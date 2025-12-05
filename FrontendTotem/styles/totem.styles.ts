import { StyleSheet } from 'react-native';

export const palette = {
<<<<<<< HEAD
  background: '#0f172a',
  card: '#111827',
  muted: '#94a3b8',
=======
  background: '#f3f6fb',
  card: '#111827',
  muted: '#64748b',
>>>>>>> origin/master
  primary: '#38bdf8',
  primaryStrong: '#0ea5e9',
  secondary: '#1f2937',
  accent: '#f59e0b',
  success: '#22c55e',
  error: '#ef4444',
  white: '#f8fafc',
  darkText: '#0f172a',
<<<<<<< HEAD
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
=======
  heroGreen: '#2e7d32',
  heroOrange: '#f58634',
};

const styles = StyleSheet.create({
  backgroundLayer: {
    flex: 1,
    position: 'relative',
  },
  backgroundBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#eff5f2',
    zIndex: 0,
  },
  backgroundOverlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  decorativeLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1.5,
    overflow: 'hidden',
  },
  decorativeImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    aspectRatio: 1.33,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  heroSafeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  heroContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    minHeight: '100%',
  },
  heroCard: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 32,
    paddingHorizontal: 32,
    paddingVertical: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: palette.heroGreen,
    textAlign: 'center',
    letterSpacing: 1,
  },
  heroSubtitle: {
    marginTop: 16,
    fontSize: 20,
    color: palette.heroGreen,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
  },
  heroButton: {
    marginTop: 36,
    width: '100%',
    borderRadius: 40,
    backgroundColor: palette.heroOrange,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: palette.heroOrange,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroButtonDisabled: {
    opacity: 0.85,
  },
  heroButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroHiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  heroHint: {
    marginTop: 18,
    color: '#4d7c0f',
    fontSize: 14,
    textAlign: 'center',
  },
  heroAssistant: {
    position: 'absolute',
    left: 32,
    bottom: 0,
    width: 280,
    height: 360,
  },
  heroBrandCard: {
    position: 'absolute',
    right: 32,
    bottom: 32,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  heroBrandSlogan: {
    color: palette.heroGreen,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
  },
  heroBrandLogo: {
    width: 140,
    height: 32,
  },
  scrollContent: {
    flexGrow: 1,
>>>>>>> origin/master
    padding: 24,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.08)',
  },
  cardTitle: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  muted: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
<<<<<<< HEAD
=======
    textAlign: 'center',
>>>>>>> origin/master
  },
  highlight: {
    color: palette.white,
    fontWeight: '700',
  },
  label: {
    color: palette.muted,
    fontSize: 14,
    marginTop: 18,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: palette.white,
    backgroundColor: '#0b1220',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
  },
  buttonColumn: {
    gap: 12,
    marginTop: 18,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: 220,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.darkText,
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: palette.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: 220,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: palette.white,
    fontWeight: '600',
    fontSize: 16,
  },
  linkButtonText: {
    color: palette.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  status: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  statusText: {
    color: palette.white,
    textAlign: 'center',
    fontSize: 14,
  },
  faturaScroll: {
    marginTop: 16,
  },
  faturaCard: {
    width: 200,
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  faturaCardSelected: {
    backgroundColor: 'rgba(56,189,248,0.2)',
    borderColor: palette.primary,
  },
  faturaTitle: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '700',
  },
  faturaInfo: {
    color: palette.muted,
    marginTop: 6,
    fontSize: 14,
  },
  faturaValue: {
    color: palette.primary,
    fontWeight: '700',
    fontSize: 18,
    marginTop: 10,
  },
  actionsContainer: {
    marginTop: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.35)',
    padding: 16,
    backgroundColor: 'rgba(8,17,31,0.9)',
  },
  actionsTitle: {
    color: palette.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  actionButton: {
    flexBasis: '48%',
    minWidth: 140,
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: palette.white,
    fontWeight: '600',
  },
  loading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  loadingText: {
    color: palette.muted,
    fontSize: 14,
  },
});

export default styles;
<<<<<<< HEAD
=======

>>>>>>> origin/master
