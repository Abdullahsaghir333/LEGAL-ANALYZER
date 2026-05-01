import asyncHandler from 'express-async-handler';
import Case from '../models/Case.js';
import Client from '../models/Client.js';

// @desc    Get all cases for a user's clients
// @route   GET /api/cases
// @access  Private
export const getCases = asyncHandler(async (req, res) => {
  // First get all clients for this user
  const clients = await Client.find({ user_id: req.user._id });
  const clientIds = clients.map(c => c._id);

  // Then get all cases for these clients
  const cases = await Case.find({ client_id: { $in: clientIds } }).populate('client_id', 'name company');
  res.json(cases);
});

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
export const getCaseById = asyncHandler(async (req, res) => {
  const caseItem = await Case.findById(req.params.id).populate('client_id');

  if (caseItem && caseItem.client_id.user_id.toString() === req.user._id.toString()) {
    res.json(caseItem);
  } else {
    res.status(404);
    throw new Error('Case not found or unauthorized');
  }
});

// @desc    Create new case
// @route   POST /api/cases
// @access  Private
export const createCase = asyncHandler(async (req, res) => {
  const { client_id, title, description, status, priority } = req.body;

  // Verify client belongs to user
  const client = await Client.findById(client_id);
  if (!client || client.user_id.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Unauthorized or Client not found');
  }

  const caseItem = new Case({
    client_id,
    title,
    description,
    status,
    priority,
  });

  const createdCase = await caseItem.save();
  res.status(201).json(createdCase);
});

// @desc    Update a case
// @route   PUT /api/cases/:id
// @access  Private
export const updateCase = asyncHandler(async (req, res) => {
  const { title, description, status, priority } = req.body;

  const caseItem = await Case.findById(req.params.id).populate('client_id');

  if (caseItem && caseItem.client_id.user_id.toString() === req.user._id.toString()) {
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

  if (caseItem && caseItem.client_id.user_id.toString() === req.user._id.toString()) {
    await caseItem.deleteOne();
    res.json({ message: 'Case removed' });
  } else {
    res.status(404);
    throw new Error('Case not found or unauthorized');
  }
});
