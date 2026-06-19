// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import type { CardState } from '../../src/lib/types';
import { Preview } from '../../src/options/components/Preview';

afterEach(cleanup);

function makeCard(overrides: Partial<CardState> = {}): CardState {
  return {
    id: '1',
    objectName: '商品',
    mode: 'custom',
    fieldLabel: '',
    showLabel: false,
    format: '',
    ...overrides,
  };
}

// プレビューでは項目値はラベル名のプレースホルダ [項目名] で表示される。
// 下線（<u>）部分がリンク、<span> 部分がプレーン。
describe('Preview — ${link:項目名} 明示リンク（#8）', () => {
  it('${link:商品コード} だけが下線（リンク）になり、レコード名はプレーンになる', () => {
    render(
      <Preview
        card={makeCard({ format: '${name} - ${link:商品コード}' })}
        linkNameOnly={true}
        showObjectName={false}
      />,
    );
    const linked = document.querySelectorAll('.preview-text u');
    expect(linked.length).toBe(1);
    expect(linked[0].textContent).toBe('[商品コード]');
    expect(document.querySelector('.preview-text')?.textContent).toBe('レコード名 - [商品コード]');
  });

  it('複数の ${link:...} がそれぞれ下線になる', () => {
    render(
      <Preview
        card={makeCard({ format: '${link:name} / ${link:商品コード}' })}
        linkNameOnly={true}
        showObjectName={false}
      />,
    );
    const linked = document.querySelectorAll('.preview-text u');
    expect(linked.length).toBe(2);
    expect(linked[0].textContent).toBe('レコード名');
    expect(linked[1].textContent).toBe('[商品コード]');
  });

  it('${link:} が無い従来 format は linkNameOnly に従いレコード名のみ下線', () => {
    render(
      <Preview
        card={makeCard({ format: '${name} - ${商品コード}' })}
        linkNameOnly={true}
        showObjectName={false}
      />,
    );
    const linked = document.querySelectorAll('.preview-text u');
    expect(linked.length).toBe(1);
    expect(linked[0].textContent).toBe('レコード名');
    expect(document.querySelector('.preview-text')?.textContent).toBe('レコード名 - [商品コード]');
  });
});
