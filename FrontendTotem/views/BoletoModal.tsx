import { useRef } from 'react';
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import PdfViewer from '@/components/pdf-viewer';
import type { PdfViewerPrintHandle } from '@/components/pdf-viewer-handle';
import styles from '@/styles/totem.styles';

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

  const handleImprimirPress = () => {
    if (Platform.OS === 'web') {
      pdfRef.current?.printDocument();
      return;
    }
    void onImprimir();
  };

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
