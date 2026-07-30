import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const service = JSON.parse(
  await readFile(new URL("../service.json", import.meta.url), "utf8"),
);
const request = JSON.parse(
  await readFile(new URL("../examples/request.json", import.meta.url), "utf8"),
);

const jsonHeaders = {
  accept: "application/json",
  "content-type": "application/json",
  "user-agent": "ActionSeal read-only buyer preflight/1.0",
};

function decodePaymentRequired(encoded) {
  assert.ok(encoded, "The unpaid response did not include PAYMENT-REQUIRED");
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

function sameAddress(left, right) {
  return String(left).toLowerCase() === String(right).toLowerCase();
}

const sampleResponse = await fetch(service.freeInspection.sample, {
  headers: {
    accept: "application/json",
    "user-agent": jsonHeaders["user-agent"],
  },
});
assert.equal(sampleResponse.status, 200, "The fixed sample is not available");
const sample = await sampleResponse.json();
assert.equal(
  sample.fullDelivery?.fileCount ?? sample.fullDelivery?.files?.length,
  service.delivery.fileCount,
  "The live sample no longer advertises 12 files",
);

const openapiResponse = await fetch(service.freeInspection.openapi, {
  headers: {
    accept: "application/json",
    "user-agent": jsonHeaders["user-agent"],
  },
});
assert.equal(openapiResponse.status, 200, "OpenAPI is not available");
const openapi = await openapiResponse.json();
assert.equal(
  openapi.servers?.[0]?.url,
  new URL(service.paidEndpoint.url).origin,
  "OpenAPI does not advertise the live origin",
);
assert.ok(
  openapi.paths?.[new URL(service.paidEndpoint.url).pathname]?.post,
  "OpenAPI no longer advertises the paid POST operation",
);

const validatorResponse = await fetch(service.freeInspection.validator.url, {
  method: "POST",
  headers: jsonHeaders,
  body: JSON.stringify(request),
});
assert.equal(validatorResponse.status, 200, "The synthetic input is not valid");
assert.match(
  validatorResponse.headers.get("cache-control") ?? "",
  /(?:^|,|\s)no-store(?:,|\s|$)/i,
  "The free validator is missing no-store",
);
const validator = await validatorResponse.json();
assert.equal(validator.valid, true, "The free validator did not return valid=true");
assert.equal(
  validator.checkout,
  service.paidEndpoint.url,
  "The validator points to a different checkout",
);
assert.equal(
  Object.hasOwn(validator, "delivery"),
  false,
  "The free validator unexpectedly returned a paid delivery",
);

const unpaidResponse = await fetch(service.paidEndpoint.url, {
  method: service.paidEndpoint.method,
  headers: jsonHeaders,
  body: JSON.stringify(request),
});
assert.equal(unpaidResponse.status, 402, "The unpaid paid-route call did not return 402");
assert.equal(
  unpaidResponse.headers.get("payment-response"),
  null,
  "An unpaid preflight unexpectedly returned PAYMENT-RESPONSE",
);

const challenge = decodePaymentRequired(
  unpaidResponse.headers.get("payment-required") ??
    unpaidResponse.headers.get("x-payment-required"),
);
assert.equal(
  challenge.x402Version,
  service.payment.x402Version,
  "The live checkout no longer uses the expected x402 version",
);
assert.equal(
  challenge.resource?.url,
  service.paidEndpoint.url,
  "The 402 challenge is bound to a different resource URL",
);
const liveBazaarMethod = challenge.extensions?.bazaar?.info?.input?.method;
assert.equal(
  liveBazaarMethod,
  service.paidEndpoint.method,
  "The Bazaar contract does not advertise the exact paid POST method",
);
const accepts = Array.isArray(challenge.accepts) ? challenge.accepts : [];
const expected = service.payment;
const matchingOption = accepts.find(
  (option) =>
    option.scheme === expected.scheme &&
    option.network === expected.network &&
    String(option.amount) === expected.amountAtomic &&
    sameAddress(option.asset, expected.asset) &&
    sameAddress(option.payTo, expected.payTo),
);
assert.ok(matchingOption, "The live 402 does not contain the expected payment tuple");

const result = {
  event: "actionseal_read_only_preflight",
  checkedAt: new Date().toISOString(),
  spent: false,
  signed: false,
  sample: {
    status: sampleResponse.status,
    fileCount: service.delivery.fileCount,
  },
  openapi: {
    status: openapiResponse.status,
    server: openapi.servers[0].url,
    paidMethod: service.paidEndpoint.method,
  },
  validator: {
    status: validatorResponse.status,
    valid: validator.valid ?? true,
    cacheControl: validatorResponse.headers.get("cache-control"),
  },
  unpaidChallenge: {
    status: unpaidResponse.status,
    x402Version: challenge.x402Version,
    scheme: matchingOption.scheme,
    network: matchingOption.network,
    amountAtomic: String(matchingOption.amount),
    asset: matchingOption.asset,
    payTo: matchingOption.payTo,
    method: liveBazaarMethod,
  },
  note: "Inspection stopped at HTTP 402. No signature or payment was created.",
};

console.log(JSON.stringify(result, null, 2));
