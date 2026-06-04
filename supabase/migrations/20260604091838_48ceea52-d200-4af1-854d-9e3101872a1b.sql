create or replace function public.admin_get_vendor_activity(_vendor_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_auth jsonb;
  v_orders int := 0;
  v_products int := 0;
  v_last_order timestamptz;
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'unauthorized';
  end if;

  select user_id into v_user_id from public.vendors where id = _vendor_id;
  if v_user_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'email', u.email,
    'phone', u.phone,
    'last_sign_in_at', u.last_sign_in_at,
    'created_at', u.created_at,
    'email_confirmed_at', u.email_confirmed_at,
    'raw_user_meta_data', u.raw_user_meta_data,
    'provider', u.raw_app_meta_data->>'provider',
    'providers', u.raw_app_meta_data->'providers'
  ) into v_auth
  from auth.users u where u.id = v_user_id;

  select count(*) into v_products from public.products where vendor_id = _vendor_id;

  select count(*), max(created_at) into v_orders, v_last_order
  from public.order_items where vendor_id = _vendor_id;

  return jsonb_build_object(
    'auth', v_auth,
    'products_count', v_products,
    'orders_count', v_orders,
    'last_order_at', v_last_order
  );
end;
$$;

grant execute on function public.admin_get_vendor_activity(uuid) to authenticated;