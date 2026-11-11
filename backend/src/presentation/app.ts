import express from 'express';
import cors from 'cors';
import { AppContainer, buildContainer } from './container';
import { errorMiddleware } from './middlewares/errorMiddleware';
import { createApiRouter } from './routes/apiRoutes';

export function createApp(customContainer?: AppContainer) {
  const app = express();
  const container = customContainer || buildContainer();

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '5mb' }));
  app.use('/api', createApiRouter(container));
  app.use(errorMiddleware);

  return { app, container };
}
