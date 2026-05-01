import mongoose from 'mongoose';

const contractChatSchema = new mongoose.Schema(
  {
    contract_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Contract',
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ContractChat = mongoose.model('ContractChat', contractChatSchema);
export default ContractChat;
