/**
 * @typedef {import("../generated/api").DeliveryInput} RunInput
 * @typedef {import("../generated/api").CartDeliveryOptionsDiscountsGenerateRunResult} CartDeliveryOptionsDiscountsGenerateRunResult
 */

/**
 * The "buy 5 for $25" bundle promo is a product-only discount and never affects
 * shipping, so this delivery target is intentionally a no-op. The target stays
 * registered because the extension declares it in shopify.extension.toml.
 *
 * @param {RunInput} _input
 * @returns {CartDeliveryOptionsDiscountsGenerateRunResult}
 */
export function cartDeliveryOptionsDiscountsGenerateRun(_input) {
  return {operations: []};
}
