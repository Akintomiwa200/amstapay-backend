const PDFDocument = require("pdfkit");
const Transaction = require("../models/Transaction");

exports.exportTransactionsCSV = async (userId, filters = {}) => {
  const query = { sender: userId };
  if (filters.startDate) query.createdAt = { $gte: new Date(filters.startDate) };
  if (filters.endDate) query.createdAt = { ...query.createdAt, $lte: new Date(filters.endDate) };
  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;

  const transactions = await Transaction.find(query).sort({ createdAt: -1 }).lean();

  const header = "Date,Type,Amount,Status,Reference,Description\n";
  const rows = transactions.map(t =>
    `"${t.createdAt.toISOString()}","${t.type}",${t.amount},"${t.status}","${t.reference || ""}","${(t.description || "").replace(/"/g, '""')}"`
  ).join("\n");

  return header + rows;
};

exports.exportTransactionsPDF = async (userId, filters = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = { sender: userId };
      if (filters.startDate) query.createdAt = { $gte: new Date(filters.startDate) };
      if (filters.endDate) query.createdAt = { ...query.createdAt, $lte: new Date(filters.endDate) };
      if (filters.type) query.type = filters.type;

      const transactions = await Transaction.find(query).sort({ createdAt: -1 }).lean();
      const doc = new PDFDocument({ margin: 30, size: "A4" });

      const chunks = [];
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).text("Transaction History", { align: "center" });
      doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: "center" });
      doc.moveDown();

      doc.fontSize(8);
      const tableTop = doc.y;
      doc.text("Date", 30, tableTop, { width: 80 });
      doc.text("Type", 115, tableTop, { width: 60 });
      doc.text("Amount", 180, tableTop, { width: 50 });
      doc.text("Status", 235, tableTop, { width: 50 });
      doc.text("Reference", 290, tableTop, { width: 100 });
      doc.text("Description", 395, tableTop, { width: 150 });
      doc.moveDown(0.5);

      let y = doc.y;
      for (const t of transactions) {
        if (y > 750) { doc.addPage(); y = 30; }
        doc.text(t.createdAt.toISOString().split("T")[0], 30, y, { width: 80 });
        doc.text(t.type, 115, y, { width: 60 });
        doc.text(`₦${t.amount}`, 180, y, { width: 50 });
        doc.text(t.status, 235, y, { width: 50 });
        doc.text((t.reference || "").substring(0, 15), 290, y, { width: 100 });
        doc.text((t.description || "").substring(0, 30), 395, y, { width: 150 });
        y += 14;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
