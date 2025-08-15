# Dead Code Documentation

## Overview
This document tracks dead/unused code that has been identified and removed from the ForHer project to maintain a clean codebase.

## Removed API Endpoints (August 15, 2025)

### Summary
**4 AI-powered recommendation APIs were removed** - none were being used anywhere in the codebase.

### Files Removed:

#### 1. `/api/recommendations` 
**File:** `src/app/api/recommendations/route.ts`
- **Purpose**: General AI-powered product recommendations using OpenAI
- **Dependencies**: OpenAI API, Sanity CMS
- **Authentication**: Required (`getAuthenticatedUser()`)
- **Features**: 
  - BMI calculation and eligibility checking
  - AI-powered product scoring
  - Sanity product fetching
  - Weight loss recommendations

#### 2. `/api/bc-recommendations`
**File:** `src/app/api/bc-recommendations/route.ts` 
- **Purpose**: Birth control recommendations using OpenAI
- **Dependencies**: OpenAI API, Sanity CMS
- **Authentication**: Required (`getAuthenticatedUser()`)
- **Features**:
  - Birth control eligibility checking
  - AI-powered contraceptive recommendations
  - Product type filtering (oral, ring, patch, etc.)

#### 3. `/api/hl-recommendations`
**File:** `src/app/api/hl-recommendations/route.ts`
- **Purpose**: Hair loss treatment recommendations using OpenAI
- **Dependencies**: OpenAI API, Sanity CMS  
- **Authentication**: Required (`getAuthenticatedUser()`)
- **Features**:
  - Hair loss assessment
  - Treatment recommendations
  - Product type filtering

#### 4. `/api/consult-recommendations`
**File:** `src/app/api/consult-recommendations/route.ts`
- **Purpose**: General consultation recommendations using OpenAI
- **Dependencies**: OpenAI API, Sanity CMS
- **Authentication**: Required (`getAuthenticatedUser()`)
- **Features**:
  - General health consultation matching
  - AI-powered recommendations

## Analysis Performed

### Code Usage Search
- ✅ **Frontend calls**: Searched all `.tsx` files - no `fetch()` calls to these APIs
- ✅ **Imports**: No components importing or referencing these APIs
- ✅ **Routing**: No navigation or links pointing to these endpoints
- ✅ **References**: Only self-references found (the API files themselves)

### Search Patterns Used:
```bash
# Direct API calls
grep -r "/api/recommendations" src/
grep -r "/api/bc-recommendations" src/
grep -r "/api/hl-recommendations" src/  
grep -r "/api/consult-recommendations" src/

# Fetch patterns
grep -r "fetch.*recommendations" src/
grep -r "api.*recommendations" src/

# General references
grep -r "recommendations" src/
```

## Impact Assessment

### Benefits of Removal:
- ✅ **Reduced API surface area** - 4 fewer endpoints to maintain
- ✅ **Removed OpenAI dependency** - No longer need OpenAI API key/costs for unused features
- ✅ **Simplified codebase** - Less complexity to maintain
- ✅ **Improved security** - Fewer authenticated endpoints to secure
- ✅ **Cleaner documentation** - API documentation more accurate

### No Breaking Changes:
- ✅ **No frontend impact** - No UI components were using these APIs
- ✅ **No user impact** - No user-facing features affected
- ✅ **No admin impact** - No admin tools using these endpoints

## Common Patterns in Removed Code

### Shared Dependencies:
```typescript
import OpenAI from 'openai';
import { client } from '@/sanity/lib/client';
import { getAuthenticatedUser } from '@/utils/apiAuth';
```

### Shared Structure:
1. Authentication check with `getAuthenticatedUser()`
2. Request validation
3. Sanity CMS product fetching
4. OpenAI API call for recommendations
5. Product scoring and filtering
6. Response formatting

### TypeScript Interfaces:
All APIs used similar interfaces:
- `Product` - Sanity product structure
- `ProductScore` / `Recommendation` - AI scoring results
- Request/Response types for API contracts

## Related Files (Not Removed)

### Dependencies Still Used Elsewhere:
- ✅ **OpenAI**: Still used in other parts of the application
- ✅ **Sanity**: Core CMS, extensively used
- ✅ **Authentication utilities**: Used by other protected APIs

### Form Data Processing:
The removed APIs referenced form data from:
- `src/app/c/wm/lose-weight/data/questions.ts` (weight loss)
- `src/app/c/b/birth-control/data/questions.ts` (birth control)
- `src/app/c/hl/hair-loss/data/questions.ts` (hair loss)

These files are still used by the actual form interfaces.

## Future Considerations

### If Recommendation Features Are Needed:
1. **Implement UI first** - Create the user interface that will consume the API
2. **Design data flow** - Plan how recommendations will be displayed/used
3. **Consider alternatives** - Static recommendations vs AI-powered
4. **Evaluate necessity** - Do users need AI recommendations or simple product listings?

### Current Approach:
The application currently uses:
- **Static subscription grids** - `WeightLossSubscriptionGrid`, `HairLossSubscriptionGrid`, etc.
- **Direct product display** - Products shown directly from Sanity CMS
- **Simple eligibility checks** - Form-based eligibility without AI

## Removal Execution

### Date: August 15, 2025
### Method: Direct file deletion
### Commands Used:
```bash
rm src/app/api/recommendations/route.ts
rm src/app/api/bc-recommendations/route.ts  
rm src/app/api/hl-recommendations/route.ts
rm src/app/api/consult-recommendations/route.ts
```

### Verification:
```bash
# Confirm no remaining references
grep -r "recommendations" src/ | grep -v "docs/"
```

---

**Note**: This removal was part of codebase cleanup and optimization. The removed code was well-written but unused, representing potential future features that were never implemented in the UI layer.