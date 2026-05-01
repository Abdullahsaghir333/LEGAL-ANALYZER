import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Client',
      index: true,
    },
    case_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
    },
    invoice_number: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'pending'],
      default: 'unpaid',
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    due_date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
