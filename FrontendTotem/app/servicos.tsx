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
    nome_titular: string;
    cpf_titular: string;
    tipo_plano: string;
    registro_ans: string;
    data_nascimento_titular?: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [showDataNascimentoInput, setShowDataNascimentoInput] = useState(false);
  const [dataNascimentoPJ, setDataNascimentoPJ] = useState('');

  const beneficiario: Beneficiario = {
    nome_titular: params.nome_titular || '',
    cpf_titular: params.cpf_titular || '',
    tipo_plano: params.tipo_plano || 'PF',
    registro_ans: params.registro_ans,
    data_nascimento_titular: params.data_nascimento_titular,
  };

  const isPJ = (beneficiario.tipo_plano || '').toUpperCase() === 'PJ';
  const nomeFormatado = utils.formatNomeCompleto(beneficiario.nome_titular || '');
  const tipoPlanoDescricao = isPJ ? 'Pessoa Juridica' : 'Pessoa Fisica';

  const handleBoletos = async () => {
    if (isPJ) {
      setShowDataNascimentoInput(true);
      return;
    }

    // PF - buscar faturas diretamente
    const contratoBase = beneficiario.registro_ans || beneficiario.cpf_titular || '';
    await buscarFaturasENavegar(beneficiario.cpf_titular || '', contratoBase);
  };

  const handleBuscarFaturasPJ = async () => {
    const digitosInformados = utils.digits(dataNascimentoPJ);
    if (digitosInformados.length !== 8) {
      Alert.alert('Erro', 'Informe a data de nascimento completa (DD/MM/AAAA).');
      return;
    }

    const esperado = utils.normalizeDataTitularToDdmmYyyyDigits(beneficiario.data_nascimento_titular);
    if (!esperado) {
      Alert.alert(
        'Erro',
        'Nao foi possivel validar a data de nascimento no cadastro. Procure o atendimento.',
      );
      return;
    }
    if (digitosInformados !== esperado) {
      Alert.alert('Erro', 'A data de nascimento nao confere com o cadastro.');
      return;
    }

    const cpfTitular = utils.digits(beneficiario.cpf_titular || '');
    if (cpfTitular.length !== 11) {
      Alert.alert('Erro', 'CPF do titular invalido no cadastro.');
      return;
    }

    await buscarFaturasENavegar(cpfTitular, digitosInformados, 'data_nascimento_titular');
  };

  const buscarFaturasENavegar = async (
    cpfCnpj: string,
    segundoParam: string,
    segundoCampo: 'contrato' | 'data_nascimento_titular' = 'contrato',
  ) => {
    setLoading(true);

    try {
      const { faturas } = await buscarFaturas(cpfCnpj, segundoParam, {
        segundoCampo,
      });

      if (!faturas || faturas.length === 0) {
        Alert.alert(
          'Nenhuma fatura encontrada',
          'Nao encontramos faturas em aberto para o documento informado.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Navegar para tela de faturas
      router.push({
        pathname: '/faturas',
        params: {
          nome_titular: beneficiario.nome_titular,
          cpf_titular: cpfCnpj,
          registro_ans: segundoParam,
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

      {/* Conteudo principal */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>TOTEM DE ATENDIMENTO</Text>

        <Text style={styles.greeting}>
          Ola, <Text style={styles.highlight}>{nomeFormatado}</Text>!
        </Text>
        <Text style={styles.info}>
          Identificamos seu plano como{' '}
          <Text style={styles.highlight}>
            {(beneficiario.tipo_plano || '').toUpperCase()} - {tipoPlanoDescricao}
          </Text>
        </Text>

        {showDataNascimentoInput ? (
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>
              Informe sua data de nascimento (mesma do cadastro):
            </Text>

            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.placeholder}
              value={dataNascimentoPJ}
              onChangeText={(v) => setDataNascimentoPJ(utils.formatDataNascimentoInput(v))}
              keyboardType="numeric"
              maxLength={10}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setShowDataNascimentoInput(false)}
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
            <Text style={styles.question}>Qual servico deseja realizar hoje?</Text>

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
                    Emissao de 2a via de boletos
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.serviceButton, styles.disabledService]}
                disabled
              >
                <Text style={styles.disabledServiceText}>
                  Guias (em desenvolvimento)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.serviceButton, styles.disabledService]}
                disabled
              >
                <Text style={styles.disabledServiceText}>
                  Consultas (em desenvolvimento)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.linkButton} onPress={handleTrocarCpf}>
              <Text style={styles.linkText}>Nao e voce? Digitar outro CPF</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
