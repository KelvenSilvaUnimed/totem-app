import { Dimensions, StyleSheet, Platform } from 'react-native';

// Função segura para obter a largura da tela, inclusive em ambientes SSR/Node.js
const getScreenWidth = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return window.innerWidth || 1920;
    }
    // Fallback para SSR
    return 1920;
  }
  try {
    return Dimensions.get('window').width || 1920;
  } catch (e) {
    return 1920;
  }
};

const SCREEN_WIDTH = getScreenWidth();

// Baseado em Full HD (1920px de largura)
export const scale = (size: number) => (SCREEN_WIDTH / 1920) * size;
// Helper para valores que devem ter um mínimo e máximo
export const responsive = (size: number, min: number, max: number) => {
  const result = scale(size);
  return Math.min(Math.max(result, min), max);
};

export const palette = {
  background: '#ffffff',
  card: 'transparent',
  muted: '#94a3b8',
  primary: '#0ea5e9',
  primaryStrong: '#0ea5e9',
  secondary: '#1f2937',
  accent: '#f59e0b',
  success: '#22c55e',
  error: '#ef4444',
  white: '#f8fafc',
  darkText: '#0f172a',
  greenDark: '#2d5016',
  grayText: '#4a4a4a',
  orange: '#e8883a',
};

const shadow = (
  webShadow: string,
  native: {
    color: string;
    offset: { width: number; height: number };
    opacity: number;
    radius: number;
    elevation?: number;
  }
) =>
  Platform.select({
    web: { boxShadow: webShadow },
    default: {
      shadowColor: native.color,
      shadowOffset: native.offset,
      shadowOpacity: native.opacity,
      shadowRadius: native.radius,
      ...(native.elevation ? { elevation: native.elevation } : {}),
    },
  }) as any;

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
  backgroundLayerFixed: {
    // Mantemos absolute pois o container principal (screenRoot) já tem overflow hidden e o ScrollView é interno.
    position: 'absolute' as any,
  },
  safeArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  scrollContent: {
    padding: 40,
    paddingBottom: 60,
    paddingLeft: 40,
    paddingRight: 40,
    minHeight: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  scrollContentTablet: {
    paddingTop: '1%',
    paddingBottom: '25%',
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.08)',
    position: 'relative',
    zIndex: 3,
  },
  cardTitle: {
    color: '#064E4C',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  muted: {
    color: '#064E4C',
    fontSize: 20,
    lineHeight: 28,
  },
  highlight: {
    color: palette.white,
    fontWeight: '700',
  },
  label: {
    color: palette.muted,
    fontSize: 20,
    marginTop: 24,
    marginBottom: 10,
  },
  input: {
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    color: palette.white,
    backgroundColor: '#0b1220',
    fontSize: 22,
    position: 'relative',
    zIndex: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 19,
    marginTop: 16,
  },
  buttonRowTablet: {
    flexWrap: 'nowrap',
    gap: 23,
  },
  buttonColumn: {
    gap: 16,
    marginTop: 29,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    minWidth: 300,
    alignItems: 'center',
    position: 'relative',
    zIndex: 3,
  },
  primaryButtonText: {
    color: palette.darkText,
    fontWeight: '600',
    fontSize: 22,
  },
  secondaryButton: {
    backgroundColor: '#008C50',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    minWidth: 300,
    alignItems: 'center',
    borderWidth: 0,
    position: 'relative',
    zIndex: 3,
  },
  secondaryButtonText: {
    color: palette.white,
    fontWeight: '600',
    fontSize: 22,
  },
  linkButtonText: {
    color: palette.greenDark,
    textDecorationLine: 'underline',
    fontWeight: '600',
    fontSize: 20,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  status: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statusText: {
    color: palette.white,
    textAlign: 'center',
    fontSize: 20,
  },
  faturaScroll: {
    marginTop: 24,
    width: '100%',
  },
  faturaHeader: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0b5967',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '96%',
    alignSelf: 'center',
  },
  faturaHeaderText: {
    color: '#D6DAC0',
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  faturaRow: {
    width: '96%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a4a52',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 5,
    alignSelf: 'center',
  },
  faturaRowSelected: {
    backgroundColor: 'rgba(56,189,248,0.15)',
  },
  faturaRowText: {
    flex: 1,
    color: palette.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  faturaRowValue: {
    flex: 1,
    color: palette.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  rowActionGroup: {
    flex: 1.2,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  rowActionButton: {
    flex: 1,
    backgroundColor: '#d3d94a',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
    zIndex: 3,
  },
  rowActionButtonText: {
    color: '#0b4a56',
    fontWeight: '800',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 980,
    height: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#0b5967',
    paddingHorizontal: 20,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#D6DAC0',
    fontWeight: '700',
    fontSize: 18,
  },
  modalCloseButton: {
    backgroundColor: '#d3d94a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalCloseButtonText: {
    color: '#0b4a56',
    fontWeight: '800',
    fontSize: 16,
  },
  modalPdf: {
    flex: 1,
    width: '100%',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalFooterButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalFooterButtonPrimary: {
    backgroundColor: '#B1CD51',
  },
  modalFooterButtonSecondary: {
    backgroundColor: '#008C50',
  },
  modalFooterButtonText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#0b4a56',
  },
  modalFooterButtonTextPrimary: {
    color: '#0b4a56',
  },
  modalFooterButtonTextLight: {
    color: '#ffffff',
  },
  actionsContainer: {},
  actionsTitle: {},
  actionsGrid: {},
  actionButton: {
    flexBasis: '48%',
    minWidth: 200,
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderWidth: 2,
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: palette.white,
    fontWeight: '600',
    fontSize: 20,
  },
  loading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loadingText: {
    color: palette.muted,
    fontSize: 20,
  },
  // Estilos da tela de boas-vindas (CPF) - TABLET
  /** Tela inicial — emissão 2ª via (layout tipo totem Unimed) */
  homeScreenRoot: {
    width: '100%',
    maxWidth: responsive(800, 480, 1200), // Aumentado para preencher melhor o HD
    alignItems: 'center',
    paddingVertical: scale(20),
    paddingHorizontal: scale(32),
  },
  homeReceiptIconWrap: {
    marginBottom: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeEmissaoTitle: {
    color: palette.greenDark,
    fontSize: responsive(48, 24, 60),
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: scale(60),
    lineHeight: responsive(56, 30, 70),
    paddingHorizontal: scale(16),
  },
  homeBemVindo: {
    color: '#1a1a1a',
    fontSize: responsive(52, 28, 64),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: scale(14),
  },
  homeInstrucaoCpf: {
    color: '#333333',
    fontSize: responsive(32, 18, 40),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: scale(40),
  },
  totemFieldOuter: {
    width: '100%',
    maxWidth: scale(700),
    position: 'relative',
    alignSelf: 'center',
    marginBottom: scale(40),
    zIndex: 2,
  },
  totemFieldOuterTight: {
    width: '100%',
    maxWidth: scale(700),
    position: 'relative',
    alignSelf: 'center',
    marginBottom: scale(1),
    zIndex: 2,
  },
  totemFieldBorder: {
    borderWidth: 3,
    borderColor: palette.greenDark,
    borderRadius: scale(24),
    backgroundColor: 'rgba(255,255,255,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scale(24),
    paddingRight: scale(28),
    paddingVertical: scale(24),
    minHeight: scale(100),
  },
  totemFieldTextInput: {
    flex: 1,
    fontSize: responsive(48, 24, 56),
    fontWeight: '600',
    color: '#333333',
    backgroundColor: 'transparent',
    paddingVertical: scale(8),
    paddingLeft: scale(16),
    borderWidth: 0,
  },
  homeConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(20),
    backgroundColor: palette.orange,
    borderRadius: scale(60),
    paddingVertical: scale(32),
    paddingHorizontal: scale(80),
    minWidth: scale(450),
    ...shadow('0 10px 20px rgba(0,0,0,0.25)', {
      color: '#000',
      offset: { width: 0, height: 10 },
      opacity: 0.25,
      radius: 15,
      elevation: 10,
    }),
  },
  homeConfirmButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: responsive(36, 20, 44),
    letterSpacing: 2,
  },
  homeConfirmCheckCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCard: {
    backgroundColor: 'transparent',
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCardTablet: {
    paddingTop: 12,
    paddingBottom: 16,
    marginTop: -24,
  },
  welcomeTitle: {
    color: palette.greenDark,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 32,
    textTransform: 'uppercase',
  },
  welcomeSubtitle: {
    color: palette.grayText,
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeDescription: {
    color: palette.grayText,
    fontSize: 26,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 40,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  orangeButton: {
    backgroundColor: palette.orange,
    borderRadius: 40,
    paddingVertical: 24,
    paddingHorizontal: 64,
    minWidth: 380,
    alignItems: 'center',
    ...shadow('0 6px 12px rgba(0,0,0,0.25)', {
      color: '#000',
      offset: { width: 0, height: 6 },
      opacity: 0.25,
      radius: 12,
      elevation: 8,
    }),
  },
  orangeButtonText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 26,
    letterSpacing: 1,
  },
  cpfInputContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 32,
  },
  cpfInput: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 3,
    borderColor: palette.greenDark,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 32,
    fontSize: 36,
    fontWeight: '600',
    color: palette.grayText,
    textAlign: 'center',
    minWidth: 400,
    ...shadow('0 4px 8px rgba(0,0,0,0.15)', {
      color: '#000',
      offset: { width: 0, height: 4 },
      opacity: 0.15,
      radius: 8,
      elevation: 5,
    }),
  },
  cpfButtonRow: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  cpfButtonRowTablet: {
    flexWrap: 'nowrap',
    gap: 24,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: palette.greenDark,
    borderRadius: 40,
    paddingVertical: 24,
    paddingHorizontal: 48,
    minWidth: 300,
    alignItems: 'center',
    position: 'relative',
    zIndex: 5,
  },
  cancelButtonText: {
    color: palette.greenDark,
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: 1,
  },
  // Estilos para tela PJ - TABLET
  pjTitle: {
    color: palette.greenDark,
    fontSize: 42,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  pjBadge: {
    backgroundColor: palette.greenDark,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  pjBadgeText: {
    color: palette.white,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 2,
  },
  pfBadge: {
    backgroundColor: palette.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  pfBadgeText: {
    color: palette.white,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 2,
  },
  pjWelcome: {
    color: palette.greenDark,
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  pjNextStep: {
    color: palette.grayText,
    fontSize: 26,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700'
  },
  rfAjudaIconWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rfAjudaMensagem: {
    color: palette.grayText,
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 8,
    paddingHorizontal: 12,
    maxWidth: 560,
    alignSelf: 'center',
  },
  pjNascimentoInfo: {
    color: palette.grayText,
    fontSize: 26,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 35,
    marginBottom: 38,
    fontWeight: '700',
  },
  pjNascimentoFieldOuter: {
    width: '100%',
    maxWidth: 440,
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 8,
    zIndex: 2,
  },
  /** Form PF (data nascimento): menos espaço até o botão BUSCAR FATURAS. */
  formContainerPfData: {
    width: '100%',
    paddingHorizontal: 32,
    marginBottom: 8,
    position: 'relative',
    zIndex: 5,
    elevation: 5,
  },
  buttonRowTightTop: {
    marginTop: 6,
  },
  greenButton: {
    backgroundColor: palette.greenDark,
    borderRadius: 40,
    paddingVertical: 24,
    paddingHorizontal: 48,
    minWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow('0 6px 12px rgba(0,0,0,0.25)', {
      color: '#000',
      offset: { width: 0, height: 6 },
      opacity: 0.25,
      radius: 12,
      elevation: 8,
    }),
  },
  greenButtonIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  greenButtonText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: 1,
  },
  faturaScreenContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: 12,
    alignItems: 'center',
    ...shadow('none', {
      color: 'transparent',
      offset: { width: 0, height: 0 },
      opacity: 0,
      radius: 0,
    }),
  },
  semFaturaContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 16,
  },
  semFaturaTexto: {
    color: '#064E4C',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  semFaturaEmptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  semFaturaMensagemBonita: {
    color: '#064E4C',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: 0.4,
    maxWidth: 520,
    ...Platform.select({
      web: {
        textShadow: '0 1px 0 rgba(255,255,255,0.6)',
      },
      default: {},
    }),
  },
  // Estilos do formulário - TABLET
  formContainer: {
    width: '100%',
    paddingHorizontal: 32,
    marginBottom: 32,
    position: 'relative',
    zIndex: 5,
    elevation: 5,
  },
  formContainerTablet: {
    marginTop: -24,
    zIndex: 10,
    elevation: 10,
  },
  formLabel: {
    color: palette.greenDark,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 3,
    borderColor: palette.greenDark,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    fontSize: 26,
    fontWeight: '500',
    color: palette.grayText,
    ...shadow('0 4px 8px rgba(0,0,0,0.15)', {
      color: '#000',
      offset: { width: 0, height: 4 },
      opacity: 0.15,
      radius: 8,
      elevation: 5,
    }),
  },
  // Estilos de layout/imagens
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  backgroundImageTablet: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topLeftImage: {
    position: 'absolute',
    top: scale(-70),
    left: scale(-2),
    width: scale(500),
    height: scale(300),
    zIndex: 1,
  },
  topLeftImageTablet: {
    width: scale(800),
    height: scale(500),
  },
  topRightImage: {
    position: 'absolute',
    top: scale(-60),
    right: scale(-40),
    width: scale(500),
    height: scale(380),
    zIndex: 1,
  },
  topRightImageTablet: {
    width: scale(800),
    height: scale(500),
  },
  bottomLeftImage: {
    position: 'absolute',
    bottom: scale(-160),
    left: scale(-2),
    width: scale(500),
    height: scale(800),
    zIndex: 1,
  },
  bottomLeftImageTablet: {
    left: scale(-420),
    width: scale(1100),
    height: scale(800),
  },
  bottomRightImage: {
    position: 'absolute',
    bottom: scale(2),
    right: scale(-50),
    width: scale(600),
    height: scale(700),
    zIndex: 1,
  },
  bottomRightImageTablet: {
    width: scale(600),
    height: scale(800),
  },
  decorImageFill: {
    width: '100%',
    height: '100%',
  },
  atendenteContainer: {
    position: 'absolute',
    bottom: scale(-22),
    left: scale(40),
    zIndex: 5,
  },
  atendenteContainerTablet: {
    left: '8%',
    bottom: scale(-40),
  },
  atendenteImage: {
    zIndex: 1,
  },
  atendenteImageTablet: {
    zIndex: 1,
    transform: [{ scale: 1.1 }],
  },
});

export default styles;
