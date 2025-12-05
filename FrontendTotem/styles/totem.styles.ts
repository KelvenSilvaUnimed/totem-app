import { StyleSheet } from 'react-native';

export const palette = {
  background: '#0f172a',
  card: '#111827',
  muted: '#94a3b8',
  primary: '#38bdf8',
  primaryStrong: '#0ea5e9',
  secondary: '#1f2937',
  accent: '#f59e0b',
  success: '#22c55e',
  error: '#ef4444',
  white: '#f8fafc',
  darkText: '#0f172a',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
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
