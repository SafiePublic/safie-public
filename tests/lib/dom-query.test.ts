// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { queryAcrossFrames, querySelectorInShadowDOM } from '../../src/lib/dom-query';
import { findReportName } from '../../src/lib/report-name';

const REPORT_NAME = '【Zuora請求項目】適用済み取次手数料マスター条件不一致';

describe('querySelectorInShadowDOM', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('light DOM の要素を見つける', () => {
    document.body.innerHTML = `<span class="t" title="x">x</span>`;
    expect(querySelectorInShadowDOM(document, '.t')?.getAttribute('title')).toBe('x');
  });

  it('open shadow root 内の要素を横断して見つける', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<span class="t" title="deep">deep</span>`;
    expect(querySelectorInShadowDOM(document, '.t')?.getAttribute('title')).toBe('deep');
  });
});

describe('queryAcrossFrames', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('トップフレームにあればそれを返す', () => {
    document.body.innerHTML = `<span class="t" title="top">top</span>`;
    expect(queryAcrossFrames(document, '.t')?.getAttribute('title')).toBe('top');
  });

  it('トップに無く同一オリジン iframe 内にある場合、iframe を覗いて見つける', () => {
    // 実バグの再現: レポート本体は同一オリジン iframe（lightningReportApp.app）内
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const idoc = iframe.contentDocument!;
    idoc.body.innerHTML = `<span class="slds-page-header__title" title="${REPORT_NAME}">${REPORT_NAME}</span>`;

    const el = queryAcrossFrames(document, '.slds-page-header__title');
    expect(el?.getAttribute('title')).toBe(REPORT_NAME);
  });

  it('クロスオリジン iframe（contentDocument が例外）はスキップする', () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    // クロスオリジンアクセスを模して contentDocument を例外化
    Object.defineProperty(iframe, 'contentDocument', {
      get() {
        throw new DOMException('cross-origin', 'SecurityError');
      },
    });
    // 例外を握りつぶして null を返す（throw しない）
    expect(() => queryAcrossFrames(document, '.missing')).not.toThrow();
    expect(queryAcrossFrames(document, '.missing')).toBeNull();
  });
});

describe('findReportName × queryAcrossFrames（実バグ統合）', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('レポート名が iframe 内・document.title に環境名混入でも、クリーンなレポート名を返す', () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframe.contentDocument!.body.innerHTML = `<div class="report-header"><span class="slds-page-header__title" title="${REPORT_NAME}">${REPORT_NAME}</span></div>`;

    const noisyTitle = `[con] ${REPORT_NAME} | Salesforce`;
    const name = findReportName(document, noisyTitle, queryAcrossFrames);
    expect(name).toBe(REPORT_NAME);
    expect(name).not.toContain('[con]');
  });
});
