# LALP — Complete Sitemap, Feature Tree & Figma Prompts

> **Who this is for**: Randy’s AI, Figma Make / design agents, engineers.  
> **Rule**: This file is the IA source of truth. Ignore the current Figma-export React nav (`LALPApp.tsx` NAV_ITEMS).  
> **Do not** map 1 tender module = 1 top-level menu.  
> **Source**: `01_Local Adaptive Learning Platform Tender - v5.pdf`  
> **Human discussion deck**: `LALP_SITEMAP_DISCUSSION.html`  
> **Updated**: 2026-08-03

---

## 0. Product definition (paste this into every design brief)

**LALP is a school-year-scoped talent + learning system with THREE portals.**

| Portal | Users | Job |
|---|---|---|
| Teacher / Admin | 班主任、科任、科主任、副校、網管 | Run class, enter scores, run activities, approve evidence, configure AI |
| Student | 學生 | Upload certificates, see history/awards/portfolio, complete incomplete class tasks, claim group roles |
| Parent | 家長 | Limited view of child + privacy / PICS + access request |

**AI engines (OCR, ACORN, Diagnostic, Prompt…) are features INSIDE pages — not the left navigation.**

---

## 1. BIG SUMMARY — Full site map tree

Copy this tree into Figma page structure. Each leaf = one screen/frame (unless noted as modal/tab).

```
LALP
│
├── 0. AUTH SHELL
│   ├── 0.1 Login Hub (choose Teacher / Student / Parent)
│   ├── 0.2 Login Form
│   ├── 0.3 Select Academic Year (e.g. 2025/26)
│   ├── 0.4 Forgot password (optional stub)
│   └── 0.5 Global: language EN | 繁中
│
├── 1. TEACHER / ADMIN APP
│   │
│   ├── 1.A 工作台 WORKSPACE
│   │   ├── 1.A.1 Today / Class Dashboard
│   │   ├── 1.A.2 My Classes (quick jump)
│   │   └── 1.A.3 Approval Inbox (todos)
│   │
│   ├── 1.B 學生與班級 STUDENTS & CLASSES          ← MISSING TODAY
│   │   ├── 1.B.1 Students by Academic Year (list)
│   │   ├── 1.B.2 Student 360 (detail — multi-tab)
│   │   │   ├── Tab: Profile
│   │   │   ├── Tab: ACORN radar + year snapshots     [badge M3]
│   │   │   ├── Tab: Academic scores & trends         [badge M2]
│   │   │   ├── Tab: Achievements & certificates      [badge M4]
│   │   │   ├── Tab: Activities / footprints          [badge M5]
│   │   │   ├── Tab: Portfolio                        [badge M6]
│   │   │   └── Tab: Points (if Mod C)
│   │   ├── 1.B.3 Class List
│   │   ├── 1.B.4 Class Roster (students in one class)
│   │   └── 1.B.5 Staff directory (light)
│   │
│   ├── 1.C 學科與評估 SUBJECTS & ASSESSMENT         ← MISSING TODAY
│   │   ├── 1.C.1 Subject List (Chinese, English, Math…)
│   │   ├── 1.C.2 Assessment Structure & Weights      [badge M2.4]
│   │   ├── 1.C.3 Score Entry Grid (manual)
│   │   ├── 1.C.4 Score Import (eClass CSV/TSV)       [badge M1/M2]
│   │   └── 1.C.5 Diagnostic & Trends                 [badge M2]
│   │       (ABS / EXEMPT / pure-ability scale)
│   │
│   ├── 1.D 活動與人才 ACTIVITIES & TALENT
│   │   ├── 1.D.1 Activity / Event / Match LIST       ← expand Event Config
│   │   ├── 1.D.2 Activity Detail
│   │   │   ├── Roster (class pick / batch paste)
│   │   │   ├── Groups & footprints matrix            [badge M5]
│   │   │   ├── Feedback / praise                     [badge M5.3]
│   │   │   ├── Export Formative/Summative
│   │   │   └── Open Live Mode →
│   │   ├── 1.D.3 Live Class Recorder + QR            [badge Mod E]
│   │   ├── 1.D.4 Achievements Approval Queue         [badge M4]
│   │   ├── 1.D.5 OCR Wizard (upload → tags)          [badge M4]
│   │   ├── 1.D.6 Roles & Positions Master            ← "pose" list
│   │   ├── 1.D.7 Portfolio / Exemplar Library        [badge M6]
│   │   ├── 1.D.8 Portfolio Assembler wizard          [badge M6]
│   │   ├── 1.D.9 Campus Points Hub (optional)        [badge Mod C]
│   │   └── 1.D.10 Engagement Index (optional)        [badge Mod D]
│   │
│   ├── 1.E 協作學習 COLLABORATION
│   │   ├── 1.E.1 Group Projects list
│   │   ├── 1.E.2 Group Project detail (leader submit, peer roles)
│   │   └── 1.E.3 Role Anchoring Board                [badge Mod B]
│   │
│   └── 1.F 系統管理 SYSTEM ADMIN (IT only — hide from class teachers)
│       ├── 1.F.1 Data Import Pipeline                [badge M1]
│       ├── 1.F.2 Dynamic Tags / JSON Schema          [badge M1.6]
│       ├── 1.F.3 Prompt Tuning Portal                [badge M6]
│       ├── 1.F.4 De-sensitization Rules              [badge Clause 6]
│       ├── 1.F.5 BYOM / Model API settings           [badge M1.3]
│       ├── 1.F.6 GSheet Sync + Audit Log             [badge Mod A]
│       ├── 1.F.7 Anonymized Export (Jupyter/n8n)     [badge M1.7]
│       ├── 1.F.8 Users & Permissions                 [badge R11]
│       └── 1.F.9 Vendor Admin Lock status            [badge 6.3]
│
├── 2. STUDENT APP                                     ← MISSING TODAY
│   ├── 2.1 Student Home
│   ├── 2.2 Upload Achievement / Certificate          [badge M4.1]
│   ├── 2.3 My Certificates & Awards
│   ├── 2.4 Learning History (timeline)
│   ├── 2.5 My Portfolio
│   ├── 2.6 Incomplete Activities (Path B complete)   [badge E.4.2]
│   ├── 2.7 Role Claims (accept/reject)               [badge Mod B]
│   └── 2.8 Privacy Settings                          [badge R8]
│
└── 3. PARENT APP (thin)                               ← MISSING TODAY
    ├── 3.1 Child Overview (limited)
    ├── 3.2 Approved Awards only
    ├── 3.3 PICS / Privacy consent                    [badge R3/R8]
    └── 3.4 Access & Correction Request               [badge R9]
```

