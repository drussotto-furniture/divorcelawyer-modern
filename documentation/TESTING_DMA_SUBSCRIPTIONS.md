# Testing DMA-Level Subscriptions

This guide will help you test the new DMA-level subscription system where lawyers can have different subscriptions in different DMAs.

## 1. Verify Migration Data

First, verify that the migration created the table and migrated existing data:

```sql
-- Check if table exists
SELECT COUNT(*) FROM lawyer_dma_subscriptions;

-- Check subscriptions for a specific lawyer
SELECT 
  l.first_name,
  l.last_name,
  d.name as dma_name,
  d.code as dma_code,
  lds.subscription_type
FROM lawyer_dma_subscriptions lds
JOIN lawyers l ON l.id = lds.lawyer_id
JOIN dmas d ON d.id = lds.dma_id
ORDER BY l.last_name, d.name
LIMIT 20;

-- Check if lawyers have subscriptions in multiple DMAs
SELECT 
  lawyer_id,
  COUNT(*) as dma_count
FROM lawyer_dma_subscriptions
GROUP BY lawyer_id
HAVING COUNT(*) > 1;
```

## 2. Test Admin UI - Setting Subscriptions Per DMA

### Test Case 1: Edit a Lawyer and Set Different Subscriptions

1. Go to `/admin/directory/lawyers`
2. Click on any lawyer to edit
3. Navigate to the **Service Areas** section
4. You should see:
   - Each service area (DMA) has its own subscription dropdown
   - A default subscription field in the Subscription section
5. **Test Steps:**
   - Add 2 service areas (DMAs) for the lawyer
   - Set one DMA to "Premium" subscription
   - Set the other DMA to "Free" subscription
   - Save the lawyer
6. **Verify:**
   - Check the database to confirm both subscriptions were saved:
   ```sql
   SELECT 
     d.name as dma_name,
     lds.subscription_type
   FROM lawyer_dma_subscriptions lds
   JOIN dmas d ON d.id = lds.dma_id
   JOIN lawyers l ON l.id = lds.lawyer_id
   WHERE l.id = '<lawyer_id>';
   ```

### Test Case 2: Auto-Population from Zip Code

1. Create a new lawyer or edit an existing one
2. Set the `office_zip_code` field
3. **Verify:**
   - The first service area should auto-populate with the DMA from that zip code
   - The subscription should default to the lawyer's default subscription type

## 3. Test Search Results - Subscription Grouping

### Test Case 3: Search by Zip Code (Single DMA)

1. Use a zip code that maps to a DMA (e.g., Miami: 33131, Los Angeles: 90069, Dallas: 75001)
2. Search for lawyers by that zip code
3. **Verify:**
   - Lawyers should be grouped by subscription type (Premium, Enhanced, Basic, Free)
   - Each lawyer should appear in the group matching their subscription for that DMA
   - Limits should be applied per subscription type

**Test Query:**
```typescript
// In your browser console or API route
const result = await getLawyersByZipCodeWithSubscriptionLimits('33131');
console.log('Grouped by subscription:', result.groupedBySubscription);
console.log('DMA:', result.dma);
```

### Test Case 4: Search by State (Multiple DMAs - Edge Case)

This is the critical edge case: a lawyer in multiple DMAs should appear in the **highest** subscription tier.

**Setup:**
1. Find or create a lawyer that is in 2 different DMAs
2. Set one DMA subscription to "Premium" (sort_order: 1)
3. Set the other DMA subscription to "Free" (sort_order: 0)

**Test:**
1. Search for lawyers by state (e.g., "Georgia" or "GA")
2. **Verify:**
   - The lawyer should appear in the "Premium" group (highest subscription)
   - Not in the "Free" group
   - The system should pick the subscription with the lowest sort_order (highest tier)

**Test Query:**
```typescript
const result = await getLawyersByStateWithSubscriptionLimits('Georgia');
// Check that lawyers in multiple DMAs appear in highest subscription tier
```

### Test Case 5: Search by City

1. Search for lawyers by city name
2. **Verify:**
   - Lawyers are grouped correctly by subscription
   - DMA-specific subscriptions are used

## 4. Test Subscription Limits

