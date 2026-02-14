-- Update play_gacha to handle Last One prize logic correctly
-- 1. Exclude Last One from normal prize pool
-- 2. Award Last One prize when all items are sold out

CREATE OR REPLACE FUNCTION public.play_gacha(p_product_id BIGINT, p_count INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_product_price INTEGER;
  v_total_cost INTEGER;
  v_user_tokens INTEGER;
  v_product_total_count INTEGER;
  v_ticket_numbers INTEGER[];
  v_prize RECORD;
  v_last_one_prize RECORD;
  v_prizes_drawn JSONB := '[]'::jsonb;
  v_ticket_no INTEGER;
  v_seed TEXT;
  v_nonce INTEGER;
  v_hash TEXT;
  v_random NUMERIC;
  v_product_remaining INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT price, total_count, remaining INTO v_product_price, v_product_total_count, v_product_remaining
  FROM products WHERE id = p_product_id;
  
  IF v_product_price IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  v_total_cost := v_product_price * p_count;

  -- Check balance
  SELECT tokens INTO v_user_tokens FROM users WHERE id = v_user_id;
  IF v_user_tokens IS NULL OR v_user_tokens < v_total_cost THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Find available ticket numbers
  -- We select p_count available numbers randomly
  SELECT ARRAY(
    SELECT t.num
    FROM generate_series(1, v_product_total_count) AS t(num)
    WHERE NOT EXISTS (
      SELECT 1 FROM draw_records 
      WHERE product_id = p_product_id AND ticket_number = t.num
    )
    ORDER BY random()
    LIMIT p_count
  ) INTO v_ticket_numbers;

  IF array_length(v_ticket_numbers, 1) < p_count OR v_ticket_numbers IS NULL THEN
    RAISE EXCEPTION 'Not enough stock remaining';
  END IF;

  -- Deduct balance
  UPDATE users SET tokens = tokens - v_total_cost WHERE id = v_user_id;

  -- Process draws
  FOREACH v_ticket_no IN ARRAY v_ticket_numbers LOOP
    -- Pick random prize based on probability
    -- EXCLUDING Last One prizes
    SELECT * INTO v_prize FROM product_prizes 
    WHERE product_id = p_product_id 
      AND remaining > 0 
      AND level NOT IN ('Last One', 'LAST ONE', '最後賞')
    ORDER BY random() * probability DESC
    LIMIT 1;

    IF v_prize IS NULL THEN
       RAISE EXCEPTION 'No prizes left';
    END IF;

    -- Decrement prize quantity
    UPDATE product_prizes SET remaining = remaining - 1 WHERE id = v_prize.id;
    
    -- Update product remaining
    UPDATE products SET remaining = remaining - 1 
    WHERE id = p_product_id
    RETURNING remaining INTO v_product_remaining;

    -- Generate random seed/hash for provable fairness
    v_seed := md5(random()::text || clock_timestamp()::text);
    v_nonce := floor(random() * 1000000)::integer;
    
    -- Use encode + digest to get clean hex string without \x prefix
    v_hash := encode(digest((v_seed || v_nonce::text)::bytea, 'sha256'), 'hex');
    
    -- Cast hex string to bit(64) for random value generation
    v_random := (('x' || substring(v_hash, 1, 16))::bit(64)::bigint)::numeric / 18446744073709551615.0;

    -- Insert record
    INSERT INTO draw_records (
      user_id, product_id, product_prize_id, ticket_number, prize_level, prize_name, status,
      txid_seed, txid_nonce, txid_hash, random_value, profit_rate
    ) VALUES (
      v_user_id, p_product_id, v_prize.id, v_ticket_no, v_prize.level, v_prize.name, 'in_warehouse',
      v_seed, v_nonce, v_hash, v_random, 1.0
    );

    v_prizes_drawn := v_prizes_drawn || jsonb_build_object(
      'id', v_prize.id,
      'grade', v_prize.level,
      'name', v_prize.name,
      'image_url', v_prize.image_url,
      'ticket_number', v_ticket_no,
      'created_at', now()
    );

    -- Check if this was the last item (product remaining became 0)
    IF v_product_remaining = 0 THEN
       -- Find and award Last One prize
       SELECT * INTO v_last_one_prize FROM product_prizes 
       WHERE product_id = p_product_id 
         AND (level IN ('Last One', 'LAST ONE', '最後賞'))
       LIMIT 1;

       IF v_last_one_prize IS NOT NULL THEN
         -- Insert Last One record (using ticket number 0 or a special indicator)
         -- Also mark the prize as taken (remaining = 0)
         UPDATE product_prizes SET remaining = 0 WHERE id = v_last_one_prize.id;

         v_seed := md5(random()::text || clock_timestamp()::text);
         v_nonce := floor(random() * 1000000)::integer;
         v_hash := encode(digest((v_seed || v_nonce::text)::bytea, 'sha256'), 'hex');
         v_random := (('x' || substring(v_hash, 1, 16))::bit(64)::bigint)::numeric / 18446744073709551615.0;

         INSERT INTO draw_records (
            user_id, product_id, product_prize_id, ticket_number, prize_level, prize_name, status,
            txid_seed, txid_nonce, txid_hash, random_value, profit_rate
          ) VALUES (
            v_user_id, p_product_id, v_last_one_prize.id, 0, v_last_one_prize.level, v_last_one_prize.name, 'in_warehouse',
            v_seed, v_nonce, v_hash, v_random, 1.0
          );

          v_prizes_drawn := v_prizes_drawn || jsonb_build_object(
            'id', v_last_one_prize.id,
            'grade', v_last_one_prize.level,
            'name', v_last_one_prize.name,
            'image_url', v_last_one_prize.image_url,
            'ticket_number', 0,
            'is_last_one', true,
            'created_at', now()
          );
       END IF;
    END IF;

  END LOOP;

  RETURN v_prizes_drawn;
END;
$$;
