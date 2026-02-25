import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import apiRouter from './routes/api';
import cors from 'cors'
import { QUESTIONS } from './data/questions';

const app = express();

app.use(cors())
app.use(express.json());

app.get('/questions', (_req, res) => {
  res.status(200).json({ questions: QUESTIONS });
});

app.use('/api', apiRouter)

// After actual routes (Global error handling)
app.use(errorHandler);

export default app;
