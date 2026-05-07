const Loan = require('../models/Loan');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { sendLoanApprovalEmail, sendLoanDisbursementEmail, sendLoanRejectionEmail } = require('../services/emailService');
const { sendOTP } = require('../services/customNotificationService');
const crypto = require('crypto');

// Helper to calculate loan details
const calculateLoanDetails = (principal, annualRate, months) => {
  const monthlyRate = annualRate / 12 / 100;
  const monthlyPayment = principal *
    (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const totalRepayable = monthlyPayment * months;
  const totalInterest = totalRepayable - principal;

  return {
    monthlyInstallment: Math.round(monthlyPayment * 100) / 100,
    totalRepayable: Math.round(totalRepayable * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100
  };
};

// Helper to assess risk and determine interest rate
const assessRiskAndRate = (loanApplication) => {
  const { amount, duration, employmentStatus, monthlyIncome } = loanApplication;

  // Base rate
  let baseRate = 15.5; // default

  // Adjust based on employment
  const employmentMultipliers = {
    EMPLOYED: 1.0,
    SELF_EMPLOYED: 1.1,
    BUSINESS_OWNER: 1.15,
    RETIRED: 1.3,
    STUDENT: 1.5,
    UNEMPLOYED: 2.0
  };

  baseRate *= employmentMultipliers[employmentStatus] || 1.5;

  // Adjust based on DTI (Debt-to-Income ratio)
  const testPayment = calculateLoanDetails(amount, baseRate, duration).monthlyInstallment;
  const dtiRatio = testPayment / (monthlyIncome || 1);

  if (dtiRatio > 0.5) {
    baseRate += 5; // high risk
  } else if (dtiRatio > 0.3) {
    baseRate += 2;
  }

  // Adjust based on duration
  if (duration > 36) baseRate += 1;

  // Cap at reasonable max
  baseRate = Math.min(Math.max(baseRate, 10), 50);

  return {
    interestRate: Math.round(baseRate * 100) / 100,
    riskLevel: dtiRatio > 0.5 ? 'high' : (dtiRatio > 0.3 ? 'medium' : 'low')
  };
};

// --------------------
// Apply for Loan
// --------------------
const applyLoan = async (req, res) => {
  try {
    const { 
      amount, 
      purpose, 
      duration, 
      employmentStatus, 
      monthlyIncome, 
      guarantorDetails,
      collateralDescription,
      metadata 
    } = req.body;
    
    const userId = req.user._id;
    
    // Validation
    if (!amount || !purpose || !duration || !employmentStatus || !monthlyIncome) {
      return res.status(400).json({ 
        success: false, 
        message: 'amount, purpose, duration, employmentStatus, and monthlyIncome are required' 
      });
    }

    // Validate purpose
    const validPurposes = ['PERSONAL', 'BUSINESS', 'EDUCATION', 'MEDICAL', 'HOME_IMPROVEMENT', 'OTHER'];
    if (!validPurposes.includes(purpose.toUpperCase())) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid purpose. Must be one of: ${validPurposes.join(', ')}` 
      });
    }

    // Validate duration
    if (duration < 3 || duration > 60) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duration must be between 3 and 60 months' 
      });
    }

    // Check minimum loan amount
    if (amount < 5000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum loan amount is ₦5,000' 
      });
    }

    // Check if user already has an active/pending loan
    const existingActiveLoan = await Loan.findOne({
      user: userId,
      status: { $in: ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE'] }
    });
    
    if (existingActiveLoan) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active or pending loan application. Please complete or cancel it before applying for a new one.' 
      });
    }

    // Assess risk and determine rate
    const riskAssessment = assessRiskAndRate({
      amount,
      duration,
      employmentStatus,
      monthlyIncome
    });

    // Calculate loan details
    const loanDetails = calculateLoanDetails(amount, riskAssessment.interestRate, duration);

    // Generate reference
    const reference = `LN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Create loan
    const loan = await Loan.create({
      user: userId,
      application: {
        purpose: purpose.toUpperCase(),
        duration,
        employmentStatus: employmentStatus.toUpperCase(),
        monthlyIncome,
        guarantorDetails,
        collateralDescription
      },
      amount,
      interestRate: riskAssessment.interestRate,
      termMonths: duration,
      monthlyInstallment: loanDetails.monthlyInstallment,
      totalRepayable: loanDetails.totalRepayable,
      outstandingBalance: loanDetails.totalRepayable,
      monthlyPayment: loanDetails.monthlyInstallment,
      status: 'PENDING',
      reference,
      riskAssessment: {
        level: riskAssessment.riskLevel,
        notes: `DTI Ratio check: Preliminary calculation suggests ${((loanDetails.monthlyInstallment/monthlyIncome)*100).toFixed(1)}% of monthly income`
      }
    });

    // Record in transaction history
    await Transaction.create({
      user: userId,
      type: 'loan_application',
      amount,
      description: `Loan application - ${purpose} (${duration} months)`,
      status: 'pending',
      reference
    });

    // Send notification
    await sendOTP({
      userId,
      email: req.user.email,
      phone: req.user.phoneNumber,
      fullName: req.user.fullName,
      code: null, // no code
      message: 'Loan application submitted successfully'
    });

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: {
        loanId: loan._id,
        reference,
        amount,
        purpose,
        duration,
        interestRate: riskAssessment.interestRate,
        totalRepayable: loanDetails.totalRepayable,
        monthlyInstallment: loanDetails.monthlyInstallment,
        status: 'PENDING',
        applicationDate: loan.createdAt,
        riskLevel: riskAssessment.riskLevel
      }
    });
  } catch (err) {
    console.error("Apply loan error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit loan application', 
      error: err.message 
    });
  }
};

