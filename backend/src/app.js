import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

// Import Routes
import userRoutes from './routes/userRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
// Add more routes as needed

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(morgan('dev')); // HTTP request logging
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/invoices', invoiceRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Legal AI + Fintech SaaS API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
