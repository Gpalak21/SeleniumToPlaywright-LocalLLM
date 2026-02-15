/**
 * code-formatter.js — Cleans and formats the LLM output
 * 
 * Handles:
 * - Stripping markdown code fences
 * - Cleaning whitespace
 * - Validating bracket matching
 * - Extracting warnings
 */

/**
 * Clean and format the raw LLM response into valid code
 * @param {string} rawResponse - Raw response from CodeLlama
 * @param {string} targetLanguage - 'javascript' or 'typescript'
 * @returns {{ code: string, warnings: string[] }}
 */
function formatCode(rawResponse, targetLanguage = 'typescript') {
    let code = rawResponse || '';
    const warnings = [];

    // Strip markdown code fences (```typescript ... ``` or ```javascript ... ``` or ``` ... ```)
    code = stripCodeFences(code);

    // Trim leading/trailing whitespace
    code = code.trim();

    // Extract TODO warnings from the code
    const todoMatches = code.match(/\/\/\s*TODO:.*$/gm);
    if (todoMatches) {
        todoMatches.forEach((todo) => {
            warnings.push(todo.replace(/\/\/\s*TODO:\s*/, ''));
        });
    }

    // Extract WARNING comments
    const warningMatches = code.match(/\/\/\s*WARNING:.*$/gm);
    if (warningMatches) {
        warningMatches.forEach((w) => {
            warnings.push(w.replace(/\/\/\s*WARNING:\s*/, ''));
        });
    }

    // Validate bracket matching
    const bracketCheck = validateBrackets(code);
    if (!bracketCheck.valid) {
        warnings.push(`Bracket mismatch detected: ${bracketCheck.message}`);
    }

    // Ensure the import statement is present
    const importLine = targetLanguage === 'typescript'
        ? `import { test, expect } from '@playwright/test';`
        : `const { test, expect } = require('@playwright/test');`;

    if (!code.includes('@playwright/test')) {
        code = `${importLine}\n\n${code}`;
        warnings.push('Import statement was missing and has been added automatically.');
    }

    return { code, warnings };
}

/**
 * Strip markdown code fences from the response
 * @param {string} text - Raw text that may contain code fences
 * @returns {string} Clean code without fences
 */
function stripCodeFences(text) {
    // Match ```lang\n...\n``` pattern
    const fenceRegex = /^```(?:typescript|javascript|ts|js|playwright)?\s*\n?([\s\S]*?)```\s*$/;
    const match = text.match(fenceRegex);
    if (match) {
        return match[1];
    }

    // Try to extract code between first ``` and last ```
    const firstFence = text.indexOf('```');
    const lastFence = text.lastIndexOf('```');
    if (firstFence !== -1 && lastFence !== -1 && firstFence !== lastFence) {
        let inner = text.substring(firstFence + 3, lastFence);
        // Remove language identifier on first line
        inner = inner.replace(/^(?:typescript|javascript|ts|js|playwright)\s*\n/, '');
        return inner;
    }

    return text;
}

/**
 * Validate that brackets/parentheses/braces are balanced
 * @param {string} code - Code to validate
 * @returns {{ valid: boolean, message: string }}
 */
function validateBrackets(code) {
    const stack = [];
    const pairs = { '(': ')', '[': ']', '{': '}' };
    const closers = new Set([')', ']', '}']);
    let inString = false;
    let stringChar = '';
    let inLineComment = false;
    let inBlockComment = false;

    for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        const next = code[i + 1] || '';

        // Handle comments
        if (!inString && !inBlockComment && ch === '/' && next === '/') {
            inLineComment = true;
            continue;
        }
        if (inLineComment && ch === '\n') {
            inLineComment = false;
            continue;
        }
        if (inLineComment) continue;

        if (!inString && !inBlockComment && ch === '/' && next === '*') {
            inBlockComment = true;
            i++;
            continue;
        }
        if (inBlockComment && ch === '*' && next === '/') {
            inBlockComment = false;
            i++;
            continue;
        }
        if (inBlockComment) continue;

        // Handle strings
        if (!inString && (ch === '"' || ch === "'" || ch === '`')) {
            inString = true;
            stringChar = ch;
            continue;
        }
        if (inString && ch === stringChar && code[i - 1] !== '\\') {
            inString = false;
            continue;
        }
        if (inString) continue;

        // Check brackets
        if (pairs[ch]) {
            stack.push(ch);
        } else if (closers.has(ch)) {
            if (stack.length === 0) {
                return { valid: false, message: `Unexpected '${ch}' at position ${i}` };
            }
            const last = stack.pop();
            if (pairs[last] !== ch) {
                return { valid: false, message: `Expected '${pairs[last]}' but found '${ch}' at position ${i}` };
            }
        }
    }

    if (stack.length > 0) {
        return { valid: false, message: `Unclosed '${stack[stack.length - 1]}'` };
    }

    return { valid: true, message: 'OK' };
}

/**
 * Generate a Playwright-style filename from a Java filename
 * @param {string} javaFileName - e.g. "LoginTest.java"
 * @param {string} targetLanguage - 'javascript' or 'typescript'
 * @returns {string} e.g. "login-test.spec.ts"
 */
function generateOutputFileName(javaFileName, targetLanguage = 'typescript') {
    const ext = targetLanguage === 'typescript' ? '.spec.ts' : '.spec.js';

    if (!javaFileName) {
        return `converted-test${ext}`;
    }

    // Remove .java extension
    let name = javaFileName.replace(/\.java$/i, '');

    // Convert CamelCase to kebab-case
    name = name
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();

    return `${name}${ext}`;
}

module.exports = { formatCode, stripCodeFences, validateBrackets, generateOutputFileName };
