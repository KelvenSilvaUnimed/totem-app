import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { API_CONFIG } from '@/services/api.config';
import type { PdfViewerPrintHandle } from '@/components/pdf-viewer-handle';

type Props = {
  source: { uri: string; cache?: boolean } | null;
  style?: any;
};

/**
 * Versão web do visualizador de PDF.
 *
 * Fluxo:
 *  1. Recebe source.uri (URL normalizada do boleto)
 *  2. Faz GET no proxy do backend: BASE_URL + /api/boleto/view?url=<encoded>
 *  3. Blob → URL.createObjectURL()
 *  4. iframe renderiza o PDF
 *
 * Impressão (totem): chamar ref.printDocument() → contentWindow.print().
 * Para não mostrar diálogo no Chrome/Edge em kiosk, use a flag --kiosk-printing e defina impressora USB como padrão no Windows.
 */
const PdfViewer = forwardRef<PdfViewerPrintHandle, Props>(function PdfViewer({ source, style }, ref) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    printDocument: () => {
      try {
        const w = iframeRef.current?.contentWindow;
        if (!w) return;
        w.focus();
        w.print();
      } catch (e) {
        console.error('[PdfViewer] printDocument:', e);
      }
    },
  }));

  useEffect(() => {
    if (!source?.uri) return;

    let cancelled = false;
    let createdUrl: string | null = null;

    setLoading(true);
    setError(null);
    setObjectUrl(null);

    const proxyUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOLETO_VIEW}?url=${encodeURIComponent(source.uri)}`;

    fetch(proxyUrl, { method: 'GET' })
      .then(async (response) => {
        if (!response.ok) {
          let errText = '';
          try {
            errText = await response.text();
          } catch (e) {}
          console.error('Falha no fetch do proxy:', response.status, errText);
          throw new Error(`HTTP ${response.status} – ${errText || response.statusText}`);
        }
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const pdfBlob =
          blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
        createdUrl = URL.createObjectURL(pdfBlob);
        setObjectUrl(createdUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[PdfViewer] Erro ao carregar PDF:', err);
        setError(err.message || 'Erro desconhecido');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [source?.uri]);

  if (!source) return null;

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontFamily: 'Arial, sans-serif',
          fontSize: 16,
          color: '#0b4a56',
        }}
      >
        Carregando documento…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontFamily: 'Arial, sans-serif',
          padding: 24,
          color: '#c0392b',
          textAlign: 'center' as const,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>Não foi possível carregar o boleto.</div>
        <div style={{ fontSize: 12, marginTop: 8, color: '#888' }}>{error}</div>
      </div>
    );
  }

  if (!objectUrl) return null;

  return (
    <iframe
      ref={iframeRef}
      title="Boleto"
      src={objectUrl}
      style={{
        border: 'none',
        width: '100%',
        height: '100%',
        ...(style || {}),
      }}
    />
  );
});

export default PdfViewer;
