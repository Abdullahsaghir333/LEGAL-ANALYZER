import asyncHandler from 'express-async-handler';
import Case from '../models/Case.js';
import Client from '../models/Client.js';
import File from '../models/File.js';
import Invoice from '../models/Invoice.js';
import { canAccessCase } from '../utils/caseAccess.js';

// @desc    Get all cases for a user's clients
// @route   GET /api/cases
// @access  Private
export const getCases = asyncHandler(async (req, res) => {
  let cases;

  if (req.user.role === 'client') {
    const clientRecords = await Client.find({ email: req.user.email });
    const clientIds = clientRecords.map((c) => c._id);
    cases = await Case.find({ client_id: { $in: clientIds } })
      .populate('client_id', 'name email')
      .populate('lawyer_id', 'name email expertise location');
  } else {
    const clients = await Client.find({ user_id: req.user._id });
    const clientIds = clients.map((c) => c._id);
    cases = await Case.find({ client_id: { $in: clientIds } })
      .populate('client_id', 'name company email')
      .populate('lawyer_id', 'name email');
  }

  res.json(cases);
});

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
export const getCaseById = asyncHandler(async (req, res) => {
  const caseItem = await Case.findById(req.params.id)
    .populate('client_id')
    .populate('lawyer_id', 'name email expertise location bio');

  if (caseItem && canAccessCase(caseItem, req.user)) {
    
    // Also fetch files related to this case
    const files = await File.find({ case_id: caseItem._id }).select('-extracted_text -__v');
    
    // Also fetch invoices
    const invoices = await Invoice.find({ case_id: caseItem._id });
    
    // Convert to regular object to attach files and invoices
    const caseResponse = caseItem.toObject();
    caseResponse.documents = files;
    caseResponse.invoices = invoices;
    
    res.json(caseResponse);
  } else {
    res.status(404);
    throw new Error('Case not found or unauthorized');
  }
});

// @desc    Create new case (disabled — cases are created when lawyers accept client requests)
// @route   POST /api/cases
// @access  Private
export const createCase = asyncHandler(async (req, res) => {
  res.status(403);
  throw new Error(
    'Cases cannot be created manually. Ask the client to submit a request from Explore Lawyers, then accept it under Client Requests.'
  );
});

// @desc    Close / end a case
// @route   PATCH /api/cases/:id/close
// @access  Private (Lawyer)
export const closeCase = asyncHandler(async (req, res) => {
  const caseItem = await Case.findById(req.params.id).populate('client_id');

  const isOwningLawyer = caseItem && caseItem.client_id.user_id.toString() === req.user._id.toString();
  const isAssignedLawyer = caseItem && caseItem.lawyer_id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!caseItem || !(isOwningLawyer || isAssignedLawyer || isAdmin)) {
    res.status(404);
    throw new Error('Case not found or unauthorized');
  }

  if (caseItem.status === 'closed') {
    return res.json(caseItem);
  }

  caseItem.status = 'closed';
  caseItem.updates.push({
    description: 'Case closed by lawyer',
    priority: 'low',
  });

  const updatedCase = await caseItem.save();
  res.json(updatedCase);
});

// @desc    Update a case
// @route   PUT /api/cases/:id
// @access  Private
export const updateCase = asyncHandler(async (req, res) => {
  const { title, description, status, priority } = req.body;

  const caseItem = await Case.findById(req.params.id).populate('client_id');

  const isOwningLawyer = caseItem && caseItem.client_id.user_id.toString() === req.user._id.toString();
  const isAssignedLawyer = caseItem && caseItem.lawyer_id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (caseItem && (isOwningLawyer || isAssignedLawyer || isAdmin)) {
    caseItem.title = title || caseItem.title;
    caseItem.description = description || caseItem.description;
    caseItem.status = status || caseItem.status;
    caseItem.priority = priority || caseItem.priority;

    const updatedCase = await caseItem.save();
    res.json(updatedCase);
  } else {
    res.status(404);
    throw new Error('Case not found or unauthorized');
  }
});

