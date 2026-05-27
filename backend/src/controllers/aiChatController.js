import AiChat from '../models/AiChat.js';
import axios from 'axios';
import FormData from 'form-data';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000/api';
// RAG on CPU often exceeds 60s (embed + Weaviate + Gemini). Override via PYTHON_API_TIMEOUT_MS.
const PYTHON_API_TIMEOUT_MS = Number(process.env.PYTHON_API_TIMEOUT_MS) || 300000;

// @desc    Get all AI chats for a user
// @route   GET /api/ai/chats
// @access  Private
export const getChats = async (req, res) => {
  try {
    const { ragType } = req.query;
    const query = { user: req.user._id };
    if (ragType) {
      query.ragType = ragType;
    }
    const chats = await AiChat.find(query)
      .select('-messages') // exclude messages for the list view
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching chats' });
  }
};

// @desc    Get single AI chat
// @route   GET /api/ai/chats/:id
// @access  Private
export const getChatById = async (req, res) => {
  try {
    const chat = await AiChat.findById(req.params.id);
    if (!chat || chat.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching chat' });
  }
};

// @desc    Delete an AI chat
// @route   DELETE /api/ai/chats/:id
// @access  Private
export const deleteChat = async (req, res) => {
  try {
    const chat = await AiChat.findById(req.params.id);
    if (!chat || chat.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    await chat.deleteOne();
    res.json({ message: 'Chat deleted', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error deleting chat' });
  }
};

// @desc    Send a message to the AI
// @route   POST /api/ai/chats/:id?/message
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { message, contextMode, ragType: ragTypeBody } = req.body;
    let chatId = req.params.id;
    let chat;

    console.log('========================================');
    console.log('sendMessage HIT!');
    console.log('  chatId:', chatId);
    console.log('  message:', message);
    console.log('  contextMode:', contextMode);
    console.log('  ragTypeBody:', ragTypeBody);
    console.log('  PYTHON_API_URL:', PYTHON_API_URL);
    console.log('========================================');

    console.log('[STEP 1] About to find/create chat in MongoDB...');
    if (chatId && chatId !== 'new') {
      chat = await AiChat.findById(chatId);
      if (!chat || chat.user.toString() !== req.user._id.toString()) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      console.log('[STEP 1] Found existing chat:', chat._id);
    } else {
      // Create new chat
      chat = await AiChat.create({
        user: req.user._id,
        title: message.substring(0, 30) + '...',
        contextMode: contextMode || 'General',
        ragType: ragTypeBody === 'lawyer' ? 'lawyer' : 'family_law',
        messages: [],
      });
      console.log('[STEP 1] Created new chat:', chat._id);
    }

    const effectiveRagType = ragTypeBody || chat.ragType || 'family_law';

    // Add user message to DB
    console.log('[STEP 2] Saving user message to MongoDB...');
    chat.messages.push({ role: 'user', content: message });
    await chat.save();
    console.log('[STEP 2] Message saved!');

    // Call Python RAG backend
    console.log('[STEP 3] About to call Python API...');
    let pythonResponse;
    try {
      if (effectiveRagType === 'lawyer') {
        console.log('>>> Calling Python LAWYER endpoint:', `${PYTHON_API_URL}/lawyer-docs/query`);
        const effectiveContextMode = contextMode || chat.contextMode || 'General';
        if (contextMode && chat.contextMode !== contextMode) {
          chat.contextMode = contextMode;
        }
        const response = await axios.post(`${PYTHON_API_URL}/lawyer-docs/query`, {
          query: message,
          lawyer_id: req.user._id.toString(),
          session_id: chat._id.toString(),
          context_mode: effectiveContextMode,
        }, { timeout: PYTHON_API_TIMEOUT_MS });
        pythonResponse = response.data;
      } else {
        console.log('>>> Calling Python FAMILY LAW endpoint:', `${PYTHON_API_URL}/query`);
        const response = await axios.post(`${PYTHON_API_URL}/query`, {
          query: message,
          session_id: chat._id.toString(),
          topic: contextMode !== 'General' ? contextMode : undefined,
        }, { timeout: PYTHON_API_TIMEOUT_MS });
        console.log('>>> Python responded successfully!');
        pythonResponse = response.data;
      }
    } catch (pythonError) {
      console.error('!!! Python API Error:', pythonError.message);
      console.error('!!! Python Error Code:', pythonError.code);
      console.error('!!! Python Error Response:', pythonError.response?.data);
      console.error('!!! Full Error:', pythonError);
      // Fallback or error handling
      pythonResponse = {
        answer: 'I encountered an error connecting to the legal reasoning engine. Please try again.',
        citations: []
      };
    }

    console.log('[STEP 4] Python response received:', JSON.stringify(pythonResponse).substring(0, 200));
    console.log('[STEP 4] pythonResponse.answer:', pythonResponse.answer ? pythonResponse.answer.substring(0, 100) : 'UNDEFINED');
    console.log('[STEP 4] pythonResponse.citations:', pythonResponse.citations);

    // Add AI response to DB
    console.log('[STEP 5] Adding AI response to messages...');
    chat.messages.push({
      role: 'assistant',
      content: pythonResponse.answer,
      citations: pythonResponse.citations || [],
    });
    console.log('[STEP 5] Messages pushed, total messages:', chat.messages.length);

    console.log('[STEP 6] Saving chat to MongoDB...');
    await chat.save();
    console.log('[STEP 6] Chat saved successfully!');

    console.log('[STEP 7] Sending response to frontend...');
    res.json(chat);
    console.log('[STEP 7] Response sent!');
  } catch (error) {
    console.error('sendMessage Error:', error);
    res.status(500).json({ message: 'Server Error sending message' });
  }
};

// @desc    Upload document for extraction
// @route   POST /api/ai/extract
// @access  Private
export const extractDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Forward file to Python API using multipart/form-data
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    const response = await axios.post(`${PYTHON_API_URL}/extract-pdf`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Extraction Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error extracting document text' });
  }
};

// @desc    Upload document to Lawyer RAG
// @route   POST /api/ai/lawyer-docs/upload
// @access  Private
export const uploadLawyerDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { documentType } = req.body;

    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);
    formData.append('lawyer_id', req.user._id.toString());
    if (documentType) {
      formData.append('document_type', documentType);
    }

    const response = await axios.post(`${PYTHON_API_URL}/lawyer-docs/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Upload Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error uploading lawyer document' });
  }
};
