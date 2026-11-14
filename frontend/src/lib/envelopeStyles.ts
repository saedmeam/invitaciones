import { EnvelopeStyleType, EnvelopeFlapType } from '@/types/invitation';

export interface EnvelopeStyleConfig {
  id: EnvelopeStyleType;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  accent: string;
  swatch: {
    primary: string;
    secondary: string;
    foil: string;
  };
  // Gradientes de solapas exteriores
  paperGradient: string;
  leftFlapGradient: string;
  rightFlapGradient: string;
  bottomFlapGradient: string;
  topFlapGradient: string;
  // Ribete de Foil Metálico
  foilColor: string;
  foilBorderGradient: string;
  foilBoxShadow: string;
  // Cavidad Interior y Forro de Gala (Liner)
  linerBackground: string;
  linerPatternSvg: string; // SVG data URI o gradiente
  backOfFlapGradient: string;
  // Tarjeta de invitación que desliza
  cardBorder: string;
  cardAccentColor: string;
  // Lacre recomendado por defecto
  recommendedSealColor: 'burgundy' | 'gold' | 'olive' | 'emerald' | 'sapphire' | 'terracotta' | 'lavender' | 'graphite';
  // Botón "Abrir Invitación"
  buttonStyle: {
    bg: string;
    border: string;
    text: string;
    icon: string;
  };
}

// Patrones vectoriales de lujo codificados para forros interiores (Liner)
const BOTANICAL_GOLD_SVG = `data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 4c-2 6-8 10-14 10 6 2 10 8 10 14 2-6 8-10 14-10-6-2-10-8-10-14zM8 32c-1 3-4 5-7 5 3 1 5 4 5 7 1-3 4-5 7-5-3-1-5-4-5-7zM40 32c-1 3-4 5-7 5 3 1 5 4 5 7 1-3 4-5 7-5-3-1-5-4-5-7z' fill='%23d4af37' fill-opacity='0.22' fill-rule='evenodd'/%3E%3C/svg%3E`;

const CELESTIAL_STARS_SVG = `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 2l1.5 5.5L27 9l-5.5 1.5L20 16l-1.5-5.5L13 9l5.5-1.5L20 2zm15 18l1 3.5L39.5 24.5 36 25.5l-1 3.5-1-3.5-3.5-1 3.5-1 1-3.5zM6 24l.8 2.8 2.8.8-2.8.8L6 31.2l-.8-2.8-2.8-.8 2.8-.8L6 24z' fill='%23ffd700' fill-opacity='0.25'/%3E%3Ccircle cx='20' cy='32' r='1' fill='%23ffd700' fill-opacity='0.3'/%3E%3Ccircle cx='32' cy='10' r='1.2' fill='%23ffd700' fill-opacity='0.35'/%3E%3Ccircle cx='8' cy='8' r='1.2' fill='%23ffd700' fill-opacity='0.35'/%3E%3C/svg%3E`;

const EUCALYPTUS_LEAF_SVG = `data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M26 6c-3 8-10 12-18 12 8 3 12 10 12 18 3-8 10-12 18-12-8-3-12-10-12-18z' fill='%23d4af37' fill-opacity='0.2'/%3E%3Cpath d='M10 38c-1.5 4-5 6-9 6 4 1.5 6 5 6 9 1.5-4 5-6 9-6-4-1.5-6-5-6-9z' fill='%239e7b44' fill-opacity='0.2'/%3E%3Cpath d='M42 38c-1.5 4-5 6-9 6 4 1.5 6 5 6 9 1.5-4 5-6 9-6-4-1.5-6-5-6-9z' fill='%239e7b44' fill-opacity='0.2'/%3E%3C/svg%3E`;

const BAROQUE_DAMASK_SVG = `data:image/svg+xml,%3Csvg width='44' height='44' viewBox='0 0 44 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22 2c2 4 6 7 11 8-5 1-9 4-11 8-2-4-6-7-11-8 5-1 9-4 11-8zm0 24c2 4 6 7 11 8-5 1-9 4-11 8-2-4-6-7-11-8 5-1 9-4 11-8zM2 22c2 2 4 4 6 6-2 2-4 4-6 6-2-2-4-4-6-6 2-2 4-4 6-6zm40 0c2 2 4 4 6 6-2 2-4 4-6 6-2-2-4-4-6-6 2-2 4-4 6-6z' fill='%23d4af37' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E`;

