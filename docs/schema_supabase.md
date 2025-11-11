| table_name          | column_name              | data_type                   | is_nullable | column_default    | constraint_type | references_table    | references_column |
| ------------------- | ------------------------ | --------------------------- | ----------- | ----------------- | --------------- | ------------------- | ----------------- |
| appointment_events  | appointment_id           | uuid                        | YES         | null              | none            | null                | null              |
| appointment_events  | created_at               | timestamp with time zone    | YES         | null              | none            | null                | null              |
| appointment_events  | event_data               | jsonb                       | YES         | null              | none            | null                | null              |
| appointment_events  | event_type               | character varying           | YES         | null              | none            | null                | null              |
| appointment_events  | id                       | uuid                        | NO          | null              | PRIMARY KEY     | appointment_events  | id                |
| appointment_events  | user_id                  | uuid                        | YES         | null              | none            | null                | null              |
| form_responses      | created_at               | timestamp without time zone | YES         | null              | none            | null                | null              |
| form_responses      | id                       | uuid                        | NO          | null              | PRIMARY KEY     | form_responses      | id                |
| form_responses      | responses                | jsonb                       | YES         | null              | none            | null                | null              |
| form_responses      | user_id                  | uuid                        | YES         | null              | none            | null                | null              |
| stripe_customers    | created_at               | timestamp with time zone    | YES         | null              | none            | null                | null              |
| stripe_customers    | email                    | text                        | YES         | null              | none            | null                | null              |
| stripe_customers    | id                       | uuid                        | NO          | null              | PRIMARY KEY     | stripe_customers    | id                |
| stripe_customers    | stripe_customer_id       | text                        | YES         | null              | none            | null                | null              |
| stripe_customers    | user_id                  | uuid                        | YES         | null              | none            | null                | null              |
| subscription_events | created_at               | timestamp with time zone    | YES         | null              | none            | null                | null              |
| subscription_events | event_data               | jsonb                       | YES         | null              | none            | null                | null              |
| subscription_events | event_type               | character varying           | YES         | null              | none            | null                | null              |
| subscription_events | id                       | uuid                        | NO          | null              | PRIMARY KEY     | subscription_events | id                |
| subscription_events | subscription_id          | uuid                        | YES         | null              | none            | null                | null              |
| subscription_events | user_id                  | uuid                        | YES         | null              | none            | null                | null              |
| user_appointments   | appointment_date         | timestamp with time zone    | YES         | null              | none            | null                | null              |
| user_appointments   | appointment_type_id      | character varying           | YES         | null              | none            | null                | null              |
| user_appointments   | completed_date           | timestamp with time zone    | YES         | null              | none            | null                | null              |
| user_appointments   | created_at               | timestamp with time zone    | YES         | null              | none            | null                | null              |
| user_appointments   | customer_name            | character varying           | YES         | null              | none            | null                | null              |
| user_appointments   | duration                 | integer                     | YES         | null              | none            | null                | null              |
| user_appointments   | id                       | uuid                        | NO          | null              | PRIMARY KEY     | user_appointments   | id                |
| user_appointments   | is_deleted               | boolean                     | YES         | null              | none            | null                | null              |
| user_appointments   | is_from_subscription     | boolean                     | YES         | null              | none            | null                | null              |
| user_appointments   | notes                    | text                        | YES         | null              | none            | null                | null              |
| user_appointments   | order_id                 | uuid                        | YES         | null              | none            | null                | null              |
| user_appointments   | payment_method           | text                        | YES         | null              | none            | null                | null              |
| user_appointments   | payment_status           | text                        | YES         | null              | none            | null                | null              |
| user_appointments   | prescription_details     | jsonb                       | YES         | null              | none            | null                | null              |
| user_appointments   | prescription_id          | text                        | YES         | null              | none            | null                | null              |
| user_appointments   | price                    | numeric                     | YES         | null              | none            | null                | null              |
| user_appointments   | qualiphy_exam_id         | integer                     | YES         | null              | none            | null                | null              |
| user_appointments   | qualiphy_exam_status     | character varying           | YES         | null              | none            | null                | null              |
| user_appointments   | qualiphy_meeting_url     | character varying           | YES         | null              | none            | null                | null              |
| user_appointments   | qualiphy_meeting_uuid    | character varying           | YES         | null              | none            | null                | null              |
| user_appointments   | qualiphy_patient_exam_id | integer                     | YES         | null              | none            | null                | null              |
| user_appointments   | qualiphy_provider_name   | character varying           | YES         | null              | none            | null                | null              |
| user_appointments   | requires_subscription    | boolean                     | YES         | null              | none            | null                | null              |
| user_appointments   | sanity_appointment_id    | character varying           | YES         | null              | none            | null                | null              |
| user_appointments   | sanity_id                | text                        | YES         | null              | none            | null                | null              |
| user_appointments   | scheduled_date           | timestamp with time zone    | YES         | null              | none            | null                | null              |
| user_appointments   | status                   | character varying           | YES         | null              | none            | null                | null              |
| user_appointments   | stripe_customer_id       | text                        | YES         | null              | none            | null                | null              |
| user_appointments   | stripe_payment_intent_id | text                        | YES         | null              | none            | null                | null              |
| user_appointments   | stripe_session_id        | text                        | YES         | null              | none            | null                | null              |
| user_appointments   | subscription_id          | uuid                        | YES         | null              | none            | null                | null              |
| user_appointments   | treatment_name           | character varying           | YES         | null              | none            | null                | null              |
| user_appointments   | updated_at               | timestamp with time zone    | YES         | null              | none            | null                | null              |
| user_appointments   | user_email               | character varying           | YES         | null              | none            | null                | null              |
| user_appointments   | user_id                  | uuid                        | YES         | null              | none            | null                | null              |
| user_data           | created_at               | timestamp with time zone    | YES         | now()             | none            | null                | null              |
| user_data           | dob                      | text                        | NO          | null              | none            | null                | null              |
| user_data           | dose_level               | integer                     | YES         | 1                 | none            | null                | null              |
| user_data           | email                    | text                        | NO          | null              | none            | null                | null              |
| user_data           | exam_pos_id              | integer                     | YES         | null              | none            | null                | null              |
| user_data           | first_name               | text                        | NO          | null              | none            | null                | null              |
| user_data           | id                       | uuid                        | NO          | gen_random_uuid() | PRIMARY KEY     | user_data           | id                |
| user_data           | last_name                | text                        | NO          | null              | none            | null                | null              |
| user_data           | meeting_url              | text                        | YES         | null              | none            | null                | null              |
| user_data           | meeting_uuid             | text                        | YES         | null              | none            | null                | null              |
| user_data           | phone                    | text                        | NO          | null              | none            | null                | null              |
| user_data           | state                    | text                        | NO          | null              | none            | null                | null              |
| user_data           | submission_count         | integer                     | YES         | 0                 | none            | null                | null              |
| user_data           | updated_at               | timestamp with time zone    | YES         | now()             | none            | null                | null              |
| user_subscriptions  | billing_amount           | numeric                     | YES         | null              | none            | null                | null              |
| user_subscriptions  | billing_period           | character varying           | YES         | null              | none            | null                | null              |
| user_subscriptions  | cancellation_date        | timestamp with time zone    | YES         | null              | none            | null                | null              |
| user_subscriptions  | coupon_code              | character varying           | YES         | null              | none            | null                | null              |
| user_subscriptions  | coupon_discount_type     | character varying           | YES         | null              | none            | null                | null              |
| user_subscriptions  | coupon_discount_value    | numeric                     | YES         | null              | none            | null                | null              |
| user_subscriptions  | created_at               | timestamp with time zone    | YES         | null              | none            | null                | null              |
| user_subscriptions  | end_date                 | timestamp with time zone    | YES         | null              | none            | null                | null              |
| user_subscriptions  | id                       | uuid                        | NO          | null              | PRIMARY KEY     | user_subscriptions  | id                |
| user_subscriptions  | is_active                | boolean                     | YES         | null              | none            | null                | null              |
| user_subscriptions  | is_test                  | text                        | YES         | null              | none            | null                | null              |
| user_subscriptions  | next_billing_date        | timestamp with time zone    | YES         | null              | none            | null                | null              |
| user_subscriptions  | original_price           | numeric                     | YES         | null              | none            | null                | null              |
| user_subscriptions  | plan_id                  | character varying           | YES         | null              | none            | null                | null              |
| user_subscriptions  | plan_name                | character varying           | YES         | null              | none            | null                | null              |
| user_subscriptions  | sanity_id                | text                        | YES         | null              | none            | null                | null              |
| user_subscriptions  | sanity_subscription_id   | character varying           | YES         | null              | none            | null                | null              |
| user_subscriptions  | start_date               | timestamp with time zone    | YES         | null              | none            | null                | null              |
| user_subscriptions  | status                   | character varying           | YES         | null              | none            | null                | null              |
| user_subscriptions  | stripe_customer_id       | character varying           | YES         | null              | none            | null                | null              |
| user_subscriptions  | stripe_session_id        | text                        | YES         | null              | none            | null                | null              |
| user_subscriptions  | stripe_subscription_id   | character varying           | YES         | null              | none            | null                | null              |
| user_subscriptions  | subscription_name        | text                        | YES         | null              | none            | null                | null              |
| user_subscriptions  | updated_at               | timestamp with time zone    | YES         | null              | none            | null                | null              |
| user_subscriptions  | user_email               | character varying           | YES         | null              | none            | null                | null              |
| user_subscriptions  | user_id                  | uuid                        | YES         | null              | none            | null                | null              |
| user_subscriptions  | variant_dosage           | text                        | YES         | null              | none            | null                | null              |
| user_subscriptions  | variant_key              | text                        | YES         | null              | none            | null                | null              |
| user_subscriptions  | variant_title            | text                        | YES         | null              | none            | null                | null              |