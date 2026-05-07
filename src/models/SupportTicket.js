const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  category: { type: String, enum: ["transaction", "account", "card", "verification", "complaint", "general", "dispute"], required: true },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: String,
    attachments: [String],
    isStaff: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  relatedTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: Date,
  resolution: String,
  closedAt: Date,
}, { timestamps: true });

supportTicketSchema.index({ user: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: -1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
