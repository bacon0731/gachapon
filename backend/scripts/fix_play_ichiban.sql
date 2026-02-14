ALTER TABLE draw_records 
  ADD COLUMN IF NOT EXISTS is_last_one BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Mark Last One on prize rows and enforce single Last One per product
ALTER TABLE product_prizes 
  ADD COLUMN IF NOT EXISTS is_last_one BOOLEAN;

UPDATE product_prizes
SET is_last_one = (level ILIKE 'last one' OR level LIKE '%最後賞%')
WHERE is_last_one IS DISTINCT FROM (level ILIKE 'last one' OR level LIKE '%最後賞%');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_last_one_per_product'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uniq_last_one_per_product ON product_prizes(product_id) WHERE is_last_one IS TRUE';
  END IF;
END $$;

-- Unify Last One handling for English and Chinese labels
CREATE OR REPLACE FUNCTION public.play_ichiban(p_product_id BIGINT, p_ticket_numbers INTEGER[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_tokens INTEGER;
  v_product_price INTEGER;
  v_total_cost INTEGER;
  v_prize RECORD;
  v_last_one RECORD;
  v_prizes_drawn JSONB := '[]'::jsonb;
  v_ticket_no INTEGER;
  v_remaining_normal INTEGER;
  v_seed TEXT;
  v_nonce INTEGER;
  v_hash TEXT;
  v_random NUMERIC;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT price, seed INTO v_product_price, v_seed
  FROM products WHERE id = p_product_id;
  IF v_product_price IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- If seed not set, initialize it
  IF v_seed IS NULL THEN
    v_seed := encode(extensions.digest(convert_to(extensions.gen_random_uuid()::text,'UTF8'),'sha256'::text),'hex');
    UPDATE products SET seed = v_seed WHERE id = p_product_id;
  END IF;

  -- If only Last One remains, award it directly
  SELECT COALESCE(SUM(remaining),0) INTO v_remaining_normal
  FROM product_prizes
  WHERE product_id = p_product_id
    AND (level NOT ILIKE 'last one' AND level NOT LIKE '%最後賞%');

  IF v_remaining_normal = 0 THEN
    -- Charge user for requested tickets (bundle)
    v_total_cost := v_product_price * GREATEST(array_length(p_ticket_numbers, 1), 1);
    SELECT tokens INTO v_user_tokens FROM users WHERE id = v_user_id;
    IF v_user_tokens IS NULL OR v_user_tokens < v_total_cost THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
    UPDATE users SET tokens = tokens - v_total_cost WHERE id = v_user_id;

    SELECT COALESCE(MAX(txid_nonce),0)+1 INTO v_nonce
    FROM draw_records WHERE product_id = p_product_id;

    SELECT id, product_id, level, name, image_url
    INTO v_last_one
    FROM product_prizes
    WHERE product_id = p_product_id
      AND (level ILIKE 'last one' OR level LIKE '%最後賞%')
    LIMIT 1;

    IF v_last_one IS NULL THEN
      RAISE EXCEPTION 'No prizes left';
    END IF;

    v_hash := encode(extensions.digest(convert_to(v_seed||':'||v_nonce::text,'UTF8'),'sha256'::text),'hex');
    v_random := random();

    INSERT INTO draw_records (
      user_id, product_id, product_prize_id, ticket_number,
      prize_level, prize_name, txid_seed, txid_nonce, txid_hash, random_value, status,
      image_url, is_last_one
    ) VALUES (
      v_user_id, p_product_id, v_last_one.id, 0,
      v_last_one.level, COALESCE(v_last_one.name, v_last_one.level),
      v_seed, v_nonce, v_hash, v_random, 'in_warehouse',
      COALESCE(v_last_one.image_url, (SELECT image_url FROM products WHERE id = p_product_id)), TRUE
    );

    UPDATE products SET remaining = 0 WHERE id = p_product_id;
    UPDATE product_prizes SET remaining = 0 WHERE id = v_last_one.id;

    v_prizes_drawn := v_prizes_drawn || jsonb_build_object(
      'grade', v_last_one.level,
      'name', v_last_one.name,
      'image_url', v_last_one.image_url,
      'ticket_number', 0,
      'is_last_one', true
    );

    RETURN v_prizes_drawn;
  END IF;

  -- Validate tickets
  IF p_ticket_numbers IS NULL OR array_length(p_ticket_numbers, 1) = 0 THEN
    RAISE EXCEPTION 'No tickets selected';
  END IF;

  -- Charge user
  v_total_cost := v_product_price * array_length(p_ticket_numbers, 1);
  SELECT tokens INTO v_user_tokens FROM users WHERE id = v_user_id;
  IF v_user_tokens IS NULL OR v_user_tokens < v_total_cost THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  UPDATE users SET tokens = tokens - v_total_cost WHERE id = v_user_id;

  -- Start nonce
  SELECT COALESCE(MAX(txid_nonce),0)+1 INTO v_nonce
  FROM draw_records WHERE product_id = p_product_id;

  -- Draw tickets (exclude Last One)
  FOREACH v_ticket_no IN ARRAY p_ticket_numbers LOOP
    SELECT id, product_id, level, name, image_url
    INTO v_prize
    FROM product_prizes
    WHERE product_id = p_product_id
      AND remaining > 0
      AND (level NOT ILIKE 'last one' AND level NOT LIKE '%最後賞%')
    ORDER BY random() * COALESCE(probability, 1) DESC
    LIMIT 1;

    IF v_prize IS NULL THEN
      RAISE EXCEPTION 'No prizes left';
    END IF;

    UPDATE product_prizes SET remaining = remaining - 1 WHERE id = v_prize.id;
    UPDATE products SET remaining = GREATEST(remaining - 1, 0) WHERE id = p_product_id;

    v_hash := encode(extensions.digest(convert_to(v_seed||':'||v_nonce::text,'UTF8'),'sha256'::text),'hex');
    v_random := random();

    INSERT INTO draw_records (
      user_id, product_id, product_prize_id, ticket_number,
      prize_level, prize_name, txid_seed, txid_nonce, txid_hash, random_value, status,
      image_url, is_last_one
    ) VALUES (
      v_user_id, p_product_id, v_prize.id, v_ticket_no,
      v_prize.level, COALESCE(v_prize.name, v_prize.level),
      v_seed, v_nonce, v_hash, v_random, 'in_warehouse',
      COALESCE(v_prize.image_url, (SELECT image_url FROM products WHERE id = p_product_id)), FALSE
    );

    v_prizes_drawn := v_prizes_drawn || jsonb_build_object(
      'grade', v_prize.level,
      'name', v_prize.name,
      'image_url', v_prize.image_url,
      'ticket_number', v_ticket_no,
      'is_last_one', false
    );

    v_nonce := v_nonce + 1;
  END LOOP;

  -- After draws, if normal prizes are now 0, award Last One once
  SELECT COALESCE(SUM(remaining),0) INTO v_remaining_normal
  FROM product_prizes
  WHERE product_id = p_product_id
    AND (level NOT ILIKE 'last one' AND level NOT LIKE '%最後賞%');

  IF v_remaining_normal = 0 THEN
    SELECT id, product_id, level, name, image_url
    INTO v_last_one
    FROM product_prizes
    WHERE product_id = p_product_id
      AND (level ILIKE 'last one' OR level LIKE '%最後賞%')
    LIMIT 1;

    IF v_last_one IS NOT NULL THEN
      v_hash := encode(extensions.digest(convert_to(v_seed||':'||v_nonce::text,'UTF8'),'sha256'::text),'hex');
      v_random := random();

      INSERT INTO draw_records (
        user_id, product_id, product_prize_id, ticket_number,
        prize_level, prize_name, txid_seed, txid_nonce, txid_hash, random_value, status,
        image_url, is_last_one
      ) VALUES (
        v_user_id, p_product_id, v_last_one.id, 0,
        v_last_one.level, COALESCE(v_last_one.name, v_last_one.level),
        v_seed, v_nonce, v_hash, v_random, 'in_warehouse',
        COALESCE(v_last_one.image_url, (SELECT image_url FROM products WHERE id = p_product_id)), TRUE
      );

      UPDATE products SET remaining = 0 WHERE id = p_product_id;

      v_prizes_drawn := v_prizes_drawn || jsonb_build_object(
        'grade', v_last_one.level,
        'name', v_last_one.name,
        'image_url', v_last_one.image_url,
        'ticket_number', 0,
        'is_last_one', true
      );
    END IF;
  END IF;

  RETURN v_prizes_drawn;
END;
$$;
