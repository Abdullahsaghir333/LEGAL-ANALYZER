import axios from 'axios';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000/api';
const PYTHON_TIMEOUT_MS = Number(process.env.PYTHON_API_TIMEOUT_MS) || 120000;

/** @route POST /api/ai/summarize */
export const summarizeLegalText = async (req, res) => {
  try {
    const { text, summaryLength = 'Medium', tone = 'Professional' } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return res.status(400).json({ message: 'Please provide at least 50 characters of text to summarize.' });
    }

    const response = await axios.post(
      `${PYTHON_API_URL}/summarize`,
      { text: text.trim(), summary_length: summaryLength, tone },
      { timeout: PYTHON_TIMEOUT_MS }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Summarize proxy error:', error.response?.data || error.message);
    res.status(500).json({
      message: error.response?.data?.detail || 'Summarization service unavailable. Ensure Python API is running on port 8000.',
    });
  }
};
