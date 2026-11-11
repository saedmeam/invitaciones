import { EventTheme } from '@/types/invitation';

export interface ThemeTokens {
  id: EventTheme;
  label: string;
  description: string;
  pageBg: string;
  surfaceBg: string;
  surfaceMutedBg: string;
  borderClass: string;
  textPrimary: string;
  textMuted: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  buttonPrimary: string;
  buttonSecondary: string;
  envelopeBg: string;
  badgeBg: string;
}

export const THEME_REGISTRY: Record<EventTheme, ThemeTokens> = {
  ROMANTIC_EDITORIAL: {
    id: 'ROMANTIC_EDITORIAL',
    label: 'Editorial Romántico',
    description: 'Marfil cálido, tipografía clásica y detalles en dorado antiguo.',
    pageBg: 'bg-[#faf7f2]',
    surfaceBg: 'bg-white',
    surfaceMutedBg: 'bg-[#f5efe6]',
    borderClass: 'border-[#e6dac8]',
    textPrimary: 'text-[#1c1917]',
    textMuted: 'text-[#6b6258]',
    accentText: 'text-[#9e7b44]',
    accentBg: 'bg-[#b08d57]',
    accentBorder: 'border-[#b08d57]',
    buttonPrimary: 'bg-[#b08d57] hover:bg-[#967543] text-white',
    buttonSecondary: 'border border-[#d5c3a5] text-[#6b5330] hover:bg-[#f5efe6]',
    envelopeBg: 'bg-gradient-to-br from-[#faf6ee] via-[#f2e8d9] to-[#e7d7bf]',
    badgeBg: 'bg-[#f3eadb] text-[#7c5e2c]',
  },
  BOTANICAL_GARDEN: {
    id: 'BOTANICAL_GARDEN',
    label: 'Botánico / Jardín',
    description: 'Verde salvia, crema natural y acentos orgánicos.',
    pageBg: 'bg-[#f3f6f1]',
    surfaceBg: 'bg-white',
    surfaceMutedBg: 'bg-[#e8efe5]',
    borderClass: 'border-[#cddcc9]',
    textPrimary: 'text-[#1e2d24]',
    textMuted: 'text-[#4e6354]',
    accentText: 'text-[#3e5f47]',
    accentBg: 'bg-[#4d6b53]',
    accentBorder: 'border-[#4d6b53]',
    buttonPrimary: 'bg-[#4d6b53] hover:bg-[#3d5742] text-white',
    buttonSecondary: 'border border-[#b4cbb0] text-[#354d3a] hover:bg-[#e8efe5]',
    envelopeBg: 'bg-gradient-to-br from-[#f2f6ef] via-[#e4ede0] to-[#d2e0cd]',
    badgeBg: 'bg-[#dfeadb] text-[#2f4b36]',
  },
  CLASSIC_NOCTURNE: {
    id: 'CLASSIC_NOCTURNE',
    label: 'Clásico Nocturno',
    description: 'Obsidiana profunda, champagne luminoso y estética de gala.',
    pageBg: 'bg-[#0f1115]',
    surfaceBg: 'bg-[#181b22]',
    surfaceMutedBg: 'bg-[#20242d]',
    borderClass: 'border-[#2f333d]',
    textPrimary: 'text-[#f5efe6]',
    textMuted: 'text-[#b6afa3]',
    accentText: 'text-[#dfc07c]',
    accentBg: 'bg-[#c9a45c]',
    accentBorder: 'border-[#c9a45c]',
    buttonPrimary: 'bg-[#c9a45c] hover:bg-[#b58e45] text-[#111216]',
    buttonSecondary: 'border border-[#474b57] text-[#e5d4b0] hover:bg-[#242832]',
    envelopeBg: 'bg-gradient-to-br from-[#14171d] via-[#1c2029] to-[#262934]',
    badgeBg: 'bg-[#28241b] text-[#e3c785]',
  },
};
