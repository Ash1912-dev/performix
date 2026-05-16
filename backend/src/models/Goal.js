const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    thrustArea: {
      type: String,
      required: [true, 'Thrust area is required'],
      trim: true,
    },
    uomType: {
      type: String,
      enum: ['min', 'max', 'timeline', 'zero'],
      required: [true, 'UoM type is required'],
    },
    target: {
      type: Number,
      default: null,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    weightage: {
      type: Number,
      required: [true, 'Weightage is required'],
      min: [10, 'Weightage must be at least 10'],
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'returned'],
      default: 'draft',
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },
    isSharedLocked: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.pre('validate', function validateGoal() {
  if (this.uomType === 'timeline' && !this.targetDate) {
    throw new Error('Target date is required for timeline goals');
  }

  if (this.uomType !== 'timeline' && this.targetDate) {
    this.targetDate = null;
  }

  if (this.uomType !== 'zero' && (this.target === null || this.target === undefined)) {
    throw new Error('Target is required for this goal type');
  }

  if (this.uomType === 'zero') {
    this.target = this.target ?? 0;
  }
});

module.exports = mongoose.model('Goal', goalSchema);
