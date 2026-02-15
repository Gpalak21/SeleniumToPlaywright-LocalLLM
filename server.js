/**
 * server.js — Express backend for Selenium → Playwright Converter
 * 
 * Endpoints:
 *   POST /api/convert   — Convert Selenium Java to Playwright JS/TS
 *   GET  /api/health    — Health check (Ollama status)
 *   GET  /api/history   — List previous conversions
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { OllamaClient } = require('./tools/ollama-client');
const { buildConversionPrompt } = require('./tools/prompt-builder');
const { formatCode, generateOutputFileName } = require('./tools/code-formatter');
const { saveConvertedFile, getConversionHistory } = require('./tools/file-writer');

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

// Initialize Ollama client
const ollama = new OllamaClient(
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    process.env.OLLAMA_MODEL || 'codellama'
);

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── POST /api/convert ───────────────────────────────────────────────
app.post('/api/convert', async (req, res) => {
    try {
        const {
            sourceCode,
            targetLanguage = process.env.DEFAULT_TARGET_LANGUAGE || 'typescript',
            fileName,
            options = {},
        } = req.body;

        // Validate input
        if (!sourceCode || sourceCode.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Source code is required. Please paste your Selenium Java code.',
            });
        }

        if (sourceCode.length > 50000) {
            return res.status(413).json({
                success: false,
                error: 'Source code is too large. Maximum 50,000 characters allowed.',
            });
        }

        const validLanguages = ['javascript', 'typescript'];
        if (!validLanguages.includes(targetLanguage)) {
            return res.status(400).json({
                success: false,
                error: `Invalid target language. Use: ${validLanguages.join(', ')}`,
            });
        }

        console.log(`[CONVERT] Starting conversion: ${fileName || 'unnamed'} → ${targetLanguage}`);
        console.log(`[CONVERT] Source code length: ${sourceCode.length} characters`);

        // Build prompt
        const prompt = buildConversionPrompt(sourceCode, targetLanguage, options);

        // Call Ollama
        const startTime = Date.now();
        let llmResult;
        try {
            llmResult = await ollama.generate(prompt);
        } catch (err) {
            console.error(`[CONVERT] Ollama error: ${err.message}`);
            return res.status(503).json({
                success: false,
                error: `LLM Error: ${err.message}`,
                hint: 'Make sure Ollama is running: ollama serve',
            });
        }

        // Format the output
        const { code, warnings } = formatCode(llmResult.response, targetLanguage);

        // Generate output filename
        const outputFileName = generateOutputFileName(fileName, targetLanguage);

        // Save to file
        let savedFile;
        try {
            savedFile = saveConvertedFile(code, outputFileName);
        } catch (err) {
            console.error(`[CONVERT] File save error: ${err.message}`);
            // Continue even if file saving fails — still return the code
            savedFile = { fileName: outputFileName, relativePath: 'output/' + outputFileName };
            warnings.push(`Could not save file: ${err.message}`);
        }

        const totalTime = Date.now() - startTime;
        console.log(`[CONVERT] Completed in ${totalTime}ms. Warnings: ${warnings.length}`);

        // Return result
        res.json({
            success: true,
            convertedCode: code,
            targetLanguage,
            outputFileName: savedFile.fileName,
            outputDir: savedFile.relativePath,
            warnings,
            mappingReport: {
                totalPatterns: code.split('\n').length,
                warningCount: warnings.length,
            },
            metadata: {
                modelUsed: llmResult.model,
                conversionTimeMs: totalTime,
                llmDurationMs: llmResult.totalDuration,
                timestamp: new Date().toISOString(),
                sourceLength: sourceCode.length,
                outputLength: code.length,
            },
        });
    } catch (err) {
        console.error(`[CONVERT] Unexpected error:`, err);
        res.status(500).json({
            success: false,
            error: `Conversion failed: ${err.message}`,
        });
    }
});

// ─── GET /api/health ─────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
    const health = await ollama.healthCheck();
    res.json({
        status: health.connected ? 'healthy' : 'degraded',
        ollama: health,
        server: {
            uptime: process.uptime(),
            port: PORT,
        },
    });
});

// ─── GET /api/history ────────────────────────────────────────────────
app.get('/api/history', (req, res) => {
    try {
        const history = getConversionHistory();
        res.json({ conversions: history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Serve frontend ──────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start server ────────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     🔄 Selenium → Playwright Converter                     ║');
    console.log('║                                                            ║');
    console.log(`║     Server:  http://${HOST}:${PORT}                        ║`);
    console.log(`║     Model:   ${(process.env.OLLAMA_MODEL || 'codellama').padEnd(42)}  ║`);
    console.log('║                                                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
});
