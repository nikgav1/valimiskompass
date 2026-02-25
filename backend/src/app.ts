import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import apiRouter from './routes/api';
import cors from 'cors'
import { QUESTIONS } from './data/questions';
import { env } from './config/env';

const app = express();

app.use(cors({ origin: env.frontendUrl }))
app.use(express.json());

app.get('/questions', (_req, res) => {
  res.status(200).json({ questions: QUESTIONS });
});

app.use('/api', apiRouter)

// After actual routes (Global error handling)
app.use(errorHandler);

export default app;
