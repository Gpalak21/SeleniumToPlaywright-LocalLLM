/**
 * file-writer.js — Saves converted Playwright code to the output directory
 * 
 * Handles:
 * - Writing files to output/ directory
 * - Creating timestamped subdirectories for batch operations
 * - Listing conversion history
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

/**
 * Save converted code to the output directory
 * @param {string} code - The converted Playwright code
 * @param {string} fileName - Output filename (e.g., login-test.spec.ts)
 * @returns {{ filePath: string, relativePath: string }}
 */
function saveConvertedFile(code, fileName) {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const filePath = path.join(OUTPUT_DIR, fileName);

    // If file already exists, add a timestamp suffix
    let finalPath = filePath;
    if (fs.existsSync(filePath)) {
        const ext = path.extname(fileName);
        const base = path.basename(fileName, ext);
        const timestamp = Date.now();
        finalPath = path.join(OUTPUT_DIR, `${base}-${timestamp}${ext}`);
    }

    fs.writeFileSync(finalPath, code, 'utf-8');

    return {
        filePath: finalPath,
        relativePath: path.relative(path.join(__dirname, '..'), finalPath),
        fileName: path.basename(finalPath),
    };
}

/**
 * Get list of previously converted files
 * @returns {Array<{ name: string, path: string, size: number, timestamp: Date }>}
 */
function getConversionHistory() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        return [];
    }

    const files = fs.readdirSync(OUTPUT_DIR)
        .filter((f) => f.endsWith('.spec.ts') || f.endsWith('.spec.js'))
        .map((f) => {
            const fullPath = path.join(OUTPUT_DIR, f);
            const stats = fs.statSync(fullPath);
            return {
                name: f,
                path: fullPath,
                relativePath: `output/${f}`,
                size: stats.size,
                timestamp: stats.mtime,
            };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

    return files;
}

/**
 * Read a previously converted file
 * @param {string} fileName - The filename to read
 * @returns {string|null} File content or null if not found
 */
function readConvertedFile(fileName) {
    const filePath = path.join(OUTPUT_DIR, fileName);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
}

module.exports = { saveConvertedFile, getConversionHistory, readConvertedFile };
