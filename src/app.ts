import express from 'express';
import propertiesRoutes from './routes/properties.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/properties', propertiesRoutes);
app.use('/file', uploadRoutes);
app.use('/', userRoutes);

// Basic error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
