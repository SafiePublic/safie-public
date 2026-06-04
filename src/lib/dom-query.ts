// DOM 探索ユーティリティ。Shadow DOM 横断と、同一オリジン iframe 横断の querySelector。

export type ShadowQuery = (
  root: Document | ShadowRoot | Element,
  selector: string,
) => HTMLElement | null;

export function querySelectorInShadowDOM(
  root: Document | ShadowRoot | Element,
  selector: string,
  maxDepth = 10,
): HTMLElement | null {
  const el = root.querySelector<HTMLElement>(selector);
  if (el) return el;
  if (maxDepth <= 0) return null;

  const elements = root.querySelectorAll("*");
  for (const element of elements) {
    if (element.shadowRoot) {
      const found = querySelectorInShadowDOM(
        element.shadowRoot,
        selector,
        maxDepth - 1,
      );
      if (found) return found;
    }
  }
  return null;
}

// トップフレーム→同一オリジン iframe の順に Shadow DOM 横断で探索する。
// 新しいレポートランタイムは内容を同一オリジン iframe（lightningReportApp.app）に
// 描画するため、トップフレームの document からは要素が見つからない。
// クロスオリジン iframe は contentDocument アクセスで例外になるため握りつぶしてスキップ。
export const queryAcrossFrames: ShadowQuery = (root, selector) => {
  const direct = querySelectorInShadowDOM(root, selector);
  if (direct) return direct;

  const frames = root.querySelectorAll("iframe");
  for (const frame of Array.from(frames)) {
    let doc: Document | null = null;
    try {
      doc = (frame as HTMLIFrameElement).contentDocument;
    } catch {
      continue; // クロスオリジン
    }
    if (!doc) continue;
    const found = querySelectorInShadowDOM(doc, selector);
    if (found) return found;
  }
  return null;
};
