import Link from 'next/link';
import { CalendarHeart, Camera, Heart, Lock } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { THEME_REGISTRY } from '@/lib/themes';
import { WeddingEvent } from '@/types/invitation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const res = await fetch(`${API_BASE_URL}/api/public/featured`, {
    cache: 'no-store',
  }).catch(() => null);

  let event: WeddingEvent | null = null;
  if (res && res.ok) {
    const data = (await res.json()) as { event: WeddingEvent | null };
    event = data.event;
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-[#faf7f2] text-stone-900 flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-3xl bg-white border border-[#e6dac8] p-10 text-center space-y-4">
          <h1 className="font-serif text-3xl font-semibold">Invitaciones Digitales</h1>
          <p className="text-sm text-stone-600">
            Aún no hay un evento principal activo configurado.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full bg-[#b08d57] text-white px-6 py-2.5 text-sm font-semibold"
          >
            <Lock className="h-4 w-4" />
            Ir al Panel de Gestión
          </Link>
        </div>
      </main>
    );
  }

  const theme = THEME_REGISTRY[event.theme] || THEME_REGISTRY.ROMANTIC_EDITORIAL;
  const content = event.contentConfig || {};
  const formattedDate = new Date(event.eventDate).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className={`min-h-screen ${theme.pageBg} ${theme.textPrimary} flex items-center justify-center p-6`}>
      <div
        className={`max-w-2xl w-full rounded-3xl ${theme.surfaceBg} border ${theme.borderClass} p-8 sm:p-14 shadow-sm text-center space-y-6`}
      >
        <span
          className={`inline-flex items-center gap-2 rounded-full ${theme.badgeBg} px-4 py-1 text-xs uppercase tracking-[0.25em]`}
        >
          <Heart className="h-3.5 w-3.5" />
          {content.homeBadgeText || '¡Nos Casamos!'}
        </span>

        <div className="space-y-2">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-tight">
            {event.partnerOneName}
            <span className={`block text-2xl italic my-1 ${theme.accentText}`}>&amp;</span>
            {event.partnerTwoName}
          </h1>
          <p className={`text-sm uppercase tracking-[0.2em] ${theme.accentText}`}>
            {formattedDate}
          </p>
        </div>

        <p className={`text-sm sm:text-base max-w-lg mx-auto leading-relaxed ${theme.textMuted}`}>
          {content.homeDescription ||
            content.welcomeText ||
            'Con mucha alegría queremos compartir contigo el día más especial de nuestras vidas.'}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <Link
            href={`/e/${event.slug}`}
            className={`flex flex-col items-center gap-2 rounded-2xl p-5 transition shadow-sm ${theme.buttonPrimary}`}
          >
            <CalendarHeart className="h-6 w-6" />
            <span className="font-semibold text-sm">
              {content.homeInviteLabel || 'Ver Invitación'}
            </span>
            <span className="text-xs opacity-85">Detalles, horarios y ubicaciones</span>
          </Link>

          <Link
            href={`/e/${event.slug}/fotos`}
            className={`flex flex-col items-center gap-2 rounded-2xl border ${theme.borderClass} ${theme.surfaceMutedBg} p-5 hover:opacity-90 transition`}
          >
            <Camera className={`h-6 w-6 ${theme.accentText}`} />
            <span className="font-semibold text-sm">
              {content.homePhotosLabel || 'Álbum de Fotos'}
            </span>
            <span className={`text-xs ${theme.textMuted}`}>
              Comparte tus fotos y videos del evento
            </span>
          </Link>
        </div>

        <div className={`pt-4 border-t ${theme.borderClass}`}>
          <Link
            href="/admin"
            className={`inline-flex items-center gap-1.5 text-xs ${theme.textMuted} hover:opacity-80 transition`}
          >
            <Lock className="h-3 w-3" />
            Acceso organizadores y pareja
          </Link>
        </div>
      </div>
    </main>
  );
}
