import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/ui';
import { C, S, serif } from '../theme';
import { SECTIONS, useNav } from '../nav';

export default function HomeScreen() {
  const nav = useNav();
  return (
    <Screen intro="Interactive versions of the ideas in your course notes, in the order you met them. Every screen is a demo you can poke at, with the formula it illustrates.">
      {SECTIONS.map((sec) => (
        <View key={sec.lecture} style={{ gap: S.sm }}>
          <Text style={st.lecture}>{sec.lecture.toUpperCase()}</Text>
          <Text style={st.theme}>{sec.theme}</Text>
          {sec.items.map((it) => (
            <Pressable key={it.route} onPress={() => nav.navigate(it.route)} style={({ pressed }) => [st.item, pressed && { opacity: 0.7 }]}>
              <Text style={st.glyph}>✦</Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={st.title}>{it.title}</Text>
                <Text style={st.hook}>{it.hook}</Text>
              </View>
              <Text style={st.arrow}>›</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <Text style={st.footer}>Toy models throughout: every number on screen is computed live from the formula shown, but the models are tiny so you can see all the way through them.</Text>
    </Screen>
  );
}

const st = StyleSheet.create({
  lecture: { color: C.dim, fontSize: 12, fontWeight: '600', letterSpacing: 1.5 },
  theme: { color: C.forest, fontSize: 26, fontFamily: serif, fontWeight: '600', marginBottom: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.card,
    borderColor: 'rgba(156,175,152,0.15)',
    borderWidth: 1,
    borderRadius: 16,
    padding: S.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  glyph: { color: C.gold, fontSize: 18, width: 28, textAlign: 'center' },
  title: { color: C.forest, fontSize: 19, fontFamily: serif, fontWeight: '600' },
  hook: { color: C.dim, fontSize: 13, lineHeight: 18 },
  arrow: { color: C.faint, fontSize: 26 },
  footer: { color: C.faint, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: S.md },
});
