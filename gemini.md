# 📜 gemini.md — Project Constitution

## Selenium Java → Playwright JS/TS Converter

> **This file is LAW.** All schemas, rules, and architectural invariants are defined here.
> Update only when: a schema changes, a rule is added, or architecture is modified.

---

## 1. Project Identity

- **Name:** Selenium-to-Playwright Converter
- **Type:** Local LLM-powered code conversion tool (Web Application)
- **Input:** Selenium WebDriver + TestNG test scripts (Java)
- **Output:** Playwright test scripts (JavaScript or TypeScript)
- **LLM Backend:** Ollama (local)
- **UI:** Web-based (paste code → see converted output)

---

## 2. Discovery Answers (CONFIRMED ✅)

| # | Question | Answer |
|---|----------|--------|
| 1 | 🎯 North Star | Selenium Java → Playwright JS/TS converter |
| 2 | 🔌 Integrations | Convert TestNG Selenium Java tests → Playwright JS/TS via local LLM (Ollama) |
| 3 | 📦 Source of Truth | Web UI — user pastes/enters Selenium Java code directly |
| 4 | 📤 Delivery Payload | Save converted files to a new directory AND display results in the UI |
| 5 | ⚖️ Behavioral Rules | **Convert Everything** — all patterns, annotations, assertions, waits, locators, POM, etc. |

---

## 3. Data Schemas (CONFIRMED ✅)

### 3.1 Input Schema — ConversionRequest

```json
{
  "type": "ConversionRequest",
  "properties": {
    "sourceCode": {
      "type": "string",
      "description": "Raw Selenium Java + TestNG source code pasted by user"
    },
    "targetLanguage": {
      "type": "string",
      "enum": ["javascript", "typescript"],
      "default": "typescript",
      "description": "Target output language"
    },
    "fileName": {
      "type": "string",
      "description": "Original file name (optional, used for output naming)",
      "example": "LoginTest.java"
    },
    "options": {
      "type": "object",
      "properties": {
        "preserveComments": {
          "type": "boolean",
          "default": true,
          "description": "Keep original comments in output"
        },
        "includeImports": {
          "type": "boolean",
          "default": true,
          "description": "Generate Playwright import statements"
        },
        "outputFormat": {
          "type": "string",
          "enum": ["playwright-test"],
          "default": "playwright-test",
          "description": "Always use @playwright/test runner format"
        }
      }
    }
  },
  "required": ["sourceCode"]
}
```

### 3.2 Output Schema — ConversionResult

```json
{
  "type": "ConversionResult",
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Whether conversion completed"
    },
    "convertedCode": {
      "type": "string",
      "description": "Generated Playwright JS/TS code"
    },
    "targetLanguage": {
      "type": "string",
      "enum": ["javascript", "typescript"]
    },
    "outputFileName": {
      "type": "string",
      "description": "Suggested output filename",
      "example": "login-test.spec.ts"
    },
    "outputDir": {
      "type": "string",
      "description": "Directory where converted file was saved"
    },
    "warnings": {
      "type": "array",
      "items": "string",
      "description": "Conversion warnings (unmapped patterns, etc.)"
    },
    "mappingReport": {
      "type": "object",
      "properties": {
        "totalPatterns": "number",
        "convertedPatterns": "number",
        "unmappedPatterns": ["string"]
      }
    },
    "metadata": {
      "modelUsed": "string — Ollama model name",
      "conversionTimeMs": "number",
      "timestamp": "string — ISO 8601"
    }
  }
}
```

---

## 4. Behavioral Rules

1. **Convert Everything:** All Selenium + TestNG patterns must be handled — annotations, assertions, waits, locators, Page Object Models, data providers, setup/teardown, etc.
2. **No Data Leaves Local:** All processing happens locally via Ollama. Zero external API calls.
3. **Preserve Intent:** The converted output must preserve the *intent* and *structure* of the original test.
4. **Warn, Don't Fail:** If a pattern can't be cleanly converted, emit a `// WARNING:` comment in the output with explanation.
5. **Idiomatic Playwright:** Generated code must follow Playwright best practices:
   - Use auto-waiting (no explicit waits where Playwright handles it)
   - Prefer modern locators (`getByRole`, `getByText`, `getByTestId`) over raw CSS/XPath
   - Use `@playwright/test` runner with `test()` and `expect()`
6. **TestNG → Playwright Test Mapping:**
   - `@Test` → `test('name', async ({ page }) => { ... })`
   - `@BeforeMethod` → `test.beforeEach()`
   - `@AfterMethod` → `test.afterEach()`
   - `@BeforeClass` → `test.beforeAll()`
   - `@AfterClass` → `test.afterAll()`
   - `@DataProvider` → Parameterized tests or test arrays
   - `Assert.assertEquals()` → `expect(locator).toHaveText()` or similar
7. **Output Files:** Save converted files to `output/` directory with `.spec.ts` or `.spec.js` extension.

---

## 5. Architectural Invariants

1. **3-Layer A.N.T. Architecture:**
   - `architecture/` — SOPs (markdown documentation)
   - Navigation — Reasoning/routing layer (LLM + system logic)
   - `tools/` — Deterministic scripts (Node.js)
2. **Web Application Stack:**
   - Backend: Node.js (Express or similar)
   - Frontend: HTML/CSS/JS (premium UI with code editors)
   - LLM: Ollama REST API (local)
3. **All temporary files go in `.tmp/`**
4. **Converted output files go in `output/`**
5. **`.env` holds all configuration** (model name, Ollama endpoint, port, etc.)
6. **`gemini.md` is the single source of truth** for schemas and rules

