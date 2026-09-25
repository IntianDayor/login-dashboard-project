# Test suite

The PHP tests (`composer test`) cover rich-text sanitization, social URL validation, PDF HTML escaping and image normalization, and stored R2 image-path parsing. These focused tests call helper functions directly and need no database. Browser/API tests (`npm run test:e2e`) cover signup/login and page navigation, API authentication and access control, CSRF, contact handling, analytics, and About-content sanitization.

## Safety and setup

Browser/API tests create accounts and the admin test edits About content. Run them only against a disposable test instance backed by its own database. Do not point `APP_TEST_URL` at production or your everyday development database. The app does not currently provision a separate test database automatically; create an isolated app/database instance using the project's setup instructions before running these tests.

Install the browser test dependency and Chromium once:

```bash
npm install
npx playwright install chromium
```

Set the test instance URL (the config refuses to run without it):

```powershell
$env:APP_TEST_URL = 'http://localhost:TEST_PORT'
npm run test:e2e
```

For admin coverage, create/promote a disposable admin account in that test database and set its credentials:

```powershell
$env:TEST_ADMIN_USERNAME = 'qa-admin'
$env:TEST_ADMIN_PASSWORD = 'your-test-only-password'
npm run test:e2e
```

Without those admin variables, the admin API test is skipped. Browser tests use Chromium and run serially to avoid account and content collisions. The suite does not test R2 uploads, SendGrid delivery, or PDF generation because those require external services and credentials.
