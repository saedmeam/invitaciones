import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from './infrastructure/config/env';
import { BaileysWhatsAppProvider } from './infrastructure/providers/BaileysWhatsAppProvider';
import { createApp } from './presentation/app';

const { app, container } = createApp();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: '*',
  },
});

if (container.whatsappProvider instanceof BaileysWhatsAppProvider) {
  container.whatsappProvider.attachSocketServer(io);
}

io.on('connection', (socket) => {
  socket.emit('whatsapp:state', container.whatsappProvider.getState());
});

server.listen(env.port, () => {
  console.log(`Backend Invitaciones escuchando en http://localhost:${env.port}`);
});
