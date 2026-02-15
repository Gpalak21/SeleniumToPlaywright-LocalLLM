# 🤖 SOP: LLM Integration

## Purpose
Define how the Ollama CodeLlama model is called for code conversion.

## Endpoint
- **URL:** `http://localhost:11434/api/generate`
- **Method:** POST
- **Model:** codellama

## Request Format
```json
{
  "model": "codellama",
  "prompt": "<system prompt + user code>",
  "stream": false,
  "options": {
    "temperature": 0.1,
    "top_p": 0.9,
    "num_predict": 4096
  }
}
```

## Temperature
- Use **0.1** (very low) for deterministic, consistent conversions
- Code conversion should produce the same output for the same input

## System Prompt Structure
1. Role definition: "You are a code converter..."
2. Mapping rules summary (key patterns)
3. Output format instructions
4. The actual source code to convert

## Response Handling
1. Parse JSON response
2. Extract `response` field
3. Strip markdown code fences if present
4. Validate basic syntax (brackets, parentheses matching)
5. Return cleaned code

## Error Handling
- **Connection refused:** Ollama not running → return friendly error
- **Model not found:** codellama not pulled → return instructions
- **Timeout:** Set 120s timeout for large files
- **Empty response:** Retry once, then return error

## Rate Limiting
- No rate limiting needed (local LLM)
- But limit max input size to 10,000 characters to prevent memory issues
