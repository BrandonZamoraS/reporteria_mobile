# Proposal: Fix check record lapso consistency

## Intent

Prevent `check_record.time_date` from diverging from `check_record.lapso_id` in mobile create/edit flows.

## Scope

### In Scope
- Resolve `lapso_id` on record creation using the actual `time_date` being stored.
- Preserve existing `lapso_id` and `time_date` during normal mobile edits.
- Ensure true active-lapso queries exclude future lapsos with `start_at <= now`.
- Add regression tests around create/edit/query behavior.

### Out of Scope
- Admin repository implementation.
- Historical data repair for already inconsistent records.
- New retroactive correction UI.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `check-record-lapso-consistency`: Mobile records must keep `time_date` and `lapso_id` aligned.

## Approach

Use the same timestamp for create lookup and insert. On edit, update mutable fields only. Change active-lapso filters from week-start lower bounds to `start_at <= now` where the query asks for the active lapso.

## Risks

| Risk | Mitigation |
|---|---|
| Existing UI depends on week-scoped lapso lists | Only changed queries that explicitly require active `en_curso` lapsos. |
| Closing logic regresses | Keep close flow tied to record's existing `lapso_id`. |

## Success Criteria

- [ ] Create assigns lapso by `route_id`, `user_id`, `start_at <= time_date`, `end_at > time_date`.
- [ ] Normal edit does not change `lapso_id` or `time_date`.
- [ ] Future lapsos are not selected as active.
