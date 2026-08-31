const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  data: { type: Buffer, required: true }, // PDF binary
  mimeType: { type: String, default: 'application/pdf' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
