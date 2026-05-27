import asyncHandler from 'express-async-handler';
import Request from '../models/Request.js';
import Client from '../models/Client.js';
import Case from '../models/Case.js';
import User from '../models/User.js';

import Invoice from '../models/Invoice.js';

// @desc    Create new client request
// @route   POST /api/requests
// @access  Private (Client)
export const createRequest = asyncHandler(async (req, res) => {
  const { lawyerId, caseType, description, urgency } = req.body;

  const request = new Request({
    clientId: req.user._id,
    lawyerId,
    caseType,
    description,
    urgency,
  });

  const createdRequest = await request.save();
  res.status(201).json(createdRequest);
});

// @desc    Get requests for a lawyer
// @route   GET /api/requests
// @access  Private (Lawyer)
export const getLawyerRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find({ lawyerId: req.user._id, status: 'pending' }).populate('clientId', 'name email');
  res.json(requests);
});

// @desc    Update request status
// @route   PUT /api/requests/:id
// @access  Private (Lawyer)
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const request = await Request.findById(req.params.id).populate('clientId');

  if (request && request.lawyerId.toString() === req.user._id.toString()) {
    request.status = status;
    const updatedRequest = await request.save();

    // If accepted, create client and case
    if (status === 'accepted') {
      const clientUser = request.clientId; // Populated user object

      // Safely get the client name (handling older DB records)
      const clientName = clientUser.name || 
        (clientUser.firstName && clientUser.lastName ? `${clientUser.firstName} ${clientUser.lastName}` : null) || 
        clientUser.email.split('@')[0];

      // Check if client already exists for this lawyer
      let clientRecord = await Client.findOne({ user_id: req.user._id, email: clientUser.email });
      
      if (!clientRecord) {
        clientRecord = await Client.create({
          user_id: req.user._id, // This belongs to the lawyer
          name: clientName,
          email: clientUser.email,
        });
      }

      // Create a Case
      const newCase = await Case.create({
        client_id: clientRecord._id, // Reference to the created client
        lawyer_id: req.user._id,
        title: `${request.caseType} - ${clientName}`,
        description: request.description,
        status: 'open',
        priority: request.urgency === 'High' ? 'high' : request.urgency === 'Low' ? 'low' : 'medium',
      });

      // Automatically generate an invoice based on case type
      let fixedRate = 1500; // Default flat rate
      const typeLower = (request.caseType || '').toLowerCase();
      
      if (typeLower.includes('divorce') || typeLower.includes('family')) {
        fixedRate = 4500;
      } else if (typeLower.includes('criminal')) {
        fixedRate = 7500;
      } else if (typeLower.includes('corporate') || typeLower.includes('business')) {
        fixedRate = 6000;
      } else if (typeLower.includes('property') || typeLower.includes('real estate')) {
        fixedRate = 3500;
      } else if (typeLower.includes('civil') || typeLower.includes('lawsuit')) {
        fixedRate = 5000;
      }

      await Invoice.create({
        client_id: clientRecord._id,
        case_id: newCase._id,
        invoice_number: 'INV-' + Math.floor(100000 + Math.random() * 900000),
        status: 'pending',
        subtotal: fixedRate,
        tax: fixedRate * 0.1, // 10% tax
        total: fixedRate * 1.1,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days due date
      });

      return res.json({
        ...updatedRequest.toObject(),
        case: newCase,
        client: clientRecord,
        message: clientRecord
          ? 'Request accepted. A new case has been added for this client.'
          : 'Request accepted. Case created.',
      });
    }

    res.json(updatedRequest);
  } else {
    res.status(404);
    throw new Error('Request not found or unauthorized');
  }
});
