/**
 * prompt-builder.js — Constructs the LLM prompt for Selenium → Playwright conversion
 * 
 * This tool builds a carefully structured prompt that includes:
 * - System role definition
 * - Comprehensive mapping rules
 * - The source code to convert
 * - Output formatting instructions
 */

/**
 * Build the conversion prompt for CodeLlama
 * @param {string} sourceCode - The raw Selenium Java source code
 * @param {string} targetLanguage - 'javascript' or 'typescript'
 * @param {object} options - Conversion options
 * @returns {string} The complete prompt
 */
function buildConversionPrompt(sourceCode, targetLanguage = 'typescript', options = {}) {
  const { preserveComments = true, includeImports = true } = options;

  const importStatement = targetLanguage === 'typescript'
    ? `import { test, expect } from '@playwright/test';`
    : `const { test, expect } = require('@playwright/test');`;

  const fileExtension = targetLanguage === 'typescript' ? '.spec.ts' : '.spec.js';

  const prompt = `You are an expert code converter that converts Selenium WebDriver Java test code (with TestNG) into Playwright ${targetLanguage === 'typescript' ? 'TypeScript' : 'JavaScript'} test code.

CONVERSION RULES — Follow these EXACTLY:

1. IMPORTS:
   - Remove ALL Java imports (org.openqa.selenium.*, org.testng.*, java.*)
   - Add: ${importStatement}

2. DRIVER/BROWSER:
   - Remove WebDriver/ChromeDriver instantiation — Playwright test fixture provides { page }
   - driver.get(url) → await page.goto(url)
   - driver.getTitle() → await page.title()
   - driver.getCurrentUrl() → page.url()
   - driver.navigate().back() → await page.goBack()
   - driver.navigate().forward() → await page.goForward()
   - driver.navigate().refresh() → await page.reload()
   - driver.close() / driver.quit() → Remove (handled by Playwright)
   - driver.getWindowHandle() → Remove or use page context
   - driver.switchTo().frame(x) → page.frameLocator(x)
   - driver.switchTo().alert() → page.on('dialog', ...)

3. LOCATORS:
   - driver.findElement(By.id("x")) → page.locator('#x')
   - driver.findElement(By.className("x")) → page.locator('.x')
   - driver.findElement(By.name("x")) → page.locator('[name="x"]')
   - driver.findElement(By.xpath("//x")) → page.locator('xpath=//x')
   - driver.findElement(By.cssSelector("x")) → page.locator('x')
   - driver.findElement(By.linkText("x")) → page.getByRole('link', { name: 'x' })
   - driver.findElement(By.partialLinkText("x")) → page.getByRole('link', { name: /x/ })
   - driver.findElement(By.tagName("x")) → page.locator('x')
   - driver.findElements(...) → page.locator(...).all() (returns array)

4. ACTIONS:
   - element.click() → await locator.click()
   - element.sendKeys("text") → await locator.fill('text')
   - element.sendKeys(Keys.ENTER) → await locator.press('Enter')
   - element.sendKeys(Keys.TAB) → await locator.press('Tab')
   - element.clear() → await locator.clear()
   - element.submit() → await locator.press('Enter')
   - element.getText() → await locator.textContent()
   - element.getAttribute("x") → await locator.getAttribute('x')
   - element.isDisplayed() → await locator.isVisible()
   - element.isEnabled() → await locator.isEnabled()
   - element.isSelected() → await locator.isChecked()
   - new Select(el).selectByVisibleText("x") → await locator.selectOption({ label: 'x' })
   - new Select(el).selectByValue("x") → await locator.selectOption('x')
   - new Select(el).selectByIndex(n) → await locator.selectOption({ index: n })

5. WAITS:
   - WebDriverWait(driver, N).until(...) → Remove or use auto-waiting
   - ExpectedConditions.visibilityOfElementLocated(...) → await locator.waitFor({ state: 'visible' })
   - ExpectedConditions.elementToBeClickable(...) → Playwright auto-waits, remove
   - ExpectedConditions.presenceOfElementLocated(...) → await locator.waitFor()
   - ExpectedConditions.titleContains("x") → await expect(page).toHaveTitle(/x/)
   - Thread.sleep(ms) → await page.waitForTimeout(ms)
   - driver.manage().timeouts().implicitlyWait(...) → Remove entirely

6. TESTNG ANNOTATIONS:
   - @Test → test('methodName', async ({ page }) => { ... })
   - @Test(description="desc") → test('desc', async ({ page }) => { ... })
   - @BeforeMethod → test.beforeEach(async ({ page }) => { ... })
   - @AfterMethod → test.afterEach(async ({ page }) => { ... })
   - @BeforeClass → test.beforeAll(async () => { ... })
   - @AfterClass → test.afterAll(async () => { ... })
   - @DataProvider → Use array + for loop or test data arrays
   - @Test(enabled=false) → test.skip('name', async ({ page }) => { ... })
   - @Test(groups={"smoke"}) → Add @smoke tag: test('name @smoke', ...)
   - @Test(priority=N) → Order tests sequentially in test.describe()
   - @Test(dependsOnMethods="x") → Use test.describe.serial()

7. ASSERTIONS:
   - Assert.assertEquals(actual, expected) → expect(actual).toBe(expected)
   - Assert.assertTrue(x) → expect(x).toBeTruthy()
   - Assert.assertFalse(x) → expect(x).toBeFalsy()
   - Assert.assertNotNull(x) → expect(x).not.toBeNull()
   - Assert.assertEquals(element.getText(), "x") → await expect(locator).toHaveText('x')
   - Assert.assertTrue(element.isDisplayed()) → await expect(locator).toBeVisible()

8. ACTIONS CLASS:
   - new Actions(driver).moveToElement(el).perform() → await locator.hover()
   - new Actions(driver).doubleClick(el).perform() → await locator.dblclick()
   - new Actions(driver).contextClick(el).perform() → await locator.click({ button: 'right' })
   - new Actions(driver).dragAndDrop(src, target).perform() → await src.dragTo(target)

9. JAVASCRIPT EXECUTOR:
   - ((JavascriptExecutor)driver).executeScript("...") → await page.evaluate(() => { ... })

10. SCREENSHOTS:
    - ((TakesScreenshot)driver).getScreenshotAs(...) → await page.screenshot({ path: '...' })

OUTPUT REQUIREMENTS:
- Output ONLY the converted Playwright ${targetLanguage === 'typescript' ? 'TypeScript' : 'JavaScript'} code
- ${includeImports ? 'Include the import statement at the top' : 'Do NOT include import statements'}
- ${preserveComments ? 'Preserve original comments with // prefix' : 'Remove all comments'}
- Use async/await for ALL Playwright operations
- Wrap test methods in test() blocks
- Use test.describe() if the class has multiple test methods
- If something cannot be converted, add: // TODO: Manual conversion needed - <reason>
- Do NOT include any explanation text — ONLY output the code
- Do NOT wrap the code in markdown code fences

SELENIUM JAVA CODE TO CONVERT:
${sourceCode}

CONVERTED PLAYWRIGHT ${targetLanguage.toUpperCase()} CODE:`;

  return prompt;
}

module.exports = { buildConversionPrompt };
