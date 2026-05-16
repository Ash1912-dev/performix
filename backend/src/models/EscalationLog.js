const mongoose = require('mongoose');

const escalationLogSchema = new mongoose.Schema(
  {
    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EscalationRule',
      default: null,
    },
    triggerType: {
      type: String,
      required: [true, 'Trigger type is required'],
      trim: true,
    },
    affectedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Affected user is required'],
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    escalatedTo: {
      type: String,
      enum: ['employee', 'manager', 'admin'],
      required: [true, 'Escalated target is required'],
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EscalationLog', escalationLogSchema);
