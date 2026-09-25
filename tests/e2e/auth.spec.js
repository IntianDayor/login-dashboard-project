const { test, expect } = require('@playwright/test');

const unique = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

test('signup validates fields, creates a standard user, and user can log in', async ({ page }) => {
  const id = unique();
  const username = `qa_${id}`;
  const password = 'TestPass123!';

  await page.goto('/pages/user/signup.html');
  await page.locator('#username-reg').fill(username);
  await page.locator('#fullname').fill('QA Test User');
  await page.locator('#email').fill(`qa_${id}@example.test`);
  await page.locator('#create').fill(password);
  await page.locator('#confirmpass').fill('different');
  await page.locator('#signup').click();
  await expect(page.locator('.toast')).toContainText('Passwords do not match');

  await page.locator('#confirmpass').fill(password);
  await page.locator('#signup').click();
  await expect(page).toHaveURL(/login\.html$/);

  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/dashboard\.html$/);
  await expect(page.locator('#username')).toHaveText(username);

  const session = await page.request.get('/api/check-session.php');
  const sessionData = await session.json();
  expect(sessionData).toMatchObject({ loggedIn: true, isAdmin: false, username });
  expect(sessionData.csrf_token).toBeTruthy();
});

test('login shows an error for invalid credentials', async ({ page }) => {
  await page.goto('/pages/user/login.html');
  await page.locator('input[name="username"]').fill(`missing_${unique()}`);
  await page.locator('input[name="password"]').fill('wrong-password');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page.locator('.toast')).toContainText('Invalid Username or Password');
  await expect(page).toHaveURL(/login\.html$/);
});

test('public portfolio page loads and login page links to signup', async ({ page }) => {
  await page.goto('/pages/user/login.html');
  await page.getByText('Create an account').click();
  await expect(page).toHaveURL(/signup\.html$/);
  await expect(page.getByRole('heading', { name: 'Register an Account' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Download portfolio PDF/ })).toHaveAttribute('href', '/api/generate-portfolio-pdf.php');
});
