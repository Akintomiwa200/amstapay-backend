const exportService = require("../services/exportService");

exports.exportCSV = async (req, res) => {
  try {
    const { startDate, endDate, type, status } = req.query;
    const csv = await exportService.exportTransactionsCSV(req.user._id, { startDate, endDate, type, status });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="transactions-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const pdf = await exportService.exportTransactionsPDF(req.user._id, { startDate, endDate, type });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="transactions-${Date.now()}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
