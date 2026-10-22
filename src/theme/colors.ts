export const Colors = {
  // Brand & Action
  primary: '#111519',
  secondary: '#15191D',
  tertiary: '#262D34',
  accent: '#5A6900',
  accentLime: '#D4E838',
  onAccentLime: '#111519',
  // Borde de la estrella llena sobre lima (mockup: #7F8F12).
  accentLimeEdge: '#7F8F12',

  // Surfaces & Backgrounds
  backgroundLight: '#EDF0F2',
  backgroundItemLight: '#FFFFFF',
  backgroundDark: '#0E1114',
  backgroundItemDark: '#171C21',

  // Monochromes
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Typography
  textPrimary: '#111519',
  textSecondary: '#555E66',
  textDisabled: '#A0A9B1',

  // Semantics & Status
  online: '#157A45',
  onlineSoft: '#DCEFE3',
  pickup: '#2458C6',
  pickupSoft: '#E1E9F9',
  danger: '#C8261B',
  dangerSoft: '#FBE3E0',
  cash: '#157A45',
  cashSoft: '#DCEFE3',

  // Colores semánticos del dominio (RunSubasta)
  origin: '#157A45',
  destination: '#2458C6',
  auction: '#D4E838',
  onAuction: '#111519',
  offer: '#D4E838',
  driverArriving: '#2458C6',
  onTrip: '#157A45',
  promo: '#D4E838',
  sos: '#C8261B',

  // Backward-compatibility aliases
  error: '#C8261B',
  success: '#157A45',
  warning: '#B7791F',
  warningSoft: '#FBEFD9',

  // Superficies superpuestas
  splash: '#0B0B0C',
  scrim: 'rgba(5, 8, 10, 0.55)',
  scrimSoft: 'rgba(5, 8, 10, 0.25)',
  onDarkHigh: 'rgba(255, 255, 255, 0.7)',
  onDarkMuted: 'rgba(255, 255, 255, 0.5)',
  onDarkLine: 'rgba(255, 255, 255, 0.15)',
  dangerOnDark: '#FF7A6E',
  originHalo: 'rgba(21, 122, 69, 0.25)',
  // Colores de los pines de mapa (location_origen / location_destino)
  pinOrigin: '#43C6F0',
  pinDestination: '#5FE3A1',
  pinRing: '#0B0F3A',

  // Peripherals & UI Elements
  divider: '#D5DADF',
  shadow: 'rgba(17, 21, 25, 0.14)',
  star: '#E8A317',
  plateBlue: '#1C4FA0',
} as const;

export type ColorKey = keyof typeof Colors;

/** Tokens del modo delivery (docs/delivery/run-delivery-replica.html, bloque `.app`). */
const DeliveryLight = {
  bg: '#F4F5F2',
  card: '#FFFFFF',
  ink: '#111519',
  muted: '#555E66',
  faint: '#A0A9B1',
  line: '#E6E8E3',
  soft: '#EEF0EC',
  lime: '#D4E838',
  limeStrong: '#7F8F12',
  olive: '#5A6900',
  limeSoft: '#F1F6CC',
  ok: '#157A45',
  red: '#C8261B',
  redSoft: '#FBE3E0',
  star: '#E8A317',
  // Barra de vidrio: velo sobre el desenfoque, borde, fondo sin desenfoque (Android) y pastilla elegida
  glassVeil: 'rgba(255, 255, 255, 0.55)',
  glassEdge: 'rgba(255, 255, 255, 0.7)',
  glassFallback: 'rgba(255, 255, 255, 0.92)',
  glassSelection: 'rgba(17, 21, 25, 0.07)',
  // Fondo oscurecido de hojas y diálogos (.dim) y aro del indicador de carga (.spin)
  dim: 'rgba(17, 21, 25, 0.45)',
  spinnerTrack: 'rgba(17, 21, 25, 0.2)',
  // Caja del método de pago Yape (.pm)
  yape: '#5B1F7A',
  // Fondo de la foto del producto (.pimg)
  productHero: '#ECEDE7',
  // Grupo de opciones que se está tocando (.grp.hl)
  groupActive: '#F6F8EC',
  // Ícono de kcal (.kc .ic)
  flame: '#E8590C',
  headerGradient: ['#2E3740', '#161B20', '#111519'] as const,
  // Fondos oscuros del inicio: banner (.hero), ofertas (.deal) y avatar (.av)
  heroGlow: '#3B4650',
  dealGlow: '#2B333B',
  avatarBg: '#2B333B',
  online: '#3DCB7E',
  onDark: '#FFFFFF',
  onDarkHigh: 'rgba(255, 255, 255, 0.85)',
  onDarkMuted: 'rgba(255, 255, 255, 0.7)',
  onDarkLine: 'rgba(255, 255, 255, 0.35)',
  onDarkFill: 'rgba(255, 255, 255, 0.12)',
  // Botones sobre la foto del local (.rhero .tb .icb)
  heroButton: 'rgba(17, 21, 25, 0.35)',
  // Pantalla de carga del modo (.trans)
  loadingBg: '#0B0B0C',
  loadingTrack: '#26282B',
  loadingText: '#8E969D',
  shadow: '#111519',
  black: '#000000',
} as const;