### Screen count (for planning)

| Area | Approx. frames |
|---|---|
| Auth | 3–4 |
| Teacher P0 (must) | ~18 |
| Teacher P1 engines (re-home existing) | ~10 |
| Teacher P2 admin | ~9 |
| Student | 8 |
| Parent | 4 |
| **Total useful mock** | **~50 frames** (many can be simple tables) |

---

## 2. BIG SUMMARY — Full features tree

Same tree, but each node lists **features / actions / fields** the screen must support.

```
0. AUTH
├── Multi-portal login (Teacher | Student | Parent)
├── Demo accounts for sandbox (tender A.1)
├── Academic year context (global filter)
└── Language: 繁中 / English

1. TEACHER
│
├── 1.A WORKSPACE
│   ├── Dashboard widgets: present count, pending approvals, class ACORN avg, quick actions
│   ├── Switch active class
│   ├── Notifications
│   └── Inbox types: achievement pending | incomplete metadata | role claim packet | import failed
│
├── 1.B STUDENTS & CLASSES
│   ├── Students by year
│   │   ├── Filters: AY, Form (F1–F6), Class, status (active/repeater/left), search name/ID
│   │   ├── Columns: student ID, name, class, class no., status flags
│   │   ├── Open → Student 360
│   │   └── Export CSV (staff only)
│   ├── Student 360
│   │   ├── Profile: photo stub, class history, SEN flags (permission-gated), repeater flag
│   │   ├── ACORN: ≥6 dimensions radar, multi-year overlay, growth rate
│   │   ├── Academic: subject scores, papers, adjusted pure-ability, trend lines
│   │   ├── Achievements: env L1–L7, tier T1–T4, hours, verified/pending
│   │   ├── Activities: footprints with timestamps + portfolio URL
│   │   ├── Portfolio: assembled docs + links
│   │   ├── Points ledger (opt)
│   │   └── Admin: repeater year mask ON/OFF for AI (M3.4)
│   ├── Class list: code, form, head teacher, headcount
│   ├── Class roster: order by class number; batch paste add students
│   └── Batch paste parser: "5A 01" / pure student IDs from Excel
│
├── 1.C SUBJECTS & ASSESSMENT
│   ├── Subject list CRUD: Chinese, English, Math, …; active by year
│   ├── Assessment structure
│   │   ├── Types: quiz, uniform test, mid-term, final, coursework
│   │   ├── Paper/component weights (e.g. Writing 30%)
│   │   ├── Save → recalc banner “full school recalc ≤ 60 seconds”
│   │   └── Subject-head permission
│   ├── Score entry grid
│   │   ├── Per student × paper cells
│   │   ├── Flags: PRESENT default, ABS, EXEMPT
│   │   └── Inline edit
│   ├── Import: eClass TSV/CSV → unpivot preview → commit
│   └── Diagnostic
│       ├── Dynamic scale for ABS/EXEMPT noise
│       ├── Cross-year / cross-subject overlay charts
│       └── Academic × non-academic correlation (optional view)
│
├── 1.D ACTIVITIES & TALENT
│   ├── Activity list
│   │   ├── Types: Class PBL | STEAM | Match | Service | Competition | Other
│   │   ├── Filters: date, type, owner teacher, class
│   │   ├── Create / edit / archive
│   │   └── Calendar + table views
│   ├── Activity detail
│   │   ├── Learning scenario fields (not only “extra-curricular”)
│   │   ├── Learning timestamp + data logging timestamp
│   │   ├── Assessing teacher
│   │   ├── Roster modes: class select | individual pick | batch paste
│   │   ├── Group matrix: assign footprint to whole group in one click
│   │   ├── Fool-proof confirm before submit
│   │   ├── Block submit if core tags missing or required attachment missing
│   │   ├── AI in-class feedback ≤30s (scaffold hints)
│   │   ├── Praise paper templates (growth mindset / STEAM / leadership)
│   │   ├── Export Excel/CSV/PDF with audit columns
│   │   └── Hidden-from-student-report toggle (Lesson Study) [E.5]
│   ├── Live mode
│   │   ├── Create temp session with NOW() + teacher ID
│   │   ├── QR scan ≤0.5s claim (static student/group QR)
│   │   ├── Manual fallback (no QR)
│   │   ├── Multi-select status: PRESENT | ABS | EXEMPT | custom
│   │   ├── Close → INCOMPLETE_METADATA lock (not final score yet)
│   │   └── Adaptive content unlock via n8n (message only in mock OK)
│   ├── Achievements queue
│   │   ├── Student/teacher submissions
│   │   ├── Duplicate award hard-block + warning [4.2]
│   │   └── Approve / reject / request fix
│   ├── OCR wizard
│   │   ├── HEIC/JPG/PNG/PDF + client compress
│   │   ├── Extract 3D tags:
│   │   │   ├── Environment Level L1–L7
│   │   │   ├── Tier T1–T4 (Member / Support / Leader / Award)
│   │   │   └── Hours (number)
│   │   └── Student/teacher edit then lock
│   ├── Roles & positions master
│   │   ├── School-defined posts/roles (班長、組長、紀錄… )
│   │   ├── Default map to Tier 1–4
│   │   └── Used by group projects + talent graph
│   ├── Portfolio library
│   │   ├── Exemplars by subject/topic
│   │   ├── Search, pin, download for classroom display
│   │   └── Batch assemble multi-student portfolios
│   ├── Points (Mod C): auto grant on approve, daily cap, export unpivot
│   └── Engagement (Mod D): toggle linear↔nonlinear, saturation, ΔBoost from points
│
├── 1.E COLLABORATION
│   ├── Leader submits once; tags peers + roles
│   ├── Peers get notify → claim role
│   ├── After all claim → packet to teacher for formative review
│   └── Role heatmap per student over time
│
└── 1.F SYSTEM ADMIN
    ├── Pipeline: upload → unpivot wide→narrow → resume on disconnect
    ├── Dynamic JSON schema tags without code deploy
    ├── Prompt portal: system prompt per subject/workflow (Socratic, Bloom…)
    ├── 3-step irreversible de-sensitize before any AI call + audit log
    ├── BYOM: API Base URL, API Key, Model Name
    ├── GSheet OAuth, least privilege, bi-directional sync log
    ├── Anonymized bulk export for Jupyter/R/n8n
    ├── Open webhook write-back of skill nodes
    ├── RBAC roles
    ├── Vendor cannot see student PII
    └── Data residency HK messaging (compliance UI copy)

2. STUDENT
├── Home: my points, todos, safe ACORN snapshot
├── Upload: file + reflective self-eval + confirm AI tags
├── Awards list: verified | pending | locked
├── History timeline
├── Portfolio view/download
├── Incomplete: add photo + reflection after class
├── Role claims accept/decline
└── Privacy dashboard

3. PARENT
├── Limited child overview (no full diagnostic dump)
├── Approved awards only
├── PICS consent
└── Access/correction request + “handled within 40 days” copy
```

