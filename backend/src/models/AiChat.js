import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    citations: {
      type: Array,
      default: [],
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File', // If there's an attached file
    },
  },
  { timestamps: true }
);

const aiChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
    },
    contextMode: {
      type: String,
      enum: ['General', 'Contracts', 'Cases', 'Clients'],
      default: 'General',
    },
    ragType: {
      type: String,
      enum: ['family_law', 'lawyer'],
      default: 'family_law',
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

const AiChat = mongoose.model('AiChat', aiChatSchema);
export default AiChat;
