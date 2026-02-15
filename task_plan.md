# 📋 Task Plan — Selenium Java → Playwright JS/TS Converter

## 🎯 Project Overview

Build a **local LLM-powered web application** that takes Selenium (Java) + TestNG test scripts as input and produces equivalent Playwright (JavaScript/TypeScript) test scripts.

---

## 🟢 Phase 0: Initialization — COMPLETE ✅

- [x] Create project memory: `gemini.md`, `task_plan.md`, `findings.md`, `progress.md`
- [x] Set up structure: `architecture/`, `tools/`, `.tmp/`, `output/`
- [x] **Halt:** Answer 5 Discovery Questions
- [x] Finalize Data Schema in `gemini.md`

## 🔵 Phase 1: Blueprint — COMPLETE ✅

- [x] Research existing Selenium → Playwright mapping (TestNG logic, locators, actions)
- [x] Research best Ollama model for code conversion (CodeLlama, DeepSeek)
- [x] Finalize SOPs for conversion in `architecture/`

## 🟡 Phase 2: Architect (The Engine) — COMPLETE ✅

- [x] Build Backend API (Node.js/Express)
- [x] Implement Ollama integration with custom prompt engineering
- [x] Set up conversion logic with mapping report generation
- [x] Implement file saving to `output/` directory

## 🟣 Phase 3: Stylize (The UI) — COMPLETE ✅

- [x] Build premium Dark-Mode UI (Vanilla JS + Glassmorphism)
- [x] Implement side-by-side editor panels
- [x] Add real-time health check for Ollama status
- [x] **NEW:** Implement robust syntax highlighting and line numbering
- [x] Add Copy/Download/Sample functionality

## 🔴 Phase 4: Trigger (Launch) — PENDING 🚀

- [ ] Final end-to-end testing with complex TestNG suites
- [ ] Add batch conversion support (upload multiple files)
- [ ] Implement code comparisons (diff view)
- [ ] Documentation Cleanup & README
