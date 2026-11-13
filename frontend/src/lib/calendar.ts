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

const pad = (n: number) => String(n).padStart(2, '0');

function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function parseTimeString(timeStr?: string): { hour: number; minute: number } {
  if (!timeStr) return { hour: 16, minute: 0 };
  const trimmed = timeStr.trim();
  const isPm = /pm/i.test(trimmed);
  const isAm = /am/i.test(trimmed);
  const clean = trimmed.replace(/[^0-9:]/g, '');
  const [hStr, mStr] = clean.split(':');
  let h = parseInt(hStr || '16', 10);
  let m = parseInt(mStr || '0', 10);
  if (isNaN(h)) h = 16;
  if (isNaN(m)) m = 0;
  if (isPm && h < 12) h += 12;
  if (isAm && h === 12) h = 0;
  return { hour: h, minute: m };
}

function parseEventBaseDate(eventDateStr: string): { year: number; month: number; day: number } {
  const clean = (eventDateStr || '').slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }
  const fallback = new Date();
  return {
    year: fallback.getFullYear(),
    month: fallback.getMonth() + 1,
    day: fallback.getDate(),
  };
}

export function resolveEventSchedule(
  event: CalendarEventProps,
  part: 'ceremony' | 'reception' | 'all' = 'all'
) {
  let startHour = 16;
  let startMinute = 0;
  let durationHours = 4;
  let title = `Boda ${event.partnerOneName} & ${event.partnerTwoName}`;
  let location = event.ceremonyAddress || '';

  if (part === 'ceremony') {
    const parsed = parseTimeString(event.ceremonyTime);
    startHour = parsed.hour;
    startMinute = parsed.minute;
    durationHours = 2;
    title = `Ceremonia: Boda ${event.partnerOneName} & ${event.partnerTwoName}`;
    location = event.ceremonyAddress || '';
  } else if (part === 'reception') {
    const parsed = parseTimeString(event.receptionTime);
    startHour = parsed.hour;
    startMinute = parsed.minute;
    durationHours = 6;
    title = `Recepción: Boda ${event.partnerOneName} & ${event.partnerTwoName}`;
    location = event.receptionAddress || event.ceremonyAddress || '';
  } else {
    const parsed = parseTimeString(event.ceremonyTime);
    startHour = parsed.hour;
    startMinute = parsed.minute;
    durationHours = 8;
    title = `Boda ${event.partnerOneName} & ${event.partnerTwoName}`;
    location = [event.ceremonyAddress, event.receptionAddress].filter(Boolean).join(' / ');
  }

  const { year, month, day } = parseEventBaseDate(event.eventDate);
  const startUtc = new Date(Date.UTC(year, month - 1, day, startHour, startMinute, 0));
  const endUtc = new Date(startUtc.getTime() + durationHours * 3600 * 1000);

  const startStr = `${startUtc.getUTCFullYear()}${pad(startUtc.getUTCMonth() + 1)}${pad(startUtc.getUTCDate())}T${pad(startUtc.getUTCHours())}${pad(startUtc.getUTCMinutes())}00`;
  const endStr = `${endUtc.getUTCFullYear()}${pad(endUtc.getUTCMonth() + 1)}${pad(endUtc.getUTCDate())}T${pad(endUtc.getUTCHours())}${pad(endUtc.getUTCMinutes())}00`;

  return {
    title,
    location,
    startStr,
    endStr,
  };
}

/**
 * Enlace directo para Google Calendar Web / Móvil
 */
export function buildGoogleCalendarUrl(
  event: CalendarEventProps,
  part: 'ceremony' | 'reception' | 'all' = 'all'
): string {
  const { title, location, startStr, endStr } = resolveEventSchedule(event, part);

  const detailsLines: string[] = [
    `¡Te invitamos a celebrar la boda de ${event.partnerOneName} & ${event.partnerTwoName}!`,
  ];
  if (event.ceremonyTitle && event.ceremonyTime) {
    detailsLines.push(
      `• ${event.ceremonyTitle} (${event.ceremonyTime}): ${event.ceremonyAddress || ''} ${
        event.ceremonyMapUrl ? `(${event.ceremonyMapUrl})` : ''
      }`
    );
  }
  if (event.receptionTitle && event.receptionTime) {
    detailsLines.push(
      `• ${event.receptionTitle} (${event.receptionTime}): ${event.receptionAddress || ''} ${
        event.receptionMapUrl ? `(${event.receptionMapUrl})` : ''
      }`
    );
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    details: detailsLines.join('\n\n'),
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera el archivo .ICS (RFC 5545) estándar para Apple Calendar y Outlook
 */
export function buildIcsContent(
  event: CalendarEventProps,
  part: 'ceremony' | 'reception' | 'all' = 'all'
): string {
  const { title, location, startStr, endStr } = resolveEventSchedule(event, part);

  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const detailsLines: string[] = [
    `¡Te invitamos a celebrar la boda de ${event.partnerOneName} & ${event.partnerTwoName}!`,
  ];
  if (event.ceremonyTitle && event.ceremonyTime) {
    detailsLines.push(`Ceremonia: ${event.ceremonyTitle} (${event.ceremonyTime}) - ${event.ceremonyAddress || ''}`);
  }
  if (event.receptionTitle && event.receptionTime) {
    detailsLines.push(`Recepción: ${event.receptionTitle} (${event.receptionTime}) - ${event.receptionAddress || ''}`);
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bodas//Invitaciones//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:boda-${event.slug}-${part}-${startStr}@invitaciones`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(detailsLines.join('\n'))}`,
    `LOCATION:${escapeIcsText(location)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Descarga el .ICS en el navegador del cliente (Compatible con iOS, Android, macOS y Windows)
 */
export function downloadIcsLocally(
  event: CalendarEventProps,
  part: 'ceremony' | 'reception' | 'all' = 'all'
): void {
  if (typeof window === 'undefined') return;

  const icsContent = buildIcsContent(event, part);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const filename = `boda-${event.slug}-${part}.ics`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function buildIcsDownloadUrl(slug: string): string {
  return resolveAssetUrl(`/api/public/events/${slug}/calendar.ics`);
}
