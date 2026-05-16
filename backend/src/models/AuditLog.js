const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },
    goalSheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GoalSheet',
      default: null,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Changed by is required'],
    },
    changeType: {
      type: String,
      enum: [
        'goal_created',
        'goal_updated',
        'goal_deleted',
        'sheet_submitted',
        'sheet_approved',
        'sheet_returned',
        'goal_unlocked',
        'checkin_added',
        'manager_comment_added',
      ],
      required: [true, 'Change type is required'],
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