---

## 3. Priority matrix (what to draw first)

### P0 — Without these the product is fake

| ID | Screen ID | Name |
|---|---|---|
| P0-01 | 0.1–0.3 | Login hub + year |
| P0-02 | 1.A.1, 1.A.3 | Dashboard + Inbox |
| P0-03 | 1.B.1 | Students by year |
| P0-04 | 1.B.3, 1.B.4 | Class list + roster |
| P0-05 | 1.B.2 | Student 360 shell (tabs can be light) |
| P0-06 | 1.C.1–1.C.3 | Subjects + weights + score grid |
| P0-07 | 1.D.1–1.D.2 | Activity list + detail |
| P0-08 | 1.D.6 | Roles & positions |
| P0-09 | 1.D.4 | Achievements queue |
| P0-10 | 2.1–2.4 | Student home + upload + awards + history |
| P0-11 | 2.x → 1.A.3 | Approval closed loop |

### P1 — Re-home existing high-fidelity mock

| Existing frame | New parent |
|---|---|
| Super Dashboard | 1.A.1 |
| ACORN / Student Portfolio | 1.B.2 Tab ACORN |
| Diagnostic Engine | 1.C.5 |
| OCR Wizard | 1.D.5 (from Achievements) |
| Live Class Recorder | 1.D.3 (from Activity detail) |
| Portfolio Library | 1.D.7 |
| Role Anchoring | 1.E.3 |
| Event Config | merge into 1.D.1 create/edit |
| Prompt Tuning | 1.F.3 |
| Data Pipeline | 1.F.1 |
| Audit Log | 1.F.6 |

