# SpendWise academic report evidence

The controlling template is `E:\Downloads\CA3_Agentic_AI_Blank_Template_v2.docx`. Its exact eight-section order and front matter are retained in the [final DOCX](../submission/SpendWise_AI_CA3_Report.docx) and [PDF](../submission/SpendWise_AI_CA3_Report.pdf). This file remains supporting evidence and drafting guidance; use the final report and [alignment checklist](../submission/CA3_ALIGNMENT_CHECKLIST.md) for submission review.

Supplied academic details: Ojas Verma; PRN 23070122153; course title Autonomous AI System and Agent-based Computing; faculty Nilima Zade; division C-2. The student will complete course duration, progress, provider and certificate evidence. Current genuine screenshots and a read-only MongoDB query show one existing INR 250 lunch record, separate from the cleaned isolated tests. The user supplied the verified [project repository](https://github.com/pratiklakra38/Spendwise); public application deployment remains unverified.

## Required front matter

Course / Subject is Agentic AI. The supplied course title, faculty and division are included in the final report, along with Ojas Verma and PRN 23070122153. The actual course duration and completion evidence remain for the student to enter. The template states a minimum of 45 hours; no faculty relaxation or course completion has been verified. Use real completion evidence only.

## 1 Introduction to Agentic AI

Explain the objective and key concepts: local language understanding, structured data, orchestration, tools, validation, persistence, and feedback. SpendWise helps record everyday expenses in natural language while keeping amount/date checks and storage confirmation deterministic.

## 2 Understanding of Agentic AI

Define an agent and its model, input, tools, state, orchestration, and feedback. The implemented system is a constrained AI-powered workflow, not a general autonomous financial adviser. n8n invokes the local model and MongoDB operations through explicitly routed nodes. The old starter’s AI Agent/workflow-tool pattern is historical background, not a claim about the current runtime.

## 3 Courses Completed

Fill the template’s course title, provider, duration, and completion-evidence fields using the student’s actual completed courses. Student input remains necessary. Do not invent certificates or course hours.

## 4 Problem Statement

Manual expense logging is inconvenient and inconsistent. Users need to describe an expense normally, obtain valid structured information, and receive a trustworthy confirmation that it was actually stored.

## 5 Proposed Solution

Project title: SpendWise AI. The solution combines local natural-language extraction, validation, authenticated automation, MongoDB persistence, a React dashboard, searchable history, and monthly category budgets. Google Sheets was the earlier storage design; MongoDB replaces it and removes the Google OAuth dependency. No unverified spreadsheet history was imported. Open-ended financial analysis and automated budget notifications are not implemented.

## 6 Implementation

- Programming language: TypeScript/JavaScript, HTML, and CSS.
- LLM / AI Model: existing Ollama `llama3.2:3b`, using native JSON Schema output with temperature 0.
- Agent Framework / Orchestration: existing n8n 2.35.6, with constrained workflow routing.
- Tools / APIs: authenticated n8n webhook, local Ollama HTTP API, native n8n MongoDB nodes.
- Database / Storage: local MongoDB 8.0 in Docker, separate persistent volume, authenticated application user, document validator, unique request-ID index. Local backend files preserve budget configuration and retry receipts; n8n retains its existing persistent state.
- Frontend: preserved React 19/Vite dashboard, transaction history, assistant, budgets, and connection settings.
- Backend: Express 5/Node.js proxy, loopback binding, validation and conservative retry handling.

Describe the verified flow: user message → backend → n8n → local Ollama schema extraction → deterministic validation → MongoDB ID lookup and insert → database readback → frontend receipt. The user’s requested arrow order is a conceptual flow; n8n orchestrates the model call and storage operation.

Explain that database documents store `amount, currency, category, description, date, originalMessage`, with ID and timestamp. The established UI response aliases `cost, descr, msg` were retained to preserve working components. No model is permitted to invent an amount, choose ambiguous dates, or announce a save by itself.

Use `docs/VERIFICATION.md` for test results actually recorded. Clearly distinguish simulated regression tests from real services and real MongoDB documents. Integration tests use a separate collection; their screenshots must be labeled as tests, not personal transactions.

## 7 Final Project Demonstration

App: `http://localhost:3000`; SpendWise n8n: `http://localhost:5679`. These are local addresses, not public deployments. The user subsequently supplied `https://github.com/pratiklakra38/Spendwise`, verified through GitHub and linked as the actual project repository in the report. The supplied academic student identity remains unchanged. The template does not explicitly require hashtags.

Use real screenshots of the app, n8n execution, and stored MongoDB document. Demonstrate a real expense in the main app if the student wants it recorded, or clearly identify the isolated test workspace. Show confirmation, stored fields, and refreshed dashboard totals. Do not present synthetic test records as personal financial history.

## 8 Conclusion

Summarize the actual tested capabilities and remaining limits from the verification record. State that MongoDB replaced Google Sheets, while the working model and UI were preserved. Do not claim a diagnosis of the unavailable historical Information Extractor output; the replacement structured-output path has its own tests. Link the supplied project repository separately from application deployment. Do not claim multi-user security, automatic financial advice, alerts, a public demo or course completion.

## Simple student briefing

You describe an expense. The local model extracts the details. Code checks the amount and date. n8n stores it in MongoDB and reads it back. Only then does the app say saved. The dashboard reads those same stored records. The migration removes Google sign-in and keeps the original message with each expense. Give the student this explanation separately when delivering the final report.
