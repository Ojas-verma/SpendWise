from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from copy import deepcopy
import hashlib, json, shutil, textwrap
from datetime import datetime, timezone
from lxml import etree
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[2]
TMP=ROOT/'.local/ca3-report'
OUT=ROOT/'submission'
REF=OUT/'reference/CA3_Agentic_AI_Blank_Template_v2.docx'
TMP.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(REF.read_bytes())=='9714bf699b47e6dd7219421fb63178a61282047da946e0e80a0b62d2a643fc76'
if REF.resolve()!=(OUT/'reference'/REF.name).resolve():
    shutil.copy2(REF,OUT/'reference'/REF.name)
with ZipFile(REF) as z:
    inventory={n:{'bytes':len(z.read(n)),'sha256':sha(z.read(n))} for n in z.namelist()}
(TMP/'baseline-parts.json').write_text(json.dumps(inventory,indent=2),encoding='utf-8',newline='\n')
(TMP/'artifact.md').write_text('''# CA3 template execution contract
Reference: submission/reference/CA3_Agentic_AI_Blank_Template_v2.docx
SHA256: 9714bf699b47e6dd7219421fb63178a61282047da946e0e80a0b62d2a643fc76
Reference rendering: template.pdf and template-render/template0001-1.png, template0001-2.png. Both pages inspected. Packaged render_docx.py failed because the Windows bundle has no LibreOffice; installed Word 16 exported the unchanged template, bundled Poppler rendered it.
Two reference pages; one portrait Letter section, 8.5 x 11 inches. Margins top/bottom .7 inches, left/right .8 inches; header/footer .5 inches. One column, no first/odd/even special furniture.
Normal Arial 10.5 pt. Document defaults after 10 pt, line 1.15. Title direct Arial 20 pt bold centered. Heading1 18 pt bold, source accent1 shade BF (365F91), 24 pt before, keepNext/keepLines. Heading2 12 pt bold, source accent1 (4F81BD), 10 pt before, keepNext/keepLines. Lists inherit Normal with .5 inch left indent and original numbering. Preserve source typography and colors because the user explicitly requires the template.
Footer centered CA3 Agentic AI plus PAGE field. Keep original footer byte-for-byte. No tables/images/content controls in reference. No header text, comments, or footnotes. PAGE field must refresh at export; set updateFields in settings for editable DOCX.
Stable slots: word/document.xml body paragraphs 0 through 47. Paragraphs 0-5 are front matter; headings 6,9,11,21,26,31,41,47 are the eight required ordered sections. Preserve every heading/subheading and both four-field course slots at 13-20. Replace underscore response slots 23-25,28,30,43,45 in place; add paragraphs, comparison tables, code excerpts, inline figures and captions adjacent to those slots. Add student name and PRN after front matter. Expand section6 with architecture, storage contract, source excerpts and verification; section7 with local demo/setup/screenshots; section8 with conclusion/limits/references/readiness.
New content uses source Normal/Heading2 roles. Allow code Consolas 9 pt, figure captions Arial 9.5 pt, and light gray bordered tables with explicit widths/repeated headers. Explicit page breaks may group major sections and figures; no section geometry changes.
Preserve-only package parts: all baseline parts except word/document.xml, word/_rels/document.xml.rels, [Content_Types].xml, word/settings.xml, docProps/core.xml. New media parts are allowed. All styles, numbering, footer, theme, fonts and opaque parts must retain original bytes. Baseline part inventory is in baseline-parts.json.
Intentional additions: actual project content, student details, evidence figures, clickable links, and clearly marked academic/link placeholders. No source style replacement. Core properties updated to supplied author/title to avoid inherited private metadata. Screenshot files remain original captures. Architecture graphic is explicitly a source-derived diagram, never a screenshot.
Fidelity gates: unchanged retained reference hash, same single section geometry and required headings, same preserve-only bytes, real image relationships, no secrets, readable code, truthful test/deployment statements, all final PDF pages inspected. Word export is the actual final DOCX render fallback; no separately typeset PDF.
''',encoding='utf-8')

# Architecture is a diagram of the inspected source, not UI evidence.
im=Image.new('RGB',(1500,860),'white'); dr=ImageDraw.Draw(im)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',27)
small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22)
bold=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',31)
dr.text((65,30),'SpendWise AI local architecture',font=bold,fill='#192a22')
def box(rect,title,body):
    dr.rounded_rectangle(rect,18,fill='#f0f4f0',outline='#537d68',width=3)
    x,y,x2,y2=rect;dr.text((x+20,y+17),title,font=font,fill='#172c21')
    for j,line in enumerate(body):dr.text((x+20,y+58+j*28),line,font=small,fill='#33463b')
