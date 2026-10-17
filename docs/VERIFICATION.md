# MongoDB migration verification

Verified on 17 October 2026, Asia/Kolkata. This record describes tests actually run, including real MongoDB writes. Synthetic expenses were confined to a separate test collection and a clearly labeled browser workspace; the personal `expenses` collection was not seeded.

## Preserved environment

The existing React/TypeScript application, validation library, Ollama `llama3.2:3b`, and n8n 2.35.6 were reused. No model was downloaded and no existing tool was reinstalled. The original n8n container on port 5678 was unchanged. SpendWise n8n retained its owner account and `spendwise_n8n_data` volume on port 5679. Existing Google credentials and the spreadsheet were not deleted or modified. There was no verified historical Sheets data available to import.

MongoDB 8.0 was added from its official Docker image, using a new `spendwise_mongodb_data` volume. Its Windows port is bound to `127.0.0.1:27018`; n8n uses the internal Docker service name. Passwords were generated into private `.env`, not source or browser code. n8n authenticates with the scoped application user, not root. Both application and test collections have required-field validation, unique request-ID indexes, and date/category indexes.

## Build and automated regression tests

`npm run build` passed TypeScript checking and the production Vite build.

`npm test` passed **15 tests** covering:

- India date boundaries, relative dates, invalid/future/conflicting dates, missing and fabricated amounts, uncertain/negated messages, and unsupported currencies.
- Canonical MongoDB fields mapped to the preserved frontend contract.
- Receipt-based success, duplicate replay without a second write, conflicting IDs, unresolved saves, and reconciliation from database records.
- A cached receipt refusing to report success when the database cannot be read.
- Cross-site write rejection and budget validation/persistence.
- MongoDB nodes failing closed and Code nodes rejecting passthrough input as database output.

These regression tests use temporary files and simulated upstream cases where appropriate. The following checks used the actual model, n8n, and MongoDB.

## Complete real-service integration test

`npm run test:e2e -- --serve` used the actual application backend and integration client, authenticated n8n webhook, installed local model, native MongoDB nodes, and an independent MongoDB driver to inspect documents. It used only `expense_integration_tests`, never the personal `expenses` collection.

| Message | Confirmed stored result |
| --- | --- |
| I spent ₹200 on transport today. | INR 200, Transport, 2026-10-17 |
| Spent ₹250 on lunch today. | INR 250, Food & drinks, 2026-10-17 |
| Yesterday I paid ₹120 for an auto. | INR 120, Transport, 2026-10-16 |
| Add ₹500 for groceries on 12 October. | INR 500, Groceries, 2026-10-12 |

The driver independently confirmed `amount`, `currency`, `category`, `description`, `date`, and `originalMessage` in the actual documents. History returned four records totaling **₹1,070**. Replaying a request returned its receipt without another document; reusing an ID for a different message was rejected. Missing amounts, a dollar expense, and conflicting dates requested clarification.

A direct duplicate insertion was rejected by MongoDB’s unique index. An invalid negative amount was rejected by its collection validator. Tests briefly stopped only the newly added MongoDB service: neither a save nor a history read was reported as successful while it was unavailable. The service was restarted and all four records remained, confirming volume persistence. Personal-collection checks confirmed no test IDs were present.

An initial outage test exposed a real n8n behavior: MongoDB connection errors under continue-on-error could forward original workflow input. All database nodes were changed to stop on error, and readback checks now require MongoDB document identity and matching fields. The complete test was rerun and passed after that fix. No security checks were disabled.

## Actual browser checks

The same production React build ran at a temporary, visibly labeled integration-test workspace on port 3001 against the isolated real collection. Through the browser, `Spent ₹40 on coffee today.` produced **Saved to MongoDB** with the real amount/date/category. A separate MongoDB query confirmed that document. The dashboard refreshed to **5 transactions, ₹1,110 total, and ₹222 average**, with updated category and daily charts.

Transaction search for `coffee` combined with the Food & drinks filter showed the single matching stored record. A Transport budget of ₹500 in the test workspace showed actual spending ₹320, remaining ₹180, and **64% used**. This budget used an isolated temporary server file; personal budgets were not changed.

The temporary server was stopped and the known test IDs were cleaned up. The personal collection remained empty. The app’s main workspace therefore shows an honest empty state, ready for the user’s real expenses. Responsive CSS is preserved; a separate mobile-device viewport was not available for an actual device test.

Private detailed integration evidence is in `.local/mongodb-e2e-results.json`; the browser results are retained separately in `.local/mongodb-browser-results.json`. The final graceful-cleanup endpoint was exercised successfully, and independent queries confirmed zero remaining test records and zero personal records. Final application health reported `n8n: true, ollama: true, mongodb: true`, and history reported source `mongodb`. The old pre-migration verification record is retained in `.local/backups/pre-mongodb/VERIFICATION.md`; its unverified Google Sheets status must not be confused with the now-tested MongoDB path.

## Working capabilities and limits

Verified capabilities include natural-language parsing/validation, real MongoDB insertion/readback, frontend confirmation, history retrieval, dashboard totals and category/chart data, search/category filtering, budget progress, retry protection, schema/unique-ID enforcement, and refusal of success during a database outage.

Existing date filters, sorting, CSV export, keyboard controls, and responsive layouts are implemented and preserved; not every control or physical device was separately retested in the browser. Budgets remain local server configuration. Automatic alerts, open-ended financial advice, multi-user accounts, and in-app expense editing/deletion are not implemented.

The final CA3 documentation pass produced a template-aligned [DOCX report](../submission/SpendWise_AI_CA3_Report.docx) and [PDF](../submission/SpendWise_AI_CA3_Report.pdf), genuine screenshots and exact source excerpts. Supplied student/faculty/division details were added. The user subsequently supplied the verified [SpendWise repository](https://github.com/pratiklakra38/Spendwise), now linked in the report. Course duration/completion evidence and any required public application demo remain pending. No links, certificates, or results were invented.

During this later read-only documentation snapshot, the personal collection contained one existing INR 250 lunch record dated 2026-10-17. The MongoDB driver independently confirmed its fields and the application reported all three services healthy, source `mongodb` and zero invalid rows. No personal record was added, changed or removed for documentation. The earlier zero-personal-record statement describes the end of the migration tests, before this later snapshot; it is not the current screenshot count. The earlier isolated test collection remained empty.

## Repository publication checks

On 17 October 2026, the user supplied `https://github.com/pratiklakra38/Spendwise`. GitHub confirmed the new public repository and the connected account's push permission. The report's repository placeholder was replaced with that verified URL, and the PDF was exported again from the actual DOCX. The existing source was rechecked: `npm.cmd test` passed all 15 regression tests and `npm.cmd run build` passed TypeScript and Vite production compilation. No real-service integration/outage test was repeated and no personal database data was changed for publication.

The repository includes the Node.js/TypeScript backend, React UI, shared expense/category validation, importable n8n workflow, MongoDB/Docker setup, tests, optional Python report tools, final reports and sanitized supporting evidence. `.env`, private `.local` state/backups, dependency installations, generated app build output and Docker volumes are excluded.
