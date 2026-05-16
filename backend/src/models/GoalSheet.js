const mongoose = require('mongoose');

const goalSheetSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    cycleYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    goals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal',
      },
    ],
    totalWeightage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'returned'],
      default: 'draft',
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

goalSheetSchema.index({ employeeId: 1, cycleYear: 1 }, { unique: true });

goalSheetSchema.pre('validate', function validateSubmission() {
  if (this.status === 'submitted' && this.totalWeightage !== 100) {
    throw new Error('Total weightage must equal 100 before submission');
  }
});

module.exports = mongoose.model('GoalSheet', goalSheetSchema);