def arrow(a,b,label=None):
    dr.line([a,b],fill='#315c45',width=4)
    x,y=b;dx=x-a[0];dy=y-a[1]
    if abs(dx)>abs(dy):dr.polygon([(x,y),(x-14 if dx>0 else x+14,y-9),(x-14 if dx>0 else x+14,y+9)],fill='#315c45')
    else:dr.polygon([(x,y),(x-9,y-14 if dy>0 else y+14),(x+9,y-14 if dy>0 else y+14)],fill='#315c45')
box((65,110,465,250),'React frontend',['Message and request ID','History, charts and receipts'])
box((560,110,1005,250),'Express backend',['Loopback API and validation','Secret and retry journal'])
box((560,345,1005,505),'n8n workflow',['Authenticated webhook','Route, validate, insert, read back'])
box((65,345,465,505),'Ollama llama3.2:3b',['Native JSON Schema output','Local inference, temperature 0'])
box((560,620,1005,760),'MongoDB 8.0',['expenses collection','Validator and unique ID index'])
box((1070,110,1445,250),'Local backend files',['Category budgets','Submission receipts'])
box((1070,620,1445,760),'Docker volumes',['MongoDB persistent data','Existing n8n state preserved'])
arrow((465,180),(560,180));arrow((1005,180),(1070,180));arrow((780,250),(780,345));arrow((560,400),(465,400));arrow((465,465),(560,465));arrow((780,505),(780,620));arrow((845,620),(845,505));arrow((1005,690),(1070,690))
dr.text((64,810),'Save response follows a matching database readback. History uses the same stored records.',font=small,fill='#33463b')
diagram=OUT/'evidence'/'architecture.png';im.save(diagram)

d=Document(REF); original=list(d.paragraphs)
def replace(index,text):
    p=original[index]
    # Retain the source paragraph properties and its first run properties.
    rp=deepcopy(p.runs[0]._r.rPr) if p.runs and p.runs[0]._r.rPr is not None else None
    for node in list(p._p):
        if node.tag!=qn('w:pPr'):p._p.remove(node)
    run=p.add_run(text)
    if rp is not None:run._r.insert(0,rp)
    return p
def para(text='',style=None,bold=None):
    p=d.add_paragraph(style=style);r=p.add_run(text);r.bold=bold
    return p._p
def heading(text):return para(text,'Heading 2')
def page():
    return None
def place(index,blocks):
    anchor=original[index]._p
    for b in blocks:
        if b is not None:anchor.addnext(b);anchor=b
def link(label,url):
    p=d.add_paragraph(); h=OxmlElement('w:hyperlink');h.set(qn('r:id'),d.part.relate_to(url,'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',is_external=True));r=OxmlElement('w:r');rp=OxmlElement('w:rPr');c=OxmlElement('w:color');c.set(qn('w:val'),'225E85');rp.append(c);u=OxmlElement('w:u');u.set(qn('w:val'),'single');rp.append(u);r.append(rp);t=OxmlElement('w:t');t.text=label;r.append(t);h.append(r);p._p.append(h);return p._p
def table(headers,rows,widths):
    t=d.add_table(rows=1,cols=len(headers));t.autofit=False
    pr=t._tbl.tblPr; borders=OxmlElement('w:tblBorders')
    for name in ['top','left','bottom','right','insideH','insideV']:
        e=OxmlElement('w:'+name);e.set(qn('w:val'),'single');e.set(qn('w:sz'),'5');e.set(qn('w:color'),'D9D9D9');borders.append(e)
    pr.append(borders)
    margins=OxmlElement('w:tblCellMar')
    for name in ['top','bottom','left','right']:
        e=OxmlElement('w:'+name);e.set(qn('w:w'),'85');e.set(qn('w:type'),'dxa');margins.append(e)
    pr.append(margins)
    for row in [t.rows[0]]+[t.add_row() for _ in rows]:
        row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
    t.rows[0]._tr.get_or_add_trPr().append(OxmlElement('w:tblHeader'))
    for ri,values in enumerate([headers]+rows):
        for ci,val in enumerate(values):
            cell=t.rows[ri].cells[ci];cell.width=Inches(widths[ci]);cell.vertical_alignment=1
            p=cell.paragraphs[0];p.paragraph_format.space_after=Pt(0);p.paragraph_format.line_spacing=1.08
            r=p.add_run(str(val));r.font.size=Pt(10);r.bold=ri==0
            if ri==0:p.paragraph_format.keep_with_next=True
            if ri==0:
                sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'E9EFF5');cell._tc.get_or_add_tcPr().append(sh)
    return t._tbl
