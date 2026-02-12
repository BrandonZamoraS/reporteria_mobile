-- Script de diagnóstico para verificar establecimientos y zonas
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Ver user_profile del rutero actual (reemplazar con el email real)
SELECT 
  user_id, 
  auth_user_id, 
  role,
  full_name
FROM public.user_profile 
WHERE auth_user_id = auth.uid()
LIMIT 1;

-- 2. Ver rutas asignadas al rutero
SELECT 
  r.route_id,
  r.nombre,
  r.assigned_user,
  up.full_name as rutero_name
FROM public.route r
JOIN public.user_profile up ON up.user_id = r.assigned_user
WHERE up.auth_user_id = auth.uid();

-- 3. Ver establecimientos de una ruta específica (reemplazar route_id)
-- NOTA: Reemplazar '1' con el route_id real
SELECT 
  e.establishment_id,
  e.name,
  e.route_id,
  e.is_active,
  e.zone_id
FROM public.establishment e
WHERE e.route_id = 1  -- <<< CAMBIAR ESTE NÚMERO
  AND e.is_active = true
ORDER BY e.name;

-- 4. Ver zonas de una ruta (para verificar si existen)
-- NOTA: Reemplazar '1' con el route_id real
SELECT 
  z.zone_id,
  z.name,
  z.is_active,
  COUNT(e.establishment_id) as num_establishments
FROM public.zone z
LEFT JOIN public.establishment e ON e.zone_id = z.zone_id AND e.is_active = true
WHERE z.route_id = 1  -- <<< CAMBIAR ESTE NÚMERO
GROUP BY z.zone_id, z.name, z.is_active
ORDER BY z.name;

-- 5. Verificar si la política RLS está permitiendo ver establecimientos
-- (Este query debería devolver las mismas filas que el query 3)
SELECT COUNT(*) as visible_establishments
FROM public.establishment
WHERE route_id = 1  -- <<< CAMBIAR ESTE NÚMERO
  AND is_active = true;

-- 6. Ver productos asignados a un establecimiento
-- NOTA: Reemplazar '1' con el establishment_id real
SELECT 
  p.product_id,
  p.name,
  p.sku,
  p.is_active
FROM public.products_establishment pe
JOIN public.product p ON p.product_id = pe.product_id
WHERE pe.establishment_id = 1  -- <<< CAMBIAR ESTE NÚMERO
  AND p.is_active = true
ORDER BY p.name;