// --------------------
// List User's Loans
// --------------------
const listLoans = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10, sortBy = 'applicationDate', sortOrder = 'desc' } = req.query;

    const filter = { user: userId };
    if (status) {
      filter.status = status.toUpperCase();
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const loans = await Loan.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Loan.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      loans: loans.map(loan => ({
        id: loan._id,
        reference: loan.reference,
        amount: loan.amount,
        outstandingBalance: loan.outstandingBalance,
        interestRate: loan.interestRate,
        duration: loan.application.duration,
        monthlyInstallment: loan.monthlyInstallment,
        status: loan.status,
        applicationDate: loan.createdAt,
        nextPaymentDate: loan.nextPaymentDate,
        purpose: loan.application.purpose
      }))
    });
  } catch (err) {
    console.error("List loans error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve loans', 
      error: err.message 
    });
  }
};

// --------------------
// Get Loan Details
// --------------------
const getLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('user', 'fullName email amstapayAccountNumber');

    if (!loan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Loan not found' 
      });
    }

    // Ownership check
    if (loan.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const loanData = loan.toObject();

    // Add application details
    loanData.applicationDetails = loan.application;

    res.json({
      success: true,
      loan: loanData
    });
  } catch (err) {
    console.error("Get loan error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve loan', 
      error: err.message 
    });
  }
};

// --------------------
// Repay Loan
// --------------------
const repayLoan = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;
    const loanId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid amount is required' 
      });
    }

    const loan = await Loan.findById(loanId);
    
    if (!loan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Loan not found' 
      });
    }

    // Ownership check
    if (loan.user.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Check loan status
    if (!['APPROVED', 'DISBURSED', 'ACTIVE'].includes(loan.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Loan is ${loan.status}. Cannot accept payments.` 
      });
    }

    // Check wallet balance
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient wallet balance' 
      });
    }

    // Process payment
    wallet.balance -= amount;
    await wallet.save();

    loan.totalPaid += amount;
    loan.outstandingBalance = Math.max(0, loan.outstandingBalance - amount);
    loan.monthlyPayment = Math.max(0, loan.monthlyPayment - amount);

    // Update status if paid off
    if (loan.outstandingBalance <= 0) {
      loan.status = 'COMPLETED';
    } else if (loan.totalPaid >= loan.totalRepayable) {
      loan.status = 'COMPLETED';
    }

    // Update payment schedule
    if (loan.repaymentSchedule && loan.repaymentSchedule.length > 0) {
      // Find first pending installment
      const installment = loan.repaymentSchedule.find(p => p.status === 'pending');
      if (installment) {
        installment.amountPaid += amount;
        installment.payments.push({
          amount,
          paymentDate: new Date(),
          method: 'wallet',
          reference: `LN-PMT-${Date.now()}`
        });
        if (installment.amountPaid >= installment.amountDue) {
          installment.status = 'paid';
        } else {
          installment.status = 'partial';
        }
      }
    }

    await loan.save();

    // Record transaction
    const transaction = await Transaction.create({
      user: userId,
      type: 'loan_repayment',
      amount,
      description: `Loan repayment for ${loan.reference}`,
      status: 'completed',
      reference: `LN-REPAY-${Date.now()}`
    });

    res.json({
      success: true,
      message: 'Loan repayment successful',
      data: {
        transactionId: transaction._id,
        amountPaid: amount,
        newOutstandingBalance: loan.outstandingBalance,
        totalPaidSoFar: loan.totalPaid,
        remainingInstallments: loan.status === 'COMPLETED' ? 0 : Math.ceil(loan.outstandingBalance / loan.monthlyInstallment),
        loanStatus: loan.status
      }
    });
  } catch (err) {
    console.error("Repay loan error:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to process loan repayment',
      error: err.message
    });
  }
};

module.exports = {
  applyLoan,
  listLoans,
  getLoan,
  repayLoan
};