def pic(path,maxw=6.6,maxh=6.3):
    p=d.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_after=Pt(3)
    w,h=Image.open(path).size;ratio=min(maxw/w,maxh/h)
    p.add_run().add_picture(str(path),width=Inches(w*ratio),height=Inches(h*ratio))
    return p._p
def pair(a,b):
    p=d.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_after=Pt(3)
    for i,name in enumerate([a,b]):
        w,h=Image.open(OUT/'evidence/screenshots'/name).size;ratio=min(3.15/w,5.7/h)
        if i:p.add_run('    ')
        p.add_run().add_picture(str(OUT/'evidence/screenshots'/name),width=Inches(w*ratio),height=Inches(h*ratio))
    return p._p
def caption(text):
    p=d.add_paragraph();p.paragraph_format.space_after=Pt(10);p.paragraph_format.keep_with_next=False
    r=p.add_run(text);r.italic=True;r.font.size=Pt(9.5);return p._p
snippets=[]
def code(title,file,start,end,explanation):
    lines=(ROOT/file).read_text(encoding='utf-8').splitlines();text='\n'.join(lines[start-1:end])
    num=len(snippets)+1; fn=f'{num:02d}-{Path(file).stem}-L{start}-L{end}.txt'
    (OUT/'evidence/code'/fn).write_text(text+'\n',encoding='utf-8',newline='\n')
    snippets.append({'number':num,'title':title,'source':file,'startLine':start,'endLine':end,'sourceSha256':sha((ROOT/file).read_bytes()),'excerpt':fn,'excerptSha256':sha((text+'\n').encode())})
    p=d.add_paragraph();p.paragraph_format.space_before=Pt(8);p.paragraph_format.space_after=Pt(4);p.paragraph_format.keep_with_next=True
    p.add_run(f'Listing {num}. {title}').bold=True
    source=d.add_paragraph(f'Source: {file}, lines {start}–{end}. Exact excerpt; surrounding code is omitted.');source.paragraph_format.space_after=Pt(4);source.paragraph_format.keep_with_next=True
    for r in source.runs:r.font.size=Pt(9.5)
    block=d.add_paragraph();block.paragraph_format.line_spacing=1.05;block.paragraph_format.space_after=Pt(5);block.paragraph_format.keep_together=True;block.paragraph_format.keep_with_next=True
    run=block.add_run(text);run.font.name='Consolas';run.font.size=Pt(9)
    return [p._p,source._p,block._p,para(explanation)]

