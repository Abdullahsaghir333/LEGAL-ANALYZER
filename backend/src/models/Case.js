import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Client',
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'pending'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

const Case = mongoose.model('Case', caseSchema);
export default Case;
