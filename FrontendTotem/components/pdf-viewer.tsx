import { Platform } from 'react-native';
import PdfViewerNative from './pdf-viewer.native';
import PdfViewerWeb from './pdf-viewer.web';

const Impl = Platform.OS === 'web' ? PdfViewerWeb : PdfViewerNative;

export default Impl;
