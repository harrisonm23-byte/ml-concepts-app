import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { C, S, serif } from '../theme';
import { SECTIONS } from '../nav';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function initialOpen(): Set<string> {
  // On the web, ?open=key expands a section directly (handy for sharing a link).
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const k = new URLSearchParams(window.location.search).get('open');
    if (k) return new Set([k]);
  }
  return new Set();
}

export default function HomeScreen() {
  const [open, setOpen] = useState<Set<string>>(initialOpen);
  const toggle = (k: string) =>
    setOpen((o) => {
      const n = new Set(o);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  let idx = 0;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.ink }} edges={['top']}>
      <StatusBar style="light" />
      <View style={st.header}>
        <Text style={st.headerTitle}>Machine Learning</Text>
        <Text style={st.headerSub}>Interactive notes on lectures 2–4</Text>
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: S.lg, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
        <Text style={st.abstract}>
          Each entry below is a definition from the course, followed by a demonstration you can operate. Every number on screen is computed live from the stated formula; the models are small enough to see through.
        </Text>
        {SECTIONS.map((sec) => (
          <View key={sec.lecture} style={{ marginTop: S.xl }}>
            <Text style={st.sectionTitle}>{sec.lecture}. {sec.theme}</Text>
            <View style={st.rule} />
            {sec.items.map((it) => {
              const n = ROMAN[idx++];
              const isOpen = open.has(it.key);
              const Body = it.component;
              return (
                <View key={it.key} style={st.item}>
                  <Pressable onPress={() => toggle(it.key)} style={({ pressed }) => [st.itemHeader, pressed && { opacity: 0.7 }]}>
                    <Text style={st.numeral}>{n}.</Text>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={st.itemTitle}>{it.title}</Text>
                      <Text style={st.definition}>{it.definition}</Text>
                    </View>
                    <Text style={st.chevron}>{isOpen ? '▾' : '▸'}</Text>
                  </Pressable>
                  {isOpen && (
                    <View style={st.body}>
                      <Body />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  header: { backgroundColor: C.ink, paddingHorizontal: S.lg, paddingVertical: S.md, gap: 2 },
  headerTitle: { color: C.white, fontFamily: serif, fontSize: 24, fontWeight: '700' },
  headerSub: { color: '#C7CBE0', fontFamily: serif, fontSize: 14, fontStyle: 'italic' },
  abstract: { color: C.text, fontFamily: serif, fontSize: 16, lineHeight: 24 },
  sectionTitle: { color: C.text, fontFamily: serif, fontSize: 22, fontWeight: '700' },
  rule: { height: 1, backgroundColor: C.text, marginTop: 6, marginBottom: S.sm },
  item: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, paddingVertical: S.md },
  numeral: { color: C.text, fontFamily: serif, fontSize: 17, fontWeight: '700', width: 30 },
  itemTitle: { color: C.text, fontFamily: serif, fontSize: 18, fontWeight: '700' },
  definition: { color: C.dim, fontFamily: serif, fontSize: 15, lineHeight: 21, fontStyle: 'italic' },
  chevron: { color: C.accent, fontSize: 18, paddingTop: 2 },
  body: { paddingTop: S.sm, paddingBottom: S.lg },
});
