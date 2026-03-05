# SF Record Linker

Salesforce Lightning レコードページ用 Chrome 拡張機能。レコードへのリンクをワンクリックでクリップボードにコピーする。

## 機能

- **ワンクリックコピー** — 拡張アイコンをクリックするだけでレコード名のハイパーリンクをコピー（リッチテキスト + プレーンテキスト）
- **簡易設定** — オブジェクトごとに項目を1つ指定し、`レコード名(項目値)` 形式でコピー
- **カスタムフォーマット** — テンプレート変数（`${name}`, `${object}`, `${項目ラベル名}`）を組み合わせて自由な形式を定義
- **複数タブ一括コピー** — 複数タブを選択した状態でアイコンをクリックすると、全タブのレコードリンクを改行区切りでまとめてコピー
- **レコードページ限定** — `declarativeContent` により Salesforce のレコードページ以外ではアイコンが無効化

## 使い方

### 基本操作

1. Salesforce Lightning のレコードページを開く
2. 拡張アイコンをクリック
3. レコード名のリンクがクリップボードにコピーされる

複数タブを選択（Ctrl/Cmd + クリック）してからアイコンをクリックすると、選択中の全レコードページのリンクをまとめてコピーできる。

### 設定（オプション）

拡張機能の設定画面（右クリック →「オプション」）でオブジェクトごとにコピー形式をカスタマイズできる。

![オプション画面](docs/screenshots/store-screenshot-options.png)

**簡易設定**: 項目を1つ指定して付加する。

| 設定 | コピー結果 |
|------|-----------|
| オブジェクト名: `商品` / 項目ラベル名: `商品コード` | `Product A(商品コード:ABC-001)` |

**カスタム設定**: テンプレート変数で自由なフォーマットを定義する。

| 変数 | 説明 |
|------|------|
| `${name}` | レコード名 |
| `${object}` | オブジェクト表示名 |
| `${項目ラベル名}` | Salesforce の項目ラベル名で値を参照 |

| フォーマット例 | コピー結果 |
|--------------|-----------|
| `${name}(${商品コード})` | `Product A(ABC-001)` |
| `[${object}]${name}(${商品コード} / ${カテゴリ})` | `[商品]Product A(ABC-001 / Electronics)` |

フォーマット内の項目が取得できなかった場合は、レコード名のみのリンクにフォールバックする。

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
│   ├── content.ts             # Content Script（メッセージ受信・DOM探索・クリップボードコピー）
│   ├── background.ts          # Service Worker（アイコンクリック・declarativeContent）
│   ├── options/               # 設定画面（Preact）
│   │   ├── index.tsx          # エントリポイント
│   │   ├── App.tsx            # メインコンポーネント（useReducer で状態管理）
│   │   ├── components/        # UI コンポーネント
│   │   │   ├── ObjectCard.tsx
│   │   │   ├── SegmentControl.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Preview.tsx
│   │   │   └── Toast.tsx
│   │   ├── hooks/             # カスタムフック
│   │   │   ├── useChromeStorage.ts
│   │   │   └── useToast.ts
│   │   ├── options.html       # 設定画面 HTML
│   │   └── options.css        # スタイル
│   └── lib/
│       ├── link-formatter.ts  # リンク生成ロジック
│       ├── validation.ts      # バリデーション純粋関数
│       └── types.ts           # 共有型定義
├── tests/
│   ├── lib/
│   │   ├── link-formatter.test.ts
│   │   └── validation.test.ts
│   └── options/
│       ├── App.test.tsx
│       ├── ObjectCard.test.tsx
│       └── hooks/
│           └── useChromeStorage.test.ts
├── scripts/
│   └── build.mjs             # esbuild ビルドスクリプト
├── dist/                      # ビルド出力（Chrome 拡張として読み込む）
├── manifest.json              # Chrome Extension Manifest V3
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
- Preact — 設定画面の宣言的 UI
- Vitest + @testing-library/preact（テスト）
- Service Worker + declarativeContent — レコードページでのみアイコン有効化
- Content Script（`*://*.lightning.force.com/*` で動作）
- Clipboard API — text/html + text/plain 両方をセット
- chrome.storage.sync — オブジェクトごとの設定を同期
