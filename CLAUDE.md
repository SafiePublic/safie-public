# SF Record Linker

Salesforce Lightning レコードページのリンクをワンクリックでコピーする Chrome 拡張機能。

## Key Files

- `content.js` — エントリポイント。DOMからレコード名を検出しコピーアイコンを挿入。MutationObserverでSPAナビゲーション対応
- `lib/link-formatter.js` — content.js より先に読み込まれるグローバル関数群（`formatBasicLink`, `formatExtendedLink`, `escapeHtml`）
- `options.js` — `chrome.storage.sync` でオブジェクトごとの拡張表示設定を管理

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | 依存パッケージをインストール |
| `npm test` | Vitest でテスト実行 |

## 開発ルール

- パブリック公開予定のツール。機能追加・変更時はテストを書く
- テストフレームワーク: Vitest
- `chrome://extensions/` →「パッケージ化されていない拡張機能を読み込む」で動作確認
- DOMセレクタの変更時は `sample.html` で検証してから反映
- `lib/link-formatter.js` の関数はグローバルスコープ（manifest.json の js 配列順で content.js より先にロード）

## Gotchas

- レコード名の取得には複数のフォールバックセレクタが必要（`records-highlights2` 配下の `lightning-formatted-text`、Shadow DOM ではないが構造がバージョンで変わりうる）
- オブジェクトAPI名は `[data-target-selection-name^='sfdc:RecordField.']` から正規表現で抽出（例: `sfdc:RecordField.PartsProduct__c.Name` → `partsproduct__c`）
- フィールド値は `records-record-layout-item[field-label="..."]` → `[data-output-element-id='output-field']` の順で探索。Lookup項目は `force-lookup a[data-navigation='enable']` から取得
- Clipboard API は `text/html`（リッチテキスト貼り付け用）と `text/plain`（レコード名のみ）を同時にセット
- MutationObserver は URL変更検知 + アイコン消失検知の2重チェック（Lightning SPAはDOM再構築が頻繁）
