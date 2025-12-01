import React from 'react';
import Pdf from 'react-native-pdf';
import { ViewStyle } from 'react-native';

type Props = {
  source: { uri: string; cache?: boolean } | null;
  style?: ViewStyle | any;
};

export default function PdfViewer({ source, style }: Props) {
  if (!source) return null;
  return (
    <Pdf
      trustAllCerts={false}
      source={source}
      style={style}
      onLoadComplete={(numberOfPages: number) => {
        console.log(`PDF carregado com ${numberOfPages} páginas.`);
      }}
    />
  );
}
