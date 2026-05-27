import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Client',
      index: true,
    },
    lawyer_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
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
    updates: [
      {
        date: { type: Date, default: Date.now },
        description: String,
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
      }
    ],
    messages: [
      {
        sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        created_at: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Case = mongoose.model('Case', caseSchema);
export default Case;
