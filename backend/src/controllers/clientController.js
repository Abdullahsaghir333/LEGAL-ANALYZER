import asyncHandler from 'express-async-handler';
import Client from '../models/Client.js';

// @desc    Get all clients for a user
// @route   GET /api/clients
// @access  Private
export const getClients = asyncHandler(async (req, res) => {
  const clients = await Client.find({ user_id: req.user._id });
  res.json(clients);
});

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
export const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (client && client.user_id.toString() === req.user._id.toString()) {
    res.json(client);
  } else {
    res.status(404);
    throw new Error('Client not found or unauthorized');
  }
});

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
export const createClient = asyncHandler(async (req, res) => {
  const { name, email, phone, company } = req.body;

  const client = new Client({
    user_id: req.user._id,
    name,
    email,
    phone,
    company,
  });

  const createdClient = await client.save();
  res.status(201).json(createdClient);
});

// @desc    Update a client
// @route   PUT /api/clients/:id
// @access  Private
export const updateClient = asyncHandler(async (req, res) => {
  const { name, email, phone, company } = req.body;

  const client = await Client.findById(req.params.id);

  if (client && client.user_id.toString() === req.user._id.toString()) {
    client.name = name || client.name;
    client.email = email || client.email;
    client.phone = phone || client.phone;
    client.company = company || client.company;

    const updatedClient = await client.save();
    res.json(updatedClient);
  } else {
    res.status(404);
    throw new Error('Client not found or unauthorized');
  }
});

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private
export const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (client && client.user_id.toString() === req.user._id.toString()) {
    await client.deleteOne();
    res.json({ message: 'Client removed' });
  } else {
    res.status(404);
    throw new Error('Client not found or unauthorized');
  }
});
