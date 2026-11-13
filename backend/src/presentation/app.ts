import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { AppContainer, buildContainer } from './container';
import { errorMiddleware } from './middlewares/errorMiddleware';
import { createApiRouter } from './routes/apiRoutes';

export function createApp(customContainer?: AppContainer) {
  const app = express();
  const container = customContainer || buildContainer();

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '5mb' }));
  app.use('/uploads', express.static(uploadsDir));
  app.use('/api', createApiRouter(container));
  app.use(errorMiddleware);

  return { app, container };
}
