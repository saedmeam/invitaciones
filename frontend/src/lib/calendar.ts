import { resolveAssetUrl } from './api';

export interface CalendarEventProps {
  slug: string;
  partnerOneName: string;
  partnerTwoName: string;
  eventDate: string;
  ceremonyTime?: string;
  ceremonyTitle?: string;
  ceremonyAddress?: string;
  ceremonyMapUrl?: string;
  receptionTime?: string;
  receptionTitle?: string;
  receptionAddress?: string;
  receptionMapUrl?: string;
}

/**
 * Genera el enlace directo para añadir el evento en Google Calendar (Web y Móvil)
 */
export function buildGoogleCalendarUrl(event: CalendarEventProps, part: 'ceremony' | 'reception' | 'all' = 'all'): string {
  const weddingDate = new Date(event.eventDate);
  const year = weddingDate.getUTCFullYear();
  const month = String(weddingDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(weddingDate.getUTCDate()).padStart(2, '0');

  let startHour = 16;
  let startMinute = 0;
  let durationHours = 4;
  let title = `Boda ${event.partnerOneName} & ${event.partnerTwoName}`;
  let location = event.ceremonyAddress || '';

  if (part === 'ceremony' && event.ceremonyTime) {
    const [h, m] = event.ceremonyTime.split(':').map(Number);
    if (!isNaN(h)) startHour = h;
    if (!isNaN(m)) startMinute = m;
    durationHours = 2;
    title = `Ceremonia: Boda ${event.partnerOneName} & ${event.partnerTwoName}`;
    location = event.ceremonyAddress || '';
  } else if (part === 'reception' && event.receptionTime) {
    const [h, m] = event.receptionTime.split(':').map(Number);
    if (!isNaN(h)) startHour = h;
    if (!isNaN(m)) startMinute = m;
    durationHours = 6;
    title = `Recepción: Boda ${event.partnerOneName} & ${event.partnerTwoName}`;
    location = event.receptionAddress || event.ceremonyAddress || '';
  } else if (event.ceremonyTime) {
    const [h, m] = event.ceremonyTime.split(':').map(Number);
    if (!isNaN(h)) startHour = h;
    if (!isNaN(m)) startMinute = m;
    durationHours = 8;
  }

  // Generar fecha en formato ISO básico sin separadores (YYYYMMDDTHHmmss)
  const pad = (n: number) => String(n).padStart(2, '0');
  const startStr = `${year}${month}${day}T${pad(startHour)}${pad(startMinute)}00`;
  const endHour = (startHour + durationHours) % 24;
  const endDay = startHour + durationHours >= 24 ? String(Number(day) + 1).padStart(2, '0') : day;
  const endStr = `${year}${month}${endDay}T${pad(endHour)}${pad(startMinute)}00`;

  const detailsLines: string[] = [
    `¡Te invitamos a celebrar la boda de ${event.partnerOneName} & ${event.partnerTwoName}!`,
  ];
  if (event.ceremonyTitle && event.ceremonyTime) {
    detailsLines.push(`• ${event.ceremonyTitle} (${event.ceremonyTime}): ${event.ceremonyAddress || ''} ${event.ceremonyMapUrl ? `(${event.ceremonyMapUrl})` : ''}`);
  }
  if (event.receptionTitle && event.receptionTime) {
    detailsLines.push(`• ${event.receptionTitle} (${event.receptionTime}): ${event.receptionAddress || ''} ${event.receptionMapUrl ? `(${event.receptionMapUrl})` : ''}`);
  }

  const details = detailsLines.join('\n\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Devuelve la URL absoluta para descargar el archivo .ICS compatible con Apple Calendar y Outlook
 */
export function buildIcsDownloadUrl(slug: string): string {
  return resolveAssetUrl(`/api/public/events/${slug}/calendar.ics`);
}
