import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

/**
 * @typedef {import("../generated/api").CartInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

// "Buy 5 for $25" bundle promo.
// Any product in the clearance-bundle collection qualifies. Qualifying units are
// grouped in fives: every complete group of 5 is priced at $25 total ($5 per
// unit). Units beyond the last complete group stay at full price. When lines
// have different prices, the cheapest qualifying units fill the groups first so
// the customer never overpays for the discounted slots.
//
// The qualifying collection (handle `clearance-bundle-5-for-25`) is resolved to
// its collection ID in the input query (cart_lines_discounts_generate_run.graphql)
// and matched via inAnyCollection.
const GROUP_SIZE = 5;
const PRICE_PER_ITEM = 5.0;

/**
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  if (!input.cart.lines.length) {
    return {operations: []};
  }

  // This promo is a product discount. Bail out if the merchant's discount isn't
  // configured with the Product class.
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );
  if (!hasProductDiscountClass) {
    return {operations: []};
  }

  // Flatten every qualifying line into individual units so we can group by 5s
  // across lines, regardless of per-line quantity.
  const units = [];
  for (const line of input.cart.lines) {
    const merchandise = line.merchandise;
    if (merchandise.__typename !== 'ProductVariant') {
      continue;
    }
    if (!merchandise.product.inClearanceBundle) {
      continue;
    }

    const unitPrice = Number(line.cost.amountPerQuantity.amount);
    // Only discount units priced above the promo price; a unit already at or
    // below $5 gains nothing and could otherwise produce a negative discount.
    if (unitPrice <= PRICE_PER_ITEM) {
      continue;
    }

    for (let i = 0; i < line.quantity; i++) {
      units.push({lineId: line.id, unitPrice});
    }
  }

  const groups = Math.floor(units.length / GROUP_SIZE);
  if (groups === 0) {
    return {operations: []};
  }

  // Fill the discounted slots with the cheapest qualifying units first.
  units.sort((a, b) => a.unitPrice - b.unitPrice);
  const discountedUnits = units.slice(0, groups * GROUP_SIZE);

  // Collapse the chosen units back onto their cart lines so each line gets a
  // single target with the count of units being discounted on it.
  const perLineQuantity = new Map();
  for (const unit of discountedUnits) {
    perLineQuantity.set(unit.lineId, (perLineQuantity.get(unit.lineId) || 0) + 1);
  }

  // A fixed-amount product discount reduces each targeted unit by `amount`, so
  // the per-unit reduction is (unitPrice - $5). Because units on the same line
  // share a price, one candidate per line applies the correct reduction.
  const lineUnitPrice = new Map();
  for (const unit of discountedUnits) {
    lineUnitPrice.set(unit.lineId, unit.unitPrice);
  }

  const candidates = [];
  for (const [lineId, quantity] of perLineQuantity.entries()) {
    const unitPrice = lineUnitPrice.get(lineId);
    const perUnitDiscount = unitPrice - PRICE_PER_ITEM;

    candidates.push({
      message: `${GROUP_SIZE} FOR $${(GROUP_SIZE * PRICE_PER_ITEM).toFixed(0)}`,
      targets: [
        {
          cartLine: {
            id: lineId,
            quantity,
          },
        },
      ],
      value: {
        fixedAmount: {
          amount: perUnitDiscount.toFixed(2),
          appliesToEachItem: true,
        },
      },
    });
  }

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates,
          selectionStrategy: ProductDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}