# Fill every required source field without removing or reordering a template heading.
replace(2,'Course Title: Autonomous AI System and Agent-based Computing')
replace(3,'Course Duration (minimum 45 hours): [To be completed by student]')
replace(4,'Faculty: Nilima Zade');replace(5,'Division: C-2')
place(5,[para('Student Name: Ojas Verma'),para('PRN: 23070122153'),para('Project: SpendWise AI',bold=True),para('Final technical report and local demonstration record · 17 October 2026'),para('This report documents the existing local expense tracker after its MongoDB migration. It explains the implemented workflow, source code, tests and evidence. The local application, database and project repository URL were verified. Course certificates and any required public application deployment remain submission items where stated.')])
place(7,[para('The objective is to reduce the effort of recording daily expenses while making each save trustworthy. A user writes a short message, the local language model proposes structured fields, deterministic code validates them, and n8n stores and reads back the record in MongoDB. The dashboard then uses those records for expense history and spending summaries.'),para('The project demonstrates a bounded AI workflow: language understanding is delegated to a model, while business rules, tool access, storage and the final success decision remain explicit in code. It is a local single-user academic prototype.')])
place(8,[para('Key concepts include structured model output, tool orchestration, validation, persistent state, idempotent requests and feedback. A JSON Schema constrains the shape of the model response; source-based checks prevent fabricated amounts and ambiguous dates. MongoDB stores the durable expense, while a submission journal tracks retry state. The receipt is generated from a matching database readback rather than from the model’s text.')])
place(10,[para('An AI agent receives observations, interprets a goal, chooses or follows actions through tools, maintains relevant state, and uses feedback to decide what happens next. In SpendWise, the observation is an expense message, the local model extracts candidate fields, n8n routes the workflow, and MongoDB supplies storage feedback.'),para('The current implementation uses predefined n8n routing rather than an unconstrained agent planning loop. Its autonomy is limited to interpreting the description and selecting a permitted category. Code controls the amount, date, allowed currency and database operations. It does not transfer money, access bank accounts or provide open-ended financial advice.'),para('This separation matters because syntactically valid JSON can still contain incorrect financial data. A schema addresses format; deterministic validation and storage verification address the conditions under which the application can accept and confirm an expense.')])
for i,label in [(13,'Course Title'),(14,'Platform / Provider'),(15,'Course Duration (minimum 45 hours)'),(16,'Completion Evidence'),(17,'Course Title'),(18,'Platform / Provider'),(19,'Course Duration (minimum 45 hours)'),(20,'Completion Evidence')]:replace(i,label+': [To be completed by student]')
place(12,[para('The student will add actual course progress, titles, providers, hours and certificate evidence. No course completion or minimum-hour requirement is claimed in this report. Both original course entries are retained below; add further entries if required.')])
replace(23,'Problem Statement: Everyday expense logging becomes inconvenient when each transaction requires several manual fields. Free-text notes are easier to enter but do not directly support consistent totals, categories and dates. An AI response alone also cannot prove that a transaction was stored.')
replace(24,'The project therefore needs to convert one natural-language expense into validated data, preserve the original message, save it reliably and retrieve the same records for history and charts. Missing amounts, ambiguous dates, unsupported currency and service failures must produce an honest clarification or error.')
replace(25,'The earlier design used Google Sheets. The final implementation uses local MongoDB in Docker, avoiding the Google OAuth dependency while preserving the existing Ollama model, n8n account, application code and Docker volumes. Historical Sheets data was not imported because access to that history was not verified.')
replace(28,'SpendWise AI')
replace(30,'SpendWise AI is a local personal-finance dashboard with natural-language expense entry, searchable transaction history, category and daily spending charts, and monthly category budgets. React communicates with an Express backend; an authenticated n8n workflow calls Ollama llama3.2:3b, validates the proposed fields, and persists the expense in MongoDB. The frontend displays a save receipt only after the workflow confirms an actual matching stored document.')
place(30,[para('The final scope supports one positive INR expense per message. It preserves amount, currency, category, description, date and original message, together with an identifier and timestamp. Budgets remain local backend configuration. The product is intended for local demonstration and is not a hosted multi-user finance service.')])
fields={33:'Programming Language: TypeScript and JavaScript; HTML and CSS.',34:'LLM / AI Model: Existing Ollama llama3.2:3b; native JSON Schema response; temperature 0.',35:'Agent Framework: n8n 2.35.6 as the workflow orchestrator with explicit routes and checks.',36:'Tools / APIs: Authenticated n8n webhook, Ollama HTTP API and native n8n MongoDB nodes.',37:'Database / Storage: MongoDB 8.0 in Docker; persistent named volume; local JSON budget and retry files.',38:'Frontend: React 19, Vite 7, TypeScript and lucide-react icons.',39:'Backend: Node.js and Express 5; same-origin local API, validation and retry reconciliation.'}
for i,t in fields.items():replace(i,t)
steps=[heading('Architecture and responsibility'),para('Figure 1 separates the browser, backend, automation, model and database. n8n orchestrates the model call before performing storage. All main services run on the local computer; the frontend does not contain the database password or webhook secret.'),pic(diagram,maxh=4),caption('Figure 1. Source-derived architecture diagram. This is an explanatory diagram, not a screenshot.'),heading('Workflow implementation')]
for text in [
'1. Accept the message and a generated request ID through POST /api/expenses. The backend validates request shape and origin, allows one active submission, and writes a pending entry to its local retry journal.',
'2. Send the request to the authenticated production n8n webhook. The secret is added by the backend from environment configuration. n8n computes the current date in Asia/Kolkata.',
'3. Call local Ollama /api/chat with the extraction schema, stream disabled, temperature 0 and bounded generation. Parse the returned JSON; invalid JSON becomes a clarification rather than a proposed save.',
'4. Validate that exactly one positive INR amount occurs in the original message. Reject uncertain or negated spending, missing or multiple amounts, unsupported currency, invalid descriptions/categories and invalid, conflicting or future dates.',
'5. Resolve dates in code. Supported forms include today, yesterday, day before yesterday, ISO date and day plus English month. An omitted date means today in India; an omitted year uses the current local year. Unsupported date expressions require clarification.',
'6. Check MongoDB for the request ID. An existing matching record may be returned without another insertion. Otherwise insert the canonical fields and read the record back. A genuine MongoDB _id and matching ID, date, amount, currency, category, description and original message are required before status saved.',
'7. Validate the receipt in the backend, update the journal and return it to React. React refreshes real history after a confirmed save. GET /api/expenses follows the workflow’s read route to MongoDB; dashboard totals and chart groups derive from those retrieved records.'
]:steps.append(para(text))
steps += [heading('Database contract'),para('The primary collection is spendwise.expenses. Documents use the canonical names below. The established UI contract retains cost, descr and msg aliases so working frontend components can be preserved. normalizeRows performs that mapping.'),table(['Stored field','Meaning and constraints'],[['id','Submission identifier; unique indexed string.'],['amount','Positive INR number, at most two decimal places in application validation; maximum 10,000,000.'],['currency','INR only.'],['category','One of eight allowed expense categories.'],['description','Nonempty short description, maximum 160 characters.'],['date','YYYY-MM-DD expense date; calendar and future-date checks in code.'],['originalMessage','Original submitted text, maximum 2,000 characters.'],['createdAt','Creation timestamp as an ISO string.'],['_id','MongoDB ObjectId used as evidence of a genuine document.']],[1.45,5.35]),para('MongoDB has a strict required-field/type validator, a unique id index and a date/category index. The validator rejects invalid document types and ranges, while application rules check source evidence, decimal precision and calendar semantics. Budgets are kept in .local/budgets.json; the MongoDB retry journal is .local/requests-mongodb.json.'),heading('Structured output and meaningful source excerpts'),para('The following listings are short exact extracts from the final source. They demonstrate format constraints, validation, integration, persistence, APIs and frontend confirmation. The complete source files remain authoritative; evidence/code contains the same excerpts and their source hashes.')]
steps += code('Expense extraction schema','shared/domain.ts',6,12,'The schema defines required fields and allowed categories. Listing 2 passes this schema as Ollama’s format field with temperature 0; the model proposes data but never confirms storage.')
steps += code('Native structured-output request','shared/domain.ts',53,54,'The request sends the actual schema as format and disables streaming. Temperature 0 and generation/context limits make extraction bounded; subsequent JSON decoding and business validation remain necessary.')
steps += code('Date and description validation','shared/domain.ts',68,71,'The date is resolved from the original message, checked against today, and combined with a permitted category and bounded description. Earlier checks in the same function require one supported positive amount from the message and reject uncertain input.')
steps += code('Authenticated workflow integration','server/integration.ts',7,11,'The backend adds the private webhook header and applies a bounded timeout. The browser calls the backend and never receives this secret. Subsequent code handles HTTP and malformed-response failures conservatively.')
steps += code('Readback before a confirmed save','scripts/build-workflow.mjs',46,51,'This workflow-generator excerpt builds the Save confirmed Code node. A real MongoDB identity is required and each returned business field must match the validated expense. Every MongoDB node stops the workflow on database errors.')
steps += code('Strict collection and indexes','docker/mongo-init.js',21,25,'Initialization creates the personal and isolated test collections with validation and indexes. It runs only on a new empty volume; existing initialized data is reused.')
steps += code('History API backed by the database','server/app.ts',33,35,'records() invokes the workflow read route and normalizes its actual documents. The API declares source mongodb and returns India’s current date; read failures become errors rather than empty mock data.')
steps += code('Frontend receipt and refresh','src/components.tsx',25,30,'The UI announces Saved to MongoDB only for a saved result. A clarification or error uses its own message; the dashboard refresh callback runs only after the confirmed receipt.')
steps += [heading('Reliability and credential protection'),para('A unique ID, request fingerprint and local journal protect retries. A repeated ID with different text is rejected. A previous attempt must be reconciled against live MongoDB before returning a cached receipt; an unknown write is not blindly resubmitted. The unique index provides a second duplicate barrier. This is local single-process protection, not a distributed exactly-once guarantee.'),para('The private .env holds the webhook secret and separate MongoDB root/application credentials. .env.example contains configuration keys without passwords. n8n uses a scoped readWrite user for the SpendWise database; its editor login is a separate credential. The MongoDB host port binds to 127.0.0.1:27018, and n8n uses mongodb:27017 on the Docker network. The app binds locally and rejects cross-site writes.'),para('SpendWise retains spendwise_n8n_data on port 5679 and uses the new spendwise_mongodb_data volume. The original n8n service on port 5678, existing Google credentials and spreadsheet were preserved. Private backup directories can contain secrets and are excluded from the submission evidence. Do not delete volumes or regenerate credentials to troubleshoot.'),heading('Testing and observed results'),para('Existing verification records dated 17 October 2026 were reused for this documentation step. No application rebuild, model download or repeat database-outage test was needed. The recorded build passed TypeScript and Vite production compilation. Fifteen regression tests passed; they use temporary files and simulated upstream responses where appropriate. The integration checks below used actual Ollama, n8n and MongoDB.'),table(['Check','Observed result','Evidence'],[['Build and regression tests','Build passed; 15 tests passed.','docs/VERIFICATION.md'],['Full service flow','Four real test records; INR 1,070 total.','mongodb-e2e-results.json'],['Stored field checks','Independent driver matched required fields.','test-mongodb.ts and result log'],['Retry and ID conflict','Replay retained one record; conflicting text rejected.','E2E and regression tests'],['Clarification cases','Missing amount, dollars and conflicting dates clarified.','E2E result log'],['Database constraints','Duplicate ID: error 11000; negative amount: error 121.','Recorded E2E test assertions'],['Database outage','No save success; history HTTP 503.','Recorded E2E result log'],['Restart persistence','All four test documents survived restart.','E2E result log'],['Browser test','Coffee receipt observed; 5 records, INR 1,110, average INR 222.','mongodb-browser-results.json'],['Search and budget','Coffee filtered to one; Transport 320 of 500, 64%.','Browser verification record'],['Current local snapshot','1 stored lunch record; INR 250 total/average; services healthy.','Current query and Figures 2–7']],[1.35,3.1,2.35]),para('The earlier four/five-record tests used expense_integration_tests, a visibly labeled isolated workspace and temporary budget files. Those test IDs were cleaned up. The final screenshots show the currently existing personal collection containing one lunch record, independently read through the MongoDB driver. These are different snapshots, not contradictory totals.'),para('An outage test previously exposed n8n passing original input when MongoDB nodes continued after connection errors. Database nodes now stop on error, and readback requires _id plus matching fields. The complete test passed after this correction. The unavailable historical Information Extractor output was not diagnosed; the replacement native structured-output route was independently verified.'),para('Date filters, sorting, CSV export and responsive CSS are implemented. The recorded browser tests covered save, history, totals, search/category filter and budget progress; they did not exercise every control or physical device. The captured narrow layout is genuine browser evidence, not comprehensive mobile-device certification.')]
place(40,steps)

