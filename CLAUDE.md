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

- `src/content.ts` — エントリポイント。DOMからレコード名を検出しコピーアイコンを挿入。MutationObserverでSPAナビゲーション対応
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
- オブジェクトAPI名は `[data-target-selection-name^='sfdc:RecordField.']` から正規表現で抽出（例: `sfdc:RecordField.PartsProduct__c.Name` → `partsproduct__c`）
- フィールド値は `records-record-layout-item[field-label="..."]` → `[data-output-element-id='output-field']` の順で探索。Lookup項目は `force-lookup a[data-navigation='enable']` から取得
- Clipboard API は `text/html`（リッチテキスト貼り付け用）と `text/plain`（レコード名のみ）を同時にセット
- MutationObserver は URL変更検知 + アイコン消失検知の2重チェック（Lightning SPAはDOM再構築が頻繁）
- content script は ES Modules 非対応のため、esbuild で IIFE にバンドルする必要がある
