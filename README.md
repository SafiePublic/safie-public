# SF Record Linker

Salesforce Lightning レコードページ用 Chrome 拡張機能。レコードへのリンクをワンクリックでクリップボードにコピーする。

## セットアップ

```bash
npm install
npm run build
```

1. `chrome://extensions/` を開く
2. 「デベロッパーモード」を ON
3. 「パッケージ化されていない拡張機能を読み込む」で `dist/` ディレクトリを選択

## 開発

```bash
npm run dev       # watch モード（ファイル変更時に自動ビルド）
npm test          # テスト実行
npm run typecheck # 型チェック
```

コード変更後は拡張機能カードの更新ボタンを押し、Salesforce タブをリロード。

## プロジェクト構成

```
sf-record-linker/
├── src/
│   ├── content.ts             # Content Script（DOM操作・UI挿入）
│   ├── options.ts             # 設定画面ロジック
│   └── lib/
│       └── link-formatter.ts  # リンク生成ロジック
├── tests/
│   └── lib/
│       └── link-formatter.test.ts
├── scripts/
│   └── build.mjs             # esbuild ビルドスクリプト
├── dist/                      # ビルド出力（Chrome 拡張として読み込む）
├── manifest.json              # Chrome Extension Manifest V3
├── options.html               # 設定画面 HTML
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── package.json
├── tsconfig.json
└── .gitignore
```

## 技術スタック

- Chrome Extension Manifest V3
- TypeScript + esbuild（IIFE バンドル）
- Vitest（テスト）
- Content Script（`*://*.lightning.force.com/*` で動作）
- Clipboard API — text/html + text/plain 両方をセット
- MutationObserver — SPA ページ遷移検知・再挿入
- chrome.storage.sync — オブジェクトごとの拡張表示設定
