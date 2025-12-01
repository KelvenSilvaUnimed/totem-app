import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { BackgroundShapes } from '@/components/background-shapes';
import { buscarFaturas, utils } from '@/services/api.service';
import type { Beneficiario } from '@/services/api.types';
import { colors, styles } from '@/styles/servicos.styles';

export default function ServicosScreen() {
  const params = useLocalSearchParams<{
    nome: string;
    documento: string;
    tipoPessoa: string;
    contrato: string;
    tipoPlano: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [showCnpjInput, setShowCnpjInput] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [contrato, setContrato] = useState('');

  const beneficiario: Beneficiario = {
    nome: params.nome || '',
    documento: params.documento || '',
    tipoPessoa: (params.tipoPessoa as 'PF' | 'PJ') || 'PF',
    contrato: params.contrato,
    tipoPlano: params.tipoPlano,
  };

  const isPJ = beneficiario.tipoPessoa === 'PJ';
  const nomeFormatado = utils.formatNomeCompleto(beneficiario.nome);
  const tipoPlanoDescricao = isPJ ? 'Pessoa Jurídica' : 'Pessoa Física';

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const handleBoletos = async () => {
    if (isPJ) {
      setShowCnpjInput(true);
      return;
    }

    // PF - buscar faturas diretamente
    await buscarFaturasENavegar(beneficiario.documento, beneficiario.contrato || beneficiario.documento);
  };

  const handleBuscarFaturasPJ = async () => {
    const cnpjDigits = utils.digits(cnpj);
    const contratoDigits = utils.digits(contrato);

    if (cnpjDigits.length !== 14) {
      Alert.alert('Erro', 'Digite um CNPJ válido com 14 números.');
      return;
    }

    if (!contratoDigits) {
      Alert.alert('Erro', 'Digite o número do contrato.');
      return;
    }

    await buscarFaturasENavegar(cnpjDigits, contratoDigits);
  };

  const buscarFaturasENavegar = async (cpfCnpj: string, contratoNum: string) => {
    setLoading(true);

    try {
      const faturas = await buscarFaturas(cpfCnpj, contratoNum);

      if (!faturas || faturas.length === 0) {
        Alert.alert(
          'Nenhuma fatura encontrada',
          'Não encontramos faturas em aberto para o documento informado.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Navegar para tela de faturas
      router.push({
        pathname: '/faturas',
        params: {
          nome: beneficiario.nome,
          documento: cpfCnpj,
          contrato: contratoNum,
          faturas: JSON.stringify(faturas),
        },
      });
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Falha ao buscar faturas.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrocarCpf = () => {
    router.replace('/' as never);
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
        <Text style={styles.title}>TOTEM DE ATENDIMENTO</Text>

        <Text style={styles.greeting}>
          Olá, <Text style={styles.highlight}>{nomeFormatado}</Text>!
        </Text>
        <Text style={styles.info}>
          Identificamos seu plano como{' '}
          <Text style={styles.highlight}>
            {beneficiario.tipoPessoa} - {tipoPlanoDescricao}
          </Text>
        </Text>

        {showCnpjInput ? (
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>
              Por se tratar de um contrato PJ, informe o CNPJ e o número do contrato:
            </Text>

            <TextInput
              style={styles.input}
              placeholder="CNPJ"
              placeholderTextColor={colors.placeholder}
              value={cnpj}
              onChangeText={(v) => setCnpj(formatCNPJ(v))}
              keyboardType="numeric"
              maxLength={18}
            />

            <TextInput
              style={styles.input}
              placeholder="Número do Contrato"
              placeholderTextColor={colors.placeholder}
              value={contrato}
              onChangeText={setContrato}
              keyboardType="numeric"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setShowCnpjInput(false)}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>VOLTAR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleBuscarFaturasPJ}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>BUSCAR FATURAS</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.question}>Qual serviço deseja realizar hoje?</Text>

            <View style={styles.servicesGrid}>
              <TouchableOpacity
                style={[styles.serviceButton, styles.primaryService]}
                onPress={handleBoletos}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.serviceButtonText}>
                    📄 Emissão de 2ª via de boletos
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.serviceButton, styles.disabledService]}
                disabled
              >
                <Text style={styles.disabledServiceText}>
                  📋 Guias (em desenvolvimento)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.serviceButton, styles.disabledService]}
                disabled
              >
                <Text style={styles.disabledServiceText}>
                  🩺 Consultas (em desenvolvimento)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.linkButton} onPress={handleTrocarCpf}>
              <Text style={styles.linkText}>Não é você? Digitar outro CPF</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
