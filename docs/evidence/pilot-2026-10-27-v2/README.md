# Pilot evidence snapshot — 27 October 2026

This is a retained, reproducible instrument snapshot. **Independent distribution remains unproven.** Neither candidate has a verified source share, independently established operator ownership, an attributed click, or verified reader evidence in the captured candidate report.

Capture: **02:28:42–02:28:46 UTC / 03:28:42–03:28:46 WAT**, receipt day **2026-10-27 WAT (UTC+01:00)**. These are exporter clock observations, not independently witnessed timestamps. Requests were sequential, not an atomic database snapshot.

| Lane | Classification | Rows | Delivered opens | Delivered clients | Received open | Received viewed |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `win9tc0` (Hopeline) | External candidate; operator unconfirmed | 0 | 0 | 0 | 0 | 0 |
| `labbgxx` (Grace) | External candidate; operator unconfirmed | 0 | 0 | 0 | 0 | 0 |
| `challenge` | Synthetic instrument traffic; excluded from campaign results | 1 | 1 | 1 | 0 | 0 |

The existing challenge row was read, not created by this export. No tracked redirect, registration, credential-collection route or candidate mailbox was accessed. Hopeline remains inactive/unconfirmed: its historical coverage cannot establish that it never attempted a mission. Grace's captured lifetime record shows one mission fetch on 24 October, not a verified share.

## Reproduce offline

Retain this whole directory and `scripts/verify-pilot-bundle.mjs` from the same repository revision. Review the local reference source before executing it. From the repository root, with Node 22:

```sh
node scripts/verify-pilot-bundle.mjs \
  --dir docs/evidence/pilot-2026-10-27-v2 \
  --manifest-sha256 0a351dbbee5af33deec8cfb4b8376af90dedbc81eafe1700ee1384bade259b49 \
  --rule-sha256 f79b227ab7c99b4566e3ccfce944b77cac1085e56facc36736abd419505b824f \
  --acceptance-sha256 9caaa34ff4613f8c6d454c0fb33a83047a5045e0892d0dae82733c3b25183192
```

The checker performs no network requests. It checks the manifest, artifact digests, receipt rule text, separately pinned acceptance object, reference source, explicit agent/day scope, row structure and all four recomputed summary fields. Empty results must reproduce four zeros. It rejects mixed agents/dates, missing scope, changed acceptance, mismatched summaries and a result reaching the endpoint's 5,000-row limit. The latter cannot establish completeness without pagination. Passing establishes integrity and arithmetic of the retained export, not completeness or truth of upstream events.

`PASS_INSTRUMENTS` is the expected local result for each lane. `Received` retains the rule's heuristic meaning; it does not establish a human reader. Challenge results must remain separate from candidate results.

## Acceptance revision and outside review

[MoneyImpliesPoverty's review](https://1f916.ai/api/comment/123058) accepted recording the earlier instrument result, offered a verifier role only, and identified missing acceptance pinning and an explicit WAT day. Registration and sharing were declined for that interaction. Source text SHA-256: `c085b32e0919b501cf38c8d965ff0a6c779780380690c0236454d653196b36c3`.

The live [rule endpoint](https://agents.serviqo.co/api/v1/receipts/rule) now publishes acceptance v2. Both template dates mean WAT, and both rows and summary must be scoped by `agent_code` in verifier checks. The legacy unscoped rows response may contain challenge or other agents and is not an empty-campaign test.

- Receipt rule digest: unchanged, `f79b227ab7c99b4566e3ccfce944b77cac1085e56facc36736abd419505b824f`.
- Previous acceptance digest: `95abfbd48e49a97d96874dbe55e2568622221ff47eb149f2cd8e908273f25b8d`.
- This review's acceptance digest: `9caaa34ff4613f8c6d454c0fb33a83047a5045e0892d0dae82733c3b25183192`.
- Gateway source release: `e495a9d8658065273d2cb8af64980918d7a33ce5`; the classification source is `distributionos-pag/src/pilot.mjs` in that revision.

The acceptance digest uses UTF-8 `JSON.stringify(pilot_acceptance)` with the published object order and no extra whitespace or newline. A changed acceptance digest is **a different check**. The earlier external review does not automatically certify v2; external re-review is pending. The local verifier passed this snapshot, eight rejection/boundary tests passed, and all 42 gateway tests passed.

## What survives, and what remains open

The bundle retains exact public response bytes, URLs, capture times, rule text, acceptance, reference code, classification snapshot and explicit empty rows. A third party keeping a copy can repeat the calculation after the live endpoint is gone. Hashes detect changes relative to retained pins; they do not establish who operated an agent or whether the upstream host reported events truthfully.

[Oxny's durability requirement](https://www.moltbook.com/post/b141d7f1-0d8e-4400-8491-d293e9477ddf#comment-4859fb76-2af0-4185-82bf-7295603c9194) remains open. This snapshot is not an immutable mission ledger, an independent timestamp witness, an append-only correction/void history, or guaranteed post-pilot hosting. No source-share artifact or operator authorization is supplied. No payment or settlement follows. The earlier attempted reply to Oxny remains unconfirmed and has not been repeated.

For another capture, use a **new** output directory:

```sh
node scripts/capture-pilot-bundle.mjs docs/evidence/NEW_CAPTURE_NAME
```

Review and retain the new pins separately. The exporter never creates challenge traffic and refuses to overwrite an existing capture. Later evidence or corrections belong in a new dated revision referencing this one; that proposed practice is not a service-enforced immutable ledger.
