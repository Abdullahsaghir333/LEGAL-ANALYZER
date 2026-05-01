import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      enum: ['spending', 'case', 'contract'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const AiInsight = mongoose.model('AiInsight', aiInsightSchema);
export default AiInsight;
