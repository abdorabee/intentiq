# Onboarding Redesign Summary

## Branch
`cursor/onboarding-signed-frames-d387`

## Pull Request
[PR #34](https://github.com/abdorabee/vesperwise/pull/34) - Draft

## Implementation Checklist

### ✅ Visual Design (Matches Signed Frames)
- [x] Removed left sidebar completely
- [x] Single-column centered layout (~600px max-width)
- [x] 44px height radio/checkbox buttons
- [x] "VESPERWISE." wordmark top-left
- [x] "n OF 4" step indicator top-right
- [x] "Saved when you finish" subtitle top-right
- [x] 20px title with muted subtitle
- [x] Clean one-column option rows with 2.5 gap
- [x] RadioButton for single-choice fields
- [x] CheckboxButton for multi-choice (industries)
- [x] No glow effects, no two-column grids, no marketing copy

### ✅ Behavior Changes
- [x] Skip button appears on step 3 (Buying motion)
- [x] Skip button appears on step 4 (Deal profile)
- [x] Steps 0-1 required (Offer + Ideal accounts)
- [x] Steps 2-3 optional (can be skipped)
- [x] Finish redirects to `/score` instead of `/dashboard`

### ✅ Schema Updates
- [x] `buyer_role` now optional in business-profile.ts
- [x] `sales_motion` now optional in business-profile.ts
- [x] `deal_size` now optional in business-profile.ts
- [x] `sales_cycle` now optional in business-profile.ts
- [x] Validation only checks steps 0-1

### ✅ Testing
- [x] Updated onboarding-profile.test.ts
- [x] Updated business-profile.test.ts
- [x] Added tests for Skip behavior
- [x] Added tests for optional commercial fields
- [x] All tests pass (14/14)

### ✅ Build & Deploy
- [x] Next.js build successful
- [x] ESLint passes (no errors in onboarding code)
- [x] Branch pushed to remote
- [x] Draft PR created with proper description
- [x] PR marked "do not merge" until founder approval

## Review Steps (4 frames)

1. **Step 1 - Your offer** (1 OF 4)
   - Radio buttons in single column
   - Consulting / Services, SaaS / Software, Hardware / Physical, Marketplace / Platform, Something else
   - Back (disabled) | Continue

2. **Step 2 - Ideal accounts** (2 OF 4)
   - Industries as checkboxes (multi-select)
   - "Add another industry" input + "Add industry" button
   - Company size as radio buttons
   - Back | Continue (no Skip)

3. **Step 3 - Buying motion** (3 OF 4)
   - "Who is your primary buyer?" radio buttons
   - "How does your team sell?" radio buttons
   - Back | Skip | Continue

4. **Step 4 - Deal profile** (4 OF 4)
   - "Typical deal size" radio buttons
   - "Typical sales cycle" radio buttons
   - "Review your profile" recap box with all 7 fields
   - Back | Skip | Finish setup

## Files Changed
- `components/onboarding/onboarding-wizard.tsx` - Complete redesign
- `lib/business-profile.ts` - Made 4 fields optional
- `lib/onboarding-profile.ts` - Removed steps 2-3 validation
- `lib/onboarding-profile.test.ts` - Updated validation tests
- `lib/business-profile.test.ts` - Added optional field tests

## Next Steps
**User must:**
1. Review the PR preview deployment
2. Click through all 4 steps to verify visual match
3. Test Skip functionality on steps 3 and 4
4. Confirm finish redirects to `/score`
5. Approve merge or request changes

**Do not merge** until founder click-through is complete.

---

## Design QA Fixes (Commit c5b63eb)

All six issues from design QA have been fixed to match the signed frames:

### ✅ 1. Choice Rows - Indicator on Left
- Radio/checkbox indicator now on LEFT side (not right)
- Selected row shows 2px lime inset bar on left edge
- Gap-3 between indicator and label text
- No more detached orbs floating right

### ✅ 2. Removed Glow Effect
- Killed `shadow-[0_0_12px_rgba(223,255,0,0.4)]` on selected indicators
- Selected rows now have: thin lime border + left inset bar only
- Clean, minimal selection state

### ✅ 3. Button Label Centering
- All buttons use `flex items-center justify-center`
- Labels optically centered horizontally and vertically
- Back, Skip, Continue, Finish setup, Add industry all ~44px height
- Even padding, consistent radius

### ✅ 4. Header Chrome Fixed
- Wordmark: "VESPERWISE" with lime period `<span className="text-[#dfff00]">.</span>`
- Next row (mt-3): "n OF 4" on LEFT, "Saved when you finish" on RIGHT
- No stacking step + persist on right of logo

### ✅ 5. Title Typography
- Changed from `text-xl font-normal` (400)
- Now `text-xl font-medium` (500) as signed

### ✅ 6. Custom Industries
- Input + "Add industry" button only
- Removed lime wrap chips display
- Custom industries silently added to selection (visible in recap)

All changes pushed to PR #34. Preview will rebuild automatically.

---

## Clerk Authentication Fix (Commit 27eade3)

Fixed the preview deployment redirect issue that was bouncing users to production.

### Problem
Preview deployments at `*.vercel.app` were unusable because:
1. Production Clerk at `accounts.vesperwise.com` redirected to `www.vesperwise.com` after auth
2. `/onboarding` required authentication via `clerkMiddleware`
3. Reviewers couldn't access preview onboarding without production account

### Solution: Preview-Only Escape Hatch

**For Preview Environments (VERCEL_ENV !== "production"):**
- `/onboarding` is public (added to proxy.ts public routes)
- Page renders `OnboardingWizard` without auth check
- Allows visual QA without Clerk sign-in

**For Production:**
- `/onboarding` remains fully auth-protected
- Normal authentication flow via Clerk
- No security changes to production

### Additional Improvements
- Changed `signInFallbackRedirectUrl` → `afterSignInUrl` in ClerkProvider
- Changed `signUpFallbackRedirectUrl` → `afterSignUpUrl` in ClerkProvider
- Added `allowedRedirectOrigins` for preview URLs in ClerkProvider
- Made redirect handling origin-relative

### Root Cause Documentation
The complete fix requires **Clerk Dashboard configuration** that cannot be done in code:
- Whitelist `*.vercel.app` as allowed redirect origins
- Add preview URLs as satellite domains
- Configure production Clerk to allow preview redirects

This escape hatch allows founder visual QA on preview deployments without modifying production Clerk settings.

### Preview Access
Once the Vercel deployment completes:
1. Navigate to `https://<preview-url>/onboarding`
2. Page loads without authentication (preview only)
3. All 6 design fixes visible
4. Skip buttons work on steps 3 & 4
5. Form validates but won't save without auth (expected)

No production Clerk signup required for visual review.
