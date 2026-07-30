---
name: actionseal-personalized-agent-commerce-launch
description: Inspect and validate the live ActionSeal Personalized Agent Commerce Launch x402 service, prepare bounded public-product input, and compare its exact Base-USDC payment challenge before purchase. Use when a user wants to test the free validator, review the 12-file output contract, prepare a request for the paid POST endpoint, or make a payment decision without exposing secrets or authorizing funds prematurely.
---

# ActionSeal Personalized Agent Commerce Launch

Use the repository's dependency-free checks to inspect a live paid service
without creating a signature or payment. Treat the live HTTP 402 challenge as
authoritative and stop on any contract drift.

## Safety boundary

- Use public product facts only. Never submit credentials, private keys, seed
  phrases, tokens, confidential material, personal data, or URL credentials.
- Default to the nonpaying workflow. Do not forge or attach a payment header,
  sign an authorization, broadcast a transaction, or retry with payment.
- Never send a raw USDC transfer to `payTo`; a direct transfer cannot fulfill
  this checkout.
- Treat `priceUSDC` and `payTo` in `examples/request.json` as the buyer's target
  offer, not ActionSeal's checkout price or receiver.
- Do not fetch the submitted product endpoint. The service also promises not
  to fetch it.
- Count validation, HTTP 402 responses, repository activity, and generated
  drafts as zero revenue.

## Nonpaying inspection

From the skill directory:

```sh
npm test
npm run inspect
```

`npm run inspect` performs two disclosed POST requests: one to the free
validator and one unpaid request to the paid endpoint. It must finish with
`signed: false`, `spent: false`, validator `valid: true`, and HTTP 402.

Require the live challenge to match every field in `service.json`:

- x402 version 2 and scheme `exact`
- network `eip155:8453`
- amount `20000000` atomic USDC
- asset `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- receiver `0x27520d6E2f9E3D1e6340F04Dfc4587a3E4f82268`
- resource URL
  `https://jax.tail5e0766.ts.net:8443/api/v1/personalized-agent-commerce-launch`
- Bazaar input method `POST`

If any field is absent or different, stop and report the mismatch. Do not
substitute a different route, receiver, asset, network, method, or amount.

## Prepare and validate buyer input

Copy `examples/request.json` to a temporary file and replace only its public
product facts. Keep the documented fields and bounds. Then call the free
validator:

```sh
curl --fail-with-body --silent --show-error \
  -H 'content-type: application/json' \
  --data-binary @/absolute/path/to/request.json \
  https://jax.tail5e0766.ts.net:8443/api/v1/personalized-agent-commerce-launch/validate
```

Require HTTP 200, `valid: true`, the exact checkout URL, `Cache-Control:
private, no-store`, and no top-level `delivery`. Validation does not reserve a
price, generate the paid files, or prove demand.

## Purchase handoff

Proceed only when the user explicitly asks to buy after seeing the exact live
contract. This skill contains no wallet, signer, facilitator, or payment
submission code. Hand payment execution to a separately trusted
x402-compatible wallet client that binds authorization to the matching live
challenge and POST request.

Before that handoff, restate the network, asset, atomic amount, receiver,
resource URL, and method. Stop if the client cannot bind all six values or if
it proposes a raw transfer.

After a successful settlement, require one JSON response containing exactly 12
inline files, per-file byte counts and SHA-256 digests, a deterministic input
hash, and a bundle digest. Preserve the payment response and transaction
identifier for the buyer's records.

## Failure handling

- Treat timeouts, non-JSON responses, validator errors, non-402 unpaid
  responses, missing headers, and schema drift as hard failures.
- Do not weaken assertions, guess missing fields, or silently use local
  metadata in place of the live challenge.
- Do not claim availability, a sale, revenue, or successful delivery from a
  health check or unpaid preflight.
