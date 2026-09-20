import mongoose from 'mongoose';
import {
  INTERVIEW_ROUNDS,
  INTERVIEW_FORMATS,
  INTERVIEW_STATUS,
  INTERVIEW_STATUS_LIST,
} from '../constants/interviewStatus.js';

const interviewSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobApplication',
      required: [true, 'Application ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    round: {
      type: String,
      required: [true, 'Interview round is required'],
      enum: {
        values: INTERVIEW_ROUNDS,
        message: '{VALUE} is not a valid interview round',
      },
    },
    interviewDate: {
      type: Date,
      required: [true, 'Interview date is required'],
    },
    durationMinutes: {
      type: Number,
      default: 60,
      min: [15, 'Duration must be at least 15 minutes'],
      max: [480, 'Duration cannot exceed 480 minutes (8 hours)'],
    },
    format: {
      type: String,
      enum: {
        values: INTERVIEW_FORMATS,
        message: '{VALUE} is not a valid interview format',
      },
      default: 'Video Call',
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    interviewers: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: INTERVIEW_STATUS_LIST,
        message: '{VALUE} is not a valid interview status',
      },
      default: INTERVIEW_STATUS.SCHEDULED,
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for query optimization
interviewSchema.index({ userId: 1, interviewDate: 1 });
interviewSchema.index({ applicationId: 1, interviewDate: 1 });

export const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
