-- Atomically move one owned shopping item into the caller's active inventory.
create or replace function public.co_purchase_shopping_item(p_shopping_item_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_shopping public.shopping_items%rowtype;
  v_pantry public.pantry_items%rowtype;
  v_pantry_id uuid;
  v_quantity numeric;
  v_category text;
  v_display_name text;
begin
  if v_owner_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- The RLS policy limits visibility to the caller's rows. The explicit owner
  -- predicate keeps the ownership check clear and prevents trusting the client.
  select * into v_shopping
  from public.shopping_items
  where id = p_shopping_item_id and owner_id = v_owner_id
  for update;

  if not found then
    raise exception 'Shopping item not found' using errcode = 'P0002';
  end if;

  if v_shopping.purchased then
    return jsonb_build_object('already_purchased', true);
  end if;

  -- Serialize this key even when no matching pantry row exists yet. All calls
  -- through this RPC for the same owner/concept/unit acquire the same lock.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_owner_id::text || chr(31) || v_shopping.concept_id || chr(31) || v_shopping.unit,
      0
    )
  );

  select * into v_pantry
  from public.pantry_items
  where owner_id = v_owner_id
    and concept_id = v_shopping.concept_id
    and unit = v_shopping.unit
    and status = 'active'
  order by added_at desc
  limit 1
  for update;

  if found then
    -- Null means untracked. Preserve it only when both sides are null.
    v_quantity := case
      when v_pantry.quantity is null and v_shopping.quantity is null then null
      else coalesce(v_pantry.quantity, 0) + coalesce(v_shopping.quantity, 0)
    end;

    update public.pantry_items
    set quantity = v_quantity,
        updated_at = pg_catalog.now()
    where id = v_pantry.id
    returning id into v_pantry_id;
  else
    -- Keep this catalog snapshot in sync with src/lib/data.ts. Postgres has no
    -- ingredient catalog table; use the concept metadata when known and retain
    -- the shopping row values for custom concepts.
    select concept.display_name, concept.category
      into v_display_name, v_category
    from (values
      ('lemon', 'Lemon', 'fruit'),
      ('lime', 'Lime', 'fruit'),
      ('avocado', 'Avocado', 'fruit'),
      ('apple', 'Apple', 'fruit'),
      ('banana', 'Banana', 'fruit'),
      ('orange', 'Orange', 'fruit'),
      ('berries', 'Berries', 'fruit'),
      ('tomato', 'Tomato', 'vegetables'),
      ('onion', 'Onion', 'vegetables'),
      ('garlic', 'Garlic', 'vegetables'),
      ('carrot', 'Carrot', 'vegetables'),
      ('potato', 'Potato', 'vegetables'),
      ('bell-pepper', 'Bell Pepper', 'vegetables'),
      ('spinach', 'Spinach', 'vegetables'),
      ('mushroom', 'Mushroom', 'vegetables'),
      ('broccoli', 'Broccoli', 'vegetables'),
      ('cauliflower', 'Cauliflower', 'vegetables'),
      ('lettuce', 'Lettuce', 'vegetables'),
      ('cucumber', 'Cucumber', 'vegetables'),
      ('zucchini', 'Zucchini', 'vegetables'),
      ('eggplant', 'Eggplant', 'vegetables'),
      ('celery', 'Celery', 'vegetables'),
      ('peas', 'Peas', 'vegetables'),
      ('ginger', 'Ginger', 'vegetables'),
      ('chili', 'Chili', 'vegetables'),
      ('parsley', 'Parsley', 'spices-herbs'),
      ('cilantro', 'Cilantro', 'spices-herbs'),
      ('basil', 'Basil', 'spices-herbs'),
      ('thyme', 'Thyme', 'spices-herbs'),
      ('oregano', 'Oregano', 'spices-herbs'),
      ('rosemary', 'Rosemary', 'spices-herbs'),
      ('mint', 'Mint', 'spices-herbs'),
      ('milk', 'Milk', 'dairy'),
      ('butter', 'Butter', 'dairy'),
      ('eggs', 'Eggs', 'dairy'),
      ('yogurt', 'Yogurt', 'dairy'),
      ('cream', 'Cream', 'dairy'),
      ('cheese', 'Cheese', 'dairy'),
      ('mozzarella', 'Mozzarella', 'dairy'),
      ('parmesan', 'Parmesan', 'dairy'),
      ('feta', 'Feta', 'dairy'),
      ('cream-cheese', 'Cream Cheese', 'dairy'),
      ('chicken', 'Chicken', 'meat-fish'),
      ('beef', 'Beef', 'meat-fish'),
      ('pork', 'Pork', 'meat-fish'),
      ('bacon', 'Bacon', 'meat-fish'),
      ('ham', 'Ham', 'meat-fish'),
      ('sausage', 'Sausage', 'meat-fish'),
      ('fish', 'Fish', 'meat-fish'),
      ('salmon', 'Salmon', 'meat-fish'),
      ('shrimp', 'Shrimp', 'meat-fish'),
      ('tuna', 'Tuna', 'meat-fish'),
      ('pasta', 'Pasta', 'pantry'),
      ('rice', 'Rice', 'pantry'),
      ('noodles', 'Noodles', 'pantry'),
      ('bread', 'Bread', 'pantry'),
      ('tortilla', 'Tortilla', 'pantry'),
      ('chickpeas', 'Chickpeas', 'pantry'),
      ('lentils', 'Lentils', 'pantry'),
      ('beans', 'Beans', 'pantry'),
      ('coconut-milk', 'Coconut Milk', 'pantry'),
      ('canned-tomatoes', 'Canned Tomatoes', 'pantry'),
      ('olives', 'Olives', 'pantry'),
      ('oats', 'Oats', 'pantry'),
      ('nuts', 'Nuts', 'pantry'),
      ('pita', 'Pita Bread', 'pantry'),
      ('ravioli', 'Ravioli', 'pantry'),
      ('olive-oil', 'Olive Oil', 'sauces-condiments'),
      ('vegetable-oil', 'Vegetable Oil', 'sauces-condiments'),
      ('soy-sauce', 'Soy Sauce', 'sauces-condiments'),
      ('vinegar', 'Vinegar', 'sauces-condiments'),
      ('balsamic-vinegar', 'Balsamic Vinegar', 'sauces-condiments'),
      ('tomato-sauce', 'Tomato Sauce', 'sauces-condiments'),
      ('tomato-paste', 'Tomato Paste', 'sauces-condiments'),
      ('pesto', 'Pesto', 'sauces-condiments'),
      ('mustard', 'Mustard', 'sauces-condiments'),
      ('ketchup', 'Ketchup', 'sauces-condiments'),
      ('mayonnaise', 'Mayonnaise', 'sauces-condiments'),
      ('honey', 'Honey', 'sauces-condiments'),
      ('jam', 'Jam', 'sauces-condiments'),
      ('peanut-butter', 'Peanut Butter', 'sauces-condiments'),
      ('sesame-oil', 'Sesame Oil', 'sauces-condiments'),
      ('fish-sauce', 'Fish Sauce', 'sauces-condiments'),
      ('rice-vinegar', 'Rice Vinegar', 'sauces-condiments'),
      ('stock', 'Stock', 'sauces-condiments'),
      ('salsa', 'Salsa', 'sauces-condiments'),
      ('salt', 'Salt', 'spices-herbs'),
      ('black-pepper', 'Black Pepper', 'spices-herbs'),
      ('cumin', 'Cumin', 'spices-herbs'),
      ('paprika', 'Paprika', 'spices-herbs'),
      ('curry-powder', 'Curry Powder', 'spices-herbs'),
      ('turmeric', 'Turmeric', 'spices-herbs'),
      ('cinnamon', 'Cinnamon', 'spices-herbs'),
      ('oregano-dried', 'Dried Oregano', 'spices-herbs'),
      ('chili-flakes', 'Chili Flakes', 'spices-herbs'),
      ('garlic-powder', 'Garlic Powder', 'spices-herbs'),
      ('onion-powder', 'Onion Powder', 'spices-herbs'),
      ('bay-leaf', 'Bay Leaf', 'spices-herbs'),
      ('flour', 'Flour', 'baking'),
      ('sugar', 'Sugar', 'baking'),
      ('brown-sugar', 'Brown Sugar', 'baking'),
      ('baking-powder', 'Baking Powder', 'baking'),
      ('baking-soda', 'Baking Soda', 'baking'),
      ('vanilla', 'Vanilla Extract', 'baking'),
      ('chocolate', 'Chocolate', 'baking'),
      ('yeast', 'Yeast', 'baking'),
      ('water', 'Water', 'drinks'),
      ('juice', 'Juice', 'drinks'),
      ('coffee', 'Coffee', 'drinks'),
      ('tea', 'Tea', 'drinks'),
      ('chamomile', 'Chamomile Tea', 'drinks'),
      ('wine', 'Wine', 'drinks'),
      ('beer', 'Beer', 'drinks'),
      ('soda', 'Soda', 'drinks'),
      ('cereal', 'Cereal', 'breakfast-snacks'),
      ('biscuits', 'Biscuits', 'breakfast-snacks'),
      ('chocolate-bar', 'Chocolate Bar', 'breakfast-snacks'),
      ('ice-cream', 'Ice Cream', 'breakfast-snacks'),
      ('chocolate-spread', 'Chocolate Spread', 'breakfast-snacks'),
      ('sweets', 'Sweets', 'breakfast-snacks'),
      ('crisps', 'Crisps', 'snacks'),
      ('crackers', 'Crackers', 'snacks'),
      ('popcorn', 'Popcorn', 'snacks'),
      ('pretzels', 'Pretzels', 'snacks'),
      ('pizza', 'Pizza', 'pantry'),
      ('ice', 'Ice', 'other'),
    ) as concept(concept_id, display_name, category)
    where concept.concept_id = v_shopping.concept_id;


    -- Concept metadata is optional; retain the values entered on the shopping
    -- item when the concept lookup has no match.
    insert into public.pantry_items (
      owner_id, concept_id, display_name, quantity, unit, category, status
    ) values (
      v_owner_id,
      v_shopping.concept_id,
      coalesce(v_display_name, v_shopping.display_name),
      v_shopping.quantity,
      v_shopping.unit,
      coalesce(v_category, v_shopping.category),
      'active'
    ) returning id into v_pantry_id;
  end if;

  update public.shopping_items
  set purchased = true
  where id = v_shopping.id;

  return jsonb_build_object('already_purchased', false, 'pantry_item_id', v_pantry_id);
end;
$$;

revoke all on function public.co_purchase_shopping_item(uuid) from public, anon;
grant execute on function public.co_purchase_shopping_item(uuid) to authenticated;
