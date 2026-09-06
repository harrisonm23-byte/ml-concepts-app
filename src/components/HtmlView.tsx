import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, View } from 'react-native';
import { C } from '../theme';

export type HtmlViewHandle = { post: (msg: unknown) => void };
type Props = { html: string; height: number; scroll?: boolean; onMessage?: (data: unknown) => void };

// Renders a self-contained HTML document: an iframe on web, react-native-webview on iOS/Android.
// post() sends a JSON message into the document (window 'message' event on web, window.__msg() on native);
// the document reports back through onMessage (parent.postMessage on web, ReactNativeWebView.postMessage on native).
const HtmlView = forwardRef<HtmlViewHandle, Props>(function HtmlView({ html, height, scroll = false, onMessage }, ref) {
  const frame = useRef<any>(null);
  useImperativeHandle(ref, () => ({
    post: (msg) => {
      if (Platform.OS === 'web') frame.current?.contentWindow?.postMessage(msg, '*');
      else frame.current?.injectJavaScript('window.__msg && window.__msg(' + JSON.stringify(msg) + '); true;');
    },
  }));
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !onMessage) return;
    const h = (e: MessageEvent) => { if (frame.current && e.source === frame.current.contentWindow) onMessage(e.data); };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, [onMessage]);
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { unstable_createElement } = require('react-native-web');
    const iframe = unstable_createElement('iframe', {
      ref: frame,
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
        ref={frame}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        scrollEnabled={scroll}
        bounces={false}
        allowsInlineMediaPlayback
        nestedScrollEnabled
        onMessage={(e: any) => { try { onMessage?.(JSON.parse(e.nativeEvent.data)); } catch { /* ignore */ } }}
        style={{ flex: 1, backgroundColor: C.bg }}
      />
    </View>
  );
});
export default HtmlView;
