# Optional Python report tools

The application backend is Node.js/TypeScript, not Python. These Python files reproduce and verify the CA3 documentation only. They are not required to run SpendWise.

- `build_report.py` contains the report's actual authoring source, architecture diagram generator, source-excerpt extraction and original-template preservation logic. It reads the retained template and genuine screenshots from `submission/` and overwrites the generated report. It does not capture or invent screenshots.
- `export-pdf.ps1` uses installed Microsoft Word on Windows to export the actual DOCX, refreshing page fields. It does not modify the source DOCX.
- `render_pdf.py` uses Poppler to render the exported PDF for manual inspection.
- `verify_package.py` checks template sections and geometry, actual source excerpts, DOCX/PDF hyperlink agreement, evidence hashes and private credential values if a local `.env` exists. A programmatic check does not replace visual review.

Use Python 3.12 or later with the packages in `requirements.txt`; report building uses Windows Arial fonts. During development these dependencies came from the Codex bundled runtime. On another computer, use a virtual environment for these optional dependencies. Microsoft Word and Poppler are needed for the export/render steps; application setup remains in the project README.

```powershell
python scripts/report/build_report.py
./scripts/report/export-pdf.ps1
python scripts/report/render_pdf.py --poppler-bin 'C:\path\to\poppler\bin'
python scripts/report/verify_package.py
```

Inspect every rendered page after changing report text or certificate fields. Review placeholders before academic submission. Edit `build_report.py` if you need those changes preserved on regeneration; otherwise keep your edited DOCX and export it directly. Existing screenshot/query evidence describes its recorded snapshot and is not refreshed by rebuilding the report.

All temporary output stays under ignored `.local/`. Credentials, retry journals, Docker database data, owner logins and private backups are not part of this repository.