---

## 6. Selenium → Playwright Comprehensive Mapping Rules

### 6.1 Driver & Browser

| # | Selenium (Java) | Playwright (JS/TS) | Notes |
|---|-----------------|---------------------|-------|
| 1 | `WebDriver driver = new ChromeDriver()` | `const browser = await chromium.launch()` | Or use test fixtures |
| 2 | `driver.get(url)` | `await page.goto(url)` | |
| 3 | `driver.close()` | `await page.close()` | |
| 4 | `driver.quit()` | `await browser.close()` | Handled by test runner |
| 5 | `driver.getTitle()` | `await page.title()` | |
| 6 | `driver.getCurrentUrl()` | `page.url()` | |
| 7 | `driver.navigate().back()` | `await page.goBack()` | |
| 8 | `driver.navigate().forward()` | `await page.goForward()` | |
| 9 | `driver.navigate().refresh()` | `await page.reload()` | |

### 6.2 Locators

| # | Selenium (Java) | Playwright (JS/TS) | Notes |
|---|-----------------|---------------------|-------|
| 10 | `By.id("x")` | `page.locator('#x')` | |
| 11 | `By.className("x")` | `page.locator('.x')` | |
| 12 | `By.name("x")` | `page.locator('[name="x"]')` | |
| 13 | `By.tagName("x")` | `page.locator('x')` | |
| 14 | `By.cssSelector("x")` | `page.locator('x')` | Direct CSS |
| 15 | `By.xpath("//x")` | `page.locator('xpath=//x')` | Prefer role-based |
| 16 | `By.linkText("x")` | `page.getByRole('link', { name: 'x' })` | Modern locator |
| 17 | `By.partialLinkText("x")` | `page.getByRole('link', { name: /x/ })` | Regex match |

### 6.3 Actions

| # | Selenium (Java) | Playwright (JS/TS) | Notes |
|---|-----------------|---------------------|-------|
| 18 | `element.click()` | `await locator.click()` | Auto-waits |
| 19 | `element.sendKeys("text")` | `await locator.fill('text')` | Clears first |
| 20 | `element.clear()` | `await locator.clear()` | |
| 21 | `element.submit()` | `await locator.press('Enter')` | Or click submit btn |
| 22 | `element.getText()` | `await locator.textContent()` | |
| 23 | `element.getAttribute("x")` | `await locator.getAttribute('x')` | |
| 24 | `element.isDisplayed()` | `await locator.isVisible()` | |
| 25 | `element.isEnabled()` | `await locator.isEnabled()` | |
| 26 | `element.isSelected()` | `await locator.isChecked()` | For checkboxes |
| 27 | `new Select(el).selectByVisibleText("x")` | `await locator.selectOption({ label: 'x' })` | |
| 28 | `new Select(el).selectByValue("x")` | `await locator.selectOption('x')` | |

### 6.4 Waits

| # | Selenium (Java) | Playwright (JS/TS) | Notes |
|---|-----------------|---------------------|-------|
| 29 | `WebDriverWait(driver, 10).until(...)` | Auto-waiting built-in | Playwright auto-waits |
| 30 | `ExpectedConditions.visibilityOf(el)` | `await locator.waitFor({ state: 'visible' })` | Usually unnecessary |
| 31 | `ExpectedConditions.elementToBeClickable(el)` | Auto-waiting | Playwright handles |
| 32 | `Thread.sleep(ms)` | `await page.waitForTimeout(ms)` | Discouraged |
| 33 | `driver.manage().timeouts().implicitlyWait(...)` | Not needed | Auto-waiting |

### 6.5 TestNG → Playwright Test

| # | TestNG (Java) | Playwright Test (JS/TS) | Notes |
|---|---------------|--------------------------|-------|
| 34 | `@Test` | `test('name', async ({ page }) => { })` | |
| 35 | `@Test(priority=1)` | Order via test.describe | |
| 36 | `@BeforeMethod` | `test.beforeEach(async ({ page }) => { })` | |
| 37 | `@AfterMethod` | `test.afterEach(async ({ page }) => { })` | |
| 38 | `@BeforeClass` | `test.beforeAll(async () => { })` | |
| 39 | `@AfterClass` | `test.afterAll(async () => { })` | |
| 40 | `@BeforeSuite` | Global setup in config | |
| 41 | `@AfterSuite` | Global teardown in config | |
| 42 | `@DataProvider` | `for...of` loop or array | |
| 43 | `@Test(groups={"smoke"})` | `test.describe('smoke', ...)` or tags | |
| 44 | `@Test(enabled=false)` | `test.skip('name', ...)` | |
| 45 | `@Test(dependsOnMethods=...)` | Sequential tests in describe | |

### 6.6 Assertions

| # | TestNG/Selenium (Java) | Playwright (JS/TS) | Notes |
|---|------------------------|---------------------|-------|
| 46 | `Assert.assertEquals(a, b)` | `expect(a).toBe(b)` | |
| 47 | `Assert.assertTrue(x)` | `expect(x).toBeTruthy()` | |
| 48 | `Assert.assertFalse(x)` | `expect(x).toBeFalsy()` | |
| 49 | `Assert.assertNotNull(x)` | `expect(x).not.toBeNull()` | |
| 50 | `Assert.assertEquals(el.getText(), "x")` | `await expect(locator).toHaveText('x')` | Web-first assertion |

---

## 7. Maintenance Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-15 | Initial constitution created | System Pilot |
| 2026-02-15 | Discovery answers confirmed, schemas finalized, mapping rules added | System Pilot |

---

*Last Updated: 2026-02-15*
