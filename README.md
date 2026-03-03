# SF Record Linker

Salesforce Lightning レコードページ用 Chrome 拡張機能。レコードへのリンクをワンクリックでクリップボードにコピーする。

## セットアップ

1. `chrome://extensions/` を開く
2. 「デベロッパーモード」を ON
3. 「パッケージ化されていない拡張機能を読み込む」でプロジェクトルートを選択

コード変更後は拡張機能カードの更新ボタンを押し、Salesforce タブをリロード。

## プロジェクト構成

```
sf-record-linker/
├── manifest.json              # Chrome Extension Manifest V3
├── content.js                 # Content Script（DOM操作・UI挿入）
├── lib/
│   └── link-formatter.js      # リンク生成ロジック（フォーマット分離）
├── options.html               # 設定画面
├── options.js                 # 設定画面ロジック
├── sample.html                # Salesforce DOM 構造のリファレンス
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── .gitignore
```

## 技術スタック

- Chrome Extension Manifest V3
- Content Script（`*://*.lightning.force.com/*` で動作）
- Clipboard API (`navigator.clipboard.write()`) — text/html + text/plain 両方をセット
- MutationObserver — SPA ページ遷移検知・再挿入
- chrome.storage.sync — オブジェクトごとの拡張表示設定
