# External timestamp request for the frozen v2 evidence

**Status: pending calendar attestations. No verified Bitcoin timestamp is claimed.** This is a supplemental artifact; the v2 evidence bytes, acceptance digest and review target are unchanged. Oxny's broader durability requirements remain open.

At 02:49:11–02:49:13 UTC / 03:49:11–03:49:13 WAT on 27 October 2026, OpenTimestamps client 0.7.2 submitted a blinded commitment to the existing manifest digest. Alice, Bob and Finney calendars each returned a pending attestation. The retained proof parses and identifies the exact manifest digest. Our submission times are local observations, not independently certified event timestamps. No wallet, payment, candidate visit, registration or file-content upload was involved.

| Artifact | SHA-256 |
| --- | --- |
| [Original manifest](../pilot-2026-10-27-v2/manifest.json) | `0a351dbbee5af33deec8cfb4b8376af90dedbc81eafe1700ee1384bade259b49` |
| [Initial timestamp proof](manifest.json.ots) | `cedc05c75ecd74d0f946c8f533b6f1e5c123df79951718d7f24ca3f5c6273e49` |

The original evidence is pinned to public commit `a58f33b7a9cc4b994fdcd68b2d8cf7dfa2f4c5ac`. [status.json](status.json) records the request, and [proof-info.txt](proof-info.txt) contains the parsed pending attestations. Calendar acknowledgments do not close the independent-timestamp requirement.

## Verify without changing the review target

Use the official [OpenTimestamps client](https://github.com/opentimestamps/opentimestamps-client). Retain the initial proof; upgrade a separate copy when calendar batching has completed:

```sh
ots info docs/evidence/pilot-2026-10-27-v2-witness/manifest.json.ots
cp docs/evidence/pilot-2026-10-27-v2-witness/manifest.json.ots manifest-upgrade.ots
ots upgrade manifest-upgrade.ots
ots verify -f docs/evidence/pilot-2026-10-27-v2/manifest.json manifest-upgrade.ots
```

A pending response is expected until the calendars anchor their batches. The official Python verifier requires access to a Bitcoin Core node for blockchain verification. This campaign has not provisioned one or claimed that check passed. See the [official timestamping explanation](https://opentimestamps.org/) and [client procedure](https://github.com/opentimestamps/opentimestamps-client).

## What this can and cannot resolve

After a valid completed proof is independently checked, it can establish that the committed bytes existed before the attested block time. It would not establish when a share occurred, whether an operator is independent, whether an event was truthfully reported, whether a human read anything, or whether the evidence remains retrievable forever. Keep the underlying bundle as well as its proof; a hash cannot recover lost content.

The remaining acceptance gaps are explicit:

- **Share evidence:** no genuine source share is in this bundle. The candidate lanes remain empty.
- **Classification and void history:** the production service does not enforce an immutable mission ledger or append-only correction/void records. The current code registry and dated snapshot are insufficient to claim that guarantee.
- **Retention:** public GitHub hosting and a downloadable copy improve availability; no independent long-term archive or retention commitment has been verified.
- **External acceptance:** MoneyImpliesPoverty's revised-rule review and Oxny's acceptance of any durability design are still pending.

A later completed timestamp should be published as a new dated record that names this initial proof and preserves it. Future share records also need retained source evidence, creation-time classification, explicit corrections/void reasons and independently retained checkpoints before the broader durability claim can pass. None of those states is inferred from this timestamp request.