### P2 — Scoring / compliance prototypes

1.F.* remaining, Points, Engagement, Parent 3.x

---

## 4. Teacher left-nav (exact labels for Figma)

Use this order. Show **zh primary**, en secondary smaller.

| Group zh | Group en | Items zh | Items en |
|---|---|---|---|
| 工作台 | Workspace | 今日概覽 | Today overview |
| | | 待辦審批 | Approval inbox |
| 學生與班級 | Students & classes | 年度學生名冊 | Students by year |
| | | 班別列表 | Class list |
| 學科與評估 | Subjects & assessment | 科目管理 | Subjects |
| | | 測考與權重 | Assessments & weights |
| | | 成績輸入 | Score entry |
| | | 能力校正與走勢 | Diagnostic & trends |
| 活動與人才 | Activities & talent | 活動／比賽／事件 | Activities / events / matches |
| | | 成就與證書 | Achievements & certificates |
| | | 角色與崗位 | Roles & positions |
| | | 成果課件庫 | Exemplar library |
| 協作學習 | Collaboration | 分組專題 | Group projects |
| | | 角色定錨 | Role anchoring |
| 系統管理 | System admin | 數據匯入 | Data import |
| | | AI 提示詞 | Prompt portal |
| | | 脫敏與審計 | De-sensitize & audit |
| | | 同步與權限 | Sync & permissions |

**Class teacher default**: hide entire「系統管理」or show locked.

---

## 5. Demo data pack (must appear in mock)

- AY: 2023/24, 2024/25, **2025/26** (default)
- Classes: F1A, F1B, F2A, F2B
- ≥1 **repeater** student with prior-year scores
- Subjects: 中文 Chinese, 英文 English, 數學 Math (+ optional Science)
- Assessments with unequal paper weights
- Score rows with **ABS** and **EXEMPT**
- ≥5 activities (PBL, STEAM, match, service, competition)
- Awards: pending + verified + one **duplicate** attempt
- 1 live session in **INCOMPLETE_METADATA**
- 1 group project with **role claim pending**
- Tokenized names on AI surfaces: `Student #TSM-4471`

