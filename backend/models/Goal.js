const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  thrustArea: {
    type: String,
    required: true,
  },
  uomType: {
    type: String,
    enum: ['Numeric', 'Percentage', 'Timeline', 'Zero-based'],
    required: true,
  },
  targetValue: {
    type: String,
    required: true,
  },
  weightage: {
    type: Number,
    required: true,
    min: 10,
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started',
  },
  progress: {
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Goal', goalSchema, 'goals');
