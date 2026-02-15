/**
 * ollama-client.js — Ollama REST API client for CodeLlama
 * 
 * Handles communication with the local Ollama instance.
 * Provides generate, health check, and model listing functionality.
 */

const http = require('http');
const https = require('https');

class OllamaClient {
    /**
     * @param {string} baseUrl - Ollama API base URL (default: http://localhost:11434)
     * @param {string} model - Model name (default: codellama)
     */
    constructor(baseUrl = 'http://localhost:11434', model = 'codellama') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.model = model;
        this.timeout = 120000; // 120 seconds for large conversions
    }

    /**
     * Make an HTTP request to Ollama
     * @param {string} path - API path
     * @param {string} method - HTTP method
     * @param {object} body - Request body
     * @returns {Promise<object>} Response data
     */
    _request(path, method = 'GET', body = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(`${this.baseUrl}${path}`);
            const isHttps = url.protocol === 'https:';
            const lib = isHttps ? https : http;

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: this.timeout,
            };

            const req = lib.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (e) {
                        reject(new Error(`Failed to parse Ollama response: ${data.substring(0, 200)}`));
                    }
                });
            });

            req.on('error', (err) => {
                if (err.code === 'ECONNREFUSED') {
                    reject(new Error('Ollama is not running. Please start Ollama with: ollama serve'));
                } else {
                    reject(new Error(`Ollama connection error: ${err.message}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Ollama request timed out. The conversion may be too complex.'));
            });

            if (body) {
                req.write(JSON.stringify(body));
            }

            req.end();
        });
    }

    /**
     * Generate a completion from CodeLlama
     * @param {string} prompt - The prompt to send
     * @param {object} options - Generation options
     * @returns {Promise<{response: string, totalDuration: number, model: string}>}
     */
    async generate(prompt, options = {}) {
        const {
            temperature = 0.1,
            topP = 0.9,
            numPredict = 4096,
        } = options;

        const startTime = Date.now();

        const result = await this._request('/api/generate', 'POST', {
            model: this.model,
            prompt,
            stream: false,
            options: {
                temperature,
                top_p: topP,
                num_predict: numPredict,
            },
        });

        const duration = Date.now() - startTime;

        return {
            response: result.response || '',
            totalDuration: duration,
            model: result.model || this.model,
            done: result.done || false,
        };
    }

    /**
     * Check if Ollama is running and the model is available
     * @returns {Promise<{connected: boolean, model: string, modelAvailable: boolean, error?: string}>}
     */
    async healthCheck() {
        try {
            const tags = await this._request('/api/tags');
            const models = (tags.models || []).map((m) => m.name);
            const modelAvailable = models.some(
                (m) => m === this.model || m.startsWith(`${this.model}:`)
            );

            return {
                connected: true,
                model: this.model,
                modelAvailable,
                availableModels: models,
            };
        } catch (err) {
            return {
                connected: false,
                model: this.model,
                modelAvailable: false,
                error: err.message,
            };
        }
    }
}

module.exports = { OllamaClient };
