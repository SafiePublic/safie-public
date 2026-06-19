// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { findRecordName, type ShadowQuery } from '../../src/lib/record-name';

// テスト用の query。フィクスチャは light DOM なので通常の querySelector で十分。
const query: ShadowQuery = (root, selector) => root.querySelector<HTMLElement>(selector);

describe('findRecordName', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('商談・取引先など単純名（lightning-formatted-text）を取得する', () => {
    document.body.innerHTML = `
      <records-highlights2>
        <lightning-formatted-text slot="primaryField">テスト商談</lightning-formatted-text>
      </records-highlights2>`;
    expect(findRecordName(document, query)).toBe('テスト商談');
  });

  it('担当者・見込客の姓名複合項目（lightning-formatted-name）を取得する（#7 修正）', () => {
    document.body.innerHTML = `
      <records-highlights2>
        <lightning-formatted-name slot="primaryField">山田 太郎</lightning-formatted-name>
      </records-highlights2>`;
    expect(findRecordName(document, query)).toBe('山田 太郎');
  });

  it('slot="primaryField" 付き要素を優先する', () => {
    document.body.innerHTML = `
      <records-highlights2>
        <lightning-formatted-text>サブ項目</lightning-formatted-text>
        <lightning-formatted-text slot="primaryField">メイン項目</lightning-formatted-text>
      </records-highlights2>`;
    expect(findRecordName(document, query)).toBe('メイン項目');
  });

  it('slot 無しの lightning-formatted-name にもフォールバックする', () => {
    document.body.innerHTML = `
      <records-highlights2>
        <lightning-formatted-name>佐藤 花子</lightning-formatted-name>
      </records-highlights2>`;
    expect(findRecordName(document, query)).toBe('佐藤 花子');
  });

  it('records-highlights2 が見つからない場合は null を返す', () => {
    document.body.innerHTML = '<div>関係ない要素</div>';
    expect(findRecordName(document, query)).toBeNull();
  });

  it('レコード名要素が空（空白のみ）の場合は null を返す', () => {
    document.body.innerHTML = `
      <records-highlights2>
        <lightning-formatted-text slot="primaryField">   </lightning-formatted-text>
      </records-highlights2>`;
    expect(findRecordName(document, query)).toBeNull();
  });

  it('前後の空白をトリムして返す', () => {
    document.body.innerHTML = `
      <records-highlights2>
        <lightning-formatted-name slot="primaryField">  鈴木 一郎  </lightning-formatted-name>
      </records-highlights2>`;
    expect(findRecordName(document, query)).toBe('鈴木 一郎');
  });
});
