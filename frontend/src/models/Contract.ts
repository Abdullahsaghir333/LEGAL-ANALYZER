// @ts-nocheck
import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
  },
  fileText: {
    type: String,
  },
  riskScore: {
    type: Number,
    default: 0,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  analysis: {
    summary: {
      type: String,
    },
    riskScore: {
      type: Number,
    },
    riskyClauses: [{
      type: String,
    }],
    recommendations: [{
      type: String,
    }],
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
  },
  status: {
    type: String,
    enum: ['pending', 'analyzed', 'approved', 'rejected'],
    default: 'pending',
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

contractSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Contract || mongoose.model('Contract', contractSchema);