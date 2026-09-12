import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { C } from '../theme';

// A vertical drag handle between two columns (web only). Reports the horizontal drag delta in pixels;
// double-click asks the parent to reset. While dragging, a transparent overlay keeps iframes from
// swallowing pointer events.
export default function SplitHandle({ onDrag, onEnd, onReset }: { onDrag: (dx: number) => void; onEnd: () => void; onReset: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  const startX = useRef(0);
  const onDragRef = useRef(onDrag); onDragRef.current = onDrag;
  const onEndRef = useRef(onEnd); onEndRef.current = onEnd;

  useEffect(() => {
    if (!dragging || Platform.OS !== 'web') return;
    const move = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0]?.clientX ?? startX.current : e.clientX;
      onDragRef.current(x - startX.current);
    };
    const up = () => { setDragging(false); onEndRef.current(); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      document.body.style.userSelect = prev;
    };
  }, [dragging]);

  if (Platform.OS !== 'web') return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { unstable_createElement } = require('react-native-web');
  const start = (e: any) => {
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
    setDragging(true);
    e.preventDefault?.();
  };
  const active = dragging || hover;
  const handle = unstable_createElement('div', {
    onMouseDown: start,
    onTouchStart: start,
    onDoubleClick: onReset,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    title: 'Drag to resize · double-click to reset',
    style: {
      width: 14, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
      alignSelf: 'stretch', flexShrink: 0, touchAction: 'none',
    },
    children: unstable_createElement('div', {
      style: { width: 4, height: 44, borderRadius: 2, background: active ? C.forest : C.border, transition: 'background 120ms' },
    }),
  });
  return (
    <>
      {handle}
      {dragging && <View pointerEvents="auto" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'col-resize' } as any} />}
    </>
  );
}
