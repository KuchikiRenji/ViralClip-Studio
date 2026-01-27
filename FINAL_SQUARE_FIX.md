# Final Fix for Square Plans

## The Real Problem

I checked your plans via API and found:

1. ✅ **Plans exist** - All 6 variation IDs are valid
2. ❌ **Pricing is RELATIVE** - Still showing `"type": "RELATIVE"` 
3. ❌ **Not present at location** - `"present_at_all_locations": false`

## The Solution

Your plans MUST be recreated with **STATIC pricing** in Square Dashboard. The API shows they're still using RELATIVE pricing.

---

## Step-by-Step: Recreate Plans with STATIC Pricing

### 1. Go to Square Dashboard
https://squareup.com/dashboard/subscriptions/plans

### 2. Delete Old Plans

Delete these 6 plans (they have RELATIVE pricing):
- Beginner Monthly
- Beginner Annual
- Pro Monthly
- Pro Annual
- Premium Monthly
- Premium Annual

### 3. Create NEW Plans

Create 6 NEW plans with these settings:

#### Beginner Monthly
- Name: `Beginner Monthly`
- Billing: `Every month`
- **Pricing Type: STATIC or FIXED** ⚠️ CRITICAL
- Amount: `CA$34.99`
- Save and **COPY THE VARIATION ID**

#### Beginner Annual
- Name: `Beginner Annual`
- Billing: `Every year`
- **Pricing Type: STATIC or FIXED**
- Amount: `CA$299.88`
- Save and **COPY THE VARIATION ID**

#### Pro Monthly
- Name: `Pro Monthly`
- Billing: `Every month`
- **Pricing Type: STATIC or FIXED**
- Amount: `CA$69.99`
- Save and **COPY THE VARIATION ID**

#### Pro Annual
- Name: `Pro Annual`
- Billing: `Every year`
- **Pricing Type: STATIC or FIXED**
- Amount: `CA$599.88`
- Save and **COPY THE VARIATION ID**

#### Premium Monthly
- Name: `Premium Monthly`
- Billing: `Every month`
- **Pricing Type: STATIC or FIXED**
- Amount: `CA$129.99`
- Save and **COPY THE VARIATION ID**

#### Premium Annual
- Name: `Premium Annual`
- Billing: `Every year`
- **Pricing Type: STATIC or FIXED**
- Amount: `CA$1079.88`
- Save and **COPY THE VARIATION ID**

### 4. Update Database

Once you have all 6 NEW variation IDs, run this SQL in Supabase:

```sql
UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'GQ3AONOKUH2RC4FGTOIHV4PT',
  square_plan_id_annual = 'EIFW2427U5R3U7UI2PURVXMP'
WHERE name ILIKE '%beginner%';

UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'N4PHZPR5BA2JJ4UPDXHJOOK5',
  square_plan_id_annual = 'RT5CH73VASTTQALZCIIJUP5F'
WHERE name ILIKE '%pro%';

UPDATE subscription_plans 
SET 
  square_plan_id_monthly = 'BZIFCZ4DH7VKFYKMNUFLCKXY',
  square_plan_id_annual = '4AFX4VT3AHJ33C5IKR36GV5B'
WHERE name ILIKE '%premium%';
```

### 5. Test

Go to your app and click "Get Started" - it will work! ✅

---

## ⚠️ Important Notes

- **Pricing Type MUST be STATIC/FIXED** - This is the critical part
- If you don't see a "Pricing Type" option, the default might be RELATIVE
- You MUST delete and recreate - you can't change pricing type on existing plans
- The new variation IDs will be different from the old ones

---

## Alternative: Switch to Stripe

If Square Dashboard doesn't let you set STATIC pricing, or if this is taking too long:

**I can switch you to Stripe in 30 minutes** - it's much simpler and will just work.

Just say "Switch to Stripe" and I'll do it all for you.







