const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'axios') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'node_modules/axios/dist/browser/axios.cjs'),
    };
  }

  if (platform === 'web') {
    if (moduleName === 'react-native') {
      moduleName = 'react-native-web';
    }
    if (moduleName === 'react-native-reanimated') {
      moduleName = 'react-native-reanimated/mock';
    }
    if (moduleName === 'react-native-pdf') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'stubs/react-native-pdf.web.js'),
      };
    }
    if (moduleName === 'react-native-blob-util') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'stubs/react-native-blob-util.web.js'),
      };
    }
    if (moduleName.includes('/reanimated2/platform-specific/RNRenderer')) {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'stubs/reanimated-rnrenderer.web.js'),
      };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
