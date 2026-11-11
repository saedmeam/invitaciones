import { API_BASE_URL } from '@/lib/api';
import { InvitationView } from '@/components/invitation/InvitationView';
import { WeddingEvent } from '@/types/invitation';

export const dynamic = 'force-dynamic';

export default async function PublicEventSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const res = await fetch(`${API_BASE_URL}/api/public/events/${slug}`, {
    cache: 'no-store',
  }).catch(() => null);

  if (!res || !res.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf7f2] p-6 text-center text-stone-800">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-sm border border-stone-200">
          <h1 className="font-serif text-3xl font-semibold mb-2">Evento no encontrado</h1>
          <p className="text-sm text-stone-600">
            Verifica la URL de la invitación o consulta con los organizadores.
          </p>
        </div>
      </main>
    );
  }

  const data = (await res.json()) as { event: WeddingEvent };
  return <InvitationView initialEvent={data.event} />;
}
