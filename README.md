# SpendWise AI

SpendWise turns natural-language expense messages into validated MongoDB records using your existing local Ollama `llama3.2:3b` model and n8n workflow. The React dashboard reads real transactions through the backend and n8n. Google Sheets and Google OAuth are no longer required.

The backend is **Node.js/TypeScript**, not Python. Expense extraction and category tags are defined in [`shared/domain.ts`](shared/domain.ts) and used by the generated [`n8n workflow`](n8n/spendwise.workflow.json). See the [code map](docs/CODE_MAP.md) for the backend, transactions, validation and persistence files. The [Python report tools](scripts/report/README.md) are included separately and are optional for running the application.

## Local addresses

- Application: <http://localhost:3000>
- SpendWise n8n: <http://localhost:5679>
- MongoDB from Windows: `127.0.0.1:27018`, with authentication
- MongoDB from n8n’s Docker network: `mongodb:27017`
- Ollama from Windows: <http://localhost:11434>
- Ollama from n8n: `http://host.docker.internal:11434`
- Original n8n on port 5678: left unchanged

All newly configured host ports bind to `127.0.0.1`. MongoDB uses the official `mongo:8.0` image. No Atlas account, new language model, paid AI API, or Google sign-in is needed.

## Routine startup

Start Docker Desktop and your existing Ollama application, then use PowerShell:

```powershell
Set-Location E:\FinSentry\SpendWise
./start.ps1
```

This starts the existing Compose services, waits for MongoDB health, and runs the app with Vite development updates. Keep the app terminal open. If port 3000 already serves SpendWise, use that running instance rather than starting a second copy.

For the production build:

```powershell
docker compose up -d --wait
npm.cmd run build
npm.cmd start
```

Stop the app using Ctrl+C. `docker compose stop` stops only this project’s services without deleting data. Start again using `docker compose up -d --wait`. Never delete the named volumes or run `docker compose down -v` to troubleshoot a login or database problem.

## First setup or reproducing the migration

The current workspace is already configured. These steps are for a checkout that has not yet been configured:

1. Install the locked npm dependencies with `npm.cmd ci`.
2. Preserve an existing `.env`. If it does not exist, copy `.env.example` to `.env`.
3. Set a strong private `N8N_WEBHOOK_SECRET` in `.env`. Use the existing value on this computer. The frontend never receives it.
4. Run `npm.cmd run setup:mongodb`. This generates MongoDB passwords only for missing or empty settings, without printing them or changing existing values.
5. Run `./scripts/install-workflow.ps1`. This starts the new database, imports the private webhook/MongoDB credential, updates the existing SpendWise workflow, publishes it, and restarts only SpendWise n8n. It preserves the owner account, n8n volume, and earlier Google credential.
6. Build and start the application using the commands above.

The setup assumes the existing local n8n image tag `n8nio/n8n:spendwise-local` and external volume `spendwise_n8n_data`. It deliberately does not reset or recreate that volume. On a different computer, identify the existing installation before configuring those values; do not blindly recreate user data.

The official MongoDB image may be downloaded if it is absent. MongoDB initializes its application user, collections, validators, and indexes **once on an empty volume** using `docker/mongo-init.js`. Later container restarts reuse the same database. Changing `.env` passwords does not change users inside an initialized database; rotate credentials explicitly through MongoDB if necessary. Do not regenerate passwords to fix an authentication error.

## Preserved resources

- The original n8n container on port 5678 is unchanged.
- SpendWise n8n still uses its existing `spendwise_n8n_data` volume and owner account on port 5679.
- A new, separate `spendwise_mongodb_data` volume stores the database.
- Existing Google credentials and the target Google spreadsheet were not modified or deleted. No historical Sheets data was imported: Sheets access had not previously been verified.
- The prior Compose file, workflow JSON, README, verification record, and `.env` were copied privately to `.local/backups/pre-mongodb/` before the migration. That directory can contain secrets; never publish it.
- Local budgets are preserved in `.local/budgets.json`. The new MongoDB receipt journal uses `.local/requests-mongodb.json`, leaving old Sheets receipts separate.

## What works in the application

- Natural-language expense entry with native Ollama JSON-schema output and deterministic validation.
- MongoDB storage of amount, currency, category, description, expense date, original message, request ID, and creation timestamp.
- Confirmed save receipts after an acknowledged insert and a matching database readback.
- Real transaction history, month/category/date filtering, search, sorting, details, and CSV export.
- Monthly spending, transaction count, average expense, daily chart, and category breakdown calculated from the retrieved records.
- Monthly category budgets stored on the local backend, with progress calculated from real expenses.
- Live n8n, Ollama, and MongoDB connection checks.
- Loading, empty, clarification, error, and success states, responsive layouts, keyboard focus, and reduced-motion styles.

Setup does not seed personal expenses. No mock expense fallback or sample records are shown as personal history; existing user records are retrieved from MongoDB. Automated email/push budget alerts, a multi-user account system, editing/deleting expenses in the UI, and open-ended financial-advice chat are not implemented. The application remains a local single-user prototype.

See [the verification record](docs/VERIFICATION.md) for checks actually performed and their limits.

## Expense validation

One positive INR expense per message is supported, with at most two decimal places and an amount up to ₹10,000,000. The amount must be present in the original text; the model cannot invent it. Missing amounts, unsupported currency, uncertain/negated spending, multiple amounts, conflicting dates, and invalid/future dates prompt clarification.

