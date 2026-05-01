import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema(
  {
    case_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      index: true,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Client',
      index: true,
    },
    file_url: {
      type: String,
      required: true,
    },
    file_name: {
      type: String,
      required: true,
    },
    file_type: {
      type: String,
    },
    summary: {
      type: String,
    },
    risk_score: {
      type: Number,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['uploaded', 'analyzed', 'reviewed'],
      default: 'uploaded',
    },
  },
  {
    timestamps: true,
  }
);

const Contract = mongoose.model('Contract', contractSchema);
export default Contract;
