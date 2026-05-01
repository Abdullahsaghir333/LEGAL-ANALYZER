import mongoose from 'mongoose';

const contractAnalysisSchema = new mongoose.Schema(
  {
    contract_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Contract',
      index: true,
    },
    summary: {
      type: String,
    },
    key_points: {
      type: mongoose.Schema.Types.Mixed, // Storing JSONB as Mixed or Array
    },
    risk_flags: {
      type: mongoose.Schema.Types.Mixed,
    },
    recommendations: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const ContractAnalysis = mongoose.model('ContractAnalysis', contractAnalysisSchema);
export default ContractAnalysis;
