import { Modal, Text, TouchableOpacity, View } from 'react-native';
import PdfViewer from '@/components/pdf-viewer';
import styles from '@/styles/totem.styles';

interface BoletoModalProps {
  visible: boolean;
  url: string | null;
  loading?: boolean;
  onVoltarParaFaturas: () => void;
  onImprimir: () => void | Promise<void>;
}

/** Modal de visualização do boleto em PDF. */
export default function BoletoModal({
  visible,
  url,
  loading = false,
  onVoltarParaFaturas,
  onImprimir,
}: BoletoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onVoltarParaFaturas}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <PdfViewer source={url ? { uri: url } : null} style={styles.modalPdf} />
          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.modalFooterButton, styles.modalFooterButtonOutline]} onPress={onVoltarParaFaturas}>
              <Text style={[styles.modalFooterButtonText, styles.modalFooterButtonTextOutline]}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalFooterButton, styles.modalFooterButtonDark, loading && styles.buttonDisabled]}
              onPress={() => void onImprimir()}
              disabled={loading}
            >
              <Text style={[styles.modalFooterButtonText, styles.modalFooterButtonTextDark]}>Imprimir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
