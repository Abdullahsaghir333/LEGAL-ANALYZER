import asyncHandler from 'express-async-handler';
import Client from '../models/Client.js';
import Case from '../models/Case.js';

const ACTIVE_CASE_STATUSES = ['open', 'pending'];

async function attachCaseStats(clients) {
  if (!clients.length) return [];

  const clientIds = clients.map((c) => c._id);
  const cases = await Case.find({ client_id: { $in: clientIds } })
    .select('client_id status title createdAt')
    .lean();

  const statsByClient = {};
  for (const caseItem of cases) {
    const key = caseItem.client_id.toString();
    if (!statsByClient[key]) {
      statsByClient[key] = { total: 0, active: 0, cases: [] };
    }
    statsByClient[key].total += 1;
    if (ACTIVE_CASE_STATUSES.includes(caseItem.status)) {
      statsByClient[key].active += 1;
    }
    statsByClient[key].cases.push(caseItem);
  }

  return clients.map((client) => {
    const doc = client.toObject ? client.toObject() : { ...client };
    const stats = statsByClient[doc._id.toString()] || { total: 0, active: 0, cases: [] };
    return {
      ...doc,
      cases: stats.cases,
      caseCount: stats.total,
      activeCaseCount: stats.active,
    };
  });
}

// @desc    Get all clients for a user
// @route   GET /api/clients
// @access  Private
export const getClients = asyncHandler(async (req, res) => {
  const clients = await Client.find({ user_id: req.user._id }).sort({ name: 1 });
  const clientsWithCases = await attachCaseStats(clients);
  res.json(clientsWithCases);
});

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
export const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (client && client.user_id.toString() === req.user._id.toString()) {
    const cases = await Case.find({ client_id: client._id }).sort({ createdAt: -1 });

    const clientResponse = client.toObject();
    clientResponse.cases = cases;
    clientResponse.caseCount = cases.length;
    clientResponse.activeCaseCount = cases.filter((c) =>
      ACTIVE_CASE_STATUSES.includes(c.status)
    ).length;

    res.json(clientResponse);
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
