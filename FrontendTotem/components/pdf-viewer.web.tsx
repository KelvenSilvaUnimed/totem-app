import React, { useMemo } from 'react';

type Props = {
  source: { uri: string; cache?: boolean } | null;
  style?: any;
};

export default function PdfViewer({ source, style }: Props) {
  const viewerHtml = useMemo(() => {
    if (!source?.uri) return '';
    const safeUrl = JSON.stringify(source.uri);
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #ffffff; }
      #viewer { width: 100%; padding: 12px; box-sizing: border-box; }
      .page { margin: 0 auto 16px; width: 100%; }
      #error { display: none; padding: 24px; font-family: Arial, sans-serif; color: #0b4a56; }
      #openBtn { background: #d3d94a; border: none; padding: 12px 18px; border-radius: 10px; font-weight: 700; }
    </style>
  </head>
  <body>
    <div id="viewer"></div>
    <div id="error">
      <div>Não foi possível renderizar o boleto no tablet.</div>
      <div style="margin-top:12px;">
        <button id="openBtn">Abrir PDF</button>
      </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
      const url = ${safeUrl};
      const viewer = document.getElementById('viewer');
      const errorBox = document.getElementById('error');
      const openBtn = document.getElementById('openBtn');
      openBtn.addEventListener('click', () => window.open(url, '_blank'));
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      pdfjsLib.getDocument({ url }).promise.then(async (pdf) => {
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          const wrapper = document.createElement('div');
          wrapper.className = 'page';
          wrapper.appendChild(canvas);
          viewer.appendChild(wrapper);
          await page.render({ canvasContext: context, viewport }).promise;
        }
      }).catch((err) => {
        console.error('PDF render error', err);
        viewer.style.display = 'none';
        errorBox.style.display = 'block';
      });
    </script>
  </body>
</html>`;
  }, [source?.uri]);

  if (!source) return null;

  return (
    <iframe
      title="Boleto"
      srcDoc={viewerHtml}
      sandbox="allow-scripts allow-same-origin"
      style={{
        border: 'none',
        width: '100%',
        height: '100%',
        ...(style || {}),
      }}
    />
  );
}
