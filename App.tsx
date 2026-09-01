import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { C, serif } from './src/theme';
import type { RootStackParamList } from './src/nav';
import HomeScreen from './src/screens/HomeScreen';
import LoopScreen from './src/screens/LoopScreen';
import TokensScreen from './src/screens/TokensScreen';
import AttentionScreen from './src/screens/AttentionScreen';
import SoftmaxScreen from './src/screens/SoftmaxScreen';
import AlignmentScreen from './src/screens/AlignmentScreen';
import NeuronScreen from './src/screens/NeuronScreen';
import CrossbarScreen from './src/screens/CrossbarScreen';
import ForwardPassScreen from './src/screens/ForwardPassScreen';
import GradientScreen from './src/screens/GradientScreen';
import TrainingScreen from './src/screens/TrainingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [],
  config: {
    screens: {
      Home: '',
      Loop: 'loop', Tokens: 'tokens', Attention: 'attention', Softmax: 'softmax', Alignment: 'alignment',
      Neuron: 'neuron', Crossbar: 'crossbar', ForwardPass: 'forward-pass', Gradient: 'gradient', Training: 'training',
    },
  },
};

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: C.bg, card: C.card, text: C.text, primary: C.forest, border: C.border },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme} linking={linking}>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: C.forest },
            headerTintColor: C.cream,
            headerTitleStyle: { fontFamily: serif, fontWeight: '600', fontSize: 20, color: C.cream },
            headerBackTitle: 'Back',
            contentStyle: { backgroundColor: C.bg },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ML Concepts' }} />
          <Stack.Screen name="Loop" component={LoopScreen} options={{ title: 'The whole machine' }} />
          <Stack.Screen name="Tokens" component={TokensScreen} options={{ title: 'Text becomes math' }} />
          <Stack.Screen name="Attention" component={AttentionScreen} options={{ title: 'Attention' }} />
          <Stack.Screen name="Softmax" component={SoftmaxScreen} options={{ title: 'Math becomes text' }} />
          <Stack.Screen name="Alignment" component={AlignmentScreen} options={{ title: 'Predictor to assistant' }} />
          <Stack.Screen name="Neuron" component={NeuronScreen} options={{ title: 'One neuron' }} />
          <Stack.Screen name="Crossbar" component={CrossbarScreen} options={{ title: 'The crossbar check' }} />
          <Stack.Screen name="ForwardPass" component={ForwardPassScreen} options={{ title: 'The forward pass' }} />
          <Stack.Screen name="Gradient" component={GradientScreen} options={{ title: 'Gradient descent' }} />
          <Stack.Screen name="Training" component={TrainingScreen} options={{ title: 'Predict, measure, update' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
