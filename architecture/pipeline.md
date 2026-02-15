# 🔄 SOP: Conversion Pipeline

## Purpose
Define the end-to-end flow from user input to converted output.

## Pipeline Steps

```
User pastes code in UI
        ↓
POST /api/convert { sourceCode, targetLanguage, options }
        ↓
1. Validate input (non-empty, max length)
        ↓
2. Build LLM prompt (prompt-builder.js)
   - System instruction
   - Mapping rules context
   - Source code
   - Output format requirements
        ↓
3. Call Ollama API (ollama-client.js)
   - POST to http://localhost:11434/api/generate
   - Model: codellama
   - Temperature: 0.1
   - Wait for response (up to 120s)
        ↓
4. Process response (code-formatter.js)
   - Extract code from response
   - Strip markdown fences
   - Clean whitespace
   - Validate bracket matching
        ↓
5. Save to file (file-writer.js)
   - Generate filename from input
   - Save to output/ directory
   - Return file path
        ↓
6. Return response to UI
   - Converted code
   - Output filename
   - Warnings/report
   - Metadata (model, time, etc.)
        ↓
UI displays result side-by-side
```

## API Endpoints

### POST /api/convert
- Input: { sourceCode, targetLanguage?, fileName?, options? }
- Output: { success, convertedCode, outputFileName, warnings, metadata }

### GET /api/health
- Output: { status, ollamaConnected, model }

### GET /api/history
- Output: { conversions: [...] }

## Error States
1. Ollama not running → 503 + friendly message
2. Empty input → 400 + validation error
3. Input too large → 413 + size limit message
4. LLM timeout → 504 + timeout message
5. Conversion error → 500 + error details
