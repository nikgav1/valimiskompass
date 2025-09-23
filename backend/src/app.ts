import express from 'express';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());


// After actual routes (Global error handling)
app.use(errorHandler);

export default app;