# Plataforma Multi-Evento de Invitaciones de Matrimonio

Sistema web modular bajo **Clean Architecture** (`Domain <- Application <- Infrastructure / Presentation`), desarrollado con **Next.js (App Router) + Tailwind CSS + TypeScript** en el frontend y **Node.js + Express 5 + Prisma ORM + SQLite** en el backend.

---

## Arquitectura del Proyecto

```text
invitaciones/
├── backend/                  # API REST + Socket.IO (Puerto 4006)
│   ├── prisma/               # schema.prisma + seed.ts (SQLite dev.db local)
│   └── src/
│       ├── domain/           # Entidades, puertos e invariantes RSVP/estadísticas
│       ├── application/      # Casos de uso (Auth, Events, Guests, RSVP, Dispatch, Media)
│       ├── infrastructure/   # Prisma, Baileys WhatsApp, Nodemailer Gmail, Google Drive OAuth2
│       ├── presentation/     # Express app, middlewares, rutas REST
│       └── tests/            # Pruebas unitarias e integración (Vitest + Supertest)
├── frontend/                 # Aplicación Web Next.js (Puerto 3006)
│   └── src/
│       ├── app/
│       │   ├── i/[token]/    # Invitación personalizada por grupo + RSVP acompañante
│       │   ├── e/[slug]/     # Vista pública del evento y galería QR (/fotos)
│       │   └── admin/        # Panel Multi-Evento (KPIs, invitados, envíos, diseño, QR Drive)
│       ├── components/       # Motor de invitación y pestañas administrativas
│       └── lib/themes.ts     # 3 estilos visuales parametrizables
└── .agents/                  # Gobernanza Multi-Agente y 22 Reglas Inmutables
```

---

## Puesta en Marcha Local

### 1. Backend (`http://localhost:4006`)
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

### 2. Frontend (`http://localhost:3006`)
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Credenciales Iniciales del Panel Admin (`/admin`)
- **SuperAdmin (Multi-evento y creación de accesos de pareja):** `admin@invitaciones.local` / `admin123`
- **Usuario de la Pareja (Acceso exclusivo a su boda y selección de mesas):** `pareja@invitaciones.local` / `pareja123`

---

## Configuración de Integraciones

### Gmail (Envío de Invitaciones por Correo)
1. Activa la verificación en 2 pasos en tu cuenta Google y genera una **Contraseña de Aplicación**.
2. Configura `GMAIL_USER` y `GMAIL_APP_PASSWORD` en `backend/.env`.

### WhatsApp (`@whiskeysockets/baileys`)
1. Ingresa al panel `/admin` → pestaña **WhatsApp QR & Gmail**.
2. Haz clic en **Generar QR de WhatsApp** y escanéalo desde *Dispositivos vinculados* en tu teléfono.

### Google Drive (Álbum QR de Fotos y Videos)
1. Crea credenciales OAuth2 (Aplicación Web) en Google Cloud Console con URI de redirección `http://localhost:4006/api/media/google/callback` y habilita **Google Drive API**.
2. Define `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_DRIVE_ROOT_FOLDER_ID` en `backend/.env`.
3. En `/admin` → pestaña **Álbum QR Drive & Deseos**, haz clic en **Conectar Cuenta Google Drive**, autoriza el acceso y copia el `GOOGLE_REFRESH_TOKEN` devuelto en `backend/.env`.
4. Si aún no configuras las credenciales OAuth2 de Google, las cargas se guardan temporalmente en modo `LOCAL_FALLBACK` (`backend/uploads/media`) para que puedas probar todo el flujo localmente.
