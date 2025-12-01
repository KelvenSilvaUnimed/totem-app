import React from 'react';
import { View, Button } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  source: { uri: string; cache?: boolean } | null;
  style?: any;
};

export default function PdfViewer({ source, style }: Props) {
  if (!source) return null;
  // Em web, usar WebView para embutir ou abrir em nova aba
  return (
    <WebView source={{ uri: source.uri }} style={style} />
  );
}
