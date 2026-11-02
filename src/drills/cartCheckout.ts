import type { Drill } from "../types";
import { code } from "./code";

const zeros = {
  totalCents: 0,
  shippingCents: 0,
  taxCents: 0,
  discountCents: 0,
};

export const cartCheckout: Drill = {
  id: "cart-checkout",
  title: "Cart checkout",
  mess: "Mixed concerns",
  entry: "Cart",
  entryKind: "class",
  prompt: [
    "Checkout validates lines, applies a coupon, adds tax, and decides shipping inside one method. Finance wrote the rules down separately. The implementation folds them together, and the coupon comes off a total that already includes tax.",
    "One check from finance: a 4,900 cent lamp, no coupon, taxRate 0.08. Tax is 392 cents, shipping stays 500, and the total is 5,792.",
  ],
  rules: [
    "Merchandise is the sum of priceCents × qty. add receives { sku, priceCents, qty }.",
    "Discount is couponPercent percent of merchandise only, rounded to the nearest cent, and it comes off before tax.",
    "Tax is taxRate times the discounted merchandise, rounded to the nearest cent. Shipping is not taxed.",
    "Shipping is 500 cents when discounted merchandise is under 5,000 cents, and 0 at 5,000 or above.",
    "An empty cart returns all zeros. It does not charge shipping.",
    "checkout({ couponPercent, taxRate }) returns { totalCents, shippingCents, taxCents, discountCents }.",
  ],
  starter: code`
    class Cart {
      constructor() {
        this.lines = [];
      }

      add(line) {
        this.lines.push(line);
      }

      checkout(options = {}) {
        const couponPercent = options.couponPercent ?? 0;
        const taxRate = options.taxRate ?? 0;

        // Validate, total, and estimate tax in one pass so we only walk the lines once.
        let merchandise = 0;
        let auditCount = 0;
        for (const line of this.lines) {
          if (!line.sku || line.qty <= 0 || typeof line.priceCents !== "number") {
            auditCount += 1;
            continue;
          }
          merchandise += line.priceCents * line.qty;
          if (line.priceCents > 100000) auditCount += 1;
        }

        // Coupon comes off the amount the customer actually pays tax on,
        // so tax is folded in before the percent is applied.
        const taxCents = Math.round(merchandise * taxRate);
        const discountCents = Math.round(((merchandise + taxCents) * couponPercent) / 100);
        const afterDiscount = merchandise - discountCents;
        const shippingCents = merchandise + taxCents < 5000 ? 500 : 0;
        const totalCents = afterDiscount + taxCents + shippingCents;

        void auditCount;
        return { totalCents, shippingCents, taxCents, discountCents };
      }
    }
  `,
  solution: code`
    class Cart {
      constructor() {
        this.lines = [];
      }

      add(line) {
        this.lines.push(line);
      }

      checkout({ couponPercent = 0, taxRate = 0 } = {}) {
        if (this.lines.length === 0) {
          return { totalCents: 0, shippingCents: 0, taxCents: 0, discountCents: 0 };
        }

        let merchandise = 0;
        for (const line of this.lines) {
          merchandise += line.priceCents * line.qty;
        }

        const discountCents = Math.round((merchandise * couponPercent) / 100);
        const taxable = merchandise - discountCents;
        const taxCents = Math.round(taxable * taxRate);
        const shippingCents = taxable < 5000 ? 500 : 0;

        return {
          totalCents: taxable + taxCents + shippingCents,
          shippingCents,
          taxCents,
          discountCents,
        };
      }
    }
  `,
  annotations: [
    {
      title: "Four rules share one pass",
      body: "SKU checks, an audit counter nothing reads, the merchandise sum, tax, the coupon, and the shipping threshold are interleaved. The counter and the skipped lines never change a receipt in these tests. They do make the money harder to see.",
    },
    {
      title: "Tax is taken before the discount",
      body: "taxCents is Math.round(merchandise * taxRate) on the pre-discount sum. The coupon is then a percent of merchandise + taxCents. Finance's order is the other way: percent off merchandise, then tax on what remains. Shipping is not part of either base.",
    },
    {
      title: "Shipping looks at a number that already includes tax",
      body: "The threshold uses merchandise + taxCents, before the discount. A 4,900 cent order plus 392 cents of tax crosses 5,000, so the 500 cent fee disappears. The threshold applies to discounted merchandise only. At exactly 5,000 cents, shipping is free.",
    },
    {
      title: "An empty cart is not a cheap order",
      body: "With no lines, merchandise is 0, which is under 5,000, so the starter charges 500 cents to ship nothing. Emptiness is its own case, and it returns zeros before the shipping rule runs.",
    },
  ],
  tests: [
    {
      id: "under",
      name: "charges 500 cents of shipping under 5,000 with no tax",
      visible: true,
      kind: "class",
      calls: [
        { method: "add", args: [{ sku: "MUG", priceCents: 1000, qty: 2 }] },
        { method: "checkout", args: [{ couponPercent: 0, taxRate: 0 }] },
      ],
      expected: {
        totalCents: 2500,
        shippingCents: 500,
        taxCents: 0,
        discountCents: 0,
      },
    },
    {
      id: "exact",
      name: "ships free at 5,000 cents with no tax",
      visible: true,
      kind: "class",
      calls: [
        { method: "add", args: [{ sku: "BOOK", priceCents: 5000, qty: 1 }] },
        { method: "checkout", args: [{ couponPercent: 0, taxRate: 0 }] },
      ],
      expected: {
        totalCents: 5000,
        shippingCents: 0,
        taxCents: 0,
        discountCents: 0,
      },
    },
    {
      id: "tax-shipping",
      name: "keeps shipping on a 4,900 cent order with 8% tax",
      visible: true,
      kind: "class",
      calls: [
        { method: "add", args: [{ sku: "LAMP", priceCents: 4900, qty: 1 }] },
        { method: "checkout", args: [{ couponPercent: 0, taxRate: 0.08 }] },
      ],
      expected: {
        totalCents: 5792,
        shippingCents: 500,
        taxCents: 392,
        discountCents: 0,
      },
    },
    {
      id: "coupon",
      name: "takes 10% off merchandise, then applies 5% tax",
      visible: true,
      kind: "class",
      calls: [
        { method: "add", args: [{ sku: "DESK", priceCents: 10000, qty: 1 }] },
        { method: "checkout", args: [{ couponPercent: 10, taxRate: 0.05 }] },
      ],
      expected: {
        totalCents: 9450,
        shippingCents: 0,
        taxCents: 450,
        discountCents: 1000,
      },
    },
    {
      id: "empty",
      name: "an empty cart totals to zero",
      visible: false,
      kind: "class",
      calls: [{ method: "checkout", args: [{}] }],
      expected: zeros,
    },
    {
      id: "full-coupon",
      name: "a 100% coupon still ships a non-empty cart",
      visible: false,
      kind: "class",
      calls: [
        { method: "add", args: [{ sku: "PEN", priceCents: 2500, qty: 1 }] },
        { method: "checkout", args: [{ couponPercent: 100, taxRate: 0.2 }] },
      ],
      expected: {
        totalCents: 500,
        shippingCents: 500,
        taxCents: 0,
        discountCents: 2500,
      },
    },
  ],
};
