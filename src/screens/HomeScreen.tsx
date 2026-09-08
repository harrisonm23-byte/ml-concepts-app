import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { C, PALETTE_LABELS, PaletteName, S, applyPalette, currentPalette, serif, themed } from '../theme';
import { SECTIONS } from '../nav';
import PdfPane, { PdfPaneHandle } from '../components/PdfPane';

// On the web the notes are laid out as a US-letter sheet (8.5 in at 96 px/in), centered on a neutral desk.
const WEB = Platform.OS === 'web';
const PAGE_W = 816;
const PDF_W = 600; // the lecture PDF column, shown to the right of the notes when the window is wide enough

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

  // Sticky header: shows the title of the lecture currently under the reader's eye.
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const itemY = useRef<Record<string, number>>({}); // local to the section
  const [current, setCurrent] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<string | null>(null);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y + 8;
    let hit: string | null = null;
    let item: string | null = null;
    for (const sec of SECTIONS) {
      const top = sectionY.current[sec.lecture];
      if (top !== undefined && top <= y) {
        hit = sec.lecture;
        item = null;
        for (const it of sec.items) {
          const iy = itemY.current[it.key];
          if (iy !== undefined && top + iy <= y + 120) item = it.key;
        }
      }
    }
    if (hit !== current) setCurrent(hit);
    if (item !== currentItem) setCurrentItem(item);
  };
  const jumpTo = (lecture: string, key?: string) => {
    const base = sectionY.current[lecture] ?? 0;
    const y = key ? base + (itemY.current[key] ?? 0) : base;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - S.sm), animated: true });
  };
  const headerSec = SECTIONS.find((sec) => sec.lecture === current);

  // Wide web windows show the lecture PDF for the current section in a column to the right of the notes.
  const { width, height } = useWindowDimensions();
  const showPdf = WEB && width >= PAGE_W + PDF_W + 48;
  const pdfSec = headerSec ?? SECTIONS[0];
  const [pdfPick, setPdfPick] = useState<Record<string, string>>({});
  const pdfId = pdfPick[pdfSec.lecture] ?? pdfSec.pdfs[0].id;
  // Follow the reader: when a new entry comes into view, scroll the PDF to the essay section it cites.
  const pdfRef = useRef<PdfPaneHandle>(null);
  const reading = pdfSec.items.find((it) => it.key === currentItem)?.reading ?? null;
  const heading = reading ? reading.split(' · ')[0].replace(/\s*\(.*\)\s*$/, '') : null;
  const syncPdf = useCallback(() => { if (heading) pdfRef.current?.goTo(heading); }, [heading]);
  useEffect(() => { syncPdf(); }, [syncPdf, pdfId]);
  const toggle = (k: string) =>
    setOpen((o) => {
      const n = new Set(o);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: WEB ? C.card2 : C.bg }} edges={['top']}>
      <StatusBar style={C.statusBar} />
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
      <View style={{ flex: 1, maxWidth: WEB ? PAGE_W : undefined }}>
      <View style={[st.header, WEB && st.sheet, WEB && { borderTopWidth: 0 }]}>
        <Pressable onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} style={{ alignSelf: 'stretch' }}>
          {headerSec && <Text style={st.headerEyebrow}>{headerSec.lecture.toUpperCase()}</Text>}
          <Text style={st.headerTitle}>{headerSec ? headerSec.theme : 'Machine Learning: Interactive Notes'}</Text>
        </Pressable>
        <View style={st.switch}>
          {(Object.keys(PALETTE_LABELS) as PaletteName[]).map((name) => (
            <Pressable key={name} onPress={() => choose(name)} style={[st.switchBtn, palette === name && st.switchBtnActive]}>
              <Text style={[st.switchText, palette === name && st.switchTextActive]}>{PALETTE_LABELS[name]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={64} style={{ flex: 1 }} contentContainerStyle={[{ padding: S.lg, paddingBottom: 64, backgroundColor: C.bg }, WEB && st.sheet, WEB && st.sheetBody]} keyboardShouldPersistTaps="handled">
        <Text style={st.abstract}>
          Each entry below is a definition from the course, followed by a demonstration you can operate. Every number on screen is computed live from the stated formula; the models are small enough to see through.
        </Text>
        <Text style={st.colophon}>
          The essays and handouts read alongside these notes are the author's own writing. The material comes from the Algoverse AI Research program lectures, courtesy of Algoverse; the essays and handouts are written from those lectures, not copied from the lecture materials.
        </Text>
        <View style={st.toc}>
          <Text style={st.tocHeading}>Contents</Text>
          {SECTIONS.map((sec) => (
            <View key={sec.lecture} style={{ gap: 2 }}>
              <Pressable onPress={() => jumpTo(sec.lecture)}>
                <Text style={st.tocLecture}>{sec.lecture} · {sec.theme}</Text>
              </Pressable>
              {sec.items.map((it) => (
                <Pressable key={it.key} onPress={() => jumpTo(sec.lecture, it.key)} style={({ pressed }) => [st.tocItem, pressed && { opacity: 0.6 }]}>
                  <Text style={st.tocItemText}>{it.title}</Text>
                  <Text style={st.tocReading} numberOfLines={1}>{it.reading}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
        {SECTIONS.map((sec) => (
          <View key={sec.lecture} style={{ marginTop: S.xl }} onLayout={(e: LayoutChangeEvent) => { sectionY.current[sec.lecture] = e.nativeEvent.layout.y; }}>
            <View style={st.sectionBox}>
              <Text style={st.eyebrow}>{sec.lecture.toUpperCase()}</Text>
              <Text style={st.sectionTitle}>{sec.theme}</Text>
            </View>
            {sec.items.map((it) => {
              const isOpen = open.has(it.key);
              const Body = it.component;
              return (
                <View key={it.key} style={st.item} onLayout={(e: LayoutChangeEvent) => { itemY.current[it.key] = e.nativeEvent.layout.y; }}>
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
      </View>
      {showPdf && (
        <View style={[st.pdfCol, { width: PDF_W }]}>
          <View style={st.pdfHead}>
            <Text style={st.eyebrow}>{pdfSec.lecture.toUpperCase()}</Text>
            <View style={st.switch}>
              {pdfSec.pdfs.map((p) => (
                <Pressable key={p.id} onPress={() => setPdfPick((m) => ({ ...m, [pdfSec.lecture]: p.id }))} style={[st.switchBtn, pdfId === p.id && st.switchBtnActive]}>
                  <Text style={[st.switchText, pdfId === p.id && st.switchTextActive]}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <PdfPane ref={pdfRef} id={pdfId} height={height - 120} onReady={syncPdf} />
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}

const st = themed(() => StyleSheet.create({
  header: { backgroundColor: C.bg, paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.md, gap: 4, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.text },
  headerTitle: { color: C.text, fontFamily: serif, fontSize: 20, lineHeight: 26, fontWeight: '700', textAlign: 'center' },
  headerEyebrow: { color: C.dim, fontFamily: serif, fontSize: 11, letterSpacing: 1.5, textAlign: 'center' },
  toc: { marginTop: S.xl, borderWidth: 1, borderColor: C.text, paddingHorizontal: S.lg, paddingVertical: S.md, gap: S.md },
  tocHeading: { color: C.text, fontFamily: serif, fontSize: 18, fontWeight: '700' },
  tocLecture: { color: C.text, fontFamily: serif, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  tocItem: { flexDirection: 'row', alignItems: 'baseline', gap: S.sm, paddingLeft: S.lg, paddingVertical: 2 },
  tocItemText: { color: C.forest, fontFamily: serif, fontSize: 15, textDecorationLine: 'underline' },
  tocReading: { color: C.dim, fontFamily: serif, fontSize: 12, flexShrink: 1 },
  abstract: { color: C.text, fontFamily: serif, fontSize: 16, lineHeight: 24 },
  colophon: { color: C.dim, fontFamily: serif, fontSize: 13, lineHeight: 19, fontStyle: 'italic', marginTop: S.md },
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
  pdfCol: { paddingTop: S.md, paddingLeft: S.lg, paddingRight: S.md, gap: S.sm },
  pdfHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  sheetBody: { paddingHorizontal: 56, paddingTop: S.xl, minHeight: '100%' },
}));
