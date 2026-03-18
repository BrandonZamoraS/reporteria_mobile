-- Backfill: create active lapsos for LT seed routes and link their existing check_records.
-- The load-test seed (20260212190000) inserted check_records without lapso_id because the
-- lapso system did not exist yet when the seed was authored. This migration:
--   1. Creates one wide active route_lapso per (LT route, assigned rutero) spanning the
--      entire historical seed date range (~400 days).
--   2. Updates all orphaned check_records (lapso_id IS NULL) for those establishments
--      to reference the new lapso, so progress counters in Pendientes/Completadas work.

DO $$
DECLARE
  v_route      RECORD;
  v_lapso_id   BIGINT;
BEGIN
  -- Guard: skip entirely if the LT seed data is not present
  IF NOT EXISTS (SELECT 1 FROM public.route WHERE nombre LIKE 'LT Ruta %' LIMIT 1) THEN
    RAISE NOTICE 'LT seed data not found – skipping lapso backfill.';
    RETURN;
  END IF;

  FOR v_route IN
    SELECT r.route_id, r.assigned_user
    FROM public.route r
    WHERE r.nombre LIKE 'LT Ruta %'
      AND r.assigned_user IS NOT NULL
  LOOP
    -- Reuse existing active lapso if one was already created for this route/user
    SELECT rl.lapso_id INTO v_lapso_id
    FROM public.route_lapso rl
    WHERE rl.route_id  = v_route.route_id
      AND rl.user_id   = v_route.assigned_user
      AND rl.status    = 'en_curso'
    LIMIT 1;

    -- Otherwise create a spanning lapso that covers the full seed history
    IF v_lapso_id IS NULL THEN
      INSERT INTO public.route_lapso (
        route_id,
        user_id,
        duration_days,
        start_at,
        end_at,
        status
      ) VALUES (
        v_route.route_id,
        v_route.assigned_user,
        400,                                                          -- duration in days
        timezone('utc', now()) - INTERVAL '395 days',                -- covers all seed records
        timezone('utc', now()) + INTERVAL '5 days',                  -- still active today
        'en_curso'
      )
      RETURNING lapso_id INTO v_lapso_id;
    END IF;

    -- Backfill orphaned check_records that belong to this route's establishments
    UPDATE public.check_record cr
    SET    lapso_id = v_lapso_id
    FROM   public.establishment e
    WHERE  cr.establishment_id = e.establishment_id
      AND  e.route_id          = v_route.route_id
      AND  cr.user_id          = v_route.assigned_user
      AND  cr.lapso_id         IS NULL;

  END LOOP;

  RAISE NOTICE 'LT lapso backfill completed.';
END
$$;
