import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

// Cores do tema Unimed
export const colors = {
  primary: '#00703C',
  secondary: '#8DC63F',
  accent: '#F7941D',
  background: '#FAFAFA',
  white: '#FFFFFF',
  text: '#333333',
  placeholder: '#999999',
  success: '#22C55E',
  error: '#DC2626',
};

export const styles = StyleSheet.create({
  // Container principal
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Atendente
  attendantContainer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: width * 0.3,
    height: height * 0.65,
    zIndex: 10,
  },

  attendantImage: {
    width: '100%',
    height: '100%',
  },

  // Conteúdo principal
  contentContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    marginLeft: width * 0.2,
  },

  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 15,
  },

  subtitle: {
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
  },

  info: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginTop: 5,
  },

  instruction: {
    fontSize: 16,
    color: colors.placeholder,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  highlight: {
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Lista de faturas
  faturasList: {
    paddingVertical: 10,
    gap: 15,
  },

  faturaCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    marginRight: 15,
    alignItems: 'center',
  },

  faturaCardSelected: {
    borderColor: colors.accent,
    backgroundColor: '#FFF7ED',
  },

  faturaNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },

  faturaInfo: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 5,
  },

  faturaValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
  },

  faturaLoading: {
    marginTop: 10,
  },

  // Container de ações
  actionsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: colors.success,
  },

  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    textAlign: 'center',
    marginBottom: 15,
  },

  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    flexWrap: 'wrap',
  },

  // Botões de ação
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 100,
  },

  actionDisabled: {
    backgroundColor: colors.placeholder,
    opacity: 0.5,
  },

  actionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },

  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },

  actionTextDisabled: {
    fontSize: 14,
    color: colors.white,
  },

  // Botão novo CPF
  newCpfButton: {
    marginTop: 25,
    alignSelf: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 10,
  },

  newCpfText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

