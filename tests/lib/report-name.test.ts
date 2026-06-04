// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { findReportName, type ShadowQuery } from '../../src/lib/report-name';

const sampleHtml = readFileSync(
  resolve(process.cwd(), 'tests/fixtures/report-sample.html'),
  'utf-8',
);

// テスト用の query。フィクスチャは light DOM なので通常の querySelector で十分。
const query: ShadowQuery = (root, selector) => root.querySelector<HTMLElement>(selector);

const REPORT_NAME = '【Zuora請求項目】適用済み取次手数料マスター条件不一致';

describe('findReportName', () => {
  beforeEach(() => {
    document.body.innerHTML = sampleHtml;
  });

  it('DOM の .slds-page-header__title からレポート名を取得する', () => {
    const name = findReportName(document, 'ignored', query);
    expect(name).toBe(REPORT_NAME);
  });

  it('document.title に環境名が混入していても DOM を優先する', () => {
    // 環境名付与拡張がタイトルを書き換えたケース
    const noisyTitle = `[本番環境] ${REPORT_NAME} | Salesforce`;
    const name = findReportName(document, noisyTitle, query);
    expect(name).toBe(REPORT_NAME);
  });

  it('レポートタイプ名（h1 直下の先頭 span）は拾わない', () => {
    const name = findReportName(document, 'ignored', query);
    expect(name).not.toContain('レポート: Invoice Item');
  });

  it("DOM が見つからない場合は document.title から ' | Salesforce' を除去して返す", () => {
    document.body.innerHTML = '<div></div>';
    const name = findReportName(document, `${REPORT_NAME} | Salesforce`, query);
    expect(name).toBe(REPORT_NAME);
  });

  it('DOM もタイトルサフィックスも無い場合は document.title をそのまま返す', () => {
    document.body.innerHTML = '<div></div>';
    const name = findReportName(document, '素のタイトル', query);
    expect(name).toBe('素のタイトル');
  });
});
