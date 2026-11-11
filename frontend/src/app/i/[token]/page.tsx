import { API_BASE_URL } from '@/lib/api';
import { InvitationView } from '@/components/invitation/InvitationView';
import { GuestGroup, WeddingEvent } from '@/types/invitation';

export const dynamic = 'force-dynamic';

export default async function PersonalizedInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const res = await fetch(`${API_BASE_URL}/api/public/invitations/${token}`, {
    cache: 'no-store',
  }).catch(() => null);

  if (!res || !res.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf7f2] p-6 text-center text-stone-800">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-sm border border-stone-200">
          <h1 className="font-serif text-3xl font-semibold mb-2">Invitación no encontrada</h1>
          <p className="text-sm text-stone-600">
            El enlace de invitación es inválido o el evento ya no se encuentra activo.
          </p>
        </div>
      </main>
    );
  }

  const data = (await res.json()) as { event: WeddingEvent; group: GuestGroup };
  return <InvitationView initialEvent={data.event} initialGroup={data.group} token={token} />;
}
