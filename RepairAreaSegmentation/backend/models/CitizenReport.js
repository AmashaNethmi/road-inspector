const mongoose = require('mongoose');

const CitizenReportSchema = new mongoose.Schema({
  reporterName: { type: String, required: true },
  defectType: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  urgencyLevel: { type: String, required: true }, // Low, Medium, High, Critical
  image: { type: String }, // base64
  status: { type: String, default: 'Pending Review' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CitizenReport', CitizenReportSchema);
