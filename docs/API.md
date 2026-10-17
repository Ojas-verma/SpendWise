# SpendWise MongoDB API contract

The browser uses the same backend contract as before the migration. MongoDB is now the expense source of truth. There is no fallback to the old spreadsheet or to mock data.

## Expense requests

`GET /api/expenses` returns `{ expenses: Expense[], invalidRows: number, source: "mongodb", today: string }`. `invalidRows` is the retained API name for invalid stored records. All dates are `YYYY-MM-DD` civil dates in `Asia/Kolkata`.

The established `Expense` response contains `id, date, cost, currency, category, descr, msg`. MongoDB stores those values as `id, date, amount, currency, category, description, originalMessage` plus `createdAt` and `_id`. The normalizer maps stored records to the established response without duplicating storage.

`POST /api/expenses` requires JSON, `X-SpendWise-Client: 1`, and `{ message: string, requestId: string }`. Generate one UUID per submission and retain it if the transport fails. Cross-site writes, untrusted origins/Host values, invalid payloads, and simultaneous saves in one backend process are rejected.

Success is `{ status: "saved", expense, replayed?: boolean }`. n8n reaches that response only after a successful MongoDB insert and a matching database readback, or after reading an existing matching ID. The backend validates the receipt against the original request. Replaying a locally cached receipt also requires a current database read; a database outage cannot be hidden by the cache.

Clarification is `{ status: "clarification", message }`, without inserting anything. Errors use HTTP 4xx/5xx with `{ status: "error", message, code? }`. `PARSE_FAILED` and validation-stage `DB_LOOKUP_FAILED` identify failures before insertion. A native database-node failure stops n8n; the backend treats its absent/failed response conservatively as unconfirmed and does not automatically retry. `WRITE_UNCERTAIN` covers an unresolved prior insertion/readback outcome; it is not a claim that no document was written.

## Internal n8n endpoint

The backend calls `POST http://127.0.0.1:5679/webhook/spendwise-v1` using server-side Header Auth `X-SpendWise-Key`. No browser receives this secret. The fixed actions are:

- `list`: query the actual `expenses` collection, normalize records, return `{ status: "ok", expenses, invalidRows }`.
- `create`: validate request, run schema-constrained Ollama extraction, validate business fields, check ID, insert the canonical MongoDB document, read it back, compare all expense fields, return a save receipt.
- `parse`: run extraction and validation only, returning `parsed` or clarification without database operations.

All MongoDB query structure and collection names are fixed in the generated workflow; user text is never treated as a query. ID filters are serialized from the validated request ID. The n8n credential authenticates as the database’s application user, with journaled majority write concern and primary reads. Google credentials are unused.

All MongoDB nodes stop the workflow on error. The installed node version can forward original input under continue-on-error settings, so those settings are deliberately not used for database operations. Following Code nodes also require genuine document identity on nonempty records; insertion does not have artificial empty output enabled. MongoDB insertion output itself is not a receipt: it must be followed by readback. If n8n stops without a response body, the backend returns an error and never a saved status.

## Other endpoints

`GET /api/health` returns `n8n`, `ollama`, and `mongodb` booleans, model, time zone, local n8n URL, and current date. MongoDB health requires a successful query through the published workflow, not just an open socket. No secrets are returned.

`GET /api/budgets` and `PUT /api/budgets` read/replace validated monthly category limits in the existing local server file. Budget progress uses real MongoDB expense data. Notifications are not implemented.

## Retry integrity

The server writes a pending entry to `.local/requests-mongodb.json` before sending a create request. It rejects reuse of an ID for a different message. On a saved or pending retry, it queries MongoDB by ID and confirms the same original message before reporting success. If the database cannot establish the prior write, it will not automatically submit another insertion.

MongoDB has a unique index on `id`, so concurrent attempts cannot persist two documents with that ID. The n8n lookup reduces unnecessary duplicate-key failures, while the database index supplies the actual uniqueness guarantee. Independent requests using different UUIDs can still represent the same human expense; there is no claim of semantic duplicate detection.

The old Sheets journal is kept intact but never used for MongoDB confirmation. Old credentials and volumes are preserved. This migration did not copy unverified historical spreadsheet rows.

## Test isolation and local security

The generated integration-test workflow is the same code with a fixed alternate webhook path and collection `expense_integration_tests`. The browser test server displays an explicit integration-test label. Its real database records are never returned by the main collection’s workflow. Test cleanup deletes only IDs recorded by that test run.

The app and newly configured Docker ports bind to loopback. Browser-origin protections are not a multi-user login system; this remains a trusted, single-user local application. MongoDB passwords, n8n credentials, local journals, database volumes, and backups contain private information and must not be committed or publicly shared.
