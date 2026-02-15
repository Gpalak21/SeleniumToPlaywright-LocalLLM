# 🔧 SOP: Conversion Rules

## Purpose
Define the deterministic mapping rules for converting Selenium Java + TestNG code to Playwright JavaScript/TypeScript.

## Conversion Pipeline

1. **Receive** raw Selenium Java source code from the user
2. **Build prompt** with mapping rules and the source code
3. **Send to CodeLlama** via Ollama REST API
4. **Extract** the converted Playwright code from the LLM response
5. **Format** the output (clean up, add imports if missing)
6. **Save** to `output/` directory
7. **Return** converted code + metadata to the UI

## Mapping Categories

### Category 1: Imports
- Remove all `org.openqa.selenium.*` imports
- Remove all `org.testng.*` imports
- Add `const { test, expect } = require('@playwright/test');` (JS)
- Or `import { test, expect } from '@playwright/test';` (TS)

### Category 2: Driver Management
- `WebDriver driver = new ChromeDriver()` → handled by test fixture `{ page }`
- `driver.get(url)` → `await page.goto(url)`
- `driver.close()` / `driver.quit()` → handled automatically by Playwright

### Category 3: Locators
- `By.id("x")` → `page.locator('#x')`
- `By.className("x")` → `page.locator('.x')`
- `By.name("x")` → `page.locator('[name="x"]')`
- `By.xpath("//x")` → `page.locator('xpath=//x')`
- `By.cssSelector("x")` → `page.locator('x')`
- `By.linkText("x")` → `page.getByRole('link', { name: 'x' })`
- `By.partialLinkText("x")` → `page.getByRole('link', { name: /x/ })`
- `By.tagName("x")` → `page.locator('x')`

### Category 4: Actions
- `element.click()` → `await locator.click()`
- `element.sendKeys("text")` → `await locator.fill('text')`
- `element.clear()` → `await locator.clear()`
- `element.getText()` → `await locator.textContent()`
- `element.getAttribute("x")` → `await locator.getAttribute('x')`
- `element.isDisplayed()` → `await locator.isVisible()`
- `element.isEnabled()` → `await locator.isEnabled()`
- `element.submit()` → `await locator.press('Enter')`

### Category 5: Waits
- `WebDriverWait` → Remove (Playwright auto-waits)
- `ExpectedConditions.visibilityOf(el)` → `await locator.waitFor({ state: 'visible' })`
- `Thread.sleep(ms)` → `await page.waitForTimeout(ms)` (with warning)
- `implicitlyWait` → Remove entirely

### Category 6: TestNG Annotations
- `@Test` → `test('name', async ({ page }) => { })`
- `@BeforeMethod` → `test.beforeEach(async ({ page }) => { })`
- `@AfterMethod` → `test.afterEach(async ({ page }) => { })`
- `@BeforeClass` → `test.beforeAll(async () => { })`
- `@AfterClass` → `test.afterAll(async () => { })`
- `@DataProvider` → Array-based parameterization
- `@Test(enabled=false)` → `test.skip()`

### Category 7: Assertions
- `Assert.assertEquals(a, b)` → `expect(a).toBe(b)`
- `Assert.assertTrue(x)` → `expect(x).toBeTruthy()`
- `Assert.assertFalse(x)` → `expect(x).toBeFalsy()`
- `Assert.assertNotNull(x)` → `expect(x).not.toBeNull()`

## Edge Cases
- If a pattern cannot be mapped, add `// TODO: Manual conversion needed` comment
- Preserve all original comments prefixed with `// [Original]`
- Chain method calls need special handling for async/await
