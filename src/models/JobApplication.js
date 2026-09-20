import mongoose from 'mongoose';
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_LIST,
  JOB_TYPES,
  WORKPLACE_TYPES,
  PRIORITY_LEVELS,
  SALARY_PERIODS,
} from '../constants/applicationStatus.js';

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
    },
    jobType: {
      type: String,
      enum: {
        values: JOB_TYPES,
        message: '{VALUE} is not a valid job type',
      },
      default: 'Full-time',
    },
    workplaceType: {
      type: String,
      enum: {
        values: WORKPLACE_TYPES,
        message: '{VALUE} is not a valid workplace type',
      },
      default: 'On-site',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    salary: {
      min: {
        type: Number,
        min: [0, 'Minimum salary cannot be negative'],
        default: null,
      },
      max: {
        type: Number,
        min: [0, 'Maximum salary cannot be negative'],
        default: null,
      },
      currency: {
        type: String,
        default: 'INR',
        uppercase: true,
        trim: true,
      },
      period: {
        type: String,
        enum: {
          values: SALARY_PERIODS,
          message: '{VALUE} is not a valid salary period',
        },
        default: 'Yearly',
      },
    },
    jobUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: APPLICATION_STATUS_LIST,
        message: '{VALUE} is not a valid application status',
      },
      default: APPLICATION_STATUS.APPLIED,
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITY_LEVELS,
        message: '{VALUE} is not a valid priority level',
      },
      default: 'Medium',
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound and text indexes as defined in locked architecture
applicationSchema.index({ userId: 1, isArchived: 1, appliedDate: -1 });
applicationSchema.index({ userId: 1, isArchived: 1, status: 1 });
applicationSchema.index({ company: 'text', jobTitle: 'text' });

export const JobApplication = mongoose.model('JobApplication', applicationSchema);
export default JobApplication;
