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
  disabled: '#9CA3AF',
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
    width: width * 0.35,
    height: height * 0.7,
    zIndex: 10,
  },

  attendantImage: {
    width: '100%',
    height: '100%',
  },

  // Conteúdo principal
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginLeft: width * 0.2,
  },

  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 2,
  },

  // Saudação
  greeting: {
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },

  info: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 30,
  },

  highlight: {
    fontWeight: 'bold',
    color: colors.primary,
  },

  question: {
    fontSize: 22,
    color: colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 25,
  },

  // Grid de serviços
  servicesGrid: {
    gap: 15,
    width: '100%',
    maxWidth: 500,
  },

  serviceButton: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
  },

  primaryService: {
    backgroundColor: colors.accent,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  disabledService: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.disabled,
    opacity: 0.6,
  },

  serviceButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },

  disabledServiceText: {
    fontSize: 18,
    color: colors.disabled,
  },

  // Link
  linkButton: {
    marginTop: 25,
  },

  linkText: {
    fontSize: 16,
    color: colors.accent,
    textDecorationLine: 'underline',
  },

  // Formulário PJ
  formContainer: {
    width: '100%',
    maxWidth: 450,
    alignItems: 'center',
  },

  formLabel: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },

  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    width: '100%',
    marginBottom: 15,
  },

  // Botões
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },

  button: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 12,
    elevation: 4,
  },

  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },

  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});

