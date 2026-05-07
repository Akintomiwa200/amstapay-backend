const SupportTicket = require("../models/SupportTicket");
const User = require("../models/User");

exports.createTicket = async (req, res) => {
  try {
    const { subject, category, message, relatedTransaction } = req.body;
    if (!subject || !category || !message) return res.status(400).json({ message: "subject, category, and message required" });

    const ticket = await SupportTicket.create({
      user: req.user._id, subject, category,
      messages: [{ sender: req.user._id, message }],
      relatedTransaction,
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, ...(req.user.role === "admin" ? [{}] : [])],
    });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.replyTicket = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message required" });

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, ...(req.user.role === "admin" ? [{}] : [])],
    });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    if (ticket.status === "closed") return res.status(400).json({ message: "Ticket is closed" });

    ticket.messages.push({ sender: req.user._id, message, isStaff: req.user.role === "admin" });
    ticket.status = ticket.status === "open" ? "in_progress" : ticket.status;
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.closeTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    ticket.status = "closed";
    ticket.closedAt = new Date();
    await ticket.save();
    res.json({ success: true, message: "Ticket closed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resolveTicket = async (req, res) => {
  try {
    const { resolution } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    ticket.status = "resolved";
    ticket.resolution = resolution || "Resolved";
    ticket.resolvedAt = new Date();
    ticket.assignedTo = req.user._id;
    ticket.messages.push({ sender: req.user._id, message: `Resolved: ${resolution || "Issue addressed"}`, isStaff: true });
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignTicket = async (req, res) => {
  try {
    const { staffId } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { assignedTo: staffId }, { new: true });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
