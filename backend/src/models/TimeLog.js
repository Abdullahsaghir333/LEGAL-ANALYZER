import mongoose from 'mongoose';

const timeLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    case_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Case',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    start_time: {
      type: Date,
    },
    end_time: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const TimeLog = mongoose.model('TimeLog', timeLogSchema);
export default TimeLog;
