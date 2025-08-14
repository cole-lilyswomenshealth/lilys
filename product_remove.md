# Product & Checkout Removal Guide

This document lists all files and directories that need to be removed to eliminate product and checkout functionality from the ForHer project.

## Frontend Pages & Components

### Product Pages (Complete Directory)
```
src/app/(default)/products/
├── [slug]/
│   ├── ProductClient.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── layout.tsx
└── page.tsx
```

### Cart Pages (Complete Directory)
```
src/app/(default)/cart/
├── layout.tsx
└── page.tsx
```

### Checkout Pages (Complete Directory)
```
src/app/(checkout)/
├── checkout/
│   ├── cancel/
│   │   └── page.tsx
│   ├── order-confirmation/
│   │   └── page.tsx
│   ├── success/
│   │   └── page.tsx
│   └── page.tsx
└── layout.tsx
```

### Product Components
```
src/components/ProductCard.tsx
src/components/AddToCartButton.tsx
```

### Checkout Components (Complete Directory)
```
src/components/Checkout/
├── CheckoutAuth.tsx
├── StripeCheckoutButton.tsx
└── StripePaymentForm.tsx
```

## Store Files (Product/Cart Only)
```
src/store/cartStore.ts          # ✅ SAFE TO REMOVE - Pure shopping cart for products
src/store/stripeStore.ts        # ✅ SAFE TO REMOVE - Only handles product checkout sessions
```

## Hooks (Product/Checkout Only)
```
src/hooks/useStripeCheckout.ts  # ✅ SAFE TO REMOVE - Only handles product cart checkout flow
```

## API Routes

### Order APIs (Complete Directory)
```
src/app/api/orders/
├── by-session/
│   └── route.ts
└── route.ts
```

### Stripe Checkout API
```
src/app/api/stripe/checkout/route.ts
src/app/api/stripe/webhook/handlers/checkout.ts
```

## Account Pages

### Order Management (Complete Directory)
```
src/app/account/orders/
└── page.tsx
```

## Sanity Schema Types
```
src/sanity/schemaTypes/productType.ts
src/sanity/schemaTypes/productCategoryType.ts
src/sanity/schemaTypes/orderType.ts
```

## Additional Updates Required

### Schema Registration
- Remove product type imports from `src/sanity/schema.ts`
- Remove any product references from other schema files

### Navigation & Layout Updates
- Remove product/cart navigation links from layout components
- Remove product-related menu items
- Update routing configurations

### Environment Variables (Review & Clean)
- Review product-related environment variables
- Clean up unused Stripe product configurations

## Summary

**Total Directories to Remove:** 6 complete directories
- `src/app/(default)/products/`
- `src/app/(default)/cart/`
- `src/app/(checkout)/`
- `src/components/Checkout/`
- `src/app/api/orders/`
- `src/app/account/orders/`

**Total Individual Files to Remove:** 15+ individual files
- 3 Sanity schema files
- 3 store files
- 1 hook file
- 2 component files
- 2 API route files
- Various page components

**Files Requiring Updates (Not Removal):**
- `src/sanity/schema.ts` - Remove product imports
- Layout/navigation components - Remove product links
- Any components referencing cart/product functionality

---

**Note:** Before removal, ensure no other parts of the application depend on these files. Consider doing a global search for imports of these files to identify any dependencies.