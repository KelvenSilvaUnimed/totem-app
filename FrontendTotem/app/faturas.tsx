import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { BackgroundShapes } from '@/components/background-shapes';
import {
  buscarBoleto,
  getPdfViewerUrl,
  imprimirBoleto,
  utils,
} from '@/services/api.service';
import type { BoletoResult, Fatura } from '@/services/api.types';
import { colors, styles } from '@/styles/faturas.styles';

export default function FaturasScreen() {
  const params = useLocalSearchParams<{
    nome: string;
    documento: string;
    contrato: string;
    faturas: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState<string | null>(null);
  const [boletoAtual, setBoletoAtual] = useState<BoletoResult | null>(null);

  const faturas: Fatura[] = params.faturas ? JSON.parse(params.faturas) : [];
  const nomeFormatado = utils.formatNomeCompleto(params.nome || '');

  const getNumeroFatura = (fatura: Fatura, index: number): string => {
    return (
      utils.escolherPrimeiroValor(
        fatura as Record<string, string>,
        ['numeroFatura', 'numerofatura', 'numerofaturacontrole', 'numero'],
        String(index + 1).padStart(2, '0')
      ) || String(index + 1).padStart(2, '0')
    );
  };

  const getVencimento = (fatura: Fatura): string => {
    const raw = utils.escolherPrimeiroValor(
      fatura as Record<string, string>,
      ['vencimento', 'vencimentofatura', 'dataVencimento', 'data_vencimento'],
      null
    );
    return utils.formatarData(raw || '') || 'N/D';
  };

  const getValor = (fatura: Fatura): string => {
    const raw = utils.escolherPrimeiroValor(
      fatura as Record<string, string | number>,
      ['valor', 'valorfatura', 'valor_fatura', 'valorComDesconto'],
      null
    );
    return utils.formatarValor(raw) || 'N/D';
  };

  const handleSelectFatura = async (fatura: Fatura, index: number) => {
    const numero = getNumeroFatura(fatura, index);
    setSelectedFatura(numero);
    setLoading(true);
    setBoletoAtual(null);

    try {
      const result = await buscarBoleto(numero);
      setBoletoAtual({ ...result, numero });
      Alert.alert('Sucesso', 'Boleto carregado com sucesso!');
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Falha ao carregar o boleto.');
      setSelectedFatura(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualizarBoleto = async () => {
    if (!boletoAtual) {
      Alert.alert('Erro', 'Nenhum boleto carregado.');
      return;
    }

    try {
      let url = boletoAtual.url;
      
      // Se for URL remota, usar o proxy/viewer
      if (boletoAtual.kind === 'remote' && boletoAtual.remoteUrl) {
        url = getPdfViewerUrl(boletoAtual.remoteUrl);
      }

      // Abrir no navegador
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o boleto.');
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Falha ao visualizar o boleto.');
    }
  };

  const handleImprimirBoleto = async () => {
    if (!boletoAtual || !selectedFatura) {
      Alert.alert('Erro', 'Nenhum boleto carregado.');
      return;
    }

    setLoading(true);

    try {
      const result = await imprimirBoleto(
        selectedFatura,
        boletoAtual.remoteUrl || (boletoAtual.kind === 'remote' ? boletoAtual.url : undefined)
      );

      Alert.alert(
        'Sucesso',
        `Enviado para a impressora${result.printer ? ` (${result.printer})` : ''}.`
      );
    } catch (err: any) {
      // Fallback: tentar abrir para impressão manual
      Alert.alert(
        'Atenção',
        'Não foi possível enviar para a impressora automaticamente. Você pode visualizar o boleto e imprimir manualmente.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Visualizar', onPress: handleVisualizarBoleto },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarEmail = () => {
    Alert.alert('Em desenvolvimento', 'Funcionalidade de e-mail em desenvolvimento.');
  };

  const handleEnviarWhatsApp = () => {
    Alert.alert('Em desenvolvimento', 'Funcionalidade de WhatsApp em desenvolvimento.');
  };

  const handleNovoCpf = () => {
    router.replace('/' as never);
  };

  const renderFatura = ({ item, index }: { item: Fatura; index: number }) => {
    const numero = getNumeroFatura(item, index);
    const isSelected = selectedFatura === numero;

    return (
      <TouchableOpacity
        style={[styles.faturaCard, isSelected && styles.faturaCardSelected]}
        onPress={() => handleSelectFatura(item, index)}
        disabled={loading}
      >
        <Text style={styles.faturaNumero}>Fatura {numero}</Text>
        <Text style={styles.faturaInfo}>Vencimento: {getVencimento(item)}</Text>
        <Text style={styles.faturaValor}>{getValor(item)}</Text>
        {isSelected && loading && (
          <ActivityIndicator
            style={styles.faturaLoading}
            color={colors.accent}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <BackgroundShapes />

      {/* Imagem da atendente */}
      <View style={styles.attendantContainer}>
        <Image
          source={require('@/assets/images/atendente.png')}
          style={styles.attendantImage}
          contentFit="contain"
        />
      </View>

      {/* Conteúdo principal */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>FATURAS EM ABERTO</Text>

        <Text style={styles.subtitle}>
          Olá, <Text style={styles.highlight}>{nomeFormatado}</Text>!
        </Text>
        <Text style={styles.info}>
          Encontramos {faturas.length} fatura{faturas.length > 1 ? 's' : ''} em
          aberto.
        </Text>
        <Text style={styles.instruction}>
          Toque em uma fatura para carregar o boleto.
        </Text>

        {/* Lista de faturas */}
        <FlatList
          data={faturas}
          renderItem={renderFatura}
          keyExtractor={(item, index) => getNumeroFatura(item, index)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.faturasList}
        />

        {/* Ações do boleto */}
        {boletoAtual && (
          <View style={styles.actionsContainer}>
            <Text style={styles.actionsTitle}>
              Boleto da fatura {selectedFatura} carregado!
            </Text>

            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleVisualizarBoleto}
                disabled={loading}
              >
                <Text style={styles.actionIcon}>👁️</Text>
                <Text style={styles.actionText}>Visualizar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleImprimirBoleto}
                disabled={loading}
              >
                <Text style={styles.actionIcon}>🖨️</Text>
                <Text style={styles.actionText}>Imprimir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionDisabled]}
                onPress={handleEnviarEmail}
                disabled
              >
                <Text style={styles.actionIcon}>📧</Text>
                <Text style={styles.actionTextDisabled}>E-mail</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionDisabled]}
                onPress={handleEnviarWhatsApp}
                disabled
              >
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionTextDisabled}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Botão novo CPF */}
        <TouchableOpacity style={styles.newCpfButton} onPress={handleNovoCpf}>
          <Text style={styles.newCpfText}>Consultar novo CPF/CNPJ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
