// records-highlights2 配下のレコード名抽出ロジック。
// DOM 探索（Shadow DOM 横断 querySelector）は呼び出し側から注入し、テスト可能にする。
//
// 商談・取引先などの単純名は lightning-formatted-text で描画されるが、
// 担当者（Contact）・見込客（Lead）など姓名の複合項目（Name compound field）は
// lightning-formatted-name で描画される。両方をフォールバックで探索する。
// slot="primaryField" 付きを優先し、無ければ slot 無しの要素にもフォールバックする。

import type { ShadowQuery } from './dom-query';

export type { ShadowQuery };

const RECORD_NAME_SELECTORS = [
  'lightning-formatted-text[slot="primaryField"]',
  'lightning-formatted-name[slot="primaryField"]',
  'lightning-formatted-text',
  'lightning-formatted-name',
];

export function findRecordName(startEl: Element | Document, query: ShadowQuery): string | null {
  const rh2 = query(startEl, 'records-highlights2');
  if (!rh2) return null;

  for (const selector of RECORD_NAME_SELECTORS) {
    const el = rh2.querySelector<HTMLElement>(selector);
    // innerText はブラウザ実体。jsdom など未実装環境では textContent にフォールバック。
    const name = (el?.innerText ?? el?.textContent)?.trim();
    if (name) return name;
  }
  return null;
}
