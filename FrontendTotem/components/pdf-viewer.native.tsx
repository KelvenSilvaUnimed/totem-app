import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View, ViewStyle } from 'react-native';
import Pdf from 'react-native-pdf';
import RNBlobUtil from 'react-native-blob-util';

type Props = {
  source: { uri: string; cache?: boolean } | null;
  style?: ViewStyle | any;
};

export default function PdfViewer({ source, style }: Props) {
  if (!source) return null;
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    const uri = source?.uri || '';
    if (!uri) {
      setLocalUri(null);
      return;
    }

    const isHttp = uri.startsWith('http://') || uri.startsWith('https://');
    if (!isHttp) {
      setLocalUri(uri);
      return;
    }

    const loadPdf = async () => {
      setLoading(true);
      try {
        const response = await RNBlobUtil.config({
          fileCache: true,
          appendExt: 'pdf',
        }).fetch('GET', uri);
        const path = response.path();
        if (isActive) setLocalUri(`file://${path}`);
      } catch (error) {
        console.error('Falha ao baixar PDF:', error);
        if (isActive) {
          setLocalUri(null);
          Alert.alert('Erro', 'Não foi possível carregar o boleto no tablet.');
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadPdf();
    return () => {
      isActive = false;
    };
  }, [source?.uri]);

  if (loading) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!localUri) return null;
  return (
    <Pdf
      source={{ uri: localUri, cache: true }}
      trustAllCerts={false}
      style={style}
      onLoadComplete={(numberOfPages: number) => {
        console.log(`PDF carregado com ${numberOfPages} páginas.`);
      }}
      onError={(error) => {
        console.error('Falha ao carregar PDF:', error);
        Alert.alert('Erro', 'Não foi possível carregar o boleto no tablet.');
      }}
    />
  );
}
