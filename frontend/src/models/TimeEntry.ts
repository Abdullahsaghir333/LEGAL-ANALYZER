// @ts-nocheck
import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
    min: 0,
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

timeEntrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.TimeEntry || mongoose.model('TimeEntry', timeEntrySchema);