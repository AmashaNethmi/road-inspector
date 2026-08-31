const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config({ path: __dirname + '/.env' });

// Set custom DNS for SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Result = require('./models/Result');

const seedData = [
  {
    image: 'potholes0.png',
    mask: 'mask_0.png',
    metrics: {
      repairArea: '4.2 m²',
      aiConfidence: '98.5%',
      severityScore: 'High',
      riskLevel: 'Dangerous',
      structuralStability: 'Compromised',
      recommendation: 'Immediate repair required.'
    },
    timestamp: new Date()
  },
  {
    image: 'potholes1.png',
    mask: 'mask_1.png',
    metrics: {
      repairArea: '1.5 m²',
      aiConfidence: '94.2%',
      severityScore: 'Medium',
      riskLevel: 'Moderate',
      structuralStability: 'Fair',
      recommendation: 'Scheduled maintenance within 30 days.'
    },
    timestamp: new Date(Date.now() - 86400000)
  },
  {
    image: 'potholes10.png',
    mask: 'mask_10.png',
    metrics: {
      repairArea: '0.8 m²',
      aiConfidence: '91.0%',
      severityScore: 'Low',
      riskLevel: 'Safe',
      structuralStability: 'Stable',
      recommendation: 'Monitor for further deterioration.'
    },
    timestamp: new Date(Date.now() - 172800000)
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || 'roadinspector'
    });
    console.log('Connected to MongoDB for seeding...');
    
    // Clear existing results (optional, but good for a fresh start)
    await Result.deleteMany({});
    
    await Result.insertMany(seedData);
    console.log('Successfully seeded database with 3 records!');
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
