import asyncHandler from 'express-async-handler';
import Contract from '../models/Contract.js';
import Client from '../models/Client.js';
import ContractAnalysis from '../models/ContractAnalysis.js';

// @desc    Get all contracts
// @route   GET /api/contracts
// @access  Private
export const getContracts = asyncHandler(async (req, res) => {
  const clients = await Client.find({ user_id: req.user._id });
  const clientIds = clients.map(c => c._id);

  const contracts = await Contract.find({ client_id: { $in: clientIds } })
    .populate('client_id', 'name')
    .populate('case_id', 'title');
    
  res.json(contracts);
});

// @desc    Upload a contract
// @route   POST /api/contracts
// @access  Private
export const uploadContract = asyncHandler(async (req, res) => {
  const { case_id, client_id, file_url, file_name, file_type } = req.body;

  // Verify client belongs to user
  const client = await Client.findById(client_id);
  if (!client || client.user_id.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Unauthorized or Client not found');
  }

  const contract = new Contract({
    case_id,
    client_id,
    file_url,
    file_name,
    file_type,
    status: 'uploaded',
  });

  const createdContract = await contract.save();
  
  // Here you could trigger an async call to your FastAPI service
  // e.g. analyzeContractWithAI(createdContract._id, file_url);

  res.status(201).json(createdContract);
});

// @desc    Get contract details including analysis
// @route   GET /api/contracts/:id
// @access  Private
export const getContractById = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id)
    .populate('client_id')
    .populate('case_id');

  if (contract && contract.client_id.user_id.toString() === req.user._id.toString()) {
    // Also fetch analysis if exists
    const analysis = await ContractAnalysis.findOne({ contract_id: contract._id });
    
    res.json({
      contract,
      analysis: analysis || null
    });
  } else {
    res.status(404);
    throw new Error('Contract not found or unauthorized');
  }
});
