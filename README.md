# ActionSeal Personalized Agent Commerce Launch

A live, accountless x402 service that turns bounded public facts for one paid
agent service into 12 buyer-specific launch and machine-discovery files.

- Fixed price: **20 USDC**
- Network: **Base mainnet** (`eip155:8453`)
- Paid method: **POST**
- Delivery: **12 inline files with byte counts and SHA-256 digests**
- Buyer page: <https://jax.tail5e0766.ts.net:8443/personalized-agent-commerce-launch>
- Paid endpoint: <https://jax.tail5e0766.ts.net:8443/api/v1/personalized-agent-commerce-launch>

The free inspection workflow in this repository never signs, pays, or submits a
payment header. It checks the current public contract, validates a synthetic
request, and confirms that an unpaid call returns HTTP 402.

## Use as an Agent Skill

This repository also follows the
[Agent Skills specification](https://agentskills.io/specification). Review
`SKILL.md` and the inspection script, then optionally install it with:

```sh
npx skills add jaxassistant55/actionseal-personalized-agent-commerce-launch
```

Installation is not a purchase. The skill defaults to the free, nonpaying
preflight and stops before any wallet authorization. The
[skills.sh documentation](https://www.skills.sh/docs) notes that its CLI uses
anonymous installation telemetry for ranking.

## Inspect before paying

Requirements: Node.js 20 or newer. There are no package dependencies.

```sh
npm test
npm run inspect
```

To call only the free validator with the synthetic example:

```sh
curl --fail-with-body --silent --show-error \
  -H 'content-type: application/json' \
  --data-binary @examples/request.json \
  https://jax.tail5e0766.ts.net:8443/api/v1/personalized-agent-commerce-launch/validate
```

That command supplies no payment header, creates no signature, spends nothing,
and returns no deliverable.

`npm run inspect` performs only these free operations:

1. reads the fixed synthetic sample;
2. reads the live OpenAPI document;
3. sends the synthetic body to the free validator;
4. sends the same body to the paid route **without** payment authorization and
   verifies the resulting 402 challenge.

The script refuses to create a signature or retry with payment.

In `examples/request.json`, `priceUSDC` and `payTo` describe the buyer's target
offer—the service for which ActionSeal will generate launch assets. They are not
the ActionSeal checkout price or receiver.

You can also inspect the public resources directly:

- [Filled synthetic sample](https://jax.tail5e0766.ts.net:8443/api/v1/personalized-agent-commerce-launch/sample)
- Free validator — `POST /api/v1/personalized-agent-commerce-launch/validate`
  (use the curl command above; a browser GET is not supported)
- [OpenAPI](https://jax.tail5e0766.ts.net:8443/openapi.json)
- [x402 descriptor](https://jax.tail5e0766.ts.net:8443/.well-known/x402)
- [Agent instructions](https://jax.tail5e0766.ts.net:8443/llms.txt)
- [Prism listing readback](https://prism-index.vercel.app/v1/listings/actionseal-personalized-agent-commerce-launch)

## Paid response

After a valid x402 settlement, the response contains:

1. `README.md`
2. `product-brief.md`
3. `landing-page.md`
4. `marketplace-listing.md`
5. `llms.txt`
6. `.well-known/agent.json`
7. `.well-known/x402.json`
8. `openapi-fragment.json`
9. `buyer-qualification.md`
10. `claims-review.md`
11. `IMPLEMENTATION-NOTES.md`
12. `validation-report.json`

Each file has an exact byte count and SHA-256 digest. The response also carries
a deterministic input hash and bundle digest.

## Exact payment boundary

Before authorizing any payment, compare the live HTTP 402 challenge against all
of these values:

| Field | Expected value |
| --- | --- |
| Protocol | x402 v2, `exact` |
| Network | `eip155:8453` |
| Amount | `20000000` atomic USDC |
| Asset | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Receiver | `0x27520d6E2f9E3D1e6340F04Dfc4587a3E4f82268` |
| HTTP method | `POST` |

Do not use a receiver copied from any older or unrelated ActionSeal/Micro Offer
Studio page. The live challenge must match the receiver above.

Never send a raw USDC transfer to `payTo`: a direct transfer cannot fulfill this
checkout. Use an x402-compatible wallet client that binds its authorization to
the matching live HTTP 402 challenge and paid POST request.

## Scope and limitations

The service generates launch artifacts from facts supplied by the buyer. It
does not:

- fetch or verify the submitted endpoint;
- deploy or register the buyer's service;
- use repository, cloud, or marketplace credentials;
- sign on the buyer's behalf;
- verify supplied proof points;
- guarantee discovery, demand, sales, or income.

Submit public product facts only. Never submit private keys, seed phrases,
credentials, tokens, personal data, or confidential material.

Availability, directory listings, health checks, and unpaid 402 challenges are
not sales. Confirmed ActionSeal revenue was **0 USDC** at the repository's last
live verification; see `service.json` for that timestamp. Publication is not
revenue, and this repository makes no claim that a sale has occurred.

## Repository license

The inspection code and documentation in this repository are MIT licensed.
That license does not grant rights to unpaid personalized output from the
commercial endpoint.
