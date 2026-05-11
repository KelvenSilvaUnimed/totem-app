/** Referência imperativa exposta pelo PdfViewer (web usa iframe.print para impressora padrão). */
export type PdfViewerPrintHandle = {
  /** Dispara impressão do PDF atual (no web: impressora padrão do sistema). */
  printDocument: () => void;
};
