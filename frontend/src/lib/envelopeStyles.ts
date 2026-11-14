import {
  EnvelopeStyleType,
  EnvelopeFlapType,
  EnvelopeOpeningMode,
} from '@/types/invitation';

export type EnvelopeCategory =
  | 'BODA_CLASICA'
  | 'GALA_NOCTURNA'
  | 'CAMPESTRE_BOHO'
  | 'PLAYA_TROPICAL'
  | 'QUINCEANERA'
  | 'GLAMOUR_VIP';

export interface EnvelopeOpeningModeOption {
  id: EnvelopeOpeningMode;
  name: string;
  badge: string;
  description: string;
  icon: string;
}

export const ENVELOPE_OPENING_MODES: EnvelopeOpeningModeOption[] = [
  {
    id: 'FULLSCREEN_CURTAIN',
    name: 'Cortina Pantalla Completa Inmersiva (Estilo Invitplan / Canva)',
    badge: 'Más Recomendado',
    description:
      'El sobre cubre el 100% de la pantalla del celular o monitor. Al tocar el sello central, las 4 solapas se abren hacia los cuatro extremos como un telón cinematográfico de gala.',
    icon: '📯',
  },
  {
    id: 'ROYAL_GATEFOLD',
    name: 'Díptico Imperial (Puertas Francesas / Gatefold)',
    badge: 'Gala Real',
    description:
      'Dos paneles batientes dorados divididos al centro que abren majestuosamente hacia ambos laterales revelando la ceremonia.',
    icon: '🚪',
  },
  {
    id: 'ORIGAMI_PETAL_REVEAL',
    name: 'Flor de Origami (Pétalos en Espiral Concéntrica)',
    badge: 'Alta Costura',
    description:
      'Cuatro pétalos geométricos en solapas cruzadas que se abren en rotación tridimensional como una flor nupcial floreciendo al tacto.',
    icon: '🌸',
  },
  {
    id: 'HORIZONTAL_POCKET_SLIDE',
    name: 'Estuche / Funda de Gala (Deslizamiento Lateral)',
    badge: 'Pocketfold',
    description:
      'Elegante estuche de sobre con ventana biselada donde la tarjeta se desliza hacia un lateral con lazo de gala.',
    icon: '🎀',
  },
  {
    id: 'CLASSIC_3D_ENVELOPE',
    name: 'Sobre Carta 3D Artesanal (Tarjeta Deslizante)',
    badge: 'Postal 3D',
    description:
      'Sobre artesanal tridimensional con forro interior de seda o damasco donde la tarjeta de invitación emerge suavemente hacia arriba.',
    icon: '✉️',
  },
];