### Test Case 6: Verify Limits Are Applied Per DMA

1. Check the subscription limits checker: `/admin/tools/subscription-limits-checker`
2. **Verify:**
   - The checker shows lawyers per DMA and subscription type
   - Limits are correctly applied per DMA
   - Global limits are used as fallback

## 5. Test Edge Cases

### Test Case 7: Lawyer with No DMA Subscription

**Scenario:** A lawyer has a service area (DMA) but no subscription set for that DMA.

**Expected:** Should fall back to the lawyer's default `subscription_type` field.

**Test:**
1. Create a lawyer with a service area
2. Don't set a subscription for that DMA (or delete it)
3. Search for lawyers in that DMA
4. **Verify:** Lawyer appears using their default subscription type

### Test Case 8: Lawyer in Multiple DMAs with Same Subscription

**Scenario:** Lawyer has Premium in DMA 1 and Premium in DMA 2.

**Expected:** Should appear in Premium group (no change, but verifies logic works)

## 6. Database Verification Queries

Use these queries to verify the system is working:

```sql
-- Find lawyers with multiple DMA subscriptions
SELECT 
  l.first_name || ' ' || l.last_name as lawyer_name,
  COUNT(lds.dma_id) as dma_count,
  STRING_AGG(d.name || ' (' || lds.subscription_type || ')', ', ') as dmas_and_subscriptions
FROM lawyers l
JOIN lawyer_dma_subscriptions lds ON l.id = lds.lawyer_id
JOIN dmas d ON d.id = lds.dma_id
GROUP BY l.id, l.first_name, l.last_name
HAVING COUNT(lds.dma_id) > 1
ORDER BY dma_count DESC;

-- Check subscription distribution per DMA
SELECT 
  d.name as dma_name,
  lds.subscription_type,
  COUNT(*) as lawyer_count
FROM lawyer_dma_subscriptions lds
JOIN dmas d ON d.id = lds.dma_id
GROUP BY d.name, lds.subscription_type
ORDER BY d.name, lds.subscription_type;

-- Verify test data has subscriptions
SELECT 
  l.first_name || ' ' || l.last_name as lawyer_name,
  l.is_test_data,
  COUNT(lds.id) as subscription_count
FROM lawyers l
LEFT JOIN lawyer_dma_subscriptions lds ON l.id = lds.lawyer_id
WHERE l.is_test_data = true
GROUP BY l.id, l.first_name, l.last_name, l.is_test_data
ORDER BY subscription_count DESC;
```

## 7. Frontend Testing Checklist

- [ ] Admin form shows subscription dropdown per DMA
- [ ] Default subscription is used for new service areas
- [ ] Saving a lawyer persists DMA subscriptions correctly
- [ ] Search results group lawyers by subscription correctly
- [ ] Lawyers in multiple DMAs appear in highest subscription tier
- [ ] Subscription limits are applied correctly
- [ ] Limits checker shows correct counts per DMA

## 8. Quick Test Script

Run this in your browser console on the admin lawyers page:

```javascript
// Test that subscriptions are loaded
const testLawyerId = 'YOUR_TEST_LAWYER_ID';
const response = await fetch(`/api/test-dma-subscriptions?lawyer_id=${testLawyerId}`);
const data = await response.json();
console.log('DMA Subscriptions:', data);
```

## Expected Results Summary

✅ **Migration:** All lawyers have DMA subscriptions (or fallback to default)
✅ **Admin UI:** Can set different subscriptions per DMA
✅ **Search by Zip:** Lawyers grouped correctly by DMA subscription
✅ **Search by State:** Lawyers in multiple DMAs appear in highest tier
✅ **Limits:** Applied correctly per DMA and subscription type
✅ **Fallback:** Default subscription used when no DMA subscription exists

## Troubleshooting

If something doesn't work:

1. **Check database:** Verify `lawyer_dma_subscriptions` table has data
2. **Check logs:** Look for errors in browser console and server logs
3. **Verify queries:** Use the SQL queries above to inspect data
4. **Check RLS:** Ensure RLS policies allow reading subscriptions
5. **Verify types:** Ensure all UUIDs are properly converted to strings for `location_value` comparisons


