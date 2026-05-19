# sorayume-rust-server-web

[SORAYU.ME](https://sorayu.me) Rust ゲームサーバーの紹介用 静的Webサイト。

vanilla / Solo・Duo・Trio / weekly wipe のサーバー情報・ルール・FAQ などを 1 ページにまとめたサイト。夜空テーマ・スライド型スクロール・日英バイリンガル対応。

## 特徴

- React 18 を CDN (UMD) から読み込み、Babel Standalone でブラウザ内 JSX 変換
- **ビルド不要 / `node_modules` 不要** — そのまま静的ホスティングに置ける
- ダーク / ライトテーマ切り替え（`localStorage` に保存）
- JP / EN 言語切り替え（`localStorage` に保存）
- スライド型スクロール（キーボード ↑↓ / PageUp/Down 対応）と URL ハッシュ同期
- 次回 wipe（毎週水曜 12:00 JST）までのカウントダウン

## ローカル実行

ビルド手順なし。任意の静的ファイルサーバーで配信する。

```sh
python3 -m http.server 8080 -d contents
# http://localhost:8080 を開く
```

`file://` 直接オープンでは JSX が読み込めないため、必ずローカルサーバー経由で開くこと。

## ファイル構成

| ファイル | 内容 |
|---|---|
| `contents/index.html` | HTML シェル。React / Babel / 各 JSX を `<script>` で読み込む |
| `contents/content.jsx` | 全テキスト・データを `CONTENT` 定数として保持（`window.CONTENT` に公開） |
| `contents/app.jsx` | React コンポーネント・ルート `App` |
| `contents/styles.css` | CSS 変数で light / dark を切り替え |
| `contents/assets/banner.png` | ライトテーマ用ヒーロー画像 |
| `contents/assets/banner-dark.png` | ダークテーマ用ヒーロー画像 |
| `contents/assets/icon.png` | favicon / ナビ・フッターのロゴ |
| `README.md` / `CLAUDE.md` | リポジトリ用ドキュメント。Cloudflare Pages では配信しない |

## コンテンツの編集

サイト上のテキスト・ルール・FAQ などはすべて [`contents/content.jsx`](contents/content.jsx) の `CONTENT` オブジェクトに集約されている。

`{ jp: "...", en: "..." }` 形式で書けば言語切り替えに自動追従する。

```js
hero: {
  title:   { jp: "ようこそ", en: "Welcome" },
  caption: { jp: "...",      en: "..." },
}
```

## デプロイ (Cloudflare Pages)

ビルドなしの静的サイト。Cloudflare Pages では `contents/` だけを公開ディレクトリにすることで、`README.md` や `CLAUDE.md` などのリポジトリ用ファイルを配信対象から外す。

### 初回セットアップ（ダッシュボード）

1. Cloudflare ダッシュボード → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. GitHub アカウントを連携し、本リポジトリを選択
3. ビルド設定を以下のように指定:
   - **Framework preset**: `None`
   - **Build command**: 空欄
   - **Build output directory**: `contents`
   - **Root directory**: 空欄
4. **Save and Deploy** で初回デプロイ
5. 完了後、`*.pages.dev` のサブドメインが自動付与される

### カスタムドメイン (sorayu.me) の設定

1. Pages プロジェクト → **Custom domains** → **Set up a custom domain**
2. `sorayu.me`（および必要なら `www.sorayu.me`）を追加
3. DNS が Cloudflare 管理下にあれば CNAME が自動追加される。外部 DNS の場合は表示される CNAME 先を登録

### 自動デプロイ

- `main` への push で本番デプロイ
- それ以外のブランチへの push でプレビューデプロイ（`<branch>.<project>.pages.dev`）
- PR ごとにプレビュー URL がコメントされる

### ローカル確認との差分

Cloudflare Pages は `contents/` 配下だけを配信する。ローカルでも `python3 -m http.server 8080 -d contents` で同じ公開ルートを確認できる。追加の設定ファイル（`_redirects` / `_headers` 等）は現状不要。

## ライセンス / クレジット

サーバーの紹介サイト。著作物の流用はしないこと。
