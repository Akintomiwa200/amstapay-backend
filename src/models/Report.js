const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['statement', 'budget-insights'],
    required: true
  },
  period: {
    type: String, // '2024-09' monthly
    required: true
  },
  data: {
    type: Object, // transactions summary, categories, charts data
    default: {}
  },
  totalIncome: { type: Number, default: 0 },
  totalExpense: { type: Number, default: 0 },
  fileUrl: String // PDF export url
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
