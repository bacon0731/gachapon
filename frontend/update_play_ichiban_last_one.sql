CREATE OR REPLACE FUNCTION public.play_ichiban(p_product_id BIGINT, p_ticket_numbers INTEGER[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_product_price INTEGER;
  v_total_cost INTEGER;
  v_prize RECORD;
  v_last_one_prize RECORD;
  v_prizes_drawn JSONB := '[]'::jsonb;
  v_ticket_no INTEGER;
  v_count INTEGER;
  v_normal_qty INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT price INTO v_product_price FROM products WHERE id = p_product_id;
  IF v_product_price IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  v_count := array_length(p_ticket_numbers, 1);
  IF v_count IS NULL OR v_count = 0 THEN
     RAISE EXCEPTION 'No tickets selected';
  END IF;

  FOREACH v_ticket_no IN ARRAY p_ticket_numbers LOOP
    -- Check if ticket is already taken
    IF EXISTS (SELECT 1 FROM draw_history WHERE product_id = p_product_id AND ticket_no = v_ticket_no::text) THEN
        RAISE EXCEPTION 'Ticket % is already sold', v_ticket_no;
    END IF;

    -- Pick a random prize (EXCLUDING Last One)
    SELECT * INTO v_prize FROM prizes 
    WHERE product_id = p_product_id AND quantity > 0 AND grade != 'Last One'
    ORDER BY random() * probability DESC
    LIMIT 1;

    IF v_prize IS NULL THEN
      RAISE EXCEPTION 'No prizes left';
    END IF;

    -- Decrement quantity
    UPDATE prizes SET quantity = quantity - 1 WHERE id = v_prize.id;
    UPDATE products SET remaining_count = remaining_count - 1 WHERE id = p_product_id;

    -- Record in draw_history
    INSERT INTO draw_history (user_id, product_id, prize_id, ticket_no, cost)
    VALUES (v_user_id, p_product_id, v_prize.id, v_ticket_no::text, v_product_price);

    -- Add to result
    v_prizes_drawn := v_prizes_drawn || jsonb_build_object(
      'grade', v_prize.grade,
      'name', v_prize.name,
      'image_url', v_prize.image_url
    );

    -- Check if this was the last normal prize
    -- We calculate sum of REMAINING quantity of normal prizes
    SELECT COALESCE(SUM(quantity), 0) INTO v_normal_qty FROM prizes 
    WHERE product_id = p_product_id AND grade != 'Last One';
    
    -- If no normal prizes left, award Last One
    IF v_normal_qty = 0 THEN
        SELECT * INTO v_last_one_prize FROM prizes 
        WHERE product_id = p_product_id AND grade = 'Last One' AND quantity > 0
        LIMIT 1;

        IF v_last_one_prize IS NOT NULL THEN
            -- Update Last One quantity
            UPDATE prizes SET quantity = 0 WHERE id = v_last_one_prize.id;
            
            -- Force product remaining count to 0 (to ensure product is marked as sold out)
            UPDATE products SET remaining_count = 0 WHERE id = p_product_id;

            -- Record Last One in draw_history
            INSERT INTO draw_history (user_id, product_id, prize_id, ticket_no, cost)
            VALUES (v_user_id, p_product_id, v_last_one_prize.id, 'LAST_ONE', 0);

            -- Add to result
            v_prizes_drawn := v_prizes_drawn || jsonb_build_object(
              'grade', v_last_one_prize.grade,
              'name', v_last_one_prize.name,
              'image_url', v_last_one_prize.image_url,
              'is_last_one', true
            );
        END IF;
    END IF;

  END LOOP;

  RETURN v_prizes_drawn;
END;
$$;
