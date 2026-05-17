const mongoose = require('mongoose');

const cycleConfigSchema = new mongoose.Schema(
  {
    cycleYear: {
      type: Number,
      required: true,
      unique: true,
    },
    goalSettingStart: {
      type: Date,
      default: function() { return new Date(new Date().getFullYear(), 4, 1); }, // 1st May
    },
    q1Start: {
      type: Date,
      default: function() { return new Date(new Date().getFullYear(), 6, 1); }, // 1st July
    },
    q2Start: {
      type: Date,
      default: function() { return new Date(new Date().getFullYear(), 9, 1); }, // 1st October
    },
    q3Start: {
      type: Date,
      default: function() { return new Date(new Date().getFullYear(), 0, 1); }, // 1st January
    },
    q4Start: {
      type: Date,
      default: function() { return new Date(new Date().getFullYear(), 2, 1); }, // 1st March
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CycleConfig', cycleConfigSchema);
