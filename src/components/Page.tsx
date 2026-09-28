import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { Item, Page as PageData, Section } from '../types';
import { Editable } from './Editable';

/** Bottom of the usable area, in pt from the page top (A4 = 842pt, 40pt bottom margin). */
const SAFE_BOTTOM_PT = 802;

export interface SectionActions {
  setTitle: (title: string) => void;
  move: (dir: -1 | 1) => void;
  remove: () => void;
  addItem: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export interface ItemActions {
  setTitle: (title: string | null) => void;
  setBody: (body: string) => void;
  move: (dir: -1 | 1) => void;
  remove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

interface PageProps {
  page: PageData;
  index: number;
  top: ReactNode;
  bottom?: ReactNode;
  sectionActions: (sectionIndex: number) => SectionActions;
  itemActions: (sectionIndex: number, itemIndex: number) => ItemActions;
}

export function Page({ page, index, top, bottom, sectionActions, itemActions }: PageProps) {
  const content = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    const el = content.current;
    if (!el) return;
    const check = () => {
      const limit = marker.current?.offsetTop ?? Infinity;
      setOverflow(el.offsetTop + el.offsetHeight > limit + 0.5);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <article className={`page ${index === 0 ? 'page--first' : 'page--rest'} ${overflow ? 'is-overflow' : ''}`}>
      {top}
      <div className="page__content" ref={content}>
        <div className="sections">
          {page.sections.map((s, si) => (
            <SectionView key={s.id} section={s} actions={sectionActions(si)} itemActions={(ii) => itemActions(si, ii)} />
          ))}
        </div>
        {bottom}
      </div>
      <div className="page__safe-line" ref={marker} style={{ top: `${SAFE_BOTTOM_PT}pt` }}>
        <span className="screen-only">페이지 하단 여백을 넘었어요 — PDF에서 잘릴 수 있으니 내용을 줄이거나 섹션을 다음 페이지로 옮기세요</span>
      </div>
    </article>
  );
}

function SectionView({ section, actions, itemActions }: { section: Section; actions: SectionActions; itemActions: (i: number) => ItemActions }) {
  return (
    <section className="section">
      <div className="section__head">
        <Editable className="section__title" value={section.title} onChange={actions.setTitle} singleLine placeholder="섹션 제목" />
        <div className="section__rule" />
        <div className="controls screen-only">
          <span className="controls__label">섹션</span>
          <button type="button" title="위로 (이전 페이지로)" disabled={!actions.canMoveUp} onClick={() => actions.move(-1)}>↑</button>
          <button type="button" title="아래로 (다음 페이지로)" disabled={!actions.canMoveDown} onClick={() => actions.move(1)}>↓</button>
          <button type="button" title="문단 추가" onClick={actions.addItem}>+ 문단</button>
          <button type="button" className="danger" title="섹션 삭제" onClick={actions.remove}>삭제</button>
        </div>
      </div>
      <div className="section__items">
        {section.items.map((it, ii) => (
          <ItemView key={it.id} item={it} actions={itemActions(ii)} />
        ))}
      </div>
    </section>
  );
}

function ItemView({ item, actions }: { item: Item; actions: ItemActions }) {
  return (
    <div className="item">
      {item.title !== null && (
        <Editable className="item__title" value={item.title} onChange={actions.setTitle} singleLine placeholder="[소제목]" />
      )}
      <Editable className="item__body" value={item.body} onChange={actions.setBody} placeholder="내용을 입력하세요" />
      <div className="controls screen-only">
        <span className="controls__label">문단</span>
        <button
          type="button"
          title={item.title === null ? '소제목 추가' : '소제목 제거'}
          onClick={() => actions.setTitle(item.title === null ? '[소제목]' : null)}
        >
          {item.title === null ? '+ 소제목' : '− 소제목'}
        </button>
        <button type="button" title="위로" disabled={!actions.canMoveUp} onClick={() => actions.move(-1)}>↑</button>
        <button type="button" title="아래로" disabled={!actions.canMoveDown} onClick={() => actions.move(1)}>↓</button>
        <button type="button" className="danger" title="문단 삭제" onClick={actions.remove}>삭제</button>
      </div>
    </div>
  );
}
