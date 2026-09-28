import { useCallback, useEffect, useRef, useState } from 'react';
import defaultContent from './defaultContent.json';
import type { Doc, Item, Page, Section } from './types';

const STORAGE_KEY = 'my-jasoseo:doc:v1';

export const uid = () => Math.random().toString(36).slice(2, 10);

export function createDefaultDoc(): Doc {
  return {
    header: { ...defaultContent.header },
    logo: 'default',
    pages: defaultContent.pages.map((p) => ({
      id: uid(),
      sections: p.sections.map((s) => ({
        id: uid(),
        title: s.title,
        items: s.items.map((it) => ({ id: uid(), title: it.title, body: it.body })),
      })),
    })),
    signature: { text: defaultContent.signature.text, image: 'default' },
  };
}

export const newItem = (): Item => ({ id: uid(), title: '[소제목]', body: ' 내용을 입력하세요.' });
export const newSection = (): Section => ({ id: uid(), title: '새 항목', items: [newItem()] });
export const newPage = (): Page => ({ id: uid(), sections: [] });

function isDoc(v: unknown): v is Doc {
  const d = v as Doc;
  return !!d && typeof d === 'object' && !!d.header && Array.isArray(d.pages) && !!d.signature;
}

export function parseDoc(json: string): Doc | null {
  try {
    const v = JSON.parse(json);
    return isDoc(v) ? v : null;
  } catch {
    return null;
  }
}

function load(): Doc {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const doc = raw && parseDoc(raw);
    if (doc) return doc;
  } catch {
    // storage unavailable (private mode etc.) — fall back to defaults
  }
  return createDefaultDoc();
}

export type SaveState = 'saved' | 'saving' | 'error';

export function useDoc() {
  const [doc, setDoc] = useState<Doc>(load);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveState('saving');
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 300);
    return () => clearTimeout(t);
  }, [doc]);

  const update = useCallback((fn: (draft: Doc) => void) => {
    setDoc((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  return { doc, setDoc, update, saveState };
}
