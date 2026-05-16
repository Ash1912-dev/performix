const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: [true, 'Goal is required'],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    quarter: {
      type: String,
      enum: ['Q1', 'Q2', 'Q3', 'Q4'],
      required: [true, 'Quarter is required'],
    },
    cycleYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    plannedTarget: {
      type: Number,
      default: null,
    },
    actualAchievement: {
      type: Number,
      default: null,
    },
    achievementDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['not_started', 'on_track', 'completed'],
      required: [true, 'Status is required'],
    },
    progressScore: {
      type: Number,
      default: 0,
    },
    managerComment: {
      type: String,
      trim: true,
      default: '',
    },
    commentedAt: {
      type: Date,
      default: null,
    },
    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

checkInSchema.index({ goalId: 1, quarter: 1, cycleYear: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);
