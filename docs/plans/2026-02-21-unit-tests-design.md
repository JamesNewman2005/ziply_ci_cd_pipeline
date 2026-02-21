# Unit Tests Design

**Date**: 2026-02-21
**Status**: Approved

## Overview

Add unit tests to both ziply_website and ziply_app, focusing on pure function logic and state management. No complex service mocking — maximum ROI for minimum complexity.

## Approach

Pure functions first: test formatters, validators, profanity filter, cart store, Zod schemas, and retry logic. One mock-based test (dashboard revenue stats) where the business logic justifies it.

## ziply_website — 4 test files

### 1. `src/utils/__tests__/profanityFilter.test.ts`
- `containsProfanity()` — blocked words, character substitution evasion (0→o, 1→i, 3→e, @→a), clean text, empty/whitespace
- `validateName()` — length bounds (2-50), profane names, no-letter names, valid names

### 2. `src/utils/__tests__/format.test.ts`
- `formatCurrency()` — whole numbers, decimals (rounds), zero, negative
- `formatOrderDate()` — string and Date inputs
- `formatTimeAgo()` — recent vs old dates

### 3. `src/utils/__tests__/constants.test.ts`
- All label maps have entries for every valid status
- No undefined values in any mapping

### 4. `src/services/__tests__/dashboard.service.test.ts`
- `getRevenueStats()` — mock Supabase client
  - Empty orders → zero revenue, zero avg
  - Multiple orders → correct totals and averages
  - 7-day pending payout boundary (orders inside/outside window)

## ziply_app — 5 test files

### 1. `src/utils/__tests__/profanityFilter.test.ts`
- Same test cases as website (logic is identical)

### 2. `src/utils/__tests__/format.test.ts`
- `formatCurrency()` — RSD formatting
- `formatDistance()` — meters vs km threshold at 1000m
- `formatDeliveryTime()` — min-max range
- `formatOrderDate()`, `formatTimeAgo()` — date handling

### 3. `src/store/__tests__/cartStore.test.ts`
- `addItem()` — new item, increment existing, restaurant switch clears cart
- `removeItem()` — removes item, clears when last removed
- `updateQuantity()` — updates quantity, removes at ≤0
- `getSubtotal()` — price × quantity calculation
- `getItemCount()` — total quantities
- `clearCart()` — resets state

### 4. `src/lib/validations/__tests__/auth.test.ts`
- `signInSchema` — valid/invalid emails, password required
- `signUpSchema` — password complexity (8+ chars, upper, lower, number), password mismatch, fullName minimum
- `forgotPasswordSchema` — email validation

### 5. `src/services/__tests__/supabase.test.ts`
- `isAbortError()` — AbortError instances, non-abort errors, unknown types
- `withRetry()` — succeeds first try, retries on AbortError, respects maxRetries, rethrows non-AbortErrors

## Decisions

- No component rendering tests — focus on logic
- No @testing-library needed for app tests (pure logic + Zustand store)
- Zustand store tested by calling actions and checking state directly
- Mock Supabase only for dashboard revenue stats (website)
- Test file convention: `__tests__/` directory colocated with source
