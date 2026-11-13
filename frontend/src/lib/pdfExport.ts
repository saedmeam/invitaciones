import { GuestGroup, RsvpStats, WeddingEvent, WishMessage } from '@/types/invitation';

/**
 * Exportación a PDF mediante documento HTML maquetado e impresión nativa del navegador
 * (Guardar como PDF). No requiere dependencias externas y conserva tipografías y colores.
 */

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@300;400;600&family=Pinyon+Script&display=swap');
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Montserrat', sans-serif; color: #1c1917; background: #fff; font-size: 11px; line-height: 1.55; }
  .cover { text-align: center; padding: 40px 0 28px; border-bottom: 1px solid #e6dac8; margin-bottom: 26px; }
  .eyebrow { font-size: 9px; letter-spacing: 4px; text-transform: uppercase; color: #b08d57; font-weight: 600; }
  .script { font-family: 'Pinyon Script', cursive; font-size: 46px; color: #8d2b3d; margin: 10px 0 4px; }
  h1 { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 30px; }
  h2 { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 19px; margin: 22px 0 10px; color: #1c1917; border-left: 3px solid #b08d57; padding-left: 10px; }
  .date { color: #6b6258; margin-top: 6px; font-size: 11px; }
  .wish { break-inside: avoid; border: 1px solid #ece3d4; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; background: #fcfaf6; }
  .wish p { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 15px; color: #2b2622; }
  .wish .author { margin-top: 8px; font-size: 10px; font-weight: 600; color: #8d2b3d; letter-spacing: 1px; text-transform: uppercase; }
  .wish .when { font-size: 9px; color: #a8a29e; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .kpi { border: 1px solid #e6dac8; border-radius: 10px; padding: 12px; text-align: center; }
  .kpi b { display: block; font-family: 'Cormorant Garamond', serif; font-size: 24px; color: #b08d57; }
  .kpi span { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #6b6258; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: #1c1917; color: #fff; font-weight: 600; font-size: 9.5px; text-transform: uppercase; letter-spacing: 1px; padding: 7px 8px; text-align: left; }
  td { border-bottom: 1px solid #eee5d8; padding: 6px 8px; font-size: 10.5px; vertical-align: top; }
  tr { break-inside: avoid; }
  .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #a8a29e; border-top: 1px solid #e6dac8; padding-top: 10px; }
  .empty { color: #a8a29e; font-style: italic; text-align: center; padding: 20px; }
`;

function openPrintWindow(title: string, body: string): void {
  if (typeof window === 'undefined') return;
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) {
    throw new Error('El navegador bloqueó la ventana emergente. Habilita las ventanas emergentes para descargar el PDF.');
  }
  win.document.open();
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${esc(title)}</title><style>${BASE_STYLES}</style></head><body>${body}<script>
    window.addEventListener('load', function () {
      var go = function () { window.focus(); window.print(); };
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { setTimeout(go, 250); }); } else { setTimeout(go, 600); }
    });
  </script></body></html>`);
  win.document.close();
}

function coverBlock(event: WeddingEvent, eyebrow: string): string {
  return `
    <div class="cover">
      <div class="eyebrow">${esc(eyebrow)}</div>
      <div class="script">${esc(event.partnerOneName.split(' ')[0])} &amp; ${esc(event.partnerTwoName.split(' ')[0])}</div>
      <h1>${esc(event.partnerOneName)} &amp; ${esc(event.partnerTwoName)}</h1>
      <div class="date">${esc(formatDate(event.eventDate))}</div>
    </div>`;
}

/**
 * Libro de Buenos Deseos en PDF.
 */
export function exportWishesPdf(event: WeddingEvent, wishes: WishMessage[]): void {
  const sorted = [...wishes].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const items = sorted.length
    ? sorted
        .map(
          (w) => `
      <div class="wish">
        <p>&ldquo;${esc(w.message)}&rdquo;</p>
        <div class="author">${esc(w.authorName)}</div>
        <div class="when">${esc(formatDate(w.createdAt))}</div>
      </div>`
        )
        .join('')
    : '<div class="empty">Aún no hay mensajes registrados.</div>';

  openPrintWindow(
    `Libro de Buenos Deseos - ${event.partnerOneName} & ${event.partnerTwoName}`,
    `${coverBlock(event, 'Libro de Buenos Deseos')}
     <h2>Mensajes de nuestros invitados (${sorted.length})</h2>
     ${items}
     <div class="footer">Generado el ${esc(formatDate(new Date().toISOString()))}</div>`
  );
}

/**
 * Resumen ejecutivo del evento en PDF: itinerario, métricas RSVP, lista de invitados y deseos.
 */
export function exportEventSummaryPdf(
  event: WeddingEvent,
  stats: RsvpStats | null,
  guests: GuestGroup[],
  wishes: WishMessage[]
): void {
  const kpis = stats
    ? `<div class="kpis">
        <div class="kpi"><b>${stats.totalAllocatedSlots}</b><span>Cupos totales</span></div>
        <div class="kpi"><b>${stats.confirmedGuests}</b><span>Confirmados</span></div>
        <div class="kpi"><b>${stats.declinedGuests}</b><span>No asistirán</span></div>
        <div class="kpi"><b>${stats.responseRatePercent}%</b><span>Tasa de respuesta</span></div>
      </div>`
    : '<div class="empty">Sin estadísticas disponibles.</div>';

  const statusLabel: Record<string, string> = {
    PENDING: 'Pendiente',
    VIEWED: 'Vista',
    CONFIRMED: 'Confirmado',
    PARTIAL: 'Parcial',
    DECLINED: 'No asistirá',
  };

  const guestRows = guests.length
    ? guests
        .map(
          (g) => `<tr>
          <td>${esc(g.groupName)}</td>
          <td>${esc(g.category)}</td>
          <td>${esc(statusLabel[g.rsvpStatus] || g.rsvpStatus)}</td>
          <td>${esc((g.members || []).map((m) => m.fullName).join(', '))}</td>
        </tr>`
        )
        .join('')
    : '<tr><td colspan="4" class="empty">Sin invitados registrados.</td></tr>';

  const wishRows = wishes.length
    ? wishes
        .slice(0, 30)
        .map((w) => `<div class="wish"><p>&ldquo;${esc(w.message)}&rdquo;</p><div class="author">${esc(w.authorName)}</div></div>`)
        .join('')
    : '<div class="empty">Sin mensajes.</div>';

  openPrintWindow(
    `Resumen del Evento - ${event.partnerOneName} & ${event.partnerTwoName}`,
    `${coverBlock(event, 'Resumen Ejecutivo del Evento')}
     <h2>Itinerario</h2>
     <table>
       <tr><th>Momento</th><th>Hora</th><th>Lugar</th></tr>
       <tr><td>${esc(event.ceremonyTitle)}</td><td>${esc(event.ceremonyTime)}</td><td>${esc(event.ceremonyAddress)}</td></tr>
       <tr><td>${esc(event.receptionTitle)}</td><td>${esc(event.receptionTime)}</td><td>${esc(event.receptionAddress)}</td></tr>
     </table>
     <h2>Confirmaciones de asistencia</h2>
     ${kpis}
     <h2>Lista de invitados (${guests.length} grupos)</h2>
     <table>
       <tr><th>Grupo</th><th>Categoría</th><th>Estado</th><th>Integrantes</th></tr>
       ${guestRows}
     </table>
     <h2>Buenos deseos (${wishes.length})</h2>
     ${wishRows}
     <div class="footer">Generado el ${esc(formatDate(new Date().toISOString()))}</div>`
  );
}