School branding in mock: Stewards Pooi Tun Secondary School / 香港神託會培敦中學

---

## 6. Figma prompts (copy-paste)

Use these with Figma Make, Randy’s AI, or any UI generator.  
**Global style prefix** (prepend to every prompt):

```
GLOBAL STYLE:
- Product: LALP (Local Adaptive Learning Platform) for a Hong Kong secondary school
- School: Stewards Pooi Tun Secondary School / 香港神託會培敦中學
- Language: Traditional Chinese (zh-HK) primary labels + English secondary smaller text
- Aesthetic: clean education SaaS, Atlassian/Jira-adjacent density but warmer blues/purples
- Layout: top bar 56px (logo, breadcrumb, search, notifications, language, avatar) + left sidebar 252px + main content
- Components: tables, filters, status badges, empty states, bilingual headings
- Academic year chip always visible: AY 2025/26
- Do NOT invent a marketing landing page. This is an authenticated app.
- Show realistic HK student names in Chinese where appropriate; use tokenized IDs when screen is AI-facing
```

---

### Prompt A — Login hub (3 portals)

```
GLOBAL STYLE + 

Design screen 0.1 Login Hub for LALP.
Full viewport, centered card cluster on soft gradient background.
Title: 校本自適應學與教平台 LALP
Subtitle: 香港神託會培敦中學 · Stewards Pooi Tun Secondary School
Three large selectable cards in a row:
1) 教師 / 行政 Teacher & Admin
2) 學生 Student
3) 家長 Parent
Each card: icon, short description of what they can do (1 line zh + 1 line en), primary button 進入.
Footer note: 「標書測試環境 Sandbox · 3 demo accounts」
No password fields yet — this is role chooser.
```

---

### Prompt B — Teacher shell + new navigation

```
GLOBAL STYLE +

Design the Teacher app chrome only (sidebar + top bar + empty main content placeholder).
Left sidebar groups EXACTLY in this order (expanded):
工作台: 今日概覽, 待辦審批
學生與班級: 年度學生名冊, 班別列表
學科與評估: 科目管理, 測考與權重, 成績輸入, 能力校正與走勢
活動與人才: 活動／比賽／事件, 成就與證書, 角色與崗位, 成果課件庫
協作學習: 分組專題, 角色定錨
系統管理: 數據匯入, AI 提示詞, 脫敏與審計, 同步與權限
Each nav item: zh primary line + en secondary 10px muted.
School block at top of sidebar: school name, AY 2025/26, form chips F1–F6.
User avatar: 陳老師 · 科學科主任
Highlight 年度學生名冊 as active.
Main area: empty state text 「請從左側選擇功能」 only.
IMPORTANT: Do NOT use nav labels like Module 1, Diagnostic Engine, Data Tokenization, OCR as top-level items.
```

---

### Prompt C — Students by year (P0)

```
GLOBAL STYLE + Teacher chrome.

Screen 1.B.1 年度學生名冊 / Students by Year.
Page header: title + subtitle 「AY 2025/26 · 全校學生」 + button 匯出名冊.
Filter bar: Academic Year select, Form select (全部/F1…F6), Class select, Status select (在學/重讀/離校), search box 姓名或學號.
Data table columns: 學號, 姓名, 班別, 班號, 狀態, 重讀旗標, 操作(查看檔案).
20 mock rows across F1A/F1B/F2A. One row clearly marked 重讀.
Row click or 查看檔案 → implies Student 360.
Pagination footer.
Right side or top stats cards: 總人數, 本班篩選人數, 重讀人數, 待審成就.
```

---

### Prompt D — Class list + roster

```
GLOBAL STYLE + Teacher chrome.

Two linked screens:

Screen 1.B.3 班別列表:
Cards or table of classes F1A, F1B, F2A, F2B.
Each: 班主任, 人數, 進行中活動數, button 開啟名冊.

Screen 1.B.4 班別名冊 for F1A:
Title F1A · 32 人 · 班主任 陳老師
Actions: 批量貼上學號, 新增學生, 匯出
Table: 班號, 學號, 姓名, 性別, 狀態, ACORN簡分, 待辦
Include button 「批量貼上」 opening a modal with large textarea and example:
5A 01
5A 05
20240012
Parse preview list before confirm.
```

---

### Prompt E — Student 360

