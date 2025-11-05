# Email Draft: GoHighLevel Integration

---

**Subject**: GoHighLevel Integration Details - ForHer Platform (Survey Fields + Stripe Webhook Approach)

---

Hi [Name],

Thank you for providing the GHL API details! We're excited to integrate our platform with GoHighLevel.

After reviewing your requirements and our current architecture, I wanted to share our technical approach and provide the detailed information you requested.

---

## Our Technical Approach

**We'll be using a code-based integration** (not Zapier or Make) for the following reasons:
- ✅ Better control over error handling and data validation
- ✅ Consistent with our existing architecture (we already integrate with Salesforce, Supabase, and Stripe via code)
- ✅ Lower latency and more reliable than third-party automation tools
- ✅ Easier to include comprehensive survey data and subscription metadata

**Tech Stack Overview**:
- **Platform**: Next.js 15 (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Payment**: Stripe
- **Current CRM**: Salesforce (will run parallel with GHL)

We'll implement this similarly to our existing Salesforce integration, ensuring non-blocking failures so GHL API issues never prevent users from completing their surveys or purchases.

---

## Part 1: Survey Lead Injection

We have **three consultation flows** that collect comprehensive health data. All forms collect contact information plus specific survey questions:

### Universal Contact Fields (All Surveys)
- First Name
- Last Name
- Email
- Phone (we'll convert to E.164 format: `+15555555555`)
- State (full state name, e.g., "California")
- Date of Birth (YYYY-MM-DD format)

---

### Survey Type 1: Weight Management (`/c/wm`)
**11 survey questions capturing**:

1. **age-group**: "What is your age group?"
   - Options: `18-24`, `25-34`, `35-44`, `45-54`, `55+`

2. **gender**: "Are you female?"
   - Options: `Yes`, `No`

3. **current-weight**: "What is your current weight?"
   - Format: Numeric (pounds)

4. **height**: "What is your height?"
   - Format: `{"feet": 5, "inches": 7}` (we can send as two separate fields if needed)

5. **bmi**: BMI (automatically calculated)
   - Format: Numeric (e.g., `24.5`)

6. **pregnant**: "Are you currently pregnant?"
   - Options: `Yes`, `No`

7. **breastfeeding**: "Are you currently breastfeeding?"
   - Options: `Yes`, `No`

8. **medical-conditions**: "Do you have any of the following medical conditions?"
   - Multi-select (can send as comma-separated string or array):
     - Type 1 Diabetes
     - Type 2 Diabetes
     - Hypertension (High Blood Pressure)
     - PCOS (Polycystic Ovary Syndrome)
     - Thyroid Disorder
     - Heart Disease
     - Kidney or Liver Disease
     - Depression or Anxiety
     - None of the above

9. **prescription-medications**: "Do you take any prescription medications?"
   - Options: `Yes`, `No`

10. **eating-disorder**: "Have you been diagnosed with an eating disorder?"
    - Options: `Yes`, `No`

11. **previous-weight-loss**: "Have you previously tried weight loss programs?"
    - Options: `First attempt`, `Didn't work`, `Worked temporarily`

**Calculated/Derived Fields**:
- **eligible**: Boolean (eligibility status based on survey logic)

---

### Survey Type 2: Hair Loss (`/c/hl`)
**7 survey questions capturing**:

1. **age-group**: Same as Weight Management
2. **gender**: Same as Weight Management
3. **hair-loss-duration**: "When did you first notice hair loss?"
   - Options: `Less than 6 months ago`, `6-12 months ago`, `More than 1 year ago`

4. **affected-areas**: "What areas of your scalp are affected?" (Multi-select)
   - General thinning all over
   - Thinning at the crown
   - Receding hairline
   - Bald spots or patches
   - No noticeable hair loss

5. **medical-conditions**: Hair-specific conditions (Multi-select)
   - PCOS
   - Thyroid disorder
   - Anemia or iron deficiency
   - Autoimmune disorder
   - None

6. **family-history**: "Do you have a family history of hair loss?"
   - Options: `Yes`, `No`

7. **current-treatments**: "Are you currently using any hair loss treatments?"
   - Options: `None`, `Over-the-counter products`, `Prescription treatments`, `Hair procedures`

---

### Survey Type 3: Birth Control (`/c/b`)
**7 survey questions capturing**:

1. **age**: Same as age-group above
2. **gender**: Same as Weight Management
3. **pregnant**: Same as Weight Management
4. **breastfeeding**: Same as Weight Management
5. **medical-conditions**: Birth control-specific conditions (Multi-select)
   - Diabetes
   - High Blood Pressure
   - Heart Disease
   - History of Blood Clots
   - Depression or Anxiety
   - None

6. **bc-history**: "Have you used birth control before?"
   - Options: `Never`, `Yes but had side effects`, `Yes and tolerated it well`

7. **preferred-method**: "Preferred birth control method?"
   - Options: `Pills`, `IUD`, `Implant`, `Not sure yet`

---

### Proposed Tagging Strategy
We can tag leads by survey type:
- **Weight Loss**: `["lead", "weight-loss"]`
- **Hair Loss**: `["lead", "hair-loss"]`
- **Birth Control**: `["lead", "birth-control"]`

Additional tags (optional):
- `["eligible"]` for users who pass eligibility screening
- `["appointment-scheduled"]` for users who book appointments

**Question**: Would you like us to add any other tags or lead source identifiers?

---

## Part 2: Stripe Customer Injection

**We'll use Stripe webhooks** (code-based approach) to send customer data to GHL when someone purchases.

### Webhook Events We'll Monitor:
- `invoice.payment_succeeded` → First successful payment (new customer)
- `customer.subscription.created` → New subscription created
- `customer.subscription.updated` → Subscription changes

### Customer Data We Can Send:

**Basic Contact Info**:
- First Name
- Last Name
- Email
- Phone (E.164 format)
- Tags: `["customer", "stripe"]`

**Subscription Metadata** (as GHL custom fields):
- `subscription_id`: Stripe subscription ID (e.g., `sub_1234567890`)
- `stripe_customer_id`: Stripe customer ID (e.g., `cus_1234567890`)
- `plan_name`: Subscription plan name (e.g., "Semaglutide Monthly Subscription")
- `medication_type`: "Semaglutide" or "Tirzepatide"
- `billing_amount`: Monthly amount (e.g., `297.00`)
- `billing_period`: "month" or "year"
- `subscription_status`: "active", "trialing", "past_due", "canceled"
- `start_date`: Subscription start date (ISO 8601)
- `next_billing_date`: Next billing date (ISO 8601)
- `pharmacy_name`: Assigned pharmacy ("Belmar Pharmacy" or "Revive Rx")
- `dose_level`: Current medication dose level (1, 2, 3, etc.)

**Coupon/Discount Data** (if applicable):
- `coupon_code`: Applied coupon code (e.g., "SAVE20")
- `discount_amount`: Discount amount in dollars
- `discount_percentage`: Discount percentage

**Question**: Do you want all of this subscription metadata, or just a subset?

---

## What We Need From You

### 1. **Custom Field Mapping (REQUIRED)**
To send all this survey and subscription data correctly, we need you to provide the exact GHL custom field names (API keys) for each data point.

**For example**:
```json
{
  "age_group": "contact.custom_age_group",
  "current_weight": "contact.custom_weight",
  "height_feet": "contact.custom_height_ft",
  "bmi": "contact.custom_bmi",
  "subscription_id": "contact.custom_stripe_sub_id",
  ...
}
```

Could you please create custom fields in GHL for:
- ✅ All weight loss survey questions (11 fields)
- ✅ All hair loss survey questions (7 fields)
- ✅ All birth control survey questions (7 fields)
- ✅ Subscription metadata fields (~15 fields)
- ✅ Calculated fields (BMI, eligibility status)

**Alternatively**, if you'd prefer, we can start with just basic contact info + tags and add custom fields in phases.

---

### 2. **Multi-Select Field Format**
For multi-select questions (like medical conditions), would you prefer:
- **Option A**: Comma-separated string (`"Diabetes, Hypertension, PCOS"`)
- **Option B**: Array format (`["Diabetes", "Hypertension", "PCOS"]`)
- **Option C**: Multiple custom fields (one per condition as boolean)

---

### 3. **Contact Update Strategy**
When a survey lead later becomes a paying customer (Stripe purchase):
- Should we **update the existing GHL contact** (merge data)?
- Or **create a new contact** with "customer" tag?
- How does GHL handle duplicate detection (email-based)?

---

### 4. **API Rate Limits**
- What are the rate limits for the contacts API?
- Do you have webhook retry policies if our server is temporarily down?

---

### 5. **Testing Environment**
- Do you have a test/sandbox GHL environment we can use for initial testing?
- Or should we test directly in production with a "test" tag?

---

## Implementation Timeline

Once we receive the custom field mapping:

- **Week 1**: Survey lead injection implementation + testing
- **Week 2**: Stripe webhook integration + testing
- **Week 3**: User acceptance testing (UAT)
- **Week 4**: Production deployment

**Estimated total development time**: 5-7 hours

---

## Additional Context

Our current data flow:
1. User completes survey → We send to **Salesforce** (CRM) + **Supabase** (our database)
2. User purchases → **Stripe** webhook updates **Supabase** subscriptions

We'll add GHL as a parallel integration:
1. Survey → **Salesforce** + **Supabase** + **GHL** (parallel, non-blocking)
2. Stripe purchase → **Supabase** + **GHL** (parallel, non-blocking)

This ensures that even if GHL API fails temporarily, user experience is unaffected.

---

## Questions or Clarifications?

Please let me know:
1. ✅ Can you provide the custom field mapping?
2. ✅ Any preferences on data format (multi-select, dates, etc.)?
3. ✅ Timeline expectations on your end?
4. ✅ Anything else you need from us?

I've also attached our detailed technical documentation for your reference.

Looking forward to getting this integration live!

---

Best regards,
[Your Name]
[Your Title]
ForHer / Lily's Women's Health
[Your Email]
[Your Phone]

---

**Attachments**:
- Technical Documentation: `GOHIGHLEVEL_INTEGRATION.md`
