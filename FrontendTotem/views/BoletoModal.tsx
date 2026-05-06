import { Modal, Text, TouchableOpacity, View } from 'react-native';
import PdfViewer from '@/components/pdf-viewer';
import styles from '@/styles/totem.styles';

interface BoletoModalProps {
  visible: boolean;
  url: string | null;
  loading?: boolean;
  onVoltarParaFaturas: () => void;
  onImprimir: () => void | Promise<void>;
  onEncerrar: () => void;
}

/** Modal de visualização do boleto em PDF. */
export default function BoletoModal({
  visible,
  url,
  loading = false,
  onVoltarParaFaturas,
  onImprimir,
  onEncerrar,
}: BoletoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onVoltarParaFaturas}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <PdfViewer source={url ? { uri: url } : null} style={styles.modalPdf} />
          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.modalFooterButton, styles.modalFooterButtonSecondary]} onPress={onVoltarParaFaturas}>
              <Text style={[styles.modalFooterButtonText, styles.modalFooterButtonTextLight]}>Ver outro boleto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalFooterButton, styles.modalFooterButtonOutline, loading && styles.buttonDisabled]}
              onPress={() => void onImprimir()}
              disabled={loading}
            >
              <Text style={[styles.modalFooterButtonText, styles.modalFooterButtonTextOutline]}>Imprimir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalFooterButton, styles.modalFooterButtonPrimary]} onPress={onEncerrar}>
              <Text style={[styles.modalFooterButtonText, styles.modalFooterButtonTextPrimary]}>Encerrar atendimento</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