```
GLOBAL STYLE + Teacher chrome.

Screen 1.B.2 學生 360.
Header: avatar, 陳大文, F1A 12, 學號 20250012, badges 在學, small 重讀 if needed.
Primary actions: 組裝成果檔案, 新增成就, 查看私隱脫敏預覽.
Tabs: 基本資料 | 六維 ACORN | 學業 | 成就證書 | 活動足跡 | 成果檔案 | 積點
Show ACORN tab content:
- Radar chart 6 axes: Academic, Collaborative, Opportunity, Realm, Nurturing, Faith (or school zh labels)
- Toggle overlay term 2024/25 vs 2025/26
- Growth rate callout
- Admin toggle: 「AI 重讀年遮罩」 with explanation
Badge M3 on tab.
```

---

### Prompt F — Subjects + weights + score entry

```
GLOBAL STYLE + Teacher chrome.

Three screens:

1.C.1 科目管理: table 中文/英文/數學/科學, code, active toggle, 負責科主任.

1.C.2 測考與權重 for 數學:
List assessments: 小測1, 統測, 期中, 期末.
Expand 期末 → paper weights: 選擇 20%, 短答 30%, 寫作/應用 50% — sliders or number inputs summing 100%.
Banner: 「儲存後 60 秒內全校重算」.
Badge M2.4.

1.C.3 成績輸入 for 數學 · F1A · 期末:
Spreadsheet-like grid. Rows students. Columns papers + total.
Status chips per row: 正常 / ABS / EXEMPT.
Top: import CSV button, save, recalc.
One ABS row greyed with flag.
```

---

### Prompt G — Activities list + detail

```
GLOBAL STYLE + Teacher chrome.

1.D.1 活動／比賽／事件:
View toggle 列表 | 月曆.
Filters: type chips PBL, STEAM, 比賽 Match, 服務, 其他.
Table: 名稱, 類型, 日期, 負責老師, 班別, 狀態, 人數.
Button 建立活動.

1.D.2 活動詳情 for 「中三數學建模工作坊」:
Left: metadata form (title, type, learning timestamp, assessing teacher, hidden-from-student-report checkbox).
Center: roster section + 分組矩陣 (Group A/B/C with members and one-click footprint assign).
Right: AI 即時回饋 panel + 褒揚範本 select.
Bottom sticky: 確認呈交 (opens fool-proof modal), 匯出評估, 開啟現場記錄.
Badges M5.
```

---

### Prompt H — Live recorder (child of activity)

```
GLOBAL STYLE + Teacher chrome, but denser "classroom mode".

1.D.3 現場記錄 Live Class Recorder opened FROM activity.
Big scan target UI: 「掃描學生 / 小組 QR · 目標 0.5 秒」
List of scanned students appearing in real time with status PRESENT.
Toolbar: 手動補錄, 批量貼上, multi-select → set ABS / EXEMPT.
Session banner: temporary session, teacher id, NOW timestamp.
Close session → dialog: 「將建立 INCOMPLETE_METADATA 待補全紀錄，暫不計入總結性分數」.
Badge Mod E. Do not present as top-level orphan product.
```

---

### Prompt I — Roles & positions + achievements

```
GLOBAL STYLE + Teacher chrome.

1.D.6 角色與崗位:
Explain subtitle: 學校崗位主檔，對應協作角色 Tier 1–4.
Table: 崗位名稱, 預設層級(T1成員/T2支援/T3領導/T4獲獎), 適用場景(課堂/PBL/學會), 啟用.
Button 新增崗位. Examples: 組長, 紀錄, 匯報, 器材, 班長.

1.D.4 成就與證書審批:
Kanban or table: 待審 / 已核准 / 退回.
Card: student, title, env level L5, tier T4, hours 12, thumbnail cert.
Actions: 核准, 退回, 開啟 OCR.
Show one row with red warning 「疑似重複獎狀上傳」.
Badge M4.
```

---

### Prompt J — Student app (full set)

