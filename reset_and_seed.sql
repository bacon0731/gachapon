-- 1. Disable triggers to avoid foreign key checks during truncation
SET session_replication_role = 'replica';

-- 2. Truncate all main tables
TRUNCATE TABLE product_prizes CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE draw_records CASCADE;
TRUNCATE TABLE banners CASCADE;
TRUNCATE TABLE news CASCADE;

-- 3. Re-enable triggers
SET session_replication_role = 'origin';

-- 4. Update product type constraint to include 'custom'
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check CHECK (type IN ('ichiban', 'blindbox', 'gacha', 'custom'));

-- 5. Insert Categories (Operation Themes)
WITH cats AS (
  INSERT INTO categories (name, sort_order, is_active) VALUES 
  ('馬年大促銷', 1, true),
  ('情人節限定', 2, true),
  ('年末出清【限時】', 3, true),
  ('人氣動漫專區', 4, true),
  ('3C 數位大賞', 5, true)
  RETURNING id, name
)
SELECT * INTO TEMP TABLE temp_cats FROM cats;

-- Helper function to get category ID
CREATE OR REPLACE FUNCTION get_cat_id(cat_name text) RETURNS uuid AS $$
  SELECT id FROM temp_cats WHERE name = cat_name LIMIT 1;
$$ LANGUAGE sql;

