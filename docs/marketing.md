# Facebook Marketing Data Guide

## What Data We Collect for Facebook Ads

Our website automatically tracks user behavior and sends rich data to Facebook for advanced advertising campaigns. This data helps you create highly targeted ads and measure campaign performance.

---

## 📊 Customer Journey Tracking

### 1. **Survey Start** (Lead Event)
- **When**: User begins weight loss assessment
- **Data**: Basic engagement tracking
- **Use for**: Top-of-funnel awareness campaigns

### 2. **Survey Completion** (CompleteRegistration Event)
- **When**: User completes assessment with contact info
- **Data Available**:
  - BMI value (e.g., 28.5, 32.1)
  - Age group (18-24, 25-34, 35-44, etc.)
  - Medical eligibility (qualified/not qualified)
  - State location
- **Use for**: Lead generation campaigns, qualified prospect targeting

### 3. **Results Page View** (ViewContent Event)
- **When**: User sees their assessment results
- **Data**: Eligibility status, recommended medication
- **Use for**: Retargeting warm prospects

### 4. **Subscription Page View** (ViewContent Event)
- **When**: User visits specific medication page
- **Data Available**:
  - Medication type (Semaglutide or Tirzepatide)
  - Price viewed ($200, $600, $1200)
  - Specific product page URL
- **Use for**: Product-specific retargeting

### 5. **Variant Selection** (AddToCart Event)
- **When**: User selects dosage/billing plan
- **Data Available**:
  - Dosage amount (2.5mg, 5mg, etc.)
  - Billing cycle (monthly, 3-month, 6-month, annual)
  - Price point ($200-$1200)
- **Use for**: Price sensitivity analysis, plan preference targeting

### 6. **Purchase Attempt** (InitiateCheckout Event)
- **When**: User clicks "Buy Now" button
- **Data**: Final price, coupon usage, selected plan
- **Use for**: Cart abandonment campaigns

### 7. **Purchase Success** (Purchase Event)
- **When**: Payment completed successfully
- **Data**: Transaction value, subscription plan, billing cycle
- **Use for**: Conversion optimization, lookalike audiences

---

## 🎯 Marketing Campaign Ideas

### **Awareness Campaigns**
- **Target**: People similar to survey starters
- **Message**: "Take our free weight loss assessment"
- **Audience**: Lookalike of Lead events

### **Lead Generation**
- **Target**: Survey starters who didn't complete
- **Message**: "Finish your assessment for personalized results"
- **Audience**: Lead event BUT NOT CompleteRegistration event

### **Qualification Campaigns**
- **Target**: People with high BMI (30+) who completed survey
- **Message**: "You may qualify for prescription weight loss medication"
- **Audience**: CompleteRegistration + BMI ≥ 30 + Eligible = true

### **Product-Specific Retargeting**
- **Target**: People who viewed Semaglutide vs Tirzepatide
- **Message**: Medication-specific benefits and testimonials
- **Audience**: ViewContent + content_ids = "semaglutide" or "tirzepatide"

### **Price-Based Targeting**
- **Target**: Users who viewed high-value plans ($1000+)
- **Message**: "Premium plans with maximum results"
- **Audience**: AddToCart + value > 1000

### **Cart Abandonment**
- **Target**: Users who started checkout but didn't purchase
- **Message**: "Complete your order - limited time offer"
- **Audience**: InitiateCheckout BUT NOT Purchase

### **Lookalike Audiences**
- **High-Value Customers**: Purchase + value > 800
- **Annual Subscribers**: Purchase + billing_cycle = "annually"
- **Quick Converters**: CompleteRegistration to Purchase within 7 days

---

## 📈 Custom Conversions to Set Up

### **Qualified Lead**
- **Event**: CompleteRegistration
- **Filter**: eligible = true AND bmi ≥ 25
- **Value**: Lead generation campaigns

### **Product Interest - Semaglutide**
- **Event**: ViewContent
- **Filter**: content_ids contains "semaglutide"
- **Value**: Product-specific campaigns

### **Product Interest - Tirzepatide**
- **Event**: ViewContent
- **Filter**: content_ids contains "tirzepatide"
- **Value**: Product-specific campaigns

### **High-Intent Prospect**
- **Event**: AddToCart
- **Filter**: value > 500
- **Value**: Premium targeting

### **Premium Purchase**
- **Event**: Purchase
- **Filter**: value > 800
- **Value**: High-value customer identification

---

## 🎯 Audience Segments Available

### **By BMI Category**
- **Overweight**: BMI 25-29.9
- **Obese Class I**: BMI 30-34.9
- **Obese Class II+**: BMI 35+

### **By Price Sensitivity**
- **Budget-Conscious**: Viewed plans under $400
- **Mid-Range**: Viewed plans $400-800
- **Premium**: Viewed plans $800+

### **By Engagement Level**
- **Browsers**: ViewContent only
- **Considerers**: AddToCart events
- **Buyers**: Purchase events

### **By Product Preference**
- **Semaglutide Interested**: Viewed semaglutide pages
- **Tirzepatide Interested**: Viewed tirzepatide pages
- **Undecided**: Viewed both products

### **By Billing Preference**
- **Monthly Subscribers**: Selected monthly billing
- **Quarterly Subscribers**: Selected 3-month plans
- **Annual Subscribers**: Selected yearly plans

---

## 💡 Advanced Targeting Strategies

### **Geographic Targeting**
- Focus on states where we can ship (29 states available)
- Exclude states where Akina Pharmacy cannot deliver

### **Demographic Layering**
- Women 25-55 (primary target)
- Higher income brackets ($50k+)
- Health and wellness interests

### **Behavioral Combinations**
- High BMI + High intent + Premium price viewing
- Qualified prospects + Cart abandoners
- Semaglutide viewers + High engagement

### **Exclusion Strategies**
- Exclude recent purchasers from acquisition ads
- Exclude non-eligible prospects from qualification campaigns

---

## 📊 Performance Tracking

### **Key Metrics to Monitor**
- **Cost per qualified lead** (CompleteRegistration with eligible = true)
- **Survey completion rate** (CompleteRegistration / Lead)
- **Product page conversion** (AddToCart / ViewContent)
- **Checkout conversion** (Purchase / InitiateCheckout)
- **Average order value** by audience segment

### **Optimization Opportunities**
- A/B test messaging for different BMI ranges
- Compare Semaglutide vs Tirzepatide ad performance
- Test price points and billing cycle preferences
- Optimize for high-value customer acquisition

---

## 🚀 Getting Started

1. **Set up Custom Conversions** in Facebook Business Manager
2. **Create Custom Audiences** based on user behavior
3. **Build Lookalike Audiences** from your best customers
4. **Test different campaign objectives** (Awareness, Traffic, Conversions)
5. **Monitor performance** and optimize based on data

This rich data foundation allows for sophisticated, data-driven advertising campaigns that can significantly improve your return on ad spend and customer acquisition efficiency.