```
GLOBAL STYLE but STUDENT chrome:
Simpler bottom-tab or left nav for mobile-friendly web:
首頁 | 上傳 | 證書 | 歷程 | 我的 | 私隱
Top: student name, class F1A, points 128.

2.1 Home: ACORN mini radar (student-safe), todos 「1 個角色待認領」「2 個活動待補相片」, CTA 上傳成就.

2.2 Upload Achievement:
Step wizard: 1 選檔(HEIC/JPG/PDF) 2 自我反思短文 3 AI 標籤確認(環境層級/角色層級/時數可改) 4 提交.
Note: 提交後待老師核准.

2.3 My awards list with status badges.

2.4 History timeline mixing activities + approved awards.

2.6 Incomplete activity card: add photos + reflection submit.

2.7 Role claim: 「你被標記為『紀錄』於 STEAM 小組，是否確認？」 Accept / Decline.
```

---

### Prompt K — Parent thin app

```
GLOBAL STYLE, calmer parent chrome, no dense tables.

3.1 Child overview: child name, class, limited highlights only (not full teacher diagnostic).
3.2 Approved awards list (read-only).
3.3 PICS privacy consent checkboxes + save.
3.4 Form: 查閱 / 改正申請 with note 「學校將於 40 天內處理」.
Footer compliance: PDPO / 兒童資料特別保障 R8.
```

---

### Prompt L — Admin strip (IT only)

```
GLOBAL STYLE + Teacher chrome with red/purple admin accent.

Create a single scrollable 系統管理 overview with 4 cards linking to:
1) 數據匯入流水線 — show wide table → narrow unpivot animation mock [M1]
2) AI 提示詞門戶 — textarea system prompt [M6]
3) 三階段脫敏 — Step1 detect PII, Step2 replace 陳小明→學生A, Step3 audit tag [Clause 6]
4) GSheet 同步日誌 — rows time/staff/count/success [Mod A]
Banner: 「此區僅資訊科技主任可見 · 廠商無法讀取學生個資 (Vendor Admin Lock)」
```

---

### Prompt M — Figma page structure (meta)

```
Create a Figma file page structure (frames named, no need full UI) matching this hierarchy.
Name pages:
00 Auth
01 Teacher Workspace
02 Students & Classes
03 Subjects & Assessment
04 Activities & Talent
05 Collaboration
06 System Admin
07 Student App
08 Parent App
09 Design System
Inside each page, create empty frames named with IDs from the site map (e.g. 1.B.1 Students by Year).
Add a cover page with product definition and P0 checklist.
```

---

### Prompt N — Fix existing mock (re-parent only)

```
You are refactoring an existing school platform mock that wrongly uses tender module names as navigation.
Keep existing high-fidelity screens as content, but redesign ONLY the left navigation and information architecture to:

Groups: 工作台 / 學生與班級 / 學科與評估 / 活動與人才 / 協作學習 / 系統管理
Move:
- ACORN into Student 360
- Diagnostic under 學科與評估
- OCR under 成就與證書
- Live Recorder under Activity detail
- Event Config fields into Activity create/edit
- Prompt, Pipeline, De-sensitize under 系統管理 only

Add missing list screens: Students by year, Class list, Subject list, Activity list, Roles list.
Add Student and Parent portals.
Do not invent new AI features. Focus on master data + portals.
```

---

## 7. Per-screen acceptance (short)

A screen is “done” when:

1. Has bilingual title  
2. Has place in the tree (ID like 1.B.1)  
3. Shows AY context  
4. Has primary action + empty/filter state if list  
5. Uses realistic demo data from §5  
6. If AI-related, shows de-sensitize or tokenized name where required  
7. Module badge optional but helpful for evaluators  

---

## 8. Anti-patterns (agents: refuse these)

1. Top nav = M1 M2 M3… only  
2. No student portal  
3. Event configuration without activity **list**  
4. Diagnostic without subjects/scores  
5. Live QR as orphan top item  
6. IT tools next to “my class” for default teacher  
7. Single hard-coded class 1A only  
8. Lists without academic year  
9. English-only for HK school tender  
10. Static marketing site instead of clickable app  

---

## 9. Open decision (human must confirm)

**“Pose list”** → implement as:

- **Default recommendation: BOTH**
  - `1.D.6 Roles & positions` (崗位)
  - `1.D.4 Achievements feed` (成就發佈)

If school says only one, prefer **Roles & positions** for talent + Mod B.

---

## 10. Related files

| File | Audience |
|---|---|
| `LALP_SITEMAP_AND_FEATURES.md` | AI / Figma (this file) |
| `LALP_SITEMAP_DISCUSSION.html` | Humans in meeting |
| Tender PDF at project root | Legal / compliance wording |

---

*End. Prefer this document over any generated React sidebar.*