# Required demonstration link slots remain in their original positions.
replace(43,'Verified local application: http://localhost:3000. This is a running local installation, not a public deployment.')
place(43,[link('Open the local SpendWise application','http://localhost:3000/'),link('Open the local published n8n workflow','http://localhost:5679/workflow/SpendWiseLocalV1'),para('Public deployment: [Not verified / not supplied]. No public live URL or deployment screenshot is claimed. Local services must be running on this computer for the localhost links to work.')])
replace(45,'Project repository: https://github.com/pratiklakra38/Spendwise')
place(45,[para('Project source, configuration and submission documents are maintained in the repository provided by the student. It is hosted under pratiklakra38; the report retains Ojas Verma as the supplied student name. Repository hosting is separate from application deployment.'),link('Project source and documentation on GitHub','https://github.com/pratiklakra38/Spendwise'),heading('Project documentation'),link('README and setup instructions','../README.md'),link('Backend API contract','../docs/API.md'),link('Detailed verification record','../docs/VERIFICATION.md'),link('Evidence folder and submission checklist','README.md'),para('Documentation links are relative to submission/; keep the package together. The essential architecture, workflow, testing and startup instructions are included in this report.')])
demo=[para('Figures 2–7 are genuine local captures from 17 October 2026. No personal expense was added for documentation. They show one existing INR 250 lunch record, not proof of a bank payment. Original PNGs and query evidence are retained under evidence/.'),heading('Demonstration procedure'),para('Start Docker Desktop and the existing Ollama instance. In the project folder run ./start.ps1 only if the app is stopped. Open the app, check Settings, submit one supported expense, wait for a receipt and inspect its history/details and MongoDB ID. Use the isolated workflow for synthetic academic tests.'),heading('Setup and reproducibility'),para('The current computer is configured. Production startup uses docker compose up -d --wait, npm.cmd run build and npm.cmd start. A new checkout needs npm.cmd ci, private .env settings, npm.cmd run setup:mongodb and ./scripts/install-workflow.ps1 as detailed in README. The preserved local n8n image and external volume must already be configured; these commands do not reconstruct private resources.'),para('npm.cmd test runs regression tests. npm.cmd run test:e2e uses the isolated real collection, temporarily stops only SpendWise MongoDB, restores it and cleans its own records. Its --serve mode provides a labeled browser workspace on port 3001. These are reproduction instructions, not a new test-run claim.'),page(),heading('Application dashboard evidence'),pair('01-local-application.png','03-dashboard-charts.png'),caption('Figure 2. Actual local dashboard summary (left) and daily/category charts (right). October 2026 contains one INR 250 lunch transaction. Narrow browser captures retain the actual responsive layout.'),para('The summary and chart share the same retrieved transaction set. At capture, the transaction count is 1 and total/average are INR 250. The category chart attributes the full amount to Food & drinks.'),page(),heading('Expense entry and stored details'),pair('02-expense-entry.png','05-stored-expense-details.png'),caption('Figure 3. Actual expense-entry dialog (left) and the existing MongoDB-backed lunch detail view (right). The entry dialog is an interface capture, not a new submission or a success receipt.'),para('The detail view retains the original message and transaction ID. The earlier isolated browser test observed a genuine save receipt, as recorded in mongodb-browser-results.json; no reconstructed receipt image is presented here.'),page(),heading('Transaction history'),pic(OUT/'evidence/screenshots/04-transaction-history.png',maxw=6.6,maxh=5.8),caption('Figure 4. Actual transaction history for October 2026, retrieved from MongoDB. One lunch record is visible; the responsive table can scroll horizontally to reveal additional columns.'),para('The API snapshot reports source mongodb, invalidRows 0 and one transaction. Search/category/date filters and sorting operate on retrieved records. The independent database query in Figure 7 confirms the canonical stored fields.'),page(),heading('Published automation workflow'),pic(OUT/'evidence/screenshots/06-n8n-workflow.png',maxw=6.4,maxh=6.2),caption('Figure 5. Actual published SpendWiseLocalV1 workflow in the local n8n editor. The full-resolution PNG is supplied separately. Figure 1 and Listings 3–5 explain the routes and database checks at readable scale.'),page(),heading('Live local connection status'),pic(OUT/'evidence/screenshots/07-local-connections.png',maxw=4.1,maxh=6.6),caption('Figure 6. Actual Settings page: n8n, Ollama and MongoDB all report Connected. This demonstrates local service availability; it is not a public deployment.'),page(),heading('Actual MongoDB records'),pic(OUT/'evidence/screenshots/08-mongodb-query-focus.png',maxw=6.7,maxh=5.0),caption('Figure 7. Read-only MongoDB driver query of spendwise.expenses. The documentation viewer explicitly identifies itself and displays the actual stored document, including _id, amount, currency, category, description, date, originalMessage and createdAt. It is not a fabricated MongoDB Compass interface.'),para('The stored ID is 36355c5d-8d99-44c3-ba25-c00fe928b2fb. Its amount is 250, currency INR, category Food & drinks, description lunch and date 2026-10-17. The original message is “Spent ₹250 on lunch today.” The captured JSON also records the unique request-ID index and zero remaining integration-test records.'),heading('Evidence traceability'),para('evidence/verification/local-health-and-history.json and mongodb-current-records.json contain the current read-only outputs. The two mongodb-*-results.json files preserve earlier isolated test results. evidence/code/manifest.json maps every report listing to its source path, line range and SHA-256 hash. evidence/manifest.json lists the supplied evidence file hashes. Original screenshots are retained without cosmetic alteration. No .env file, token, password or private backup is included.')]
place(46,demo)
conclusion=[para('SpendWise AI demonstrates a working constrained AI expense workflow. The existing local model and n8n automation were retained, MongoDB became the primary expense database, and the UI consumes the same persisted records for confirmations, history and charts. Native schema output is followed by deterministic checks; the database readback, rather than an AI assertion, determines save success.'),heading('Limitations and planned enhancements'),para('The current application supports one INR expense at a time, a limited set of explicit date forms and eight categories. Category/description interpretation can still be wrong and must be reviewed. Unspecified dates default to today. History is retrieved as a collection and processed in the frontend, so large datasets would need server-side pagination and aggregation.'),para('This is a local single-user prototype. Multi-user authentication, hosted deployment, bank feeds, recurring transactions, in-app expense editing/deletion, automatic budget notifications and open-ended financial advice are not implemented. Budgets and retry receipts use local backend files. No historical spreadsheet import, backup restore drill, load test or comprehensive mobile-device test is claimed.'),para('Possible future work includes explicit user review before saving, safe edit/delete flows, broader date/currency support, authenticated multi-user access, server-side analytics, database backup/restore testing and a verified hosted deployment. These are planned enhancements, not completed features.'),heading('Submission items requiring student input'),para('Ojas Verma’s supplied academic details are included. The student must complete the course duration, actual course progress/completion details and certificate links or attachments in Section 3. The project repository URL is verified and linked in Section 7. A public deployment URL is absent; the report states local-only operation. Confirm any institution-specific cover-page, declaration, signature or certificate-upload requirement separately; none is invented.'),heading('Official technology references'),para('The official links below were opened successfully on 17 October 2026. They explain the technology capabilities, while the project’s source and evidence establish what this application actually implements.'),link('Ollama structured outputs','https://docs.ollama.com/capabilities/structured-outputs'),link('n8n MongoDB node','https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.mongodb'),link('MongoDB schema validation','https://www.mongodb.com/docs/manual/core/schema-validation/'),link('React documentation','https://react.dev/'),link('Express documentation','https://expressjs.com/'),link('Docker Compose documentation','https://docs.docker.com/compose/'),heading('Simple project explanation'),para('You describe an expense. The local model extracts the details. Code checks the amount and date. n8n stores the expense in MongoDB and reads it back. Only then does the application say saved. The dashboard reads those same records. The final documentation preserves this evidence and clearly marks the remaining certificate and deployment items.')]
place(47,conclusion)

