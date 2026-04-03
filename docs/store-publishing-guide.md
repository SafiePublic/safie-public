# Chrome ウェブストア公開・更新ガイド

このガイドは Chrome ウェブストアへの申請と、バージョン更新時の手順をまとめたものです。
必要な素材はすべて GitHub 上に公開されています。

---

## 素材の入手先

すべて GitHub リポジトリから取得できます。

| 素材 | URL |
|------|-----|
| **ZIP パッケージ** | [最新リリースページ](https://github.com/SafiePublic/sf-record-linker/releases/latest) の Assets から `sf-record-linker.zip` をダウンロード |
| **ストア掲載テキスト** | [docs/store-listing.md](https://github.com/SafiePublic/sf-record-linker/blob/main/docs/store-listing.md) |
| **スクリーンショット** | [docs/screenshots/store-screenshot-options.png](https://github.com/SafiePublic/sf-record-linker/blob/main/docs/screenshots/store-screenshot-options.png) — 「Download raw file」ボタンでダウンロード |
| **プライバシーポリシー URL** | https://safiepublic.github.io/sf-record-linker/privacy-policy.html |
| **リポジトリ URL**（ウェブサイト欄用） | https://github.com/SafiePublic/sf-record-linker |

---

## 初回申請手順

### Step 1: デベロッパーダッシュボードにログイン

1. https://chrome.google.com/webstore/devconsole を開く
2. Google アカウントでログイン（初回は $5 の登録料が必要）

### Step 2: パッケージアップロード

1. 「新しいアイテム」をクリック
2. 上記の素材入手先から **sf-record-linker.zip** をダウンロードし、アップロード

### Step 3: ストアの掲載情報

[store-listing.md](https://github.com/SafiePublic/sf-record-linker/blob/main/docs/store-listing.md) を開き、内容をコピーして入力してください。

| フィールド | 入力内容 |
|-----------|---------|
| 名前 | `SF Record Linker` |
| 概要（短い説明） | store-listing.md →「概要（短い説明）」をコピー |
| 詳細説明 | store-listing.md →「詳細説明」をコピー |
| カテゴリ | 仕事効率化（Productivity） |
| 言語 | 日本語（デフォルト）、English |
| ウェブサイト | `https://github.com/SafiePublic/sf-record-linker` |
| スクリーンショット | 上記の素材入手先からダウンロードした PNG をアップロード |

### Step 4: プライバシーへの取り組み

| フィールド | 入力内容 |
|-----------|---------|
| シングルパーパス | `Salesforce Lightning レコードページのリンクをクリップボードにコピーする` |
| 権限の正当性 | 下記の文章をコピー |
| プライバシーポリシー URL | `https://safiepublic.github.io/sf-record-linker/privacy-policy.html` |
| データの使用 | 「ユーザーのデータを収集または使用しない」にチェック |

**権限の正当性（そのままコピーしてください）:**

```
This extension uses the following permissions:

- clipboardWrite: Required to copy generated hyperlinks to the user's clipboard.
- storage: Required to save and sync user-configured copy format settings across devices.
- declarativeContent: Required to enable the extension icon only on Salesforce Lightning record pages (*.lightning.force.com).

The extension does not collect, transmit, or store any personal data. All processing occurs entirely within the user's browser.
```

### Step 5: 配布設定

| フィールド | 設定 |
|-----------|------|
| 公開設定 | 公開（一般公開） |
| 対象地域 | すべての地域 |

### Step 6: 審査に提出

「審査のために提出」ボタンをクリック。通常 1〜3 営業日で審査完了。

---

## バージョン更新手順

開発者がリリースを作成すると、GitHub の [Releases ページ](https://github.com/SafiePublic/sf-record-linker/releases/latest) に新しい ZIP がアップロードされます。

### 開発者（更新依頼する側）がやること

1. コードを修正・コミット
2. `manifest.json` と `package.json` の `version` を更新
3. `npm run package` で ZIP を作成
4. GitHub に新しいタグ・リリースを作成し、ZIP を添付
5. 情シスに更新を依頼（以下の情報を伝える）:
   - 新しいバージョン番号（例: v1.5.0）
   - 変更概要（リリースノートの URL で可）
   - 掲載テキストの変更有無

### 情シス（ストア更新する側）がやること

1. [最新リリースページ](https://github.com/SafiePublic/sf-record-linker/releases/latest) から新しい ZIP をダウンロード
2. https://chrome.google.com/webstore/devconsole を開く
3. SF Record Linker を選択 →「パッケージ」タブ →「新しいパッケージをアップロード」
4. ダウンロードした ZIP をアップロード
5. 掲載テキストの変更が必要な場合は [store-listing.md](https://github.com/SafiePublic/sf-record-linker/blob/main/docs/store-listing.md) を確認して更新
6. 「審査のために提出」

---

## チェックリスト

### 初回申請

- [ ] デベロッパーアカウント登録済み
- [ ] ZIP パッケージをアップロード
- [ ] ストア掲載情報を入力（名前・概要・詳細説明・カテゴリ・言語・ウェブサイト・スクリーンショット）
- [ ] プライバシー情報を入力（シングルパーパス・権限の正当性・プライバシーポリシー URL・データの使用）
- [ ] 配布設定を選択
- [ ] 審査に提出

### バージョン更新

- [ ] 最新リリースから ZIP をダウンロード
- [ ] ダッシュボードで新しい ZIP をアップロード
- [ ] 掲載テキストの変更があれば更新
- [ ] 審査に提出