Dates use `Asia/Kolkata`. No stated date defaults explicitly to today. Today, yesterday, day before yesterday, ISO dates, and day + English month are resolved in code. An omitted year uses the current local year. Unrecognized date expressions require clarification.

The old Information Extractor failure is avoided by calling Ollama’s native `/api/chat` with a JSON Schema, temperature 0, and a bounded response. JSON decoding and business validation follow it. The original historical raw-output mismatch was not established because its workflow was absent from the inspected instance; do not claim otherwise in the report.

## Database and credentials

MongoDB stores documents in `spendwise.expenses`. The persisted shape is:

```text
id              string, uniquely indexed submission identifier
amount          positive number, INR
currency        INR
category        validated category
description     short description
date            YYYY-MM-DD civil date in India
originalMessage original user input
createdAt       ISO timestamp
_id             MongoDB ObjectId
```

The existing frontend API aliases remain `cost`, `descr`, and `msg`, so the established dashboard components did not need a rewrite. MongoDB’s strict collection validator enforces required fields/types and allowed categories/currency; application validation additionally checks calendar dates, decimal precision, and evidence from the original message. A unique `id` index prevents two documents with the same request ID. A date/category index supports retrieval.

`.env` contains separate MongoDB root/application credentials and the webhook secret. The application user has `readWrite` only on the SpendWise database; n8n does not use the root account. Docker Compose reads the MongoDB variables, and the import helper creates an encrypted n8n credential from them. Its temporary secret-bearing file is deleted after import. The workflow JSON and `.env.example` contain no passwords.

The three separate credentials are the n8n editor owner login, the backend-to-n8n webhook Header Auth, and the n8n-to-MongoDB application user. None belongs in browser JavaScript. No Google OAuth is used by the new workflow.

## Tests and browser verification

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test:ollama
node --import tsx scripts/test-n8n.ts
```

The first command covers validation and backend/workflow regressions using isolated temporary files and simulated upstream responses. The model and n8n parser commands use real local services but do not write expenses.

To reproduce complete database tests, install the isolated test workflow and then run:

```powershell
./scripts/install-workflow.ps1 -IncludeTestWorkflow
npm.cmd run test:e2e
```

This exercises the actual backend → authenticated n8n → Ollama → validated MongoDB insert/readback → API receipt path. It verifies canonical stored fields, real history and totals, duplicate replay, conflicting IDs, missing amounts, unique indexes, MongoDB schema rejection, a brief outage of **only SpendWise MongoDB**, and persistence across its restart. It restores the service and removes only its own records from `expense_integration_tests`. The personal `expenses` collection is not seeded or cleared.

`npm.cmd run test:e2e -- --serve` keeps a clearly labeled real-database test workspace at port 3001 for browser checks. Finish it from another PowerShell terminal using `Invoke-RestMethod -Method Post -Uri http://localhost:3001/__integration/finish -Headers @{'X-SpendWise-Client'='1'}`. This drains requests, cleans up its own test IDs and temporary files, and stops that test server. Forced process termination can skip signal cleanup; no test records are ever returned by the personal collection. Evidence is written privately to `.local/mongodb-e2e-results.json`.

## Troubleshooting

- **n8n login:** use the owner account created for port 5679. MongoDB does not change that login. Never reset owner management or delete a volume to change email.
- **Database unavailable:** start Docker Desktop, run `docker compose up -d --wait`, and check the app’s Settings. A MongoDB connection is checked by an actual query through n8n.
- **Database authentication fails:** keep `.env` consistent with the credentials created on the volume’s first initialization. Do not delete the volume or generate replacement passwords. Reimport the n8n credential only when it matches the actual database user.
- **Webhook 404:** publish workflow `SpendWiseLocalV1` and use production path `/webhook/spendwise-v1`. The frontend calls the backend; it does not use the n8n editor password.
- **Webhook 403:** match `X-SpendWise-Key` Header Auth to `.env`. Do not disable authentication.
- **Ollama unavailable:** verify the existing `llama3.2:3b` model with `/api/tags`. n8n uses `host.docker.internal:11434`; `localhost` inside Docker means the container itself.
- **Uncertain save:** the backend checks MongoDB by request ID before any replay and refuses an unconfirmed second write. A lookup failure before insertion can safely be retried; an insert/readback timeout must be reconciled first. See [the API contract](docs/API.md).
- **Port in use:** use the existing app instance, or stop that instance before starting another. Keep port 27018 consistent between `.env`, Compose, and verification scripts.

## Project layout and report

`src/` contains the preserved React dashboard and assistant. `server/` is the backend proxy and budget/receipt storage. `shared/domain.ts` contains the existing extraction schema and validation. `scripts/build-workflow.mjs` generates the MongoDB workflow in `n8n/`. `docker/` contains first-time database initialization. `compose.yaml`, `.env.example`, and `start.ps1` provide local setup/startup.

The final CA3 report is available in [DOCX](submission/SpendWise_AI_CA3_Report.docx) and [PDF](submission/SpendWise_AI_CA3_Report.pdf), with genuine screenshots, exact source excerpts and verification evidence in [submission/](submission/README.md). It preserves the template’s eight-section order and includes the supplied student, PRN, faculty and division details. The verified repository is linked in the report. Course duration/certificates and any required public application deployment remain explicitly pending.

The report’s current screenshot snapshot contains one existing INR 250 lunch record on 17 October 2026. This is separate from the earlier isolated four/five-record integration tests, which were cleaned up. See [the alignment checklist](submission/CA3_ALIGNMENT_CHECKLIST.md) for the remaining academic submission items.
