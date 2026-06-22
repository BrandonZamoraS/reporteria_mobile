# Design: Check record lapso consistency

## Root cause

Mobile creation and editing were using “active lapso now/current week” logic as a proxy for the record's domain lapso. Editing also rewrote both `lapso_id` and `time_date`, so an old record could move to a different active lapso.

## Mobile design

- Creation computes `recordTimeDateIso` once.
- Creation resolves writable route context with `recordTimeDateIso` and inserts that exact timestamp.
- Normal edit reads the existing record but updates only mutable fields: inventory, evidence count, comments.
- Automatic lapso close remains based on the record's stored `lapso_id`.
- Active-lapso reads use `start_at <= now` and `end_at > now`.

## Verification

- Node test source-regression checks for create/edit invariants.
- Existing route-lapso tests cover pending/completed/auto-close behavior.
- `npm run lint` and targeted `node --test` runs provide static and regression evidence.
