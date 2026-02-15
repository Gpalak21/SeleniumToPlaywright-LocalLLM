# 🎭 Selenium to Playwright Converter (Local LLM Powered)

A premium, local LLM-powered web application that transforms Selenium (Java) + TestNG test scripts into equivalent Playwright (JavaScript/TypeScript) code.

![UI Mockup](https://raw.githubusercontent.com/antigravity-ai/assets/main/converter-mockup.png) <!-- Placeholder for image -->

## 🚀 Features

- **Local LLM Integration**: Uses Ollama (CodeLlama/DeepSeek) for secure, local code conversion. No API keys or cloud data exposure.
- **TestNG Support**: Maps TestNG annotations (`@Test`, `@BeforeMethod`, etc.) to Playwright test runner syntax.
- **Smart Mapping**: Automatically converts Selenium locators, actions, and waits to Playwright's auto-waiting locators and modern assertions.
- **Premium UI**: Modern dark-mode interface with side-by-side editors, line numbering, and syntax highlighting.
- **Instant Delivery**: Download converted scripts as `.spec.ts` or `.spec.js` files ready for execution.

## 🛠️ Prerequisites

- **Node.js**: v18.0.0 or higher
- **Ollama**: Installed and running locally ([ollama.com](https://ollama.com))
- **Local Model**: Pull the requested model (default is `codellama`):
  ```bash
  ollama pull codellama
  ```

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd SeleniumToPlaywrightLocalLLM
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   Copy `.env.example` to `.env` and adjust the model or port if needed.

## 🚦 Usage

1. Start the server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:8080`.
3. Paste your Selenium Java code on the left.
4. Click **⚡ Convert** and wait for the local LLM to generate your Playwright code.

## 📜 Project Structure

- `server.js`: Node.js/Express backend handling LLM communication.
- `public/`: Frontend assets (HTML, CSS, JS).
- `output/`: Local directory where converted files are saved.
- `architecture/`: Strategic Operating Procedures (SOPs) and mapping rules.

## ⚖️ License

MIT License - feel free to use and contribute!
