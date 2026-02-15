# 🔍 Findings — Selenium Java → Playwright JS/TS Converter

## Research Log

All research discoveries, constraints, and learnings are logged here.

---

### 📅 2026-02-15 — Phase 1 Research

#### 1. Existing Open-Source Converters

**Finding:** There is **no direct, fully automated, open-source converter** from Selenium Java → Playwright JS/TS on GitHub.

- **CodingFleet** — Online AI-powered converter (not open-source)
- **ray.run/tools/selenium-to-playwright** — Online tool, not open-source
- **thomhurst/Selenium.PlaywrightDriver** — C# only, acts as a Selenium-compatible wrapper around Playwright, not a code converter
- **AI-Powered approaches** — GitHub Copilot's PLAN Mode can assist migration but is not a standalone tool

**Implication:** We are building something **novel** — there is a clear gap in the ecosystem for a local, LLM-powered Java Selenium → JS/TS Playwright converter.

---

#### 2. Best LLM Models for Code Conversion (via Ollama)

| Model | Size Options | Strengths | Recommendation |
|-------|-------------|-----------|----------------|
| **DeepSeek-Coder V2** | 6.7B, 16B, 33B | Top HumanEval/MBPP scores, trained on extensive code dataset | ⭐ **Primary choice** |
| **Qwen2.5-Coder** | 7B, 14B, 32B | 92+ language support, competitive with GPT-4o on code repair | ⭐ **Strong alternative** |
| **Qwen3-Coder** | Various | Latest from Alibaba, excellent local coding | Good option |
| **Code Llama** | 7B, 13B, 34B, 70B | Built on Llama 2, supports Java/JS/TS | Fallback option |
| **MiniMax M2.5** | Various | Fast-improving, handles full dev lifecycle, strong on SE benchmarks | Worth testing |

**Decision:** Start with `deepseek-coder:6.7b` for speed, upgrade to `qwen2.5-coder:7b` or larger models if quality is insufficient.

**Key Insight:** Direct "conversion" requires more than syntax translation — it needs understanding of design patterns, library equivalents, and idiomatic approaches. LLM + deterministic rules is the right hybrid approach.

---

#### 3. TestNG → Playwright Test Mapping (Comprehensive)

| TestNG Annotation | Playwright Equivalent | Notes |
|-------------------|-----------------------|-------|
| `@Test` | `test('name', async ({ page }) => { })` | Core test function |
| `@Test(description="...")` | Title string in `test()` | First argument |
| `@Test(priority=N)` | Sequential ordering in `test.describe()` | No direct equivalent |
| `@Test(enabled=false)` | `test.skip('name', ...)` | Skips execution |
| `@Test(groups={"smoke"})` | `test('name @smoke', ...)` or `test.describe('smoke')` | Tags or grouping |
| `@Test(dependsOnMethods=...)` | Sequential tests in `test.describe.serial()` | Use serial mode |
| `@Test(expectedExceptions=...)` | `expect().toThrow()` or `test.fail()` | Assertion-based |
| `@Test(timeOut=5000)` | `test('name', { timeout: 5000 }, ...)` | Per-test timeout |
| `@BeforeMethod` | `test.beforeEach(async ({ page }) => { })` | Per-test setup |
| `@AfterMethod` | `test.afterEach(async ({ page }) => { })` | Per-test cleanup |
| `@BeforeClass` | `test.beforeAll(async () => { })` | File/group level |
| `@AfterClass` | `test.afterAll(async () => { })` | File/group level |
| `@BeforeSuite` | `globalSetup` in playwright.config.ts | Config-level |
| `@AfterSuite` | `globalTeardown` in playwright.config.ts | Config-level |
| `@BeforeTest` | `test.beforeAll()` (in describe) | Group-level |
| `@AfterTest` | `test.afterAll()` (in describe) | Group-level |
| `@DataProvider` | `for...of` loop or `test.describe()` with array | Data-driven |
| `@Parameters` | Parameterized via env or config | Config-driven |

---

#### 4. Key Challenges Identified

1. **Java → JS Type System:** Java is statically typed; JS/TS is dynamic. Need to strip types for JS or convert to TS types.
2. **Synchronous → Asynchronous:** Java Selenium is synchronous; Playwright JS is async/await everywhere.
3. **TestNG Annotations:** Complex annotations with attributes (groups, priority, dependencies) have no 1:1 Playwright equivalent.
4. **Page Object Model:** Java uses class inheritance + PageFactory; Playwright uses class-based POM without annotations.
5. **Exception Handling:** Java's try-catch-finally maps to JS, but checked exceptions don't exist in JS/TS.
6. **Import Mapping:** Java imports (org.openqa.selenium.*) → Playwright imports (@playwright/test).
7. **Assertion Libraries:** TestNG Assert → Playwright expect() with web-first assertions.
8. **WebDriverWait + ExpectedConditions:** Most become unnecessary due to Playwright's auto-waiting.
9. **Actions Class Chains:** Java `new Actions(driver).moveToElement(el).click().perform()` → Playwright native methods.
10. **Select Class:** Java `new Select(el)` → Playwright `locator.selectOption()`.

---

#### 5. Playwright Best Practices for Generated Code

- Always use `@playwright/test` runner format
- Prefer role-based locators: `getByRole()`, `getByText()`, `getByLabel()`, `getByTestId()`
- Use web-first assertions: `expect(locator).toHaveText()` instead of `expect(await el.textContent()).toBe()`
- Leverage auto-waiting — don't add explicit waits where Playwright handles it
- Use `test.describe()` for grouping related tests
- Use fixtures for shared setup (browser context, page, etc.)

---

*Last Updated: 2026-02-15*
