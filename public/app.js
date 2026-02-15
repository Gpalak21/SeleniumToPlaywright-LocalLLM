/**
 * app.js — Frontend logic for Selenium → Playwright Converter
 */

// ── State ────────────────────────────────────────────────────
let currentConversion = null;
let loadingTimer = null;
let loadingSeconds = 0;

// ── DOM Ready ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    updateCharCount();

    // Update output language label when selector changes
    document.getElementById('target-language').addEventListener('change', (e) => {
        const label = e.target.value === 'typescript' ? 'TypeScript' : 'JavaScript';
        document.getElementById('output-lang-label').textContent = label;
    });
});

// ── Health Check ─────────────────────────────────────────────
async function checkHealth() {
    const indicator = document.getElementById('status-indicator');
    const statusText = indicator.querySelector('.status-text');

    try {
        const res = await fetch('/api/health');
        const data = await res.json();

        if (data.ollama && data.ollama.connected && data.ollama.modelAvailable) {
            indicator.className = 'status-indicator connected';
            statusText.textContent = `${data.ollama.model} ready`;
        } else if (data.ollama && data.ollama.connected) {
            indicator.className = 'status-indicator disconnected';
            statusText.textContent = `Model not found`;
        } else {
            indicator.className = 'status-indicator disconnected';
            statusText.textContent = 'Ollama offline';
        }
    } catch (err) {
        indicator.className = 'status-indicator disconnected';
        statusText.textContent = 'Server offline';
    }
}

// ── Convert Handler ──────────────────────────────────────────
async function handleConvert() {
    const sourceCode = document.getElementById('source-editor').value.trim();
    const targetLanguage = document.getElementById('target-language').value;
    const fileName = document.getElementById('file-name').value.trim();

    if (!sourceCode) {
        showToast('Please paste your Selenium Java code first.', 'error');
        return;
    }

    // Show loading
    showLoading(true);
    const convertBtn = document.getElementById('convert-btn');
    convertBtn.disabled = true;

    try {
        const res = await fetch('/api/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceCode,
                targetLanguage,
                fileName: fileName || undefined,
                options: {
                    preserveComments: true,
                    includeImports: true,
                },
            }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            showToast(data.error || 'Conversion failed. Please try again.', 'error');
            showLoading(false);
            convertBtn.disabled = false;
            return;
        }

        // Store result
        currentConversion = data;

        // Display converted code
        displayOutput(data);

        // Show results bar
        showResults(data);

        // Show warnings
        if (data.warnings && data.warnings.length > 0) {
            showWarnings(data.warnings);
        }

        showToast('Conversion completed successfully!', 'success');
    } catch (err) {
        showToast(`Connection error: ${err.message}`, 'error');
    } finally {
        showLoading(false);
        convertBtn.disabled = false;
    }
}

// ── Display Output ───────────────────────────────────────────
function displayOutput(data) {
    const outputEditor = document.getElementById('output-editor');
    const placeholder = document.getElementById('output-placeholder');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');

    // Hide placeholder
    if (placeholder) placeholder.style.display = 'none';

    // Clear previous output
    outputEditor.innerHTML = '';

    // Create code container
    const container = document.createElement('div');
    container.className = 'code-container';

    // Split into lines for numbering
    const lines = data.convertedCode.split('\n');

    // Create line numbers
    const lineNumbers = document.createElement('div');
    lineNumbers.className = 'line-numbers';
    lineNumbers.innerHTML = lines
        .map((_, i) => `<span>${i + 1}</span>`)
        .join('');

    // Create code block
    const codeBlock = document.createElement('pre');
    codeBlock.className = 'code-content';
    codeBlock.innerHTML = highlightCode(data.convertedCode);

    // Assemble
    container.appendChild(lineNumbers);
    container.appendChild(codeBlock);
    outputEditor.appendChild(container);

    // Show action buttons
    copyBtn.style.display = 'inline-flex';
    downloadBtn.style.display = 'inline-flex';
}

