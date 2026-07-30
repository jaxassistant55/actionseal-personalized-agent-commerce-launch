import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const serviceText = await readFile(new URL("service.json", root), "utf8");
const service = JSON.parse(serviceText);
const request = JSON.parse(
  await readFile(new URL("examples/request.json", root), "utf8"),
);
const readme = await readFile(new URL("README.md", root), "utf8");
const inspector = await readFile(
  new URL("scripts/inspect-live.mjs", root),
  "utf8",
);

test("machine metadata pins the exact live commercial tuple", () => {
  assert.equal(service.paidEndpoint.method, "POST");
  assert.equal(service.payment.x402Version, 2);
  assert.equal(service.payment.scheme, "exact");
  assert.equal(service.payment.network, "eip155:8453");
  assert.equal(service.payment.amountAtomic, "20000000");
  assert.equal(
    service.payment.asset.toLowerCase(),
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  );
  assert.equal(
    service.payment.payTo.toLowerCase(),
    "0x27520d6e2f9e3d1e6340f04dfc4587a3e4f82268",
  );
});

test("delivery inventory is exact and unique", () => {
  assert.equal(service.delivery.fileCount, 12);
  assert.equal(service.delivery.files.length, 12);
  assert.equal(new Set(service.delivery.files).size, 12);
});

test("the synthetic request satisfies the documented top-level shape", () => {
  assert.match(request.endpoint, /^https:\/\//);
  assert.match(request.payTo, /^0x[a-fA-F0-9]{40}$/);
  assert.ok(["GET", "POST"].includes(request.method));
  assert.ok(request.serviceDescription.length >= 40);
  assert.ok(request.proofPoints.length >= 1);
  assert.ok(request.limitations.length >= 1);
});

test("the commercial metadata exposes only the current asset and receiver", () => {
  const joined = `${serviceText}\n${readme}\n${inspector}`.toLowerCase();
  const addresses = new Set(joined.match(/0x[a-f0-9]{40}/g) ?? []);
  assert.deepEqual(
    [...addresses].sort(),
    [
      "0x27520d6e2f9e3d1e6340f04dfc4587a3e4f82268",
      "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    ].sort(),
  );
});

test("the live inspector cannot create or submit payment", () => {
  assert.doesNotMatch(inspector, /payment-signature/i);
  assert.doesNotMatch(inspector, /private[_ -]?key|seed phrase|mnemonic/i);
  assert.match(
    inspector,
    /Inspection stopped at HTTP 402\. No signature or payment was created\./,
  );
});

test("the live inspector fails closed on validator and challenge drift", () => {
  for (const requiredAssertion of [
    "validator.valid",
    "validator.checkout",
    'Object.hasOwn(validator, "delivery")',
    "challenge.x402Version",
    "challenge.resource?.url",
    "challenge.extensions?.bazaar?.info?.input?.method",
  ]) {
    assert.ok(
      inspector.includes(requiredAssertion),
      `missing fail-closed assertion for ${requiredAssertion}`,
    );
  }
});
