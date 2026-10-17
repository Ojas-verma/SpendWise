# SpendWise AI CA3 submission package

The report follows the original CA3 template, with all eight required sections and fields retained. The technical content documents the actual local MongoDB implementation. Student: Ojas Verma; PRN: 23070122153; faculty: Nilima Zade; division: C-2. Course: Autonomous AI System and Agent-based Computing.

- [Editable report](SpendWise_AI_CA3_Report.docx)
- [PDF report](SpendWise_AI_CA3_Report.pdf)
- [Section-by-section alignment and missing items](CA3_ALIGNMENT_CHECKLIST.md)
- [Original unchanged template](reference/CA3_Agentic_AI_Blank_Template_v2.docx)
- [Genuine screenshots](evidence/screenshots/)
- [Exact code excerpts and source manifest](evidence/code/manifest.json)
- [Verification evidence](evidence/verification/)
- [Evidence hashes](evidence/manifest.json)

## Complete these before academic submission

1. Enter the actual course duration and course progress/completion details in the front matter and Section 3. Add genuine certificate links or evidence. No minimum-hour completion is claimed.
2. The project repository is [pratiklakra38/Spendwise](https://github.com/pratiklakra38/Spendwise), supplied by the user and verified through GitHub. It is linked in Section 7. The student identity remains Ojas Verma as supplied for the report; the repository is hosted under pratiklakra38.
3. If a public deployment is required, supply and verify it before changing the local-only statement. The current working application is [localhost:3000](http://localhost:3000/) and n8n is [localhost:5679](http://localhost:5679/). These links work only on the configured computer while services run.
4. Re-export the PDF from the edited DOCX after filling remaining fields. Confirm any institution-specific declarations, signatures or certificate-upload requirements.

## Evidence and interpretation

The screenshot snapshot on 17 October 2026 contains one existing INR 250 lunch record from `spendwise.expenses`. The independent query output includes MongoDB's actual `_id` and canonical fields. The MongoDB image is a clearly labeled read-only query viewer, not MongoDB Compass. The expense-entry screenshot shows the real dialog without submitting another record.

Earlier integration evidence used real services with synthetic test expenses in the separate `expense_integration_tests` collection. Four records totaled INR 1,070; a browser coffee submission produced five records totaling INR 1,110. Those records were cleaned up. The test results and current personal-record screenshots describe separate snapshots. No receipt image was reconstructed. No cloud deployment screenshot is supplied because none was verified.

The report includes a source-derived architecture diagram, separately identified as a diagram. Source excerpts retain exact original text; long lines wrap visually in Word. Their filenames, line ranges and source SHA-256 values are recorded in the code manifest. Images are original PNG captures without cosmetic alteration.

The unchanged template's styles, numbering, footer and page geometry are preserved. Content expansions, images, tables and links were added in the appropriate existing sections. The bundled DOCX renderer could not run because LibreOffice is absent from the Windows bundle. Installed Microsoft Word 16 exported the actual final DOCX to PDF; bundled Poppler rendered every PDF page for visual inspection. The PDF is not a separately typeset approximation.

Keep this folder alongside the project README and `docs/` so relative documentation links work. The report itself contains the essential explanation, local setup and test results. Do not include `.env`, `.local`, private backups, node_modules or Docker data in an academic upload. Evidence files intentionally omit credentials.

## Simple explanation for the demonstration

You type what you spent. Ollama turns the message into fields. Code checks the amount and date. n8n saves the expense to MongoDB and reads it back. Only then does the app say saved. The dashboard reads those same stored records for history, totals and charts. MongoDB replaces Google Sheets, so this path does not need Google sign-in.

The documentation step added the report, screenshots, source extracts and evidence checklist. It reused the working application and recorded tests; it did not seed personal history. The subsequent GitHub publication step updated the verified repository link and rechecked the existing regression suite and production build. Optional Python authoring and verification source is in [scripts/report/](../scripts/report/README.md); the running backend remains Node.js/TypeScript.
