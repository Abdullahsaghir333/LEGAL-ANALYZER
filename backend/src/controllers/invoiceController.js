import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';

// @desc    Get all invoices for a user
// @route   GET /api/invoices
// @access  Private
export const getInvoices = asyncHandler(async (req, res) => {
  const clients = await Client.find({ user_id: req.user._id });
  const clientIds = clients.map(c => c._id);

  const invoices = await Invoice.find({ client_id: { $in: clientIds } })
    .populate('client_id', 'name company')
    .populate('case_id', 'title');
    
  res.json(invoices);
});

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
export const createInvoice = asyncHandler(async (req, res) => {
  const { client_id, case_id, subtotal, tax, due_date } = req.body;

  // Verify client belongs to user
  const client = await Client.findById(client_id);
  if (!client || client.user_id.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Unauthorized or Client not found');
  }

  // Generate unique invoice number
  const invoice_number = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const total = subtotal + (tax || 0);

  const invoice = new Invoice({
    client_id,
    case_id,
    invoice_number,
    status: 'unpaid',
    subtotal,
    tax: tax || 0,
    total,
    due_date,
  });

  const createdInvoice = await invoice.save();
  res.status(201).json(createdInvoice);
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('client_id')
    .populate('case_id');

  if (invoice && invoice.client_id.user_id.toString() === req.user._id.toString()) {
    res.json(invoice);
  } else {
    res.status(404);
    throw new Error('Invoice not found or unauthorized');
  }
});
