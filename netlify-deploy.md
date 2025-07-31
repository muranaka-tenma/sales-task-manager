# 🚀 Netlify 5分デプロイガイド

## ✅ 完了したファイル
- `index.html` - メインランディングページ
- `manifest.json` - PWAマニフェスト
- `sw.js` - Service Worker（オフライン対応）
- `enhanced-task-manager.html` - 高機能タスク管理
- `sales-workflow-builder.html` - 営業フロー構築
- `mobile-app.html` - モバイル対応版
- `admin-dashboard.html` - 管理ダッシュボード

## 🌐 デプロイ手順

### 方法1: ドラッグ&ドロップ（最簡単）
1. [netlify.com](https://netlify.com) にアクセス
2. 「Deploy to Netlify」をクリック
3. 「Deploy manually」を選択
4. このフォルダ全体をドラッグ&ドロップ
5. **完了！** 自動でURLが生成されます

### 方法2: CLI使用
```bash
# Netlify CLI インストール
npm install -g netlify-cli

# ログイン
netlify login

# デプロイ
cd /home/muranaka-tenma/顧客管理ツール/frontend/src/services/api/最強タスク管理ツール
netlify deploy --prod --dir .
```

## 📱 特徴
- **PC・スマホ完全対応**
- **オフライン動作可能**（PWA）
- **アプリ風インストール対応**
- **安定したHTTPS接続**
- **カスタムドメイン設定可能**

## 🔧 生成されるURL例
```
https://amazing-task-manager-12345.netlify.app
```

## ⚡ 即座に使用可能な機能
1. **営業タスク管理** - ドラッグ優先度、ファイル添付
2. **フロー構築** - テンプレートベース営業プロセス
3. **モバイル同期** - スマホ・PC間のデータ連携
4. **管理機能** - チーム管理・権限設定

---

**次のアクション**: Netlify.comでアカウント作成後、このフォルダをアップロードするだけで完了です！