// @desc    Delete a case
// @route   DELETE /api/cases/:id
// @access  Private
export const deleteCase = asyncHandler(async (req, res) => {
  const caseItem = await Case.findById(req.params.id).populate('client_id');

  const isOwningLawyer = caseItem && caseItem.client_id.user_id.toString() === req.user._id.toString();
  const isAssignedLawyer = caseItem && caseItem.lawyer_id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (caseItem && (isOwningLawyer || isAssignedLawyer || isAdmin)) {
    await caseItem.deleteOne();
    res.json({ message: 'Case removed' });
  } else {
    res.status(404);
    throw new Error('Case not found or unauthorized');
  }
});

// @desc    Add an update to a case
// @route   POST /api/cases/:id/updates
// @access  Private
export const addCaseUpdate = asyncHandler(async (req, res) => {
  const { description, priority } = req.body;

  const caseItem = await Case.findById(req.params.id).populate('client_id');

  if (caseItem && caseItem.client_id.user_id.toString() === req.user._id.toString()) {
    caseItem.updates.push({
      description,
      priority: priority || 'low',
    });

    const updatedCase = await caseItem.save();
    res.status(201).json(updatedCase);
  } else {
    res.status(404);
    throw new Error('Case not found or unauthorized');
  }
});

// @desc    Add a chat message to a case
// @route   POST /api/cases/:id/messages
// @access  Private (Lawyer or Client)
export const addCaseMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const caseItem = await Case.findById(req.params.id).populate('client_id');

  if (!caseItem) {
    res.status(404);
    throw new Error('Case not found');
  }

  if (canAccessCase(caseItem, req.user)) {
    caseItem.messages.push({
      sender_id: req.user._id,
      text,
    });

    const updatedCase = await caseItem.save();
    res.status(201).json(updatedCase);
  } else {
    res.status(401);
    throw new Error('Unauthorized to access this case chat');
  }
});

import axios from 'axios';
import FormData from 'form-data';

// @desc    Upload document for a specific case
// @route   POST /api/cases/:id/documents
// @access  Private (Lawyer or Client)
export const uploadCaseDocument = asyncHandler(async (req, res) => {
  const caseItem = await Case.findById(req.params.id).populate('client_id');
  if (!caseItem) {
    res.status(404);
    throw new Error('Case not found');
  }

  if (!canAccessCase(caseItem, req.user)) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000/api';
  const formData = new FormData();
  formData.append('file', req.file.buffer, req.file.originalname);
  
  // Use the lawyer's ID for vector DB context, and label the document with the case ID
  formData.append('lawyer_id', caseItem.lawyer_id.toString());
  formData.append('document_type', `case_${caseItem._id.toString()}`);

  try {
    // Send to Python AI service to extract text and embed into Weaviate
    const response = await axios.post(`${PYTHON_API_URL}/lawyer-docs/upload`, formData, {
      headers: { ...formData.getHeaders() },
    });

    const extractedText = response.data.extracted_text || '';

    // Save metadata and extracted text to MongoDB
    const fileRecord = await File.create({
      user_id: caseItem.lawyer_id, // Owner of the document is logically the lawyer for context
      uploaded_by: req.user._id, // Actual uploader
      file_name: req.file.originalname,
      file_url: 'local_upload', // In production, this would be an S3/Cloudinary URL
      file_type: 'application/pdf',
      linked_to: 'case',
      case_id: caseItem._id,
      extracted_text: extractedText,
    });

    res.status(201).json({
      message: 'Document uploaded, extracted, and linked to case successfully',
      file: fileRecord,
      extracted_text: extractedText,
    });
  } catch (error) {
    console.error('Case Document Upload Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to process and upload document' });
  }
});

// @desc    Get extracted text for a case document
// @route   GET /api/cases/:id/documents/:docId
// @access  Private (Lawyer or Client)
export const getCaseDocumentText = asyncHandler(async (req, res) => {
  const caseItem = await Case.findById(req.params.id).populate('client_id');
  if (!caseItem) {
    res.status(404);
    throw new Error('Case not found');
  }

  if (!canAccessCase(caseItem, req.user)) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  const fileRecord = await File.findOne({
    _id: req.params.docId,
    case_id: caseItem._id,
  }).select('file_name file_type createdAt extracted_text uploaded_by');

  if (!fileRecord) {
    res.status(404);
    throw new Error('Document not found');
  }

  res.json(fileRecord);
});