export const DeliveryColors = {
  light: DeliveryLight,
  // El mockup solo trae el modo claro; el oscuro se usa cuando se apruebe la propuesta.
  dark: DeliveryLight,
} as const;

export const ThemeColors = {
  light: {
    primary: Colors.primary,
    onPrimary: Colors.white,
    sig: Colors.accentLime,
    onSig: Colors.primary,
    accent: '#1C4FA0',
    background: '#EDF0F2',
    surface: Colors.white,
    surfaceMuted: '#F4F6F8',
    surfaceSoft: '#E1E9F9',
    drawer: '#111519',
    text: Colors.textPrimary,
    textMuted: Colors.textSecondary,
    textDisabled: Colors.textDisabled,
    divider: '#D5DADF',
    line: '#D5DADF',
    iconButton: Colors.white,
    shadow: Colors.shadow,
    statusBar: 'dark' as const,

    // Status
    online: Colors.online,
    onlineSoft: Colors.onlineSoft,
    pickup: Colors.pickup,
    pickupSoft: Colors.pickupSoft,
    danger: Colors.danger,
    dangerSoft: Colors.dangerSoft,
    cash: Colors.cash,
    cashSoft: Colors.cashSoft,
    warning: Colors.warning,
    warningSoft: Colors.warningSoft,

    // Colores semánticos del dominio
    origin: '#157A45',
    destination: '#2458C6',
    auction: '#D4E838',
    onAuction: '#111519',
    offer: '#D4E838',
    driverArriving: '#2458C6',
    onTrip: '#157A45',
    promo: '#D4E838',
    sos: '#C8261B',

    // Map & Route
    route: '#111519',
    routeCase: '#FFFFFF',

    delivery: DeliveryColors.light,
  },
  dark: {
    primary: Colors.accentLime,
    onPrimary: Colors.primary,
    sig: Colors.accentLime,
    onSig: Colors.primary,
    accent: Colors.accentLime,
    background: '#0E1114',
    surface: '#171C21',
    surfaceMuted: '#20262D',
    surfaceSoft: '#1A2640',
    drawer: '#101418',
    text: '#ECEFF1',
    textMuted: '#A0A9B1',
    textDisabled: 'rgba(236, 239, 241, 0.38)',
    divider: '#29313A',
    line: '#29313A',
    iconButton: '#171C21',
    shadow: 'rgba(0, 0, 0, 0.5)',
    statusBar: 'light' as const,

    // Status
    online: '#3DCB7E',
    onlineSoft: '#15301F',
    pickup: '#8DB1F5',
    pickupSoft: '#1A2640',
    danger: '#FF7A6E',
    dangerSoft: '#3A1916',
    cash: '#3DCB7E',
    cashSoft: '#15301F',
    warning: '#F2C14E',
    warningSoft: '#3A2E10',

    // Colores semánticos del dominio
    origin: '#3DCB7E',
    destination: '#8DB1F5',
    auction: '#D4E838',
    onAuction: '#111519',
    offer: '#D4E838',
    driverArriving: '#8DB1F5',
    onTrip: '#3DCB7E',
    promo: '#D4E838',
    sos: '#FF7A6E',

    // Map & Route
    route: '#D4E838',
    routeCase: '#101519',

    delivery: DeliveryColors.dark,
  },
} as const;

export type ThemeMode = keyof typeof ThemeColors;
export type AppTheme = (typeof ThemeColors)[ThemeMode];
