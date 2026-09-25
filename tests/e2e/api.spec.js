const { test, expect } = require('@playwright/test');

const unique = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const testClientIp = () => {
  const id = Math.floor(Math.random() * 0x10000);
  return `198.18.${id >> 8}.${id & 255}`;
};

async function createAndLoginUser(page) {
  const id = unique();
  const user = { username: `api_${id}`, password: 'TestPass123!', fullname: 'API Test User', email: `api_${id}@example.test` };
  const signup = await page.request.post('/api/signup.php', { data: user });
  expect((await signup.json()).success).toBe(true);
  const login = await page.request.post('/api/login.php', { data: { username: user.username, password: user.password } });
  expect((await login.json()).success).toBe(true);
  return user;
}

test('protected reads deny anonymous access and allow signed-in users', async ({ page }) => {
  for (const endpoint of ['/api/get-profile.php', '/api/get-projects.php', '/api/dashboard-content.php']) {
    const response = await page.request.get(endpoint);
    expect((await response.json()).success).toBe(false);
  }

  await createAndLoginUser(page);
  for (const endpoint of ['/api/get-profile.php', '/api/get-projects.php', '/api/dashboard-content.php']) {
    const response = await page.request.get(endpoint);
    expect(response.ok(), `${endpoint} should be available to a signed-in user`).toBeTruthy();
  }
});

test('standard user cannot perform admin actions; logout requires CSRF', async ({ page }) => {
  await createAndLoginUser(page);
  const session = await (await page.request.get('/api/check-session.php')).json();

  const denied = await page.request.post('/api/dashboard-content.php', {
    multipart: { content: '<p>QA should not save this</p>' },
    headers: { 'X-CSRF-Token': session.csrf_token },
  });
  expect((await denied.json()).success).toBe(false);

  const noTokenLogout = await page.request.post('/api/logout.php');
  expect((await noTokenLogout.json()).message).toBe('Invalid CSRF token');

  const logout = await page.request.post('/api/logout.php', { headers: { 'X-CSRF-Token': session.csrf_token } });
  expect((await logout.json()).success).toBe(true);
  expect((await (await page.request.get('/api/check-session.php')).json()).loggedIn).toBe(false);
});

test('contact honeypot is accepted without sending email', async ({ page }) => {
  const response = await page.request.post('/api/contact.php', {
    data: { name: 'Automated test', email: 'bot@example.test', message: 'Ignored', website: 'filled-by-bot' },
    headers: { 'X-Forwarded-For': testClientIp() },
  });
  expect((await response.json()).success).toBe(true);
});

test('signup rejects short passwords and invalid email addresses', async ({ page }) => {
  const shortPassword = await page.request.post('/api/signup.php', {
    data: { username: `short_${unique()}`, password: '123', fullname: 'QA User', email: `short_${unique()}@example.test` },
  });
  expect((await shortPassword.json()).message).toBe('Password must be at least 6 characters.');

  const invalidEmail = await page.request.post('/api/signup.php', {
    data: { username: `email_${unique()}`, password: 'TestPass123!', fullname: 'QA User', email: 'not-an-email' },
  });
  expect((await invalidEmail.json()).message).toBe('Invalid email address.');
});

test('contact form rejects missing fields and invalid email before delivery', async ({ page }) => {
  const missing = await page.request.post('/api/contact.php', {
    data: { name: '', email: '', message: '' },
    headers: { 'X-Forwarded-For': testClientIp() },
  });
  expect((await missing.json()).message).toBe('All fields are required');

  const invalidEmail = await page.request.post('/api/contact.php', {
    data: { name: 'QA', email: 'not-an-email', message: 'This will not be sent' },
    headers: { 'X-Forwarded-For': testClientIp() },
  });
  expect((await invalidEmail.json()).message).toBe('Invalid email address');
});

test('admin can load analytics and save sanitized About content', async ({ page }) => {
  const username = process.env.TEST_ADMIN_USERNAME;
  const password = process.env.TEST_ADMIN_PASSWORD;
  test.skip(!username || !password, 'Set TEST_ADMIN_USERNAME and TEST_ADMIN_PASSWORD for admin API coverage.');

  const login = await page.request.post('/api/login.php', { data: { username, password } });
  expect((await login.json()).success).toBe(true);
  const session = await (await page.request.get('/api/check-session.php')).json();
  expect(session.isAdmin).toBe(true);

  const analytics = await page.request.get('/api/get-analytics.php?filter=days&days=7', {
    headers: { 'X-CSRF-Token': session.csrf_token },
  });
  expect((await analytics.json()).success).toBe(true);

  const content = `<p>QA content ${Date.now()}</p><script>alert(1)</script>`;
  const saved = await page.request.post('/api/dashboard-content.php', {
    multipart: { content }, headers: { 'X-CSRF-Token': session.csrf_token },
  });
  expect((await saved.json()).success).toBe(true);
  const result = await (await page.request.get('/api/dashboard-content.php')).json();
  expect(result.content).toContain('<p>QA content');
  expect(result.content).not.toContain('<script');
});
