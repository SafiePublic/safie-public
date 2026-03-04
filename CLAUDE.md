# SF Record Linker

Salesforce Lightning レコードページのリンクをワンクリックでコピーする Chrome 拡張機能。

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | 依存パッケージをインストール |
| `npm run build` | esbuild で `dist/` にバンドル |
| `npm run dev` | watch モードでビルド |
| `npm test` | Vitest でテスト実行 |
| `npm run typecheck` | TypeScript 型チェック |

## Key Files

- `src/content.ts` — content script。Shadow DOM探索でレコード名・項目値を取得しクリップボードにコピー。backgroundからのメッセージで起動
- `src/background.ts` — service worker。拡張アイコンクリック→content scriptにメッセージ送信→バッジで結果表示。declarativeContentでレコードページのみ有効化
- `src/lib/link-formatter.ts` — リンク生成の純粋関数群（`formatBasicLink`, `formatExtendedLink`, `escapeHtml`）
- `src/options.ts` — 設定画面ロジック。`chrome.storage.sync` でオブジェクトごとの拡張表示設定を管理
- `scripts/build.mjs` — esbuild ビルドスクリプト。各エントリを IIFE 形式で `dist/` に出力し、静的ファイルをコピー

## 開発ルール

- パブリック公開予定のツール。機能追加・変更時はテストを書く
- TypeScript + esbuild（バンドル）+ Vitest（テスト）
- ソースは `src/` に配置、`npm run build` で `dist/` に出力
- Chrome 拡張は `dist/` ディレクトリを「パッケージ化されていない拡張機能を読み込む」で指定
- DOMセレクタの変更時は `sample.html` で検証してから反映

## Gotchas

- レコード名の取得には複数のフォールバックセレクタが必要（`records-highlights2` 配下の `lightning-formatted-text`、Shadow DOM ではないが構造がバージョンで変わりうる）
- オブジェクト表示名は `records-entity-label` / `.entityNameTitle` の textContent から取得。`options.ts` が表示名をキーに設定を保存するため、`content.ts` 側も表示名で照合する必要がある（API名で照合すると設定がヒットしない）
- `content.ts` の設定は起動時にキャッシュし `chrome.storage.onChanged` でリアルタイム同期。コピーごとに `chrome.storage.sync.get()` を呼ばない
- 項目値は `records-record-layout-item[field-label="..."]` → `[data-output-element-id='output-field']` の順で探索。Lookup項目は `force-lookup a[data-navigation='enable']` から取得
- Clipboard API は `text/html`（リッチテキスト貼り付け用）と `text/plain`（レコード名のみ）を同時にセット
- コピーは拡張アイコンクリック起点（background→content scriptメッセージング）。クリック時にDOMを探索するためレンダリング完了の心配が不要
- `declarativeContent` で `*.lightning.force.com` + `/lightning/r/` パスのときのみアイコンを有効化。content.ts側にも `isRecordPage()` ガードあり（二重チェック）
- content script は ES Modules 非対応のため、esbuild で IIFE にバンドルする必要がある
