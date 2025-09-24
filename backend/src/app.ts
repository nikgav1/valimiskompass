import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import apiRouter from './routes/api';
import cors from 'cors'

const app = express();

app.use(cors())
app.use(express.json());

app.use('/api', apiRouter)

// After actual routes (Global error handling)
app.use(errorHandler);

export default app;