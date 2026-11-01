import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fogRoutes from './routes/fogRoutes.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-fog-secret']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Mount all fog routes
app.use('/', fogRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Fog Node endpoint not found: ${req.originalUrl}`
  });
});

export default app;

