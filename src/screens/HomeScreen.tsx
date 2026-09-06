import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { C, PALETTE_LABELS, PaletteName, S, applyPalette, currentPalette, serif, themed } from '../theme';
import { SECTIONS } from '../nav';

// On the web the notes are laid out as a US-letter sheet (8.5 in at 96 px/in), centered on a neutral desk.
const WEB = Platform.OS === 'web';
const PAGE_W = 816;

function initialOpen(): Set<string> {
  // On the web, ?open=key expands a section directly (handy for sharing a link).
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const k = new URLSearchParams(window.location.search).get('open');
    if (k) return new Set([k]);
  }
  // Every entry open by default, so the page reads top to bottom like the essays.
  return new Set(SECTIONS.flatMap((sec) => sec.items.map((it) => it.key)));
}

export default function HomeScreen() {
  const [open, setOpen] = useState<Set<string>>(initialOpen);
  const [palette, setPalette] = useState<PaletteName>(() => {
    // On the web, ?theme=paper|trine|dark picks the palette up front.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const t = new URLSearchParams(window.location.search).get('theme') as PaletteName | null;
      if (t && PALETTE_LABELS[t]) { applyPalette(t); return t; }
    }
    return currentPalette();
  });
  const choose = (name: PaletteName) => { applyPalette(name); setPalette(name); };
  const toggle = (k: string) =>
    setOpen((o) => {
      const n = new Set(o);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: WEB ? C.card2 : C.bg }} edges={['top']}>
      <StatusBar style={C.statusBar} />
      <View style={[st.header, WEB && st.sheet, WEB && { borderTopWidth: 0 }]}>
        <Text style={st.headerTitle}>Machine Learning: Interactive Notes</Text>
        <View style={st.switch}>
          {(Object.keys(PALETTE_LABELS) as PaletteName[]).map((name) => (
            <Pressable key={name} onPress={() => choose(name)} style={[st.switchBtn, palette === name && st.switchBtnActive]}>
              <Text style={[st.switchText, palette === name && st.switchTextActive]}>{PALETTE_LABELS[name]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView key={palette} style={{ flex: 1 }} contentContainerStyle={[{ padding: S.lg, paddingBottom: 64, backgroundColor: C.bg }, WEB && st.sheet, WEB && st.sheetBody]} keyboardShouldPersistTaps="handled">
        <Text style={st.abstract}>
          Each entry below is a definition from the course, followed by a demonstration you can operate. Every number on screen is computed live from the stated formula; the models are small enough to see through.
        </Text>
        {SECTIONS.map((sec) => (
          <View key={sec.lecture} style={{ marginTop: S.xl }}>
            <View style={st.sectionBox}>
              <Text style={st.eyebrow}>{sec.lecture.toUpperCase()}</Text>
              <Text style={st.sectionTitle}>{sec.theme}</Text>
            </View>
            {sec.items.map((it) => {
              const isOpen = open.has(it.key);
              const Body = it.component;
              return (
                <View key={it.key} style={st.item}>
                  <Pressable onPress={() => toggle(it.key)} style={({ pressed }) => [st.itemHeader, pressed && { opacity: 0.7 }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={st.reading}>{it.reading}</Text>
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

const st = themed(() => StyleSheet.create({
  header: { backgroundColor: C.bg, paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.md, gap: 4, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.text },
  headerTitle: { color: C.text, fontFamily: serif, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  abstract: { color: C.text, fontFamily: serif, fontSize: 16, lineHeight: 24 },
  sectionBox: { backgroundColor: C.card, borderWidth: 1, borderColor: C.text, borderRadius: 0, paddingHorizontal: S.lg, paddingVertical: S.md, marginBottom: S.sm, gap: 4 },
  eyebrow: { color: C.dim, fontFamily: serif, fontSize: 12, letterSpacing: 1.5 },
  sectionTitle: { color: C.text, fontFamily: serif, fontSize: 20, lineHeight: 27, fontWeight: '700' },
  reading: { color: C.dim, fontFamily: serif, fontSize: 12, letterSpacing: 0.5 },
  item: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, paddingVertical: S.md },
  itemTitle: { color: C.text, fontFamily: serif, fontSize: 18, fontWeight: '700' },
  definition: { color: C.dim, fontFamily: serif, fontSize: 15, lineHeight: 21, fontStyle: 'italic' },
  chevron: { color: C.text, fontSize: 18, paddingTop: 2 },
  body: { paddingTop: S.sm, paddingBottom: S.lg },
  switch: { flexDirection: 'row', gap: 6, marginTop: 6 },
  switchBtn: { paddingVertical: 3, paddingHorizontal: 10, borderWidth: 1, borderColor: C.border, borderRadius: 2 },
  switchBtnActive: { backgroundColor: C.forest, borderColor: C.forest },
  switchText: { color: C.dim, fontFamily: serif, fontSize: 12 },
  switchTextActive: { color: C.cream },
  sheet: { width: '100%', maxWidth: PAGE_W, alignSelf: 'center', backgroundColor: C.bg, borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border },
  sheetBody: { paddingHorizontal: 56, paddingTop: S.xl, minHeight: '100%' },
}));
