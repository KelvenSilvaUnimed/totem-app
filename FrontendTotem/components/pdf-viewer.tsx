import { Platform } from 'react-native';

let Impl: any;
if (Platform.OS === 'web') {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	Impl = require('./pdf-viewer.web').default;
} else {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	Impl = require('./pdf-viewer.native').default;
}

export default Impl;
