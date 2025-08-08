# Qualiphy Packages Integration Documentation

## Overview
This document describes the implementation of dynamic `exam_pos_id` selection for Qualiphy API appointments, enabling proper dosage progression for Semaglutide and Tirzepatide prescriptions.

## Problem Solved
Previously, appointments were booked without specifying the correct dosage package (`exam_pos_id`). Qualiphy requires this parameter to ensure patients receive the appropriate medication dose based on their treatment progression.

## Implementation Details

### Files Modified
- **`src/app/api/qualiphy/route.ts`** - Main Qualiphy API integration
- **Database Schema** - Added `exam_pos_id` and `dose_level` columns to `user_data` table

### Key Functions Added

#### `getExamPosId(examId: number, state: string): Promise<number>`
**Location:** `src/app/api/qualiphy/route.ts:100-146`

Dynamically fetches pharmacy packages from Qualiphy API and selects the appropriate dose 1 package.

**Process:**
1. Calls Qualiphy `partner_pharmacy_treatment_packages` API
2. Filters packages by medication type and dose level
3. Returns correct `exam_pos_id` for dose 1
4. Falls back to hardcoded values if API fails

**Filtering Logic:**
- **Semaglutide (exam_id: 2413)**: Looks for titles containing "Semaglutide - Injection - Dose 1"
- **Tirzepatide (exam_id: 2414)**: Looks for titles containing "Dose 1:" or "eDose 1:"
- **Exclusions**: Filters out Niacinamide variants and "Weekly" packages

### Database Schema Changes
```sql
-- Added to user_data table
ALTER TABLE user_data ADD COLUMN exam_pos_id INTEGER;
ALTER TABLE user_data ADD COLUMN dose_level INTEGER DEFAULT 1;
```

### API Payload Enhancement
The Qualiphy appointment payload now includes:
```typescript
const qualiphyPayload = {
  api_key: process.env.QUALIPHY_API_KEY,
  exams: [examId],
  exam_pos_id: examPosId, // ← NEW: Dynamic package selection
  first_name: firstName,
  // ... rest of existing fields
};
```

## Package Examples

### Semaglutide Packages (exam_id: 2413)
From Qualiphy API response, we select:
- **Dose 1**: `exam_pos_id: 9608` - "Semaglutide - Injection - Dose 1: 0.25mg/week"
- **Dose 2**: `exam_pos_id: 9609` - "Semaglutide - Injection - Dose 2: 0.5mg/week" 
- **Dose 3**: `exam_pos_id: 9610` - "Semaglutide - Injection - Dose 3: 1mg/week"
- **Dose 4**: `exam_pos_id: 11032` - "Semaglutide - Injection - Dose 4: 1.7mg/week"
- **Dose 5**: `exam_pos_id: 9611` - "Semaglutide - Injection - Dose 5+: 2.4mg/week"

### Tirzepatide Packages (exam_id: 2414)
From Qualiphy API response, we select:
- **Dose 1**: `exam_pos_id: 9680` - "for eDose 1: 2.5mg/week - Total 10mg"
- **Dose 2**: `exam_pos_id: 9735` - "Dose 2: 5mg/week - Total 20mg"
- **Dose 3**: `exam_pos_id: 9681` - "Dose 3: 7.5mg/week - Total 30mg"
- **Dose 4**: `exam_pos_id: 9736` - "Dose 4: 10mg/week - Total 40mg"
- **Dose 5**: `exam_pos_id: 9737` - "Dose 5: 12.5mg/week - Total 50mg"
- **Dose 6**: `exam_pos_id: 9682` - "Dose 6: 15mg/week - Total: 60mg"

## Current Implementation (Phase 1)

### Dose Level Logic
```typescript
const doseLevel = 1; // Phase 1: Always dose 1 for new users
```

**Current Behavior:**
- All new appointments default to dose 1
- System dynamically fetches correct `exam_pos_id` for dose 1 based on user's state
- Ensures state-specific package availability as recommended by Qualiphy

### Admin Visibility
Admins can track Qualiphy API calls through Supabase dashboard:
- **`exam_pos_id`**: Which specific package was sent to Qualiphy
- **`dose_level`**: User's current dose level (currently always 1)
- **`meeting_url`**: Resulting appointment URL
- **`submission_count`**: Number of appointments booked

## Future Implementation (Phase 2)

### Planned Dose Progression
When subscription renewal system is implemented:

```typescript
async function getUserDoseLevel(userEmail: string, examId: number): Promise<number> {
  const { data: subscriptions } = await supabaseAdmin
    .from('user_subscriptions')
    .select('*')
    .eq('user_email', userEmail)
    .eq('exam_id', examId)
    .eq('status', 'completed');
  
  const completedCount = subscriptions?.length || 0;
  return Math.min(completedCount + 1, examId === 2413 ? 5 : 6);
}
```

**Future Behavior:**
- 1st subscription = Dose 1
- 2nd subscription = Dose 2  
- Progression continues up to maximum dose (5 for Semaglutide, 6 for Tirzepatide)

## Error Handling

### Fallback Strategy
If Qualiphy packages API fails, system falls back to known dose 1 `exam_pos_id`:
- **Semaglutide**: `9608`
- **Tirzepatide**: `9680`

### Logging
Errors are logged to console for debugging:
```typescript
console.error('Error fetching Qualiphy packages:', error);
```

## Benefits

### 1. **Dynamic Package Selection**
- Always uses current packages available in user's state
- Handles Qualiphy package updates automatically
- No manual configuration required per state

### 2. **Future-Ready Architecture**
- Easy to add dose progression when subscription system is built
- Minimal code changes required for Phase 2 implementation
- Scalable for mobile app and agentic network expansion

### 3. **Improved Patient Care**
- Ensures correct medication dosage based on treatment stage
- Prevents dosage errors in prescription fulfillment
- Supports proper GLP-1 medication titration protocol

### 4. **Admin Transparency**
- Complete visibility into which packages are selected
- Easy debugging of appointment booking issues
- Clear audit trail for all Qualiphy API calls

## Testing Recommendations

### 1. **State-Specific Testing**
Test package fetching for different states to ensure proper filtering:
```bash
# Test different states
curl -X POST /api/qualiphy -d '{"state": "NY", "examId": 2413, ...}'
curl -X POST /api/qualiphy -d '{"state": "CA", "examId": 2414, ...}'
```

### 2. **Fallback Testing**
Test behavior when Qualiphy packages API is unavailable:
- Temporarily modify API key to invalid value
- Verify fallback `exam_pos_id` values are used
- Confirm appointments still book successfully

### 3. **Database Verification**
After successful appointments, verify database records:
```sql
SELECT email, exam_pos_id, dose_level, meeting_url 
FROM user_data 
WHERE created_at > NOW() - INTERVAL '1 day';
```

## Maintenance Notes

### Package Updates
If Qualiphy changes package titles or `exam_pos_id` values:
1. Update filtering logic in `getExamPosId()` function
2. Update fallback values if needed
3. Test with different states to ensure compatibility

### Monitoring
Monitor console logs for:
- Package fetching errors
- Unexpected package title formats
- Fallback usage frequency

This implementation provides a robust, scalable foundation for proper Qualiphy integration while maintaining simplicity for future expansion.