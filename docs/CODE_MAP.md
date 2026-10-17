# Where the SpendWise code lives

The application uses TypeScript/JavaScript. Python is used only for producing the academic report.

| Component | Actual source | Responsibility |
| --- | --- | --- |
| Categories and extraction | [shared/domain.ts](../shared/domain.ts) | Eight permitted category tags, JSON Schema, Ollama request, amount/date validation and stored-record normalization. |
| Workflow builder | [scripts/build-workflow.mjs](../scripts/build-workflow.mjs) | Bundles the shared rules into n8n nodes; routes extraction, validation, ID lookup, insertion and database readback. |
| Importable n8n workflow | [n8n/spendwise.workflow.json](../n8n/spendwise.workflow.json) | Actual generated workflow. Credential identifiers are references; passwords and webhook values are not embedded. |
| Backend API | [server/app.ts](../server/app.ts) | Expense/history endpoints, receipt checks, retry reconciliation, budgets and health checks. |
| n8n client | [server/integration.ts](../server/integration.ts) | Adds the server-side webhook secret, calls n8n and handles uncertain failures. |
| Backend startup/configuration | [server/index.ts](../server/index.ts), [server/config.ts](../server/config.ts) | Local server startup and environment configuration. |
| Local budget/receipt storage | [server/storage.ts](../server/storage.ts) | Atomic local JSON persistence for backend state; private data is ignored by Git. |
| MongoDB initialization | [docker/mongo-init.js](../docker/mongo-init.js) | Application user, strict document validator and unique/date-category indexes. |
| Frontend submission | [src/components.tsx](../src/components.tsx), [src/api.ts](../src/api.ts) | Sends the message/request ID and displays a success receipt only for a confirmed save. |
| Dashboard and history | [src/App.tsx](../src/App.tsx) | Loads real transactions, computes totals/charts, filters history and shows category budgets. |
| Connection view and styling | [src/Settings.tsx](../src/Settings.tsx), [src/styles.css](../src/styles.css) | Service status and responsive finance interface. |
| Regression and service tests | [tests/](../tests/), [scripts/test-mongodb.ts](../scripts/test-mongodb.ts) | Validation/API/workflow regressions and actual isolated MongoDB integration checks. |
| Python documentation tools | [scripts/report/](../scripts/report/) | Report authoring, PDF page rendering and evidence checks; optional and separate from the backend. |
| Final academic documents | [submission/](../submission/) | DOCX, PDF, original template, genuine screenshots, source excerpts and sanitized verification records. |

The category labels are `Food & drinks`, `Transport`, `Groceries`, `Shopping`, `Bills & utilities`, `Health`, `Entertainment` and `Other`. Ollama chooses one permitted label; deterministic rules validate the transaction before n8n saves it. The dashboard displays the category stored in MongoDB.

The save flow is browser → Express → authenticated n8n → local Ollama → validation → MongoDB insert/readback → backend receipt → frontend refresh. The model never decides that a database save succeeded.

Passwords, `.env`, private `.local` state/backups, dependency installs, generated app build files, Docker volumes and temporary Word files are excluded from the repository. `.env.example` documents the required environment keys without credentials.
