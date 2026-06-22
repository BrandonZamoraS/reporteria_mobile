# Molecular Spec: Check record lapso consistency

## Requirement: Create record lapso by record date

When mobile creates a `check_record`, it MUST compute the record timestamp first and select the matching `route_lapso` using:

- `route_id = selected route`
- `user_id = route assignee / profile user according to role`
- `status = 'en_curso'`
- `start_at <= time_date`
- `end_at > time_date`

The inserted `check_record.time_date` MUST be the same timestamp used for lapso resolution.

## Requirement: Normal edit preserves lapso identity

When mobile edits an existing `check_record`, it MUST NOT recalculate or overwrite `lapso_id` during normal edit. If mobile does not expose `time_date` editing, it MUST also preserve `time_date`.

## Requirement: Active lapso excludes future starts

Queries that ask for the current active lapso MUST include:

- `status = 'en_curso'`
- `start_at <= now`
- `end_at > now`

## Regression scenarios

- Creating a record uses the lapso that contains the stored `time_date`.
- Editing inventory/evidence/comments leaves `lapso_id` unchanged.
- A future `en_curso` lapso is not considered active before `start_at`.

## Admin follow-up

In the admin repo, normal edit should either block `time_date` changes or expose a distinct retroactive-correction action. If retroactive correction is allowed, it must recalculate `lapso_id` from the new `time_date`. If in scope, audit should store `old_record` and `new_record` JSONB.
