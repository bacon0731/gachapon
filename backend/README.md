# 一番賞線上抽獎 - 後台管理系統

這是「一番賞線上抽獎」平台的後台管理系統，用於管理商品、訂單、用戶、抽獎紀錄等。

## 功能模組

- 📊 **儀表板** - 數據統計與概覽
- 🛍️ **商品管理** - 商品列表、新增、編輯、刪除
- 📦 **訂單管理** - 訂單列表、訂單詳情、訂單狀態管理
- 👥 **用戶管理** - 用戶列表、用戶詳情、用戶狀態管理
- 🎲 **抽獎紀錄管理** - 查看所有抽獎紀錄、統計分析
- 💰 **儲值紀錄管理** - 查看儲值紀錄、退款處理
- ⚙️ **配率管理** - 設定商品獎項配率
- 📈 **數據分析** - 銷售報表、用戶分析

## 技術棧

- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **狀態管理**: React Hooks

## 開始使用

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 查看結果。

### 建置生產版本

```bash
npm run build
npm start
```

## 專案結構

```
ichiban-kuji-admin/
├── app/                    # Next.js App Router 頁面
│   ├── login/             # 登入頁面
│   ├── dashboard/         # 儀表板
│   ├── products/          # 商品管理
│   ├── orders/            # 訂單管理
│   ├── users/             # 用戶管理
│   ├── draws/             # 抽獎紀錄管理
│   ├── recharges/         # 儲值紀錄管理
│   └── settings/          # 系統設定
├── components/            # 可重用組件
├── contexts/              # React Context
├── utils/                 # 工具函數
└── public/                # 靜態資源
```