-- ==========================================
-- PRODUCT 1: Ichiban - One Piece (Anime)
-- ==========================================
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes, 
  distributor, release_year, release_month
) VALUES (
  'ICHIBAN-001', '一番賞 海賊王 未來的島嶼', '人氣動漫專區', get_cat_id('人氣動漫專區'), 350, 'active', true,
  80, 76, '/images/item.png', 'ichiban', ARRAY['A賞', 'B賞', 'Last One'],
  'Bandai', '2025', '03'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, 'A', '蒙其·D·魯夫 模型', '/images/item.png', 2, 2, 2.5 FROM products WHERE product_code = 'ICHIBAN-001' UNION ALL
SELECT id, 'B', '羅羅亞·索隆 模型', '/images/item.png', 2, 2, 2.5 FROM products WHERE product_code = 'ICHIBAN-001' UNION ALL
SELECT id, 'C', '香吉士 模型', '/images/item.png', 2, 1, 2.5 FROM products WHERE product_code = 'ICHIBAN-001' UNION ALL
SELECT id, 'D', '娜美 模型', '/images/item.png', 1, 1, 1.25 FROM products WHERE product_code = 'ICHIBAN-001' UNION ALL
SELECT id, 'E', '大海賊毛巾', '/images/item.png', 23, 20, 28.75 FROM products WHERE product_code = 'ICHIBAN-001' UNION ALL
SELECT id, 'F', '橡膠吊飾', '/images/item.png', 25, 25, 31.25 FROM products WHERE product_code = 'ICHIBAN-001' UNION ALL
SELECT id, 'G', '通緝令資料夾', '/images/item.png', 25, 25, 31.25 FROM products WHERE product_code = 'ICHIBAN-001' UNION ALL
SELECT id, 'Last One', '蒙其·D·魯夫 最後賞異色版', '/images/item.png', 1, 1, 0 FROM products WHERE product_code = 'ICHIBAN-001';

-- ==========================================
-- PRODUCT 2: Ichiban - Dragon Ball (Clearance/Ended)
-- ==========================================
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'ICHIBAN-002', '一番賞 七龍珠 激戰歷史 (已完售)', '年末出清【限時】', get_cat_id('年末出清【限時】'), 300, 'ended', false,
  80, 0, '/images/item.png', 'ichiban', ARRAY['A賞', 'Last One'],
  'Bandai', '2024', '12'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, 'A', '孫悟空 超級賽亞人', '/images/item.png', 2, 0, 2.5 FROM products WHERE product_code = 'ICHIBAN-002' UNION ALL
SELECT id, 'B', '貝吉塔 大猿', '/images/item.png', 2, 0, 2.5 FROM products WHERE product_code = 'ICHIBAN-002' UNION ALL
SELECT id, 'C', '毛巾', '/images/item.png', 30, 0, 37.5 FROM products WHERE product_code = 'ICHIBAN-002' UNION ALL
SELECT id, 'D', '資料夾', '/images/item.png', 46, 0, 57.5 FROM products WHERE product_code = 'ICHIBAN-002' UNION ALL
SELECT id, 'Last One', '神龍 模型', '/images/item.png', 1, 0, 0 FROM products WHERE product_code = 'ICHIBAN-002';

-- ==========================================
-- PRODUCT 3: Ichiban - Naruto (Anime)
-- ==========================================
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'ICHIBAN-003', '一番賞 火影忍者 疾風傳 忍界大戰', '人氣動漫專區', get_cat_id('人氣動漫專區'), 320, 'active', true,
  80, 60, '/images/item.png', 'ichiban', ARRAY['A賞', 'B賞'],
  'Bandai', '2025', '01'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, 'A', '漩渦鳴人 六道仙人模式', '/images/item.png', 2, 1, 2.5 FROM products WHERE product_code = 'ICHIBAN-003' UNION ALL
SELECT id, 'B', '宇智波佐助 輪迴眼', '/images/item.png', 2, 2, 2.5 FROM products WHERE product_code = 'ICHIBAN-003' UNION ALL
SELECT id, 'C', '宇智波鼬', '/images/item.png', 2, 2, 2.5 FROM products WHERE product_code = 'ICHIBAN-003' UNION ALL
SELECT id, 'D', '忍者頭帶', '/images/item.png', 24, 20, 30.0 FROM products WHERE product_code = 'ICHIBAN-003' UNION ALL
SELECT id, 'E', '苦無吊飾', '/images/item.png', 25, 15, 31.25 FROM products WHERE product_code = 'ICHIBAN-003' UNION ALL
SELECT id, 'F', '海報組', '/images/item.png', 25, 20, 31.25 FROM products WHERE product_code = 'ICHIBAN-003' UNION ALL
SELECT id, 'Last One', '旗木卡卡西 須佐能乎', '/images/item.png', 1, 1, 0 FROM products WHERE product_code = 'ICHIBAN-003';

-- ==========================================
-- PRODUCT 4: Ichiban - Demon Slayer (Anime)
-- ==========================================
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'ICHIBAN-004', '一番賞 鬼滅之刃 柱訓練', '人氣動漫專區', get_cat_id('人氣動漫專區'), 300, 'active', true,
  70, 65, '/images/item.png', 'ichiban', ARRAY['A賞', 'C賞'],
  'Banpresto', '2025', '02'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, 'A', '富岡義勇 模型', '/images/item.png', 2, 2, 2.85 FROM products WHERE product_code = 'ICHIBAN-004' UNION ALL
SELECT id, 'B', '蝴蝶忍 模型', '/images/item.png', 2, 2, 2.85 FROM products WHERE product_code = 'ICHIBAN-004' UNION ALL
SELECT id, 'C', '煉獄杏壽郎 模型', '/images/item.png', 2, 1, 2.85 FROM products WHERE product_code = 'ICHIBAN-004' UNION ALL
SELECT id, 'D', '小毛巾', '/images/item.png', 32, 30, 45.71 FROM products WHERE product_code = 'ICHIBAN-004' UNION ALL
SELECT id, 'E', '橡膠吊飾', '/images/item.png', 32, 30, 45.71 FROM products WHERE product_code = 'ICHIBAN-004' UNION ALL
SELECT id, 'Last One', '不死川實彌 模型', '/images/item.png', 1, 1, 0 FROM products WHERE product_code = 'ICHIBAN-004';

-- ==========================================
-- PRODUCT 5: Ichiban - Spy x Family (Valentine)
-- ==========================================
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'ICHIBAN-005', '一番賞 SPY×FAMILY 間諜家家酒 甜蜜約會', '情人節限定', get_cat_id('情人節限定'), 330, 'active', true,
  66, 60, '/images/item.png', 'ichiban', ARRAY['A賞', 'Last One'],
  'Bandai', '2025', '02'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, 'A', '安妮亞 & 彭德 模型', '/images/item.png', 2, 2, 3.03 FROM products WHERE product_code = 'ICHIBAN-005' UNION ALL
SELECT id, 'B', '約兒 抱枕', '/images/item.png', 2, 2, 3.03 FROM products WHERE product_code = 'ICHIBAN-005' UNION ALL
SELECT id, 'C', '洛伊德 馬克杯', '/images/item.png', 4, 4, 6.06 FROM products WHERE product_code = 'ICHIBAN-005' UNION ALL
SELECT id, 'D', '壓克力立牌', '/images/item.png', 28, 25, 42.42 FROM products WHERE product_code = 'ICHIBAN-005' UNION ALL
SELECT id, 'E', '貼紙組', '/images/item.png', 30, 27, 45.45 FROM products WHERE product_code = 'ICHIBAN-005' UNION ALL
SELECT id, 'Last One', '安妮亞 表情包模型', '/images/item.png', 1, 1, 0 FROM products WHERE product_code = 'ICHIBAN-005';

-- ==========================================
-- PRODUCT 6: Ichiban - Evangelion (Horse Year Sale)
-- ==========================================
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'ICHIBAN-006', '一番賞 福音戰士 新劇場版 (馬年特價)', '馬年大促銷', get_cat_id('馬年大促銷'), 280, 'active', false,
  80, 70, '/images/item.png', 'ichiban', ARRAY['A賞', 'B賞'],
  'Bandai', '2025', '01'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, 'A', '初號機 覺醒版', '/images/item.png', 2, 2, 2.5 FROM products WHERE product_code = 'ICHIBAN-006' UNION ALL
SELECT id, 'B', '明日香 駕駛服', '/images/item.png', 2, 2, 2.5 FROM products WHERE product_code = 'ICHIBAN-006' UNION ALL
SELECT id, 'C', '綾波零 駕駛服', '/images/item.png', 2, 1, 2.5 FROM products WHERE product_code = 'ICHIBAN-006' UNION ALL
SELECT id, 'D', '真希波 駕駛服', '/images/item.png', 2, 1, 2.5 FROM products WHERE product_code = 'ICHIBAN-006' UNION ALL
SELECT id, 'E', 'NERV 資料夾', '/images/item.png', 36, 32, 45.0 FROM products WHERE product_code = 'ICHIBAN-006' UNION ALL
SELECT id, 'F', '杯墊', '/images/item.png', 36, 32, 45.0 FROM products WHERE product_code = 'ICHIBAN-006' UNION ALL
SELECT id, 'Last One', '13號機 擬似真化', '/images/item.png', 1, 1, 0 FROM products WHERE product_code = 'ICHIBAN-006';

-- ==========================================
-- PRODUCT 7: Ichiban - Jujutsu Kaisen (Anime)
-- ==========================================
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'ICHIBAN-007', '一番賞 咒術迴戰 澀谷事變', '人氣動漫專區', get_cat_id('人氣動漫專區'), 310, 'active', true,
  75, 75, '/images/item.png', 'ichiban', ARRAY['A賞', 'B賞'],
  'Banpresto', '2025', '03'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, 'A', '虎杖悠仁 黑閃', '/images/item.png', 3, 3, 4.0 FROM products WHERE product_code = 'ICHIBAN-007' UNION ALL
SELECT id, 'B', '五條悟 獄門疆', '/images/item.png', 2, 2, 2.67 FROM products WHERE product_code = 'ICHIBAN-007' UNION ALL
SELECT id, 'C', '伏黑惠 鵺', '/images/item.png', 2, 2, 2.67 FROM products WHERE product_code = 'ICHIBAN-007' UNION ALL
SELECT id, 'D', '釘崎野薔薇', '/images/item.png', 2, 2, 2.67 FROM products WHERE product_code = 'ICHIBAN-007' UNION ALL
SELECT id, 'E', '透明海報', '/images/item.png', 30, 30, 40.0 FROM products WHERE product_code = 'ICHIBAN-007' UNION ALL
SELECT id, 'F', '金屬吊飾', '/images/item.png', 36, 36, 48.0 FROM products WHERE product_code = 'ICHIBAN-007' UNION ALL
SELECT id, 'Last One', '宿儺 領域展開', '/images/item.png', 1, 1, 0 FROM products WHERE product_code = 'ICHIBAN-007';

-- ==========================================
-- PRODUCT 8: Ichiban - Sanrio (Valentine)
-- ==========================================
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'ICHIBAN-008', '一番賞 三麗鷗角色 巧克力派對', '情人節限定', get_cat_id('情人節限定'), 250, 'active', false,
  60, 58, '/images/item.png', 'ichiban', ARRAY['1等', '2等'],
  'Sanrio', '2025', '02'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, '1等', 'Hello Kitty 巧克力玩偶', '/images/item.png', 2, 2, 3.33 FROM products WHERE product_code = 'ICHIBAN-008' UNION ALL
SELECT id, '2等', '美樂蒂 抱枕', '/images/item.png', 2, 2, 3.33 FROM products WHERE product_code = 'ICHIBAN-008' UNION ALL
SELECT id, '3等', '酷洛米 化妝包', '/images/item.png', 4, 4, 6.67 FROM products WHERE product_code = 'ICHIBAN-008' UNION ALL
SELECT id, '4等', '大耳狗 馬克杯', '/images/item.png', 10, 10, 16.67 FROM products WHERE product_code = 'ICHIBAN-008' UNION ALL
SELECT id, '5等', '手帕', '/images/item.png', 20, 20, 33.33 FROM products WHERE product_code = 'ICHIBAN-008' UNION ALL
SELECT id, '6等', '貼紙', '/images/item.png', 22, 20, 36.67 FROM products WHERE product_code = 'ICHIBAN-008' UNION ALL
SELECT id, 'Last One', '布丁狗 巨型玩偶', '/images/item.png', 1, 1, 0 FROM products WHERE product_code = 'ICHIBAN-008';

-- ==========================================
-- PRODUCT 9: Ichiban - Gundam (Horse Year Sale)
-- ==========================================
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'ICHIBAN-009', '一番賞 機動戰士鋼彈 SEED FREEDOM', '馬年大促銷', get_cat_id('馬年大促銷'), 360, 'active', true,
  70, 68, '/images/item.png', 'ichiban', ARRAY['A賞', 'B賞'],
  'Bandai', '2025', '01'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, 'A', '攻擊自由鋼彈 極', '/images/item.png', 2, 2, 2.85 FROM products WHERE product_code = 'ICHIBAN-009' UNION ALL
SELECT id, 'B', '無限正義鋼彈貳式', '/images/item.png', 2, 2, 2.85 FROM products WHERE product_code = 'ICHIBAN-009' UNION ALL
SELECT id, 'C', '拉克絲·克萊因 模型', '/images/item.png', 2, 1, 2.85 FROM products WHERE product_code = 'ICHIBAN-009' UNION ALL
SELECT id, 'D', '壓克力立牌', '/images/item.png', 20, 20, 28.57 FROM products WHERE product_code = 'ICHIBAN-009' UNION ALL
SELECT id, 'E', '毛巾', '/images/item.png', 22, 21, 31.43 FROM products WHERE product_code = 'ICHIBAN-009' UNION ALL
SELECT id, 'F', '資料夾', '/images/item.png', 22, 22, 31.43 FROM products WHERE product_code = 'ICHIBAN-009' UNION ALL
SELECT id, 'Last One', '攻擊自由鋼彈 極 金屬色版', '/images/item.png', 1, 1, 0 FROM products WHERE product_code = 'ICHIBAN-009';

-- ==========================================
-- PRODUCT 10: Ichiban - My Hero Academia (Clearance)
-- ==========================================
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'ICHIBAN-010', '一番賞 我的英雄學院 意志 (已完售)', '年末出清【限時】', get_cat_id('年末出清【限時】'), 280, 'ended', false,
  80, 0, '/images/item.png', 'ichiban', ARRAY['A賞', 'B賞'],
  'Banpresto', '2024', '11'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, 'A', '綠谷出久', '/images/item.png', 2, 0, 2.5 FROM products WHERE product_code = 'ICHIBAN-010' UNION ALL
SELECT id, 'B', '爆豪勝己', '/images/item.png', 2, 0, 2.5 FROM products WHERE product_code = 'ICHIBAN-010' UNION ALL
SELECT id, 'C', '轟焦凍', '/images/item.png', 2, 0, 2.5 FROM products WHERE product_code = 'ICHIBAN-010' UNION ALL
SELECT id, 'D', '毛巾', '/images/item.png', 30, 0, 37.5 FROM products WHERE product_code = 'ICHIBAN-010' UNION ALL
SELECT id, 'E', '吊飾', '/images/item.png', 44, 0, 55.0 FROM products WHERE product_code = 'ICHIBAN-010' UNION ALL
SELECT id, 'Last One', '歐爾麥特', '/images/item.png', 1, 0, 0 FROM products WHERE product_code = 'ICHIBAN-010';

-- ==========================================
-- PRODUCT 11: Ichiban - Hololive (Anime)
-- ==========================================
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'ICHIBAN-011', '一番賞 Hololive Production Vol.4', '人氣動漫專區', get_cat_id('人氣動漫專區'), 380, 'active', true,
  70, 65, '/images/item.png', 'ichiban', ARRAY['A賞', 'B賞', 'C賞'],
  'Bandai', '2025', '03'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, 'A', '兔田佩克拉 掛軸', '/images/item.png', 2, 2, 2.85 FROM products WHERE product_code = 'ICHIBAN-011' UNION ALL
SELECT id, 'B', '寶鐘瑪琳 掛軸', '/images/item.png', 2, 2, 2.85 FROM products WHERE product_code = 'ICHIBAN-011' UNION ALL
SELECT id, 'C', '白銀諾艾爾 掛軸', '/images/item.png', 2, 1, 2.85 FROM products WHERE product_code = 'ICHIBAN-011' UNION ALL
SELECT id, 'D', '壓克力立牌', '/images/item.png', 20, 20, 28.57 FROM products WHERE product_code = 'ICHIBAN-011' UNION ALL
SELECT id, 'E', '色紙', '/images/item.png', 22, 20, 31.43 FROM products WHERE product_code = 'ICHIBAN-011' UNION ALL
SELECT id, 'F', '橡膠吊飾', '/images/item.png', 22, 20, 31.43 FROM products WHERE product_code = 'ICHIBAN-011' UNION ALL
SELECT id, 'Last One', 'hololive 插畫冊', '/images/item.png', 1, 1, 0 FROM products WHERE product_code = 'ICHIBAN-011';


-- ==========================================
-- OTHER PRODUCTS (Custom, Blindbox, Gacha)
-- ==========================================

-- Custom: 3C Digital
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'CUSTOM-001', '史萊姆自製賞：3C大禮包', '3C 數位大賞', get_cat_id('3C 數位大賞'), 500, 'active', true,
  50, 48, '/images/item.png', 'custom', ARRAY['SP賞', 'A賞'],
  'Slime Inc.', '2025', '01'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, 'SP', 'iPhone 16 Pro Max', '/images/item.png', 1, 1, 2.0 FROM products WHERE product_code = 'CUSTOM-001' UNION ALL
SELECT id, 'A', 'iPad Air 5', '/images/item.png', 1, 1, 2.0 FROM products WHERE product_code = 'CUSTOM-001' UNION ALL
SELECT id, 'B', 'AirPods Pro 2', '/images/item.png', 2, 2, 4.0 FROM products WHERE product_code = 'CUSTOM-001' UNION ALL
SELECT id, 'C', 'HomePod mini', '/images/item.png', 4, 3, 8.0 FROM products WHERE product_code = 'CUSTOM-001' UNION ALL
SELECT id, 'D', '7-11 禮券 500元', '/images/item.png', 10, 10, 20.0 FROM products WHERE product_code = 'CUSTOM-001' UNION ALL
SELECT id, 'E', '7-11 禮券 100元', '/images/item.png', 32, 31, 64.0 FROM products WHERE product_code = 'CUSTOM-001';

-- Blindbox: Molly (Horse Year Sale)
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'BLIND-001', 'POP MART Molly 幻想流浪記', '馬年大促銷', get_cat_id('馬年大促銷'), 380, 'active', true,
  12, 10, '/images/item.png', 'blindbox', NULL,
  'POP MART', '2025', '02'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, '隱藏款', '流浪詩人 Molly', '/images/item.png', 1, 1, 8.33 FROM products WHERE product_code = 'BLIND-001' UNION ALL
SELECT id, '常規款', 'Molly 基礎款', '/images/item.png', 11, 9, 91.67 FROM products WHERE product_code = 'BLIND-001';

-- Blindbox: Labubu (Clearance)
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'BLIND-002', 'Labubu 精靈藝術系列 (已完售)', '年末出清【限時】', get_cat_id('年末出清【限時】'), 400, 'ended', false,
  12, 0, '/images/item.png', 'blindbox', NULL,
  'POP MART', '2024', '11'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, '隱藏款', '梵高 Labubu', '/images/item.png', 1, 0, 8.33 FROM products WHERE product_code = 'BLIND-002' UNION ALL
SELECT id, '常規款', 'Labubu 藝術家', '/images/item.png', 11, 0, 91.67 FROM products WHERE product_code = 'BLIND-002';

-- Gacha: Chiikawa (Valentine)
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'GACHA-001', '吉伊卡哇 睡衣派對吊飾', '情人節限定', get_cat_id('情人節限定'), 150, 'active', true,
  50, 45, '/images/item.png', 'gacha', NULL,
  'Kitan Club', '2025', '03'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, '常規', '吉伊卡哇', '/images/item.png', 10, 9, 20.0 FROM products WHERE product_code = 'GACHA-001' UNION ALL
SELECT id, '常規', '小八貓', '/images/item.png', 10, 9, 20.0 FROM products WHERE product_code = 'GACHA-001' UNION ALL
SELECT id, '常規', '兔兔', '/images/item.png', 10, 9, 20.0 FROM products WHERE product_code = 'GACHA-001' UNION ALL
SELECT id, '常規', '小桃鼠', '/images/item.png', 10, 9, 20.0 FROM products WHERE product_code = 'GACHA-001' UNION ALL
SELECT id, '常規', '栗子饅頭', '/images/item.png', 10, 9, 20.0 FROM products WHERE product_code = 'GACHA-001';

-- Gacha: Pokemon (Horse Year Sale)
INSERT INTO products (
  product_code, name, category, category_id, price, status, is_hot, 
  total_count, remaining, image_url, type, major_prizes,
  distributor, release_year, release_month
) VALUES (
  'GACHA-002', '寶可夢 睡眠公仔 第5彈', '馬年大促銷', get_cat_id('馬年大促銷'), 120, 'active', false,
  60, 55, '/images/item.png', 'gacha', NULL,
  'Takara Tomy', '2025', '01'
);

INSERT INTO product_prizes (product_id, level, name, image_url, total, remaining, probability) 
SELECT id, '常規', '皮卡丘', '/images/item.png', 12, 11, 20.0 FROM products WHERE product_code = 'GACHA-002' UNION ALL
SELECT id, '常規', '卡比獸', '/images/item.png', 12, 11, 20.0 FROM products WHERE product_code = 'GACHA-002' UNION ALL
SELECT id, '常規', '呆呆獸', '/images/item.png', 12, 11, 20.0 FROM products WHERE product_code = 'GACHA-002' UNION ALL
SELECT id, '常規', '可達鴨', '/images/item.png', 12, 11, 20.0 FROM products WHERE product_code = 'GACHA-002' UNION ALL
SELECT id, '常規', '伊布', '/images/item.png', 12, 11, 20.0 FROM products WHERE product_code = 'GACHA-002';


-- ==========================================
-- Banners
-- ==========================================
INSERT INTO banners (name, image_url, link_url, sort_order, is_active) VALUES
('新春特輯：海賊王一番賞', '/images/banner.png', '/shop', 1, true),
('自製賞大放送：iPhone 16等你拿', '/images/banner.png', '/shop', 2, true),
('盲盒新品上市', '/images/banner.png', '/shop', 3, true);

-- ==========================================
-- News
-- ==========================================
INSERT INTO news (id, title, content, category, image_url, is_active, published_at) VALUES
(uuid_generate_v4(), '【公告】系統維護通知', '我們將於 2025/02/14 進行系統維護，預計時間為 02:00 - 04:00。', '系統公告', '/images/banner.png', true, NOW()),
(uuid_generate_v4(), '【新品】海賊王一番賞到貨', '最新的一番賞 海賊王 激戰的軌跡 已經到貨啦！趕快來抽！', '新品情報', '/images/banner.png', true, NOW() - INTERVAL '1 day'),
(uuid_generate_v4(), '【活動】滿千送百活動開跑', '即日起至月底，儲值滿 1000 元即送 100 點數！', '優惠活動', '/images/banner.png', true, NOW() - INTERVAL '2 days');
