import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

// Import Routes
import userRoutes from './routes/userRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import aiChatRoutes from './routes/aiChatRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import summarizeRoutes from './routes/summarizeRoutes.js';
// Add more routes as needed

const app = express();

// Middleware
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
})); // Security headers

// Dev-friendly CORS: reflect request origin so localhost:3000 / 3001 / LAN IP all work.
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(morgan('dev')); // HTTP request logging
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body
app.use(cookieParser()); // Parse cookies

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/ai/chats', aiChatRoutes);
app.use('/api/ai', summarizeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Legal AI + Fintech SaaS API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
