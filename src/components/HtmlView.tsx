import React from 'react';
import { Platform, View } from 'react-native';
import { C } from '../theme';

// Renders a self-contained HTML document: an iframe on web, react-native-webview on iOS/Android.
export default function HtmlView({ html, height }: { html: string; height: number }) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { unstable_createElement } = require('react-native-web');
    const iframe = unstable_createElement('iframe', {
      srcDoc: html,
      sandbox: 'allow-scripts allow-same-origin',
      style: { width: '100%', height, border: `1px solid ${C.border}`, borderRadius: 6, display: 'block', background: C.bg },
    });
    return <View style={{ height }}>{iframe}</View>;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const WebView = require('react-native-webview').default;
  return (
    <View style={{ height, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
      <WebView
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
        allowsInlineMediaPlayback
        nestedScrollEnabled
        style={{ flex: 1, backgroundColor: C.bg }}
      />
    </View>
  );
}