# Keep required section headings together with their following content.
for p in d.paragraphs:
    if p.style.name=='Heading 1':p.paragraph_format.page_break_before=p.text.startswith(('2.','8.'))
for p in d.paragraphs:
    prev=p._p.getprevious()
    if prev is not None and prev.tag==qn('w:tbl'):p.paragraph_format.space_before=Pt(8)
for p in d.paragraphs:
    if p.text in ['Application dashboard evidence','Expense entry and stored details','Transaction history','Published automation workflow','Live local connection status','Actual MongoDB records']:p.paragraph_format.page_break_before=True
# Preserve the first section's normal flow after the filled front matter.
original[6].paragraph_format.page_break_before=False
d.core_properties.author='Ojas Verma';d.core_properties.last_modified_by='Ojas Verma';d.core_properties.title='SpendWise AI CA3 Report';d.core_properties.subject='Autonomous AI System and Agent-based Computing';d.core_properties.comments=''
settings=d.settings.element
update=settings.find(qn('w:updateFields'))
if update is None:update=OxmlElement('w:updateFields');settings.append(update)
update.set(qn('w:val'),'true')
work=TMP/'authored.docx';d.save(work)
editable={'word/document.xml','word/_rels/document.xml.rels','[Content_Types].xml','word/settings.xml','docProps/core.xml'}
final=OUT/'SpendWise_AI_CA3_Report.docx'
with ZipFile(REF) as ref,ZipFile(work) as new,ZipFile(final,'w',ZIP_DEFLATED) as z:
    for n in new.namelist():z.writestr(n,new.read(n) if n in editable or n not in ref.namelist() else ref.read(n))
with ZipFile(REF) as ref,ZipFile(final) as new:
    preserved=[n for n in ref.namelist() if n not in editable]
    assert all(ref.read(n)==new.read(n) for n in preserved)
    fidelity={'referenceSha256':sha(REF.read_bytes()),'preservedParts':preserved,'preservedPartBytesMatch':True,'editableParts':sorted(editable),'sectionCount':len(Document(final).sections),'requiredHeadingOrder':[p.text for p in Document(final).paragraphs if p.style.name=='Heading 1']}
(OUT/'evidence/verification/template-fidelity.json').write_text(json.dumps(fidelity,indent=2),encoding='utf-8',newline='\n')
(OUT/'evidence/code/manifest.json').write_text(json.dumps(snippets,indent=2),encoding='utf-8',newline='\n')
print('Built',final,'with',len(snippets),'actual source excerpts')
