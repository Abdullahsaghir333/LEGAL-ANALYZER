// @ts-nocheck
import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['paid', 'unpaid', 'overdue'],
    default: 'unpaid',
  },
  lineItems: [{
    description: {
      type: String,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    rate: {
      type: Number,
    },
    amount: {
      type: Number,
    },
  }],
  dueDate: {
    type: Date,
  },
  paidDate: {
    type: Date,
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

invoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);