const ART_DECO_GEOMETRIC_SVG = `data:image/svg+xml,%3Csvg width='36' height='36' viewBox='0 0 36 36' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M18 0l18 18-18 18L0 18 18 0zm0 4.5L4.5 18 18 31.5 31.5 18 18 4.5zm0 5L9.5 18 18 26.5 26.5 18 18 9.5z' fill='%23f59e0b' fill-opacity='0.18' fill-rule='evenodd'/%3E%3C/svg%3E`;

const BLUSH_FLORAL_SVG = `data:image/svg+xml,%3Csvg width='46' height='46' viewBox='0 0 46 46' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M23 4c3 6 8 9 15 9-7 3-10 8-12 15-2-7-5-12-12-15 7 0 10-5 12-15zM7 31c2 4 5 6 10 6-5 2-7 5-8 10-1-5-3-8-8-10 5 0 7-3 8-10zm32 0c2 4 5 6 10 6-5 2-7 5-8 10-1-5-3-8-8-10 5 0 7-3 8-10z' fill='%23e0a96d' fill-opacity='0.25' fill-rule='evenodd'/%3E%3C/svg%3E`;

export const ENVELOPE_STYLES: EnvelopeStyleConfig[] = [
  {
    id: 'IVORY_GOLD_DECKLE',
    name: 'Marfil Real & Pan de Oro',
    subtitle: 'Algodón Marfil & Ribete Oro Metálico',
    description: 'El clásico indiscutible de alta tarjetería. Papel de algodón artesanal marfil, bordes biselados con foil dorado y forro interior botánico en oro.',
    badge: 'Más Elegido',
    accent: '#b08d57',
    swatch: {
      primary: '#faf7f2',
      secondary: '#ebdccb',
      foil: '#d4af37',
    },
    paperGradient: 'linear-gradient(145deg, #fbf8f3 0%, #f3eae0 50%, #e6d8c3 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #f7efe4 0%, #ece0cf 60%, #dfd1bd 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #f7efe4 0%, #ece0cf 60%, #dfd1bd 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #dfd1bd 0%, #efe4d5 60%, #fbf7f0 100%)',
    topFlapGradient: 'linear-gradient(180deg, #fdfaf4 0%, #ece0d0 70%, #decbb4 100%)',
    foilColor: '#d4af37',
    foilBorderGradient: 'linear-gradient(90deg, #aa7c11, #ffd978, #d4af37, #ffe9a6, #aa7c11)',
    foilBoxShadow: '0 0 10px rgba(212, 175, 55, 0.45)',
    linerBackground: 'linear-gradient(145deg, #23201a 0%, #302b23 50%, #1e1b16 100%)',
    linerPatternSvg: BOTANICAL_GOLD_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #302b23 0%, #201c17 100%)',
    cardBorder: '1px solid #e5d8c3',
    cardAccentColor: '#b08d57',
    recommendedSealColor: 'burgundy',
    buttonStyle: {
      bg: 'bg-stone-900/95',
      border: 'border-[#d4af37]/60 hover:border-[#ffd978]',
      text: 'text-[#fbf7f0]',
      icon: 'text-[#ffd978]',
    },
  },
  {
    id: 'MIDNIGHT_CELESTIAL',
    name: 'Azul Noche & Constelación Astral',
    subtitle: 'Zafiro Profundo & Mapa Estelar Oro',
    description: 'Elegancia nocturna de gala. Papel azul marino profundo aterciopelado con ribetes perimetrales de oro y forro interior con constelaciones doradas.',
    badge: 'Gala Nocturna',
    accent: '#38bdf8',
    swatch: {
      primary: '#0f172a',
      secondary: '#1e293b',
      foil: '#ffd700',
    },
    paperGradient: 'linear-gradient(145deg, #182338 0%, #0f172a 50%, #090d16 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #1e293b 0%, #151f30 60%, #0d1422 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #1e293b 0%, #151f30 60%, #0d1422 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #0d1422 0%, #182338 60%, #223048 100%)',
    topFlapGradient: 'linear-gradient(180deg, #273752 0%, #172236 70%, #0e1625 100%)',
    foilColor: '#ffd700',
    foilBorderGradient: 'linear-gradient(90deg, #997318, #ffe580, #ffd700, #fff4b8, #997318)',
    foilBoxShadow: '0 0 12px rgba(255, 215, 0, 0.45)',
    linerBackground: 'linear-gradient(145deg, #070b13 0%, #0e1525 50%, #05080e 100%)',
    linerPatternSvg: CELESTIAL_STARS_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #0f1828 0%, #080d16 100%)',
    cardBorder: '1px solid #cbd5e1',
    cardAccentColor: '#0284c7',
    recommendedSealColor: 'gold',
    buttonStyle: {
      bg: 'bg-slate-950/95',
      border: 'border-[#ffd700]/70 hover:border-[#ffe580]',
      text: 'text-[#f0f9ff]',
      icon: 'text-[#ffd700]',
    },
  },
  {
    id: 'EMERALD_BOTANIC',
    name: 'Verde Esmeralda & Follaje Imperial',
    subtitle: 'Verde Bosque & Eucalipto en Pan de Oro',
    description: 'Inspiración botánica y campestre de lujo. Papel verde esmeralda profundo con destellos en oro y forro interior con ramas de olivo y eucalipto.',
    badge: 'Botánico Lujo',
    accent: '#10b981',
    swatch: {
      primary: '#064e3b',
      secondary: '#022c22',
      foil: '#d4af37',
    },
    paperGradient: 'linear-gradient(145deg, #065f46 0%, #044332 50%, #02261d 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #076d50 0%, #05503b 60%, #033628 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #076d50 0%, #05503b 60%, #033628 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #033628 0%, #065740 60%, #0a795a 100%)',
    topFlapGradient: 'linear-gradient(180deg, #0b8663 0%, #065841 70%, #043e2e 100%)',
    foilColor: '#d4af37',
    foilBorderGradient: 'linear-gradient(90deg, #8a6508, #ffd76b, #d4af37, #ffe89e, #8a6508)',
    foilBoxShadow: '0 0 12px rgba(212, 175, 55, 0.45)',
    linerBackground: 'linear-gradient(145deg, #021a14 0%, #052c21 50%, #02150f 100%)',
    linerPatternSvg: EUCALYPTUS_LEAF_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #053327 0%, #021c15 100%)',
    cardBorder: '1px solid #a7f3d0',
    cardAccentColor: '#059669',
    recommendedSealColor: 'emerald',
    buttonStyle: {
      bg: 'bg-emerald-950/95',
      border: 'border-[#d4af37]/70 hover:border-[#ffd76b]',
      text: 'text-[#ecfdf5]',
      icon: 'text-[#ffd76b]',
    },
  },
  {
    id: 'BURGUNDY_ROYAL',
    name: 'Burdeos Terciopelo & Damasco Real',
    subtitle: 'Borgoña Noble & Filigrana Barroca Oro',
    description: 'Pasión y distinción palaciega. Papel borgoña vino tinto aterciopelado con ribetes metálicos y forro de damasco barroco veneciano en pan de oro.',
    badge: 'Realeza Clásica',
    accent: '#be123c',
    swatch: {
      primary: '#881337',
      secondary: '#4c0519',
      foil: '#e5b842',
    },
    paperGradient: 'linear-gradient(145deg, #881337 0%, #5d0c24 50%, #3d0516 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #9f1239 0%, #730d2b 60%, #4c081c 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #9f1239 0%, #730d2b 60%, #4c081c 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #4c081c 0%, #77102e 60%, #a4193f 100%)',
    topFlapGradient: 'linear-gradient(180deg, #b01743 0%, #7d0e2f 70%, #53071d 100%)',
    foilColor: '#e5b842',
    foilBorderGradient: 'linear-gradient(90deg, #805c08, #ffdc73, #e5b842, #fff0a6, #805c08)',
    foilBoxShadow: '0 0 12px rgba(229, 184, 66, 0.45)',
    linerBackground: 'linear-gradient(145deg, #26020c 0%, #400617 50%, #20020a 100%)',
    linerPatternSvg: BAROQUE_DAMASK_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #440719 0%, #22020a 100%)',
    cardBorder: '1px solid #fecdd3',
    cardAccentColor: '#be123c',
    recommendedSealColor: 'burgundy',
    buttonStyle: {
      bg: 'bg-rose-950/95',
      border: 'border-[#e5b842]/70 hover:border-[#ffdc73]',
      text: 'text-[#fff1f2]',
      icon: 'text-[#ffdc73]',
    },
  },
  {
    id: 'ONYX_MINIMAL_GOLD',
    name: 'Negro Carbón & Oro Líquido',
    subtitle: 'Negro Azabache & Art Déco Líneas Oro',
    description: 'Minimalismo editorial contemporáneo. Negro mate de alta costura con vivos nítidos en oro pulido y forro interior con geometría Art Déco.',
    badge: 'Ultra Moderno',
    accent: '#f59e0b',
    swatch: {
      primary: '#18181b',
      secondary: '#09090b',
      foil: '#f59e0b',
    },
    paperGradient: 'linear-gradient(145deg, #27272a 0%, #18181b 50%, #09090b 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #2b2b2f 0%, #1d1d21 60%, #121215 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #2b2b2f 0%, #1d1d21 60%, #121215 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #121215 0%, #212126 60%, #2c2c33 100%)',
    topFlapGradient: 'linear-gradient(180deg, #37373f 0%, #222227 70%, #141417 100%)',
    foilColor: '#f59e0b',
    foilBorderGradient: 'linear-gradient(90deg, #92400e, #fcd34d, #f59e0b, #fef08a, #92400e)',
    foilBoxShadow: '0 0 14px rgba(245, 158, 11, 0.45)',
    linerBackground: 'linear-gradient(145deg, #09090a 0%, #161618 50%, #060607 100%)',
    linerPatternSvg: ART_DECO_GEOMETRIC_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #1c1c20 0%, #0a0a0c 100%)',
    cardBorder: '1px solid #d4af37',
    cardAccentColor: '#d97706',
    recommendedSealColor: 'gold',
    buttonStyle: {
      bg: 'bg-black/95',
      border: 'border-[#f59e0b]/70 hover:border-[#fcd34d]',
      text: 'text-[#fbfbfb]',
      icon: 'text-[#fcd34d]',
    },
  },
  {
    id: 'BLUSH_ROSE_GOLD',
    name: 'Rosa Empolvado & Oro Rosa',
    subtitle: 'Nude Romántico & Destellos Rose Gold',
    description: 'Dulzura, romanticismo y delicadeza. Papel rosa nude empolvado con ribetes biselados en oro rosa y forro de pétalos y peonías.',
    badge: 'Romance Dulce',
    accent: '#fb7185',
    swatch: {
      primary: '#fff1f2',
      secondary: '#fce7f3',
      foil: '#e0a96d',
    },
    paperGradient: 'linear-gradient(145deg, #fff5f6 0%, #fae6ea 50%, #f4d0d8 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #fff1f2 0%, #f9dde3 60%, #efc5ce 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #fff1f2 0%, #f9dde3 60%, #efc5ce 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #efc5ce 0%, #f9dee4 60%, #fff6f7 100%)',
    topFlapGradient: 'linear-gradient(180deg, #fff9f9 0%, #fae0e5 70%, #edbcc6 100%)',
    foilColor: '#e0a96d',
    foilBorderGradient: 'linear-gradient(90deg, #b45309, #fed7aa, #e0a96d, #fef3c7, #b45309)',
    foilBoxShadow: '0 0 12px rgba(224, 169, 109, 0.45)',
    linerBackground: 'linear-gradient(145deg, #fff2f5 0%, #ffe3ea 50%, #fed7e2 100%)',
    linerPatternSvg: BLUSH_FLORAL_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #fed7e2 0%, #fce7ed 100%)',
    cardBorder: '1px solid #fbcfe8',
    cardAccentColor: '#e11d48',
    recommendedSealColor: 'terracotta',
    buttonStyle: {
      bg: 'bg-stone-900/90',
      border: 'border-[#e0a96d]/70 hover:border-[#fed7aa]',
      text: 'text-[#fff1f2]',
      icon: 'text-[#e0a96d]',
    },
  },
];

export const ENVELOPE_FLAP_OPTIONS: { id: EnvelopeFlapType; label: string; desc: string; icon: string }[] = [
  {
    id: 'EURO_TRIANGLE',
    label: 'Solapa Euro Flap (Punta V Pronunciada)',
    desc: 'El corte de gala más emblemático de tarjetería nupcial de lujo con vértice alargado.',
    icon: '▼',
  },
  {
    id: 'DIAMOND_PEAK',
    label: 'Solapa Diamante (Corte Simétrico Clásico)',
    desc: 'Pliegues en proporción áurea clásica con vértice en el centro geométrico del sobre.',
    icon: '◆',
  },
  {
    id: 'BARONIAL_ROUND',
    label: 'Solapa Baronial (Curva Suave Biselada)',
    desc: 'Corte refinado con caída redondeada suave, ideal para sobres de estilo carta señorial.',
    icon: '◠',
  },
];

export function getEnvelopeStyleConfig(id?: EnvelopeStyleType): EnvelopeStyleConfig {
  const found = ENVELOPE_STYLES.find((s) => s.id === id);
  return found || ENVELOPE_STYLES[0];
}
