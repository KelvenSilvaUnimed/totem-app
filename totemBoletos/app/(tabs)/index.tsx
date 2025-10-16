import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import axios from 'axios';
import Pdf from 'react-native-pdf';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// 🖥️ IMPORTANTE: Troque 'localhost' pelo IP local do seu computador!
const API_BASE = 'http://192.168.1.10:3001'; // Exemplo: use o seu IP

// Funções de API separadas para organização
const apiClient = axios.create({ baseURL: API_BASE });

const buscarFaturasAPI = (cpfCnpj, contrato) => {
  return apiClient.post('/api/faturas', { cpfCnpj, contrato });
};

const buscarBoletoAPI = (numeroFatura) => {
  return apiClient.post('/api/boleto', { numeroFatura });
};

const enviarBoletoEmailAPI = (email, url, numeroFatura) => {
  return apiClient.post('/api/send-boleto', { email, url, numeroFatura });
};


export default function App() {
  // --- Estados para controlar a UI ---
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [contrato, setContrato] = useState('');
  const [faturas, setFaturas] = useState([]);
  const [numeroFaturaSelecionada, setNumeroFaturaSelecionada] = useState('');
  
  const [boletoUrl, setBoletoUrl] = useState(null);
  const [pdfSource, setPdfSource] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Funções de Ação ---
  const handleConsultarFaturas = async () => {
    if (!cpfCnpj || !contrato) {
      setError('Por favor, preencha CPF/CNPJ e Contrato.');
      return;
    }
    setLoading(true);
    setError(null);
    setFaturas([]);
    setBoletoUrl(null);

    try {
      const response = await buscarFaturasAPI(cpfCnpj, contrato);
      if (response.data.content && response.data.content.length > 0) {
        setFaturas(response.data.content);
      } else {
        setError('Nenhuma fatura pendente encontrada.');
      }
    } catch (err) {
      setError('Erro ao buscar faturas. Verifique os dados e a conexão.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGerarBoleto = async (numeroFatura) => {
    if (!numeroFatura) {
        Alert.alert('Erro', 'Número da fatura inválido.');
        return;
    }
    setLoading(true);
    setError(null);
    setBoletoUrl(null);
    setNumeroFaturaSelecionada(numeroFatura);

    try {
      const response = await buscarBoletoAPI(numeroFatura);
      const url = response.data.url;
      if (url) {
        setBoletoUrl(url);
        Alert.alert('Sucesso', 'Link do boleto gerado! Agora você pode visualizar, baixar ou enviar por e-mail.');
      } else {
        setError('Não foi possível gerar o link do boleto.');
      }
    } catch (err) {
      setError('Erro ao gerar o boleto.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualizar = () => {
    if (!boletoUrl) return;
    // A rota /api/pdf do seu backend serve o PDF de forma segura
    const proxiedUrl = `${API_BASE}/api/pdf?url=${encodeURIComponent(boletoUrl)}`;
    setPdfSource({ uri: proxiedUrl, cache: true });
    setModalVisible(true);
  };
  
  const handleBaixar = async () => {
    if (!boletoUrl) return;
    setLoading(true);
    try {
        const fileName = `boleto-${numeroFaturaSelecionada}.pdf`;
        const downloadUrl = `${API_BASE}/api/pdf-download?url=${encodeURIComponent(boletoUrl)}`;
        const localUri = FileSystem.cacheDirectory + fileName;

        const { uri } = await FileSystem.downloadAsync(downloadUrl, localUri);
        
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
        } else {
            Alert.alert('Não disponível', 'O compartilhamento não está disponível neste dispositivo.');
        }
    } catch (e) {
        Alert.alert('Erro', 'Não foi possível baixar o arquivo.');
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleEnviarEmail = () => {
    if (!boletoUrl) return;
    Alert.prompt(
      'Enviar por E-mail',
      'Digite o e-mail de destino:',
      async (email) => {
        if (email) {
          setLoading(true);
          try {
            await enviarBoletoEmailAPI(email, boletoUrl, numeroFaturaSelecionada);
            Alert.alert('Sucesso!', 'E-mail enviado para ' + email);
          } catch (e) {
            Alert.alert('Erro', 'Falha ao enviar e-mail.');
          } finally {
            setLoading(false);
          }
        }
      },
      'plain-text' // Tipo de input
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Consulta de Faturas</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="CPF/CNPJ (só números)"
            keyboardType="numeric"
            value={cpfCnpj}
            onChangeText={setCpfCnpj}
          />
          <TextInput
            style={styles.input}
            placeholder="Nº do Contrato (só números)"
            keyboardType="numeric"
            value={contrato}
            onChangeText={setContrato}
          />
          <Button title="Consultar Faturas" onPress={handleConsultarFaturas} />
        </View>

        {loading && <ActivityIndicator size="large" color="#007bff" style={styles.mt} />}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {faturas.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Faturas Encontradas</Text>
            <FlatList
              data={faturas}
              keyExtractor={(item) => item.numerofatura.toString()}
              renderItem={({ item }) => (
                <View style={styles.faturaItem}>
                  <Text>Fatura: {item.numerofatura}</Text>
                  <Text>Vencimento: {item.vencimentofatura}</Text>
                  <Text>Valor: {item.valorfatura}</Text>
                  <Button title="Gerar Boleto" onPress={() => handleGerarBoleto(item.numerofatura)} />
                </View>
              )}
            />
          </View>
        )}

        {boletoUrl && (
          <View style={[styles.card, styles.actionsCard]}>
             <Text style={styles.subtitle}>Boleto Gerado (Fatura {numeroFaturaSelecionada})</Text>
             <View style={styles.buttonRow}>
                <Button title="👁️ Visualizar" onPress={handleVisualizar} />
                <Button title="⬇️ Baixar/Compartilhar" onPress={handleBaixar} />
             </View>
             <Button title="✉️ Enviar por E-mail" onPress={handleEnviarEmail} />
          </View>
        )}
      </ScrollView>

      {/* Modal para Visualizar o PDF */}
      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Fechar</Text>
            </Pressable>
            <Pdf
                trustAllCerts={false} // importante para segurança
                source={pdfSource}
                style={styles.pdf}
                onLoadComplete={(numberOfPages, filePath) => {
                    console.log(`PDF carregado com ${numberOfPages} páginas.`);
                }}
            />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  errorText: { color: 'red', textAlign: 'center', marginTop: 10 },
  faturaItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  actionsCard: { backgroundColor: '#e6f7ff' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  pdf: { flex: 1, width: '100%', height: '100%' },
  mt: { marginTop: 16 },
  closeButton: { padding: 10, backgroundColor: '#ddd', alignItems: 'center' },
  closeButtonText: { fontWeight: 'bold' }
});