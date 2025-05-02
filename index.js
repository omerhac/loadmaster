/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry, SafeAreaView, StyleSheet} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Make sure the app takes up all available space
import {LogBox} from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'RCTBridge required dispatch_sync to load RCTDevLoadingView',
  'VirtualizedLists should never be nested',
]);

// Ensure app uses all screen space
AppRegistry.registerComponent(appName, () => App);
