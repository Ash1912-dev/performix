const mongoose = require('mongoose');

const escalationRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
    },
    triggerType: {
      type: String,
      enum: ['goal_not_submitted', 'goal_not_approved', 'checkin_not_completed'],
      required: [true, 'Trigger type is required'],
    },
    daysThreshold: {
      type: Number,
      required: [true, 'Days threshold is required'],
      min: 0,
    },
    escalationChain: [
      {
        type: String,
        enum: ['employee', 'manager', 'admin'],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EscalationRule', escalationRuleSchema);
