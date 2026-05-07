const mongoose = require("mongoose");

const savingsGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true, min: 100 },
  savedAmount: { type: Number, default: 0 },
  currency: { type: String, default: "NGN" },
  frequency: { type: String, enum: ["daily", "weekly", "monthly", "none"], default: "none" },
  autoSaveAmount: { type: Number, default: 0 },
  autoSaveEnabled: { type: Boolean, default: false },
  nextAutoSaveDate: Date,
  lockUntil: { type: Date },
  status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
  completedAt: Date,
  transactions: [{
    amount: Number,
    type: { type: String, enum: ["deposit", "withdrawal", "interest", "auto_save"] },
    date: { type: Date, default: Date.now },
    description: String,
  }],
  category: { type: String, enum: ["emergency", "travel", "education", "shopping", "business", "vacation", "other"], default: "other" },
}, { timestamps: true });

savingsGoalSchema.index({ user: 1, status: 1 });
savingsGoalSchema.virtual("progress").get(function () {
  return this.targetAmount > 0 ? Math.min((this.savedAmount / this.targetAmount) * 100, 100) : 0;
});
savingsGoalSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("SavingsGoal", savingsGoalSchema);
