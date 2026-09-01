import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/ui';
import { C, S } from '../theme';
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
              <Text style={st.emoji}>{it.emoji}</Text>
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
  lecture: { color: C.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  theme: { color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: S.md,
  },
  emoji: { fontSize: 24, width: 32, textAlign: 'center' },
  title: { color: C.text, fontSize: 16, fontWeight: '600' },
  hook: { color: C.dim, fontSize: 13, lineHeight: 18 },
  arrow: { color: C.faint, fontSize: 26 },
  footer: { color: C.faint, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: S.md },
});
