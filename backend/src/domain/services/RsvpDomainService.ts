import { EventEntity } from '../entities/Event';
import { GuestGroupEntity, RsvpStatsDto, RsvpStatus } from '../entities/Guest';

export class RsvpDomainService {
  static computeGroupStatus(attendances: boolean[]): RsvpStatus {
    if (attendances.length === 0) return 'PENDING';
    const yesCount = attendances.filter(Boolean).length;
    if (yesCount === attendances.length) return 'CONFIRMED';
    if (yesCount === 0) return 'DECLINED';
    return 'PARTIAL';
  }

  static computeStats(groups: GuestGroupEntity[]): RsvpStatsDto {
    let totalAllocatedSlots = 0;
    let confirmedGuests = 0;
    let declinedGuests = 0;
    let pendingGuests = 0;

    let groupsConfirmed = 0;
    let groupsPartial = 0;
    let groupsDeclined = 0;
    let groupsViewed = 0;
    let groupsPending = 0;

    const categoryMap = new Map<
      string,
      { category: string; allocated: number; confirmed: number; declined: number; pending: number }
    >();
    const timelineMap = new Map<string, { date: string; confirmed: number; declined: number }>();

    for (const group of groups) {
      totalAllocatedSlots += group.maxGuests;

      if (group.rsvpStatus === 'CONFIRMED') groupsConfirmed += 1;
      else if (group.rsvpStatus === 'PARTIAL') groupsPartial += 1;
      else if (group.rsvpStatus === 'DECLINED') groupsDeclined += 1;
      else if (group.rsvpStatus === 'VIEWED') groupsViewed += 1;
      else groupsPending += 1;

      const catKey = group.category || 'General';
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, {
          category: catKey,
          allocated: 0,
          confirmed: 0,
          declined: 0,
          pending: 0,
        });
      }
      const catEntry = categoryMap.get(catKey)!;
      catEntry.allocated += group.maxGuests;

      let groupYes = 0;
      let groupNo = 0;

      if (group.members.length > 0) {
        for (const m of group.members) {
          if (m.attending === true) {
            confirmedGuests += 1;
            catEntry.confirmed += 1;
            groupYes += 1;
          } else if (m.attending === false) {
            declinedGuests += 1;
            catEntry.declined += 1;
            groupNo += 1;
          } else {
            pendingGuests += 1;
            catEntry.pending += 1;
          }
        }
        const diff = group.maxGuests - group.members.length;
        if (diff > 0) {
          pendingGuests += diff;
          catEntry.pending += diff;
        }
      } else {
        pendingGuests += group.maxGuests;
        catEntry.pending += group.maxGuests;
      }

      if (group.respondedAt) {
        const day = group.respondedAt.toISOString().slice(0, 10);
        if (!timelineMap.has(day)) {
          timelineMap.set(day, { date: day, confirmed: 0, declined: 0 });
        }
        const tl = timelineMap.get(day)!;
        tl.confirmed += groupYes;
        tl.declined += groupNo;
      }
    }

    const respondedGroups = groupsConfirmed + groupsPartial + groupsDeclined;
    const responseRatePercent =
      groups.length > 0 ? Math.round((respondedGroups / groups.length) * 1000) / 10 : 0;

    return {
      totalGroups: groups.length,
      totalAllocatedSlots,
      confirmedGuests,
      declinedGuests,
      pendingGuests,
      groupsConfirmed,
      groupsPartial,
      groupsDeclined,
      groupsViewed,
      groupsPending,
      responseRatePercent,
      byCategory: Array.from(categoryMap.values()),
      timeline: Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  static sanitizeSpreadsheetCell(value: string): string {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      return `'${trimmed}`;
    }
    return trimmed;
  }

  static normalizePhone(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }

  static buildWhatsAppFallbackUrl(phone: string, message: string): string {
    const clean = RsvpDomainService.normalizePhone(phone);
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  }

  static buildIcsCalendar(event: EventEntity): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const baseDate = event.eventDate;
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();
    const day = baseDate.getUTCDate();

    let startHour = 16;
    let startMinute = 0;
    if (event.ceremonyTime) {
      const parts = event.ceremonyTime.split(':').map(Number);
      if (!isNaN(parts[0])) startHour = parts[0];
      if (!isNaN(parts[1])) startMinute = parts[1];
    }

    const start = new Date(Date.UTC(year, month, day, startHour, startMinute, 0));
    const end = new Date(start.getTime() + 8 * 60 * 60 * 1000); // 8 horas de duración estimada

    const fmtFloating = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`;

    const title = `Boda ${event.partnerOneName} & ${event.partnerTwoName}`;
    const location = event.ceremonyAddress || event.ceremonyMapUrl || 'Por confirmar';
    const description = `${event.ceremonyTitle || 'Ceremonia'} (${event.ceremonyTime || '16:00'}) - ${event.ceremonyAddress || ''} | ${event.receptionTitle || 'Recepción'} (${event.receptionTime || '19:00'}) - ${event.receptionAddress || ''}`;

    const now = new Date();
    const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//WeddingInvitations//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id || event.slug}@invitaciones.local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${fmtFloating(start)}`,
      `DTEND:${fmtFloating(end)}`,
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }
}
