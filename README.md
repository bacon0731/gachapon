# 線上一番賞抽獎網站

這是一個使用 Next.js 14 和 Tailwind CSS 建立的響應式一番賞抽獎網站，參考了 slimetoy.com.tw 的佈局與配色風格。

## 功能特色

- 🎨 **現代化設計**：採用鮮豔的配色方案（橙紅、天藍等），符合潮玩網站風格
- 📱 **完全響應式**：支援手機、平板、桌面等各種裝置
- 🎁 **商品展示**：精美的商品卡片展示，包含熱賣標籤、庫存提醒
- 🎰 **抽獎功能**：模擬一番賞抽獎體驗
- 🏆 **賞項列表**：清晰的賞項分級展示（A賞、B賞、C賞等）
- 🎯 **商品篩選**：支援按熱門、價格等條件篩選和排序
- 👤 **使用者系統**：完整的登入、註冊、忘記密碼功能
- 📄 **完整頁面**：包含隱私政策、服務條款、常見問題、聯絡我們等頁面
- 🚫 **錯誤處理**：404 缺省頁面

## 技術棧

- **Next.js 14** - React 框架（使用 App Router）
- **TypeScript** - 型別安全
- **Tailwind CSS** - 實用優先的 CSS 框架
- **Next/Image** - 優化的圖片載入

## 開始使用

### 安裝依賴

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 執行開發伺服器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看網站。

### 建置生產版本

```bash
npm run build
npm start
```

## 專案結構

```
ichiban-kuji-online/
├── app/                    # Next.js App Router 頁面
│   ├── layout.tsx         # 根佈局（包含 Navbar 和 Footer）
│   ├── page.tsx           # 首頁
│   ├── globals.css        # 全域樣式
│   ├── not-found.tsx     # 404 缺省頁面
│   ├── about/             # 關於我們
│   │   └── page.tsx
│   ├── contact/           # 聯絡我們
│   │   └── page.tsx
│   ├── faq/               # 常見問題
│   │   └── page.tsx
│   ├── login/             # 登入
│   │   └── page.tsx
│   ├── register/          # 註冊
│   │   └── page.tsx
│   ├── forgot-password/   # 忘記密碼
│   │   └── page.tsx
│   ├── privacy/           # 隱私政策
│   │   └── page.tsx
│   ├── terms/             # 服務條款
│   │   └── page.tsx
│   └── shop/              # 商品相關頁面
│       ├── page.tsx       # 商品列表頁
│       └── [id]/          # 動態路由
│           └── page.tsx   # 商品詳情頁
├── components/            # React 組件
│   ├── Navbar.tsx        # 導航列
│   ├── Footer.tsx        # 頁尾
│   ├── HeroBanner.tsx    # 首頁輪播橫幅
│   ├── ProductCard.tsx   # 商品卡片
│   └── PrizeList.tsx     # 賞項列表
├── tailwind.config.js    # Tailwind CSS 配置
├── tsconfig.json         # TypeScript 配置
└── package.json          # 專案依賴
```

## 配色方案

專案使用自訂的 Tailwind 配色：

- **Primary（主色）**: `#FF6F61` - 溫暖橙紅，用於主要按鈕和強調
- **Accent（輔助色）**: `#00A8E8` - 清新天藍，用於次要操作
- **Neutral（中性色）**: 灰色階，用於文字和背景

## 響應式斷點

- `sm`: 640px 以上（手機橫向）
- `md`: 768px 以上（平板）
- `lg`: 1024px 以上（桌面）
- `xl`: 1280px 以上（大桌面）

## 未來改進

- [ ] 整合後端 API
- [ ] 使用者認證系統
- [ ] 購物車功能
- [ ] 付款整合
- [ ] 管理後台
- [ ] 更豐富的抽獎動畫效果
- [ ] 庫存管理系統

## 授權

MIT License

