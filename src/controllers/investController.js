const Investment = require('../models/Investment');
const InvestmentPlan = require('../models/InvestmentPlan');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

// Helper to generate reference
const generateRef = (prefix) => `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

// --------------------
// Create Investment
// --------------------
const createInvestment = async (req, res) => {
  try {
    const { planId, amount, duration, autoReinvest = false } = req.body;
    const userId = req.user._id;

    // Validation
    if (!planId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'planId and amount are required' 
      });
    }

    // Find investment plan
    const plan = await InvestmentPlan.findOne({ 
      code: planId, 
      isActive: true 
    });

    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Investment plan not found' 
      });
    }

    // Validate amount against plan limits
    if (amount < plan.minInvestment) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum investment amount is ₦${plan.minInvestment.toLocaleString()}` 
      });
    }

    if (plan.maxInvestment && amount > plan.maxInvestment) {
      return res.status(400).json({ 
        success: false, 
        message: `Maximum investment amount is ₦${plan.maxInvestment.toLocaleString()}` 
      });
    }

    // Determine duration (default to first available if not specified)
    let durationMonths = duration || (plan.durations && plan.durations[0]?.months) || 3;
    
    // Validate duration exists in plan
    if (plan.durations && plan.durations.length > 0) {
      const validDuration = plan.durations.find(d => d.months === Number(durationMonths));
      if (!validDuration) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid duration. Available: ${plan.durations.map(d => d.months + ' months').join(', ')}` 
        });
      }
    }

    // Check wallet balance
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient wallet balance' 
      });
    }

    // Calculate returns
    const roi = plan.roi; // annual rate
    const durationYears = durationMonths / 12;
    const expectedReturns = amount * roi * durationYears / 100;

    // Deduct from wallet
    wallet.balance -= amount;
    await wallet.save();

    // Create investment
    const investment = await Investment.create({
      user: userId,
      plan: plan._id,
      amount,
      duration: {
        months: durationMonths,
        startDate: new Date()
      },
      roi,
      expectedReturns,
      currentValue: amount,
      autoReinvest,
      payoutSchedule: plan.payoutSchedule || 'at-maturity',
      reference: generateRef('INV')
    });

    // Record transaction
    await Transaction.create({
      user: userId,
      type: 'investment',
      amount,
      description: `Investment in ${plan.name} (${durationMonths} months)`,
      status: 'completed',
      reference: investment.reference
    });

    // Send notification
    // TODO: send investment confirmation email

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: {
        investment: {
          id: investment._id,
          reference: investment.reference,
          plan: {
            id: plan._id,
            code: plan.code,
            name: plan.name,
            description: plan.description,
            type: plan.type
          },
          amount: investment.amount,
          duration: investment.duration.months,
          startDate: investment.duration.startDate,
          maturityDate: investment.duration.endDate,
          roi: investment.roi,
          expectedReturns: investment.expectedReturns,
          currentValue: investment.currentValue,
          autoReinvest: investment.autoReinvest,
          status: investment.status,
          createdAt: investment.createdAt
        }
      }
    });
  } catch (err) {
    console.error("Create investment error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create investment', 
      error: err.message 
    });
  }
};

// --------------------
// List Investments
// --------------------
const listInvestments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const investments = await Investment.find(filter)
      .populate('plan', 'name code roi payoutSchedule')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Investment.countDocuments(filter);

    // Calculate currentValue with interest accrual for active investments
    const enrichedInvestments = investments.map(inv => {
      const data = inv.toObject();
      
      // Calculate accrued interest (simplified daily accrual)
      if (inv.status === 'active' && inv.duration) {
        const daysHeld = (Date.now() - new Date(inv.duration.startDate)) / (1000 * 60 * 60 * 24);
        const totalDays = inv.duration.months * 30;
        const progress = Math.min(daysHeld / totalDays, 1);
        data.currentValue = inv.amount + (inv.expectedReturns * progress);
        data.accruedInterest = inv.expectedReturns * progress;
      }

      return data;
    });

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      investments: enrichedInvestments
    });
  } catch (err) {
    console.error("List investments error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve investments', 
      error: err.message 
    });
  }
};

// --------------------
// Get Investment Details
// --------------------
const getInvestment = async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id)
      .populate('plan', 'name code description roi payoutSchedule features')
      .populate('user', 'fullName email');

    if (!investment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Investment not found' 
      });
    }

    // Ownership check
    if (investment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Calculate current value with interest
    const inv = investment.toObject();
    if (investment.status === 'active') {
      const daysHeld = (Date.now() - new Date(investment.duration.startDate)) / (1000 * 60 * 60 * 24);
      const totalDays = investment.duration.months * 30;
      const progress = Math.min(daysHeld / totalDays, 1);
      inv.currentValue = investment.amount + (investment.expectedReturns * progress);
      inv.accruedInterest = investment.expectedReturns * progress;
      inv.timeRemaining = Math.max(0, totalDays - daysHeld);
    }

    // Get transaction history
    const transactions = await Transaction.find({ 
      reference: { $in: [investment.reference] } 
    }).sort({ createdAt: -1 });

    inv.transactions = transactions.map(t => ({
      type: t.type,
      amount: t.amount,
      date: t.createdAt,
      status: t.status
    }));

    res.json({ 
      success: true, 
      investment: inv 
    });
  } catch (err) {
    console.error("Get investment error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve investment', 
      error: err.message 
    });
  }
};

// --------------------
// Get Investment Plans (catalog)
// --------------------
const getInvestmentPlans = async (req, res) => {
  try {
    const { type, minAmount } = req.query;
    const filter = { isActive: true };
    
    if (type) filter.type = type;
    if (minAmount) filter['minInvestment'] = { $lte: Number(minAmount) };

    const plans = await InvestmentPlan.find(filter)
      .select('-features -__v')
      .sort({ roi: -1 });

    res.json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (err) {
    console.error("Get plans error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve plans', 
      error: err.message 
    });
  }
};

// --------------------
// Get Single Investment Plan
// --------------------
const getInvestmentPlan = async (req, res) => {
  try {
    const plan = await InvestmentPlan.findOne({ 
      code: req.params.planId, 
      isActive: true 
    });

    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Investment plan not found' 
      });
    }

    res.json({
      success: true,
      plan
    });
  } catch (err) {
    console.error("Get plan error:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve plan',
      error: err.message
    });
  }
};

module.exports = {
  createInvestment,
  listInvestments,
  getInvestment,
  getInvestmentPlans,
  getInvestmentPlan
};

