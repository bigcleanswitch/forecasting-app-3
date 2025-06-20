# Update Log

## 2025-06-20 (After 07:09am)

- **Fix:** Resolved database error `relation "public.revenue_streams" does not exist` by creating the necessary SQL migration script.
- **Feat:** Added complete SQL script with Row Level Security (RLS) policies for `revenue_streams`, `tier_tables`, and `tiers` to ensure data privacy and security.
- **Fix:** Addressed UI bug where the "+ Add revenue stream" button was unresponsive and unreadable. Implemented robust loading and error handling states in the `ProductAndPricingStep` component.
- **Dev:** Explained the purpose of `DROP POLICY IF EXISTS` to clarify that it safely updates security rules without deleting user data.

## 2025-06-20 (Morning)

- **Refactor:** Began major refactor of the "Product and Pricing" step.
- **DB:** Designed and created new database schema to associate tier tables directly with revenue streams, moving away from a single global client tier model. Created tables `revenue_streams`, `tier_tables`, `tiers`.
- **UI:** Created new `ProductAndPricingStep` and `TierTableEditor` components to replace the legacy pricing assumptions UI.
- **Feat:** Implemented full CRUD (Create, Read, Update, Delete) functionality for revenue streams and their associated pricing tiers, with changes syncing live to the database.
- **UX:** Improved UI for adding and deleting tiers, including adding a trash can icon and improving button interactivity.

--- 