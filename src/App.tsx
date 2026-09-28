import { useEffect, useRef, useState } from 'react';
import defaultLogo from './assets/logo.svg';
import defaultSignature from './assets/signature.png';
import { Editable } from './components/Editable';
import { ImageSlot } from './components/ImageSlot';
import { Page, type ItemActions, type SectionActions } from './components/Page';
import { createDefaultDoc, newItem, newPage, newSection, parseDoc, useDoc } from './store';
import type { Doc } from './types';

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5];
const ZOOM_KEY = 'my-jasoseo:zoom';

function initialZoom() {
  try {
    const z = Number(localStorage.getItem(ZOOM_KEY));
    if (ZOOMS.includes(z)) return z;
  } catch {
    // ignore
  }
  // A4 at 100% is ~794px wide; shrink on narrow screens.
  return window.innerWidth < 860 ? 0.5 : 1;
}

export default function App() {
  const { doc, setDoc, update, saveState } = useDoc();
  const [zoom, setZoom] = useState(initialZoom);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(ZOOM_KEY, String(zoom));
    } catch {
      // ignore
    }
  }, [zoom]);

  const exportPdf = () => {
    const prev = document.title;
    // Chrome/Edge/Safari use the document title as the default PDF file name.
    document.title = `${doc.header.title}_${doc.header.name}`.replace(/[\\/:*?"<>|\s]+/g, '_');
    window.print();
    document.title = prev;
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `자기소개서_${doc.header.name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseDoc(await file.text());
    if (!parsed) {
      alert('올바른 자기소개서 백업 파일이 아니에요.');
      return;
    }
    setDoc(parsed);
  };

  const reset = () => {
    if (confirm('모든 수정 내용을 지우고 처음 상태로 되돌릴까요?')) setDoc(createDefaultDoc());
  };

  const sectionActions = (pi: number) => (si: number): SectionActions => {
    const page = doc.pages[pi];
    const isLastPage = pi === doc.pages.length - 1;
    return {
      setTitle: (title) => update((d) => void (d.pages[pi].sections[si].title = title)),
      canMoveUp: si > 0 || pi > 0,
      canMoveDown: si < page.sections.length - 1 || !isLastPage,
      move: (dir) =>
        update((d) => {
          const list = d.pages[pi].sections;
          const [s] = list.splice(si, 1);
          const target = si + dir;
          if (target < 0) d.pages[pi - 1].sections.push(s);
          else if (target > list.length) d.pages[pi + 1].sections.unshift(s);
          else list.splice(target, 0, s);
        }),
      remove: () => {
        if (confirm(`'${page.sections[si].title}' 섹션을 삭제할까요?`)) update((d) => void d.pages[pi].sections.splice(si, 1));
      },
      addItem: () => update((d) => void d.pages[pi].sections[si].items.push(newItem())),
    };
  };

  const itemActions = (pi: number) => (si: number, ii: number): ItemActions => {
    const items = doc.pages[pi].sections[si].items;
    return {
      setTitle: (title) => update((d) => void (d.pages[pi].sections[si].items[ii].title = title)),
      setBody: (body) => update((d) => void (d.pages[pi].sections[si].items[ii].body = body)),
      canMoveUp: ii > 0,
      canMoveDown: ii < items.length - 1,
      move: (dir) =>
        update((d) => {
          const list = d.pages[pi].sections[si].items;
          const [it] = list.splice(ii, 1);
          list.splice(ii + dir, 0, it);
        }),
      remove: () => {
        if (confirm('이 문단을 삭제할까요?')) update((d) => void d.pages[pi].sections[si].items.splice(ii, 1));
      },
    };
  };

  const setHeader = (key: keyof Doc['header']) => (v: string) => update((d) => void (d.header[key] = v));
  const lastPage = doc.pages.length - 1;

  const logo = (
    <ImageSlot
      className="logo"
      label="로고"
      src={doc.logo}
      defaultSrc={defaultLogo}
      onChange={(src) => update((d) => void (d.logo = src))}
    />
  );

  return (
    <>
      <header className="toolbar screen-only">
        <div className="toolbar__title">
          자기소개서 편집기
          <span className={`toolbar__save toolbar__save--${saveState}`}>
            {saveState === 'saved' ? '자동 저장됨' : saveState === 'saving' ? '저장 중…' : '저장 실패 (브라우저 저장소 사용 불가)'}
          </span>
        </div>
        <div className="toolbar__actions">
          <label className="toolbar__zoom">
            배율
            <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
              {ZOOMS.map((z) => (
                <option key={z} value={z}>{Math.round(z * 100)}%</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={exportJson}>백업 저장</button>
          <button type="button" onClick={() => fileInput.current?.click()}>백업 불러오기</button>
          <button type="button" onClick={reset}>초기화</button>
          <button type="button" className="primary" onClick={exportPdf}>PDF로 저장</button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              importJson(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      <p className="hint screen-only">
        글자를 클릭해서 바로 수정하세요. 문단·섹션에 마우스를 올리면 오른쪽에 편집 버튼이 나타나요. PDF로 저장 시 인쇄 창에서 대상을 <b>‘PDF로 저장’</b>으로 선택하세요.
      </p>

      <main className="pages" style={{ zoom }}>
        {doc.pages.map((page, pi) => (
          <div className="page-wrap" key={page.id}>
            <Page
              page={page}
              index={pi}
              sectionActions={sectionActions(pi)}
              itemActions={itemActions(pi)}
              top={
                <>
                  {logo}
                  {pi === 0 && (
                    <div className="doc-header">
                      <Editable className="doc-header__title" value={doc.header.title} onChange={setHeader('title')} singleLine placeholder="자기소개서" />
                      <div className="doc-header__line">
                        <Editable inline className="doc-header__name" value={doc.header.name} onChange={setHeader('name')} singleLine placeholder="이름" />
                        <span className="doc-header__gap">{'    '}</span>
                        <Editable inline className="doc-header__tagline" value={doc.header.tagline} onChange={setHeader('tagline')} singleLine placeholder="한 줄 소개" />
                      </div>
                    </div>
                  )}
                </>
              }
              bottom={
                pi === lastPage && (
                  <div className="signature">
                    <Editable className="signature__text" value={doc.signature.text} onChange={(v) => update((d) => void (d.signature.text = v))} />
                    <ImageSlot
                      className="signature__image"
                      label="서명"
                      src={doc.signature.image}
                      defaultSrc={defaultSignature}
                      onChange={(src) => update((d) => void (d.signature.image = src))}
                    />
                  </div>
                )
              }
            />
            <div className="page-actions screen-only">
              <span className="page-actions__num">{pi + 1} / {doc.pages.length}</span>
              <button type="button" onClick={() => update((d) => void d.pages[pi].sections.push(newSection()))}>+ 섹션 추가</button>
              {pi === lastPage && (
                <button type="button" onClick={() => update((d) => void d.pages.push(newPage()))}>+ 페이지 추가</button>
              )}
              {pi > 0 && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    if (page.sections.length === 0 || confirm('이 페이지와 안의 내용을 모두 삭제할까요?')) update((d) => void d.pages.splice(pi, 1));
                  }}
                >
                  페이지 삭제
                </button>
              )}
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