// ── Robust Syntax Highlighting ───────────────────────────────
function highlightCode(code) {
    if (!code) return '';

    // Define token types and their regex patterns
    const tokens = [
        { type: 'todo', regex: /\/\/\s*TODO:.*$/gm },
        { type: 'warning', regex: /\/\/\s*WARNING:.*$/gm },
        { type: 'comment', regex: /\/\/.*/g },
        { type: 'comment', regex: /\/\*[\s\S]*?\*\//g },
        { type: 'string', regex: /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g },
        { type: 'keyword', regex: /\b(import|from|const|let|var|async|await|function|return|if|else|for|while|class|export|default|test|expect|describe|new|typeof|this|true|false|null)\b/g },
        { type: 'number', regex: /\b\d+\.?\d*\b/g },
        { type: 'function', regex: /\b[a-zA-Z_]\w*(?=\s*\()/g }
    ];

    // Collect all matches
    let matches = [];
    tokens.forEach(token => {
        let match;
        const regex = new RegExp(token.regex);
        while ((match = regex.exec(code)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0],
                type: token.type
            });
        }
    });

    // Sort and filter overlaps (first match wins)
    matches.sort((a, b) => a.start - b.start);
    const filtered = [];
    let lastEnd = 0;
    for (const m of matches) {
        if (m.start >= lastEnd) {
            filtered.push(m);
            lastEnd = m.end;
        }
    }

    // Build final HTML string
    let html = '';
    let currentIndex = 0;

    const styles = {
        todo: 'color:#f59e0b; font-weight: 600;',
        warning: 'color:#ef4444; font-weight: 600;',
        comment: 'color:#5a5a78; font-style: italic;',
        string: 'color:#22c55e;',
        keyword: 'color:#a78bfa; font-weight: 500;',
        number: 'color:#f59e0b;',
        function: 'color:#60a5fa;'
    };

    for (const m of filtered) {
        // Add text before match (escaped)
        html += escapeHtml(code.substring(currentIndex, m.start));
        // Add tagged match (escaped content, style wrapper)
        html += `<span style="${styles[m.type]}">${escapeHtml(m.text)}</span>`;
        currentIndex = m.end;
    }

    // Add remaining text
    html += escapeHtml(code.substring(currentIndex));

    return html;
}

// ── Show Results Bar ─────────────────────────────────────────
function showResults(data) {
    const resultsBar = document.getElementById('results-bar');
    resultsBar.style.display = 'block';

    document.getElementById('stat-time').textContent =
        data.metadata.conversionTimeMs < 1000
            ? `${data.metadata.conversionTimeMs}ms`
            : `${(data.metadata.conversionTimeMs / 1000).toFixed(1)}s`;

    document.getElementById('stat-model').textContent = data.metadata.modelUsed;
    document.getElementById('stat-file').textContent = data.outputFileName;
    document.getElementById('stat-warnings').textContent = data.warnings.length;

    if (data.warnings.length > 0) {
        document.getElementById('stat-warnings').style.color = 'var(--warning)';
    } else {
        document.getElementById('stat-warnings').style.color = 'var(--success)';
    }
}

// ── Show Warnings ────────────────────────────────────────────
function showWarnings(warnings) {
    if (!warnings || warnings.length === 0) {
        document.getElementById('warnings-panel').style.display = 'none';
        return;
    }

    const panel = document.getElementById('warnings-panel');
    const list = document.getElementById('warnings-list');

    list.innerHTML = warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('');
    panel.style.display = 'block';
}

// ── Loading State ────────────────────────────────────────────
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    const timerEl = document.getElementById('loading-timer');

    if (show) {
        overlay.style.display = 'flex';
        loadingSeconds = 0;
        timerEl.textContent = '0s';
        loadingTimer = setInterval(() => {
            loadingSeconds++;
            timerEl.textContent = `${loadingSeconds}s`;
        }, 1000);
    } else {
        overlay.style.display = 'none';
        if (loadingTimer) {
            clearInterval(loadingTimer);
            loadingTimer = null;
        }
    }
}

// ── Copy Output ──────────────────────────────────────────────
async function handleCopyOutput() {
    if (!currentConversion) return;

    try {
        await navigator.clipboard.writeText(currentConversion.convertedCode);
        showToast('Copied to clipboard!', 'success');
    } catch (err) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = currentConversion.convertedCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copied to clipboard!', 'success');
    }
}