export interface EnvelopeStyleConfig {
  id: EnvelopeStyleType;
  category: EnvelopeCategory;
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
  linerPatternSvg: string; // SVG data URI
  backOfFlapGradient: string;
  // Tarjeta de invitación que desliza
  cardBorder: string;
  cardAccentColor: string;
  // Lacre recomendado por defecto
  recommendedSealColor:
    | 'burgundy'
    | 'gold'
    | 'olive'
    | 'emerald'
    | 'sapphire'
    | 'terracotta'
    | 'lavender'
    | 'graphite';
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

const BOHO_PAMPA_SVG = `data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 2c2 10 8 18 18 22-10 4-16 12-18 22-2-10-8-18-18-22 10-4 16-12 18-22z' fill='%23ea580c' fill-opacity='0.18'/%3E%3Ccircle cx='24' cy='24' r='3' fill='%23d97706' fill-opacity='0.25'/%3E%3C/svg%3E`;

const LAVENDER_FIELD_SVG = `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 4c1 4 4 7 8 8-4 1-7 4-8 8-1-4-4-7-8-8 4-1 7-4 8-8zm-10 16c1 3 3 5 6 6-3 1-5 3-6 6-1-3-3-5-6-6 3-1 5-3 6-6zm20 0c1 3 3 5 6 6-3 1-5 3-6 6-1-3-3-5-6-6 3-1 5-3 6-6z' fill='%23c084fc' fill-opacity='0.22'/%3E%3C/svg%3E`;

const TROPICAL_PALM_SVG = `data:image/svg+xml,%3Csvg width='54' height='54' viewBox='0 0 54 54' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M27 3c2 9 9 16 20 20-11 4-18 11-20 20-2-9-9-16-20-20 11-4 18-11 20-20zM12 36c1 5 5 9 11 11-6 2-10 6-11 11-1-5-5-9-11-11 6-2 10-6 11-11zm30 0c1 5 5 9 11 11-6 2-10 6-11 11-1-5-5-9-11-11 6-2 10-6 11-11z' fill='%2310b981' fill-opacity='0.2'/%3E%3C/svg%3E`;

const SAPPHIRE_FILIGREE_SVG = `data:image/svg+xml,%3Csvg width='44' height='44' viewBox='0 0 44 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22 2l4 12 12 4-12 4-4 12-4-12-12-4 12-4 4-12zm0 8l-2 6-6 2 6 2 2 6 2-6 6-2-6-2-2-6z' fill='%2338bdf8' fill-opacity='0.25'/%3E%3C/svg%3E`;

const GLITZ_CHAMPAGNE_SVG = `data:image/svg+xml,%3Csvg width='38' height='38' viewBox='0 0 38 38' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='19' cy='19' r='2' fill='%23fef08a' fill-opacity='0.4'/%3E%3Ccircle cx='6' cy='8' r='1.5' fill='%23fde047' fill-opacity='0.3'/%3E%3Ccircle cx='32' cy='10' r='1.5' fill='%23fde047' fill-opacity='0.3'/%3E%3Ccircle cx='8' cy='30' r='1.2' fill='%23fde047' fill-opacity='0.3'/%3E%3Ccircle cx='30' cy='28' r='1.2' fill='%23fde047' fill-opacity='0.3'/%3E%3Cpath d='M19 8l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4z' fill='%23fef08a' fill-opacity='0.35'/%3E%3C/svg%3E`;

const LILAC_BUTTERFLY_SVG = `data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 18c3-6 9-8 14-6 2 4-1 10-6 12 5 2 8 8 6 12-5 2-11 0-14-6-3 6-9 8-14 6-2-4 1-10 6-12-5-2-8-8-6-12 5-2 11 0 14 6z' fill='%23e879f9' fill-opacity='0.22'/%3E%3Ccircle cx='24' cy='24' r='1.5' fill='%23f0abfc' fill-opacity='0.5'/%3E%3C/svg%3E`;

// =========================================================================
// CATÁLOGO MAESTRO: 12 COLECCIONES DE LUJO DE PAPELERÍA & SOBRES
// =========================================================================
export const ENVELOPE_STYLES: EnvelopeStyleConfig[] = [
  // 1. MARFIL REAL & PAN DE ORO (Boda Clásica de Gala)
  {
    id: 'IVORY_GOLD_DECKLE',
    category: 'BODA_CLASICA',
    name: 'Marfil Real & Pan de Oro',
    subtitle: 'Algodón Marfil & Ribete Oro Metálico',
    description:
      'El clásico indiscutible de alta tarjetería. Papel de algodón artesanal marfil, bordes biselados con foil dorado y forro interior botánico en oro.',
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

  // 2. AZUL NOCHE & CONSTELACIÓN ASTRAL (Gala Nocturna / Black-Tie)
  {
    id: 'MIDNIGHT_CELESTIAL',
    category: 'GALA_NOCTURNA',
    name: 'Azul Noche & Constelación Astral',
    subtitle: 'Zafiro Profundo & Mapa Estelar Oro',
    description:
      'Elegancia nocturna de gala. Papel azul marino profundo aterciopelado con ribetes perimetrales de oro y forro interior con constelaciones doradas.',
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

  // 3. VERDE ESMERALDA & FOLLAJE IMPERIAL (Boda Botánica / Jardín de Lujo)
  {
    id: 'EMERALD_BOTANIC',
    category: 'BODA_CLASICA',
    name: 'Verde Esmeralda & Follaje Imperial',
    subtitle: 'Verde Bosque & Eucalipto en Pan de Oro',
    description:
      'Inspiración botánica y campestre de lujo. Papel verde esmeralda profundo con destellos en oro y forro interior con ramas de olivo y eucalipto.',
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

  // 4. BURDEOS TERCIOPELO & DAMASCO REAL (Realeza & Pasión)
  {
    id: 'BURGUNDY_ROYAL',
    category: 'BODA_CLASICA',
    name: 'Burdeos Terciopelo & Damasco Real',
    subtitle: 'Borgoña Noble & Filigrana Barroca Oro',
    description:
      'Pasión y distinción palaciega. Papel borgoña vino tinto aterciopelado con ribetes metálicos y forro de damasco barroco veneciano en pan de oro.',
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

  // 5. NEGRO CARBÓN & ORO LÍQUIDO (Minimalismo Ultra Moderno)
  {
    id: 'ONYX_MINIMAL_GOLD',
    category: 'GALA_NOCTURNA',
    name: 'Negro Carbón & Oro Líquido',
    subtitle: 'Negro Azabache & Art Déco Líneas Oro',
    description:
      'Minimalismo editorial contemporáneo. Negro mate de alta costura con vivos nítidos en oro pulido y forro interior con geometría Art Déco.',
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

  // 6. ROSA EMPOLVADO & ORO ROSA (Romance Dulce)
  {
    id: 'BLUSH_ROSE_GOLD',
    category: 'QUINCEANERA',
    name: 'Rosa Empolvado & Oro Rosa',
    subtitle: 'Nude Romántico & Destellos Rose Gold',
    description:
      'Dulzura, romanticismo y delicadeza. Papel rosa nude empolvado con ribetes biselados en oro rosa y forro de pétalos y peonías.',
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

  // 7. TERRACOTA TOSCANO & PAMPA GRASS (Boda Campestre / Boho Sunset)
  {
    id: 'TERRACOTTA_BOHO',
    category: 'CAMPESTRE_BOHO',
    name: 'Terracota Toscano & Pampa Grass',
    subtitle: 'Arcilla Cálida, Arena & Oro Cobre',
    description:
      'Estética bohemia y campestre toscana. Textura cálida en arcilla terracota, destellos en oro cobrizo y forro interior con espigas de pampa.',
    badge: 'Boho Sunset',
    accent: '#ea580c',
    swatch: {
      primary: '#9a3412',
      secondary: '#431407',
      foil: '#f97316',
    },
    paperGradient: 'linear-gradient(145deg, #b45309 0%, #7c2d12 50%, #431407 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #c2410c 0%, #9a3412 60%, #5c1d09 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #c2410c 0%, #9a3412 60%, #5c1d09 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #431407 0%, #7c2d12 60%, #c2410c 100%)',
    topFlapGradient: 'linear-gradient(180deg, #ea580c 0%, #9a3412 70%, #5c1d09 100%)',
    foilColor: '#fb923c',
    foilBorderGradient: 'linear-gradient(90deg, #9a3412, #fed7aa, #fb923c, #ffedd5, #9a3412)',
    foilBoxShadow: '0 0 12px rgba(251, 146, 60, 0.45)',
    linerBackground: 'linear-gradient(145deg, #2d1007 0%, #431407 50%, #1f0b05 100%)',
    linerPatternSvg: BOHO_PAMPA_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #5c1d09 0%, #2d1007 100%)',
    cardBorder: '1px solid #fed7aa',
    cardAccentColor: '#c2410c',
    recommendedSealColor: 'terracotta',
    buttonStyle: {
      bg: 'bg-amber-950/95',
      border: 'border-[#fb923c]/70 hover:border-[#fed7aa]',
      text: 'text-[#fff7ed]',
      icon: 'text-[#fed7aa]',
    },
  },

  // 8. LAVANDA PROVENZAL & RAMAS SILVESTRES (Romance Campiña Vintage)
  {
    id: 'LAVENDER_PROVENCE',
    category: 'CAMPESTRE_BOHO',
    name: 'Lavanda Provenzal & Ramas Silvestres',
    subtitle: 'Lila Aterciopelado & Plata Suave',
    description:
      'Ensueño provenzal y vintage. Papel lila pastel con ribetes platinados suaves y forro interior con racimos de lavanda silvestre.',
    badge: 'Campiña Provenzal',
    accent: '#a855f7',
    swatch: {
      primary: '#6b21a8',
      secondary: '#3b0764',
      foil: '#e9d5ff',
    },
    paperGradient: 'linear-gradient(145deg, #581c87 0%, #3b0764 50%, #200438 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #6b21a8 0%, #4c1d95 60%, #2e1065 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #6b21a8 0%, #4c1d95 60%, #2e1065 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #2e1065 0%, #581c87 60%, #7e22ce 100%)',
    topFlapGradient: 'linear-gradient(180deg, #9333ea 0%, #6b21a8 70%, #3b0764 100%)',
    foilColor: '#d8b4fe',
    foilBorderGradient: 'linear-gradient(90deg, #6b21a8, #f3e8ff, #d8b4fe, #faf5ff, #6b21a8)',
    foilBoxShadow: '0 0 12px rgba(216, 180, 254, 0.45)',
    linerBackground: 'linear-gradient(145deg, #18022b 0%, #290847 50%, #120120 100%)',
    linerPatternSvg: LAVENDER_FIELD_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #3b0764 0%, #18022b 100%)',
    cardBorder: '1px solid #e9d5ff',
    cardAccentColor: '#7e22ce',
    recommendedSealColor: 'lavender',
    buttonStyle: {
      bg: 'bg-purple-950/95',
      border: 'border-[#d8b4fe]/70 hover:border-[#f3e8ff]',
      text: 'text-[#faf5ff]',
      icon: 'text-[#d8b4fe]',
    },
  },

  // 9. VERDE SALVIA & PALMA ESMERALDA (Boda Playa / Destino Exclusivo)
  {
    id: 'TROPICAL_SALVIA',
    category: 'PLAYA_TROPICAL',
    name: 'Verde Salvia & Palma Esmeralda',
    subtitle: 'Salvia Suave & Palmera Real en Oro',
    description:
      'Frescura marina y lujo caribeño. Papel verde salvia orgánico con ribetes en oro pulido y forro interior con siluetas de palmeras tropicales.',
    badge: 'Playa & Trópico',
    accent: '#059669',
    swatch: {
      primary: '#047857',
      secondary: '#064e3b',
      foil: '#fcd34d',
    },
    paperGradient: 'linear-gradient(145deg, #0f766e 0%, #044e46 50%, #022c27 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #115e59 0%, #044e46 60%, #033630 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #115e59 0%, #044e46 60%, #033630 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #033630 0%, #0d9488 60%, #14b8a6 100%)',
    topFlapGradient: 'linear-gradient(180deg, #134e4a 0%, #0f766e 70%, #042f2b 100%)',
    foilColor: '#fcd34d',
    foilBorderGradient: 'linear-gradient(90deg, #b45309, #fef08a, #fcd34d, #fef9c3, #b45309)',
    foilBoxShadow: '0 0 12px rgba(252, 211, 77, 0.45)',
    linerBackground: 'linear-gradient(145deg, #02201b 0%, #033830 50%, #011713 100%)',
    linerPatternSvg: TROPICAL_PALM_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #044e46 0%, #02201b 100%)',
    cardBorder: '1px solid #99f6e4',
    cardAccentColor: '#0d9488',
    recommendedSealColor: 'olive',
    buttonStyle: {
      bg: 'bg-teal-950/95',
      border: 'border-[#fcd34d]/70 hover:border-[#fef08a]',
      text: 'text-[#f0fdfa]',
      icon: 'text-[#fcd34d]',
    },
  },

  // 10. ZAFIRO REAL & PLATA PLATINO (Cuento de Hadas / Majestuoso)
  {
    id: 'ROYAL_SAPPHIRE',
    category: 'GALA_NOCTURNA',
    name: 'Zafiro Real & Plata Platino',
    subtitle: 'Azul Majestad & Filigrana en Plata',
    description:
      'Imponencia y distinción aristocrática. Papel azul zafiro con ribetes biselados en plata platino brillante y forro interior con blasones de gala.',
    badge: 'Cuento de Hadas',
    accent: '#0284c7',
    swatch: {
      primary: '#0369a1',
      secondary: '#082f49',
      foil: '#e2e8f0',
    },
    paperGradient: 'linear-gradient(145deg, #0c4a6e 0%, #07344f 50%, #031c2b 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #0369a1 0%, #075985 60%, #0c4a6e 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #0369a1 0%, #075985 60%, #0c4a6e 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #031c2b 0%, #0284c7 60%, #38bdf8 100%)',
    topFlapGradient: 'linear-gradient(180deg, #0284c7 0%, #075985 70%, #031c2b 100%)',
    foilColor: '#cbd5e1',
    foilBorderGradient: 'linear-gradient(90deg, #64748b, #ffffff, #cbd5e1, #f8fafc, #64748b)',
    foilBoxShadow: '0 0 12px rgba(203, 213, 225, 0.45)',
    linerBackground: 'linear-gradient(145deg, #02131f 0%, #04253a 50%, #010a11 100%)',
    linerPatternSvg: SAPPHIRE_FILIGREE_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #082f49 0%, #02131f 100%)',
    cardBorder: '1px solid #bae6fd',
    cardAccentColor: '#0284c7',
    recommendedSealColor: 'sapphire',
    buttonStyle: {
      bg: 'bg-sky-950/95',
      border: 'border-[#cbd5e1]/70 hover:border-white',
      text: 'text-[#f0f9ff]',
      icon: 'text-[#e0f2fe]',
    },
  },

  // 11. CHAMPÁN PERLADO & DESTELLOS GLITZ (Bodas de Oro / Aniversarios / Gala VIP)
  {
    id: 'CHAMPAGNE_GLAMOUR',
    category: 'GLAMOUR_VIP',
    name: 'Champán Perlado & Destellos Glitz',
    subtitle: 'Nácar Dorado & Lluvia de Diamantes',
    description:
      'Luminosidad festiva y glamour deslumbrante. Papel perlado champán con destellos glitter en oro amarillo y forro interior con chispas de luz.',
    badge: 'Gala VIP',
    accent: '#ca8a04',
    swatch: {
      primary: '#fef08a',
      secondary: '#ca8a04',
      foil: '#facc15',
    },
    paperGradient: 'linear-gradient(145deg, #fef9c3 0%, #fef08a 50%, #fde047 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #fef08a 0%, #fde047 60%, #eab308 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #fef08a 0%, #fde047 60%, #eab308 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #ca8a04 0%, #facc15 60%, #fef08a 100%)',
    topFlapGradient: 'linear-gradient(180deg, #fefce8 0%, #fef08a 70%, #eab308 100%)',
    foilColor: '#ca8a04',
    foilBorderGradient: 'linear-gradient(90deg, #854d0e, #fef9c3, #facc15, #fefce8, #854d0e)',
    foilBoxShadow: '0 0 14px rgba(250, 204, 21, 0.55)',
    linerBackground: 'linear-gradient(145deg, #422006 0%, #713f12 50%, #291202 100%)',
    linerPatternSvg: GLITZ_CHAMPAGNE_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #713f12 0%, #422006 100%)',
    cardBorder: '1px solid #fde047',
    cardAccentColor: '#a16207',
    recommendedSealColor: 'gold',
    buttonStyle: {
      bg: 'bg-yellow-950/95',
      border: 'border-[#facc15]/80 hover:border-[#fef9c3]',
      text: 'text-[#fefce8]',
      icon: 'text-[#facc15]',
    },
  },

  // 12. LILA ENSUEÑO & MARIPOSAS HOLOGRÁFICAS (15 Años / Quinceañera)
  {
    id: 'SWEET_FIFTEEN_LILAC',
    category: 'QUINCEANERA',
    name: 'Lila Ensueño & Mariposas',
    subtitle: 'Malva Pastel & Destellos Mágicos',
    description:
      'Ideal para Quinceañeras y 15 Años. Papel malva pastel con ribetes tornasol holográficos y forro interior con mariposas mágicas en relieve.',
    badge: '15 Años / Quinceañera',
    accent: '#d946ef',
    swatch: {
      primary: '#f0abfc',
      secondary: '#c026d3',
      foil: '#f472b6',
    },
    paperGradient: 'linear-gradient(145deg, #fae8ff 0%, #f5d0fe 50%, #f0abfc 100%)',
    leftFlapGradient: 'linear-gradient(135deg, #f5d0fe 0%, #f0abfc 60%, #e879f9 100%)',
    rightFlapGradient: 'linear-gradient(225deg, #f5d0fe 0%, #f0abfc 60%, #e879f9 100%)',
    bottomFlapGradient: 'linear-gradient(0deg, #c026d3 0%, #e879f9 60%, #fae8ff 100%)',
    topFlapGradient: 'linear-gradient(180deg, #fdf4ff 0%, #f5d0fe 70%, #d946ef 100%)',
    foilColor: '#ec4899',
    foilBorderGradient: 'linear-gradient(90deg, #9d174d, #fbcfe8, #ec4899, #fdf2f8, #9d174d)',
    foilBoxShadow: '0 0 12px rgba(236, 72, 153, 0.45)',
    linerBackground: 'linear-gradient(145deg, #701a75 0%, #a21caf 50%, #4a044e 100%)',
    linerPatternSvg: LILAC_BUTTERFLY_SVG,
    backOfFlapGradient: 'linear-gradient(0deg, #a21caf 0%, #701a75 100%)',
    cardBorder: '1px solid #f472b6',
    cardAccentColor: '#c026d3',
    recommendedSealColor: 'lavender',
    buttonStyle: {
      bg: 'bg-fuchsia-950/95',
      border: 'border-[#ec4899]/70 hover:border-[#fbcfe8]',
      text: 'text-[#fdf4ff]',
      icon: 'text-[#f472b6]',
    },
  },
];

export const ENVELOPE_FLAP_OPTIONS: {
  id: EnvelopeFlapType;
  label: string;
  desc: string;
  icon: string;
}[] = [
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
  {
    id: 'ORIGAMI_CROSS',
    label: 'Pliegue Origami Cruzado (Pétalos en Cruz)',
    desc: 'Corte asimétrico donde las solapas se superponen en cruz formando una flor central.',
    icon: '✦',
  },
];

export interface EventPresetConfig {
  id: string;
  name: string;
  eventType: string;
  icon: string;
  description: string;
  openingMode: EnvelopeOpeningMode;
  envelopeStyle: EnvelopeStyleType;
  envelopeFlap: EnvelopeFlapType;
  sealColor: string;
  monogram: string;
}

export const EVENT_PRESETS: EventPresetConfig[] = [
  {
    id: 'ROYAL_WEDDING_PRESET',
    name: 'Boda Real de Gala (Invitplan)',
    eventType: 'Boda Religiosa / Catedral',
    icon: '👑',
    description: 'Apertura en cortina de 4 solapas con algodón marfil, ribetes en pan de oro y sello borgoña vino.',
    openingMode: 'FULLSCREEN_CURTAIN',
    envelopeStyle: 'IVORY_GOLD_DECKLE',
    envelopeFlap: 'EURO_TRIANGLE',
    sealColor: 'burgundy',
    monogram: 'S&J',
  },
  {
    id: 'MIDNIGHT_GALA_PRESET',
    name: 'Gala Nocturna Black-Tie',
    eventType: 'Gala de Noche / Hotel 5 Estrellas',
    icon: '🌌',
    description: 'Díptico doble puerta francesa azul medianoche con mapa estelar y sello en oro líquido.',
    openingMode: 'ROYAL_GATEFOLD',
    envelopeStyle: 'MIDNIGHT_CELESTIAL',
    envelopeFlap: 'DIAMOND_PEAK',
    sealColor: 'gold',
    monogram: 'S&J',
  },
  {
    id: 'BOHO_SUNSET_PRESET',
    name: 'Romance Campestre & Boho Sunset',
    eventType: 'Hacienda / Finca / Viñedo',
    icon: '🌾',
    description: 'Flor de origami con textura terracota arcilla, espigas de pampa y sello terracota artesanal.',
    openingMode: 'ORIGAMI_PETAL_REVEAL',
    envelopeStyle: 'TERRACOTTA_BOHO',
    envelopeFlap: 'ORIGAMI_CROSS',
    sealColor: 'terracotta',
    monogram: 'S&J',
  },
  {
    id: 'BOTANIC_GARDEN_PRESET',
    name: 'Jardín Botánico & Olivo',
    eventType: 'Boda al Aire Libre / Jardín',
    icon: '🌿',
    description: 'Cortina pantalla completa verde esmeralda con eucalipto en pan de oro y sello verde oliva.',
    openingMode: 'FULLSCREEN_CURTAIN',
    envelopeStyle: 'EMERALD_BOTANIC',
    envelopeFlap: 'EURO_TRIANGLE',
    sealColor: 'emerald',
    monogram: 'S&J',
  },
  {
    id: 'QUINCEANERA_LILAC_PRESET',
    name: 'Quinceañera & Sweet 15',
    eventType: 'Fiesta de 15 Años / Debutante',
    icon: '🦋',
    description: 'Flor de origami lila y mariposas con ribete oro rosa y sello lavanda perfumado.',
    openingMode: 'ORIGAMI_PETAL_REVEAL',
    envelopeStyle: 'SWEET_FIFTEEN_LILAC',
    envelopeFlap: 'BARONIAL_ROUND',
    sealColor: 'lavender',
    monogram: '15',
  },
  {
    id: 'BEACH_TROPICAL_PRESET',
    name: 'Boda de Playa & Caribe',
    eventType: 'Playa / Destino Tropical',
    icon: '🌴',
    description: 'Funda de gala deslizante con verde salvia, palmeras doradas y sello oliva.',
    openingMode: 'HORIZONTAL_POCKET_SLIDE',
    envelopeStyle: 'TROPICAL_SALVIA',
    envelopeFlap: 'DIAMOND_PEAK',
    sealColor: 'olive',
    monogram: 'S&J',
  },
];

export function getEnvelopeStyleConfig(id?: EnvelopeStyleType): EnvelopeStyleConfig {
  const found = ENVELOPE_STYLES.find((s) => s.id === id);
  return found || ENVELOPE_STYLES[0];
}
