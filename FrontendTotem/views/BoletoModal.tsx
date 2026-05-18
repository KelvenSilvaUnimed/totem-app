import { useRef, useState, useEffect } from 'react';
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import PdfViewer from '@/components/pdf-viewer';
import type { PdfViewerPrintHandle } from '@/components/pdf-viewer-handle';
import styles from '@/styles/totem.styles';
import { enviarTelemetriaPesquisa } from '@/services/api.service';

interface BoletoModalProps {
  visible: boolean;
  url: string | null;
  loading?: boolean;
  onVoltarParaFaturas: () => void;
  onImprimir: () => void | Promise<void>;
}

export default function BoletoModal({
  visible,
  url,
  loading = false,
  onVoltarParaFaturas,
  onImprimir,
}: BoletoModalProps) {
  const pdfRef = useRef<PdfViewerPrintHandle>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset success state when modal is closed
  useEffect(() => {
    if (!visible) {
      setIsSuccess(false);
    }
  }, [visible]);

  // Auto-redirect to satisfaction survey when success screen is active
  useEffect(() => {
    if (!isSuccess) return;

    const timer = setTimeout(() => {
      handleRedirectToSurvey();
    }, 6000);

    return () => clearTimeout(timer);
  }, [isSuccess]);

  const handleRedirectToSurvey = () => {
    let labSlug = 'centro'; // default unit slug
    
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const urlLab = params.get('lab');
      if (urlLab) {
        labSlug = urlLab;
      } else if (process.env.EXPO_PUBLIC_LAB_SLUG) {
        labSlug = process.env.EXPO_PUBLIC_LAB_SLUG;
      }
      
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const surveyUrl = isLocal 
        ? `http://localhost:3002/${labSlug}`
        : `https://totemunimed.unimedpatosdeminas.com.br/${labSlug}`;
        
      window.location.href = surveyUrl;
    }
  };

  const handleImprimirPress = async () => {
    if (Platform.OS === 'web') {
      pdfRef.current?.printDocument();
      // Registra telemetria de impressão no web totem
      void enviarTelemetriaPesquisa('IMPRIMIU_BOLETO', 'Impressão de boleto acionada via diálogo do navegador.');
      // Em web, o print do PDF abre a janela nativa de impressão. Transitamos direto para a tela de sucesso.
      setIsSuccess(true);
      return;
    }
    
    try {
      await onImprimir();
      setIsSuccess(true);
    } catch (err) {
      console.error('Erro ao imprimir:', err);
    }
  };

  if (isSuccess) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onVoltarParaFaturas}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { padding: 40, alignItems: 'center', justifyContent: 'center', minHeight: 480, maxWidth: 500, width: '90%', borderRadius: 24 }]}>
            {/* Icon Circle */}
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(0, 153, 93, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Ionicons name="checkmark-circle" size={72} color="#00995D" />
            </View>

            <Text style={{ fontSize: 24, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginBottom: 8, fontFamily: Platform.OS === 'web' ? 'sans-serif' : undefined }}>
              Impressão Solicitada!
            </Text>
            
            <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 28, fontFamily: Platform.OS === 'web' ? 'sans-serif' : undefined }}>
              Por favor, retire seu boleto impresso na bandeja da impressora.
            </Text>

            <View style={{ width: '100%', height: 1, backgroundColor: '#E2E8F0', marginBottom: 28 }} />

            <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: Platform.OS === 'web' ? 'sans-serif' : undefined }}>
              Sua Opinião é Importante
            </Text>

            <Text style={{ fontSize: 18, fontWeight: '900', color: '#00995D', textAlign: 'center', marginBottom: 24, fontFamily: Platform.OS === 'web' ? 'sans-serif' : undefined }}>
              Como foi seu atendimento hoje?
            </Text>

            {/* Redirection Button */}
            <TouchableOpacity 
              style={{ width: '100%', backgroundColor: '#00995D', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 12 }}
              onPress={handleRedirectToSurvey}
            >
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#ffffff', fontFamily: Platform.OS === 'web' ? 'sans-serif' : undefined }}>
                Avaliar Atendimento ⭐️
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ width: '100%', paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}
              onPress={onVoltarParaFaturas}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B', fontFamily: Platform.OS === 'web' ? 'sans-serif' : undefined }}>
                Voltar sem Avaliar
              </Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 16, fontStyle: 'italic', fontFamily: Platform.OS === 'web' ? 'sans-serif' : undefined }}>
              Redirecionando para a pesquisa em alguns segundos...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onVoltarParaFaturas}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <PdfViewer ref={pdfRef} source={url ? { uri: url } : null} style={styles.modalPdf} />
          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.modalFooterButton, styles.modalFooterButtonOutline]} onPress={onVoltarParaFaturas}>
              <Text style={[styles.modalFooterButtonText, styles.modalFooterButtonTextOutline]}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalFooterButton, styles.modalFooterButtonDark, loading && styles.buttonDisabled]}
              onPress={handleImprimirPress}
              disabled={loading && Platform.OS !== 'web'}
            >
              <Text style={[styles.modalFooterButtonText, styles.modalFooterButtonTextDark]}>Imprimir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