// ── Download Output ──────────────────────────────────────────
function handleDownload() {
    if (!currentConversion) return;

    const blob = new Blob([currentConversion.convertedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentConversion.outputFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Downloaded ${currentConversion.outputFileName}`, 'success');
}

// ── Paste Sample Code ────────────────────────────────────────
function handlePasteSample() {
    const sampleCode = `import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.testng.Assert;
import org.testng.annotations.*;

import java.time.Duration;

public class LoginTest {
    WebDriver driver;
    WebDriverWait wait;

    @BeforeMethod
    public void setUp() {
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.manage().window().maximize();
    }

    @Test(description = "Verify successful login with valid credentials")
    public void testSuccessfulLogin() {
        driver.get("https://example.com/login");

        // Wait for the login form to be visible
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("loginForm")));

        // Enter credentials
        WebElement usernameField = driver.findElement(By.id("username"));
        usernameField.clear();
        usernameField.sendKeys("testuser@example.com");

        WebElement passwordField = driver.findElement(By.id("password"));
        passwordField.clear();
        passwordField.sendKeys("SecurePassword123");

        // Click login button
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        // Verify successful login
        wait.until(ExpectedConditions.titleContains("Dashboard"));
        Assert.assertEquals(driver.getTitle(), "Dashboard - My App");

        // Verify welcome message is displayed
        WebElement welcomeMsg = driver.findElement(By.className("welcome-message"));
        Assert.assertTrue(welcomeMsg.isDisplayed());
        Assert.assertEquals(welcomeMsg.getText(), "Welcome, Test User!");
    }

    @Test(description = "Verify error message for invalid credentials")
    public void testInvalidLogin() {
        driver.get("https://example.com/login");

        driver.findElement(By.id("username")).sendKeys("invalid@example.com");
        driver.findElement(By.id("password")).sendKeys("wrongpassword");
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        // Verify error message
        WebElement errorMsg = wait.until(
            ExpectedConditions.visibilityOfElementLocated(By.className("error-message"))
        );
        Assert.assertEquals(errorMsg.getText(), "Invalid username or password");
    }

    @Test(enabled = false, description = "Verify forgot password link")
    public void testForgotPassword() {
        driver.get("https://example.com/login");
        driver.findElement(By.linkText("Forgot Password?")).click();
        Assert.assertTrue(driver.getCurrentUrl().contains("/forgot-password"));
    }

    @AfterMethod
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}`;

    document.getElementById('source-editor').value = sampleCode;
    document.getElementById('file-name').value = 'LoginTest.java';
    updateCharCount();
    showToast('Sample code loaded!', 'info');
}

// ── Clear All ────────────────────────────────────────────────
function handleClear() {
    document.getElementById('source-editor').value = '';
    document.getElementById('file-name').value = '';

    const outputEditor = document.getElementById('output-editor');
    outputEditor.innerHTML = `
    <div class="output-placeholder" id="output-placeholder">
      <div class="placeholder-icon">🎭</div>
      <div class="placeholder-title">Converted code will appear here</div>
      <div class="placeholder-subtitle">Paste your Selenium Java code on the left and click Convert</div>
    </div>
  `;

    document.getElementById('copy-btn').style.display = 'none';
    document.getElementById('download-btn').style.display = 'none';
    document.getElementById('results-bar').style.display = 'none';
    document.getElementById('warnings-panel').style.display = 'none';

    currentConversion = null;
    updateCharCount();
}

// ── Character Count ──────────────────────────────────────────
function updateCharCount() {
    const editor = document.getElementById('source-editor');
    const counter = document.getElementById('input-char-count');
    const len = editor.value.length;
    counter.textContent = `${len.toLocaleString()} chars`;

    if (len > 40000) {
        counter.style.color = 'var(--error)';
    } else if (len > 30000) {
        counter.style.color = 'var(--warning)';
    } else {
        counter.style.color = 'var(--text-muted)';
    }
}

// ── Toast Notification ───────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 4000);
}

// ── Utility ──────────────────────────────────────────────────
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
