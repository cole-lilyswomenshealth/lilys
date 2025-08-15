# Salesforce API Test - Direct cURL Command

## Test the weight-loss-lead API directly on production

### Basic Test Request:

```bash
curl -X POST https://www.lilyswomenshealth.com/api/weight-loss-lead \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "age-group": "25-34",
      "gender": "yes",
      "current-weight": "180",
      "height": "{\"feet\":5,\"inches\":6}",
      "pregnant": "no",
      "breastfeeding": "no",
      "medical-conditions": ["none"],
      "prescription-medications": "no",
      "eating-disorder": "no",
      "previous-weight-loss": "Diet and exercise"
    },
    "contactInfo": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "phone": "+1234567890",
      "state": "VA",
      "dateOfBirth": "1990-01-01"
    }
  }'
```

### Expected Response (Success):
```json
{
  "success": true,
  "message": "Request processed successfully"
}
```

### Expected Response (Failure):
```json
{
  "success": false,
  "error": "Processing failed: [DETAILED ERROR MESSAGE]"
}
```

### How to Test:

1. **Copy the curl command above**
2. **Run it in your terminal**
3. **Check the response immediately**
4. **Then check Vercel logs**:
   ```bash
   vercel logs --follow | grep "SALESFORCE_DEBUG"
   ```

### What Each Field Tests:

- **formData**: All required form fields with valid data
- **contactInfo**: Required contact information
- **height**: JSON string format (as expected by the form)
- **state**: "VA" (Virginia - supported by Akina Pharmacy)
- **email**: Valid format for Salesforce Lead

### Alternative Test with Minimal Data:

```bash
curl -X POST https://www.lilyswomenshealth.com/api/weight-loss-lead \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "age-group": "25-34",
      "gender": "yes"
    },
    "contactInfo": {
      "firstName": "Test",
      "lastName": "User", 
      "email": "test@example.com"
    }
  }'
```

### Debug Steps:

1. **Run the curl command**
2. **Note the HTTP status code**
3. **Check the JSON response**
4. **Monitor Vercel logs in real-time**:
   ```bash
   vercel logs --since=1m | grep "SALESFORCE_DEBUG"
   ```

This will show you exactly what's happening in the Salesforce integration on your production environment!