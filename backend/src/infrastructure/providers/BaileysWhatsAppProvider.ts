import fs from 'fs';
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import { Server as SocketServer } from 'socket.io';
import { IWhatsAppProvider, WhatsAppStateDto } from '../../domain/ports/Providers';
import { RsvpDomainService } from '../../domain/services/RsvpDomainService';

export class BaileysWhatsAppProvider implements IWhatsAppProvider {
  private sock: WASocket | null = null;
  private state: WhatsAppStateDto = {
    status: 'DISCONNECTED',
    qrDataUrl: null,
    connectedPhone: null,
    lastError: null,
  };
  private io: SocketServer | null = null;
  private manualDisconnect = false;

  constructor(private readonly sessionDir: string) {}

  attachSocketServer(io: SocketServer) {
    this.io = io;
  }

  private emitState() {
    if (this.io) {
      this.io.emit('whatsapp:state', this.state);
    }
  }

  getState(): WhatsAppStateDto {
    return { ...this.state };
  }

  buildFallbackUrl(toPhone: string, message: string): string {
    return RsvpDomainService.buildWhatsAppFallbackUrl(toPhone, message);
  }

  async connect(): Promise<void> {
    if (this.state.status === 'CONNECTING' || this.state.status === 'CONNECTED') {
      return;
    }

    this.manualDisconnect = false;
    fs.mkdirSync(this.sessionDir, { recursive: true });

    this.state = {
      status: 'CONNECTING',
      qrDataUrl: null,
      connectedPhone: null,
      lastError: null,
    };
    this.emitState();

    const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({
      version: [2, 3000, 1023223821] as [number, number, number],
    }));

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['InvitacionesWeb', 'Chrome', '1.0.0'],
    });

    this.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
        this.state = {
          status: 'QR_READY',
          qrDataUrl,
          connectedPhone: null,
          lastError: null,
        };
        this.emitState();
      }

      if (connection === 'open') {
        const rawId = sock.user?.id || '';
        const connectedPhone = rawId.split(':')[0] || null;
        this.state = {
          status: 'CONNECTED',
          qrDataUrl: null,
          connectedPhone,
          lastError: null,
        };
        this.emitState();
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        this.sock = null;
        this.state = {
          status: 'DISCONNECTED',
          qrDataUrl: null,
          connectedPhone: null,
          lastError: loggedOut
            ? 'Sesión cerrada en el teléfono. Escanea el QR nuevamente.'
            : 'Conexión cerrada',
        };
        this.emitState();

        if (!loggedOut && !this.manualDisconnect) {
          setTimeout(() => {
            this.connect().catch(() => {});
          }, 3000);
        } else if (loggedOut) {
          fs.rmSync(this.sessionDir, { recursive: true, force: true });
        }
      }
    });
  }

  async disconnect(): Promise<void> {
    this.manualDisconnect = true;
    if (this.sock) {
      await this.sock.logout().catch(() => {});
      this.sock.end(undefined);
      this.sock = null;
    }
    fs.rmSync(this.sessionDir, { recursive: true, force: true });
    this.state = {
      status: 'DISCONNECTED',
      qrDataUrl: null,
      connectedPhone: null,
      lastError: null,
    };
    this.emitState();
  }

  async sendText(
    toPhone: string,
    message: string
  ): Promise<{ ok: boolean; error?: string; fallbackUrl: string }> {
    const fallbackUrl = this.buildFallbackUrl(toPhone, message);
    const cleanPhone = RsvpDomainService.normalizePhone(toPhone);

    if (!cleanPhone) {
      return { ok: false, error: 'Número telefónico inválido', fallbackUrl };
    }

    if (!this.sock || this.state.status !== 'CONNECTED') {
      return {
        ok: false,
        error: 'WhatsApp no está conectado. Escanea el QR o usa el enlace manual.',
        fallbackUrl,
      };
    }

    try {
      const jid = `${cleanPhone}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { text: message });
      return { ok: true, fallbackUrl };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Fallo al enviar por Baileys',
        fallbackUrl,
      };
    }
  }
}
