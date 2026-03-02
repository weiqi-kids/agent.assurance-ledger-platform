# Assurance Ledger Platform

**SOC1 Type II / ISQM1 / ISO9001 三框架審計就緒平台**

一個整合三大國際標準的審計管理平台，以 GitHub 作為不可變證據庫，確保每一筆操作記錄都具備密碼學等級的防竄改保護。

---

## 平台簡介

Assurance Ledger Platform (ALP) 是一個為會計師事務所、審計團隊和品質管理部門設計的審計就緒平台，同時支援三個國際框架：

| 框架 | 說明 |
|---|---|
| **SOC1 Type II** | 證明內部控制在整個審計期間內持續有效運作 |
| **ISQM1** | 國際審計品質管理標準，確保事務所的品質管理制度符合要求 |
| **ISO 9001** | 國際品質管理系統標準，適用於任何組織的品質管理 |

### 核心設計理念

- **不可變記錄**：所有操作事件以 append-only 方式寫入 GitHub Repository，一旦寫入便無法修改或刪除
- **密碼學鏈結**：每筆事件包含前一筆事件的密碼雜湊值（類似區塊鏈），任何竄改都會立即被偵測
- **每日自動驗證**：CI/CD 每天自動重新計算所有雜湊鏈，確保資料完整性
- **可重現的證據包**：相同輸入永遠產生相同的證據包 (deterministic)，支援獨立驗證

---

## 主要功能

### 儀表板 (Dashboard)

即時掌握組織的審計健康狀況：

- **統計卡片**：進行中案件數、未解決發現事項、風險評分等關鍵指標
- **KRI 趨勢圖**：關鍵風險指標 (Key Risk Indicator) 隨時間變化的折線圖
- **控制點熱力圖**：30 個控制點依 6 大領域分類，以顏色標示有效性
- **活動紀錄**：跨所有案件的最新操作事件

### 案件管理 (Cases)

每個案件代表一個審計委託 (engagement)：

- **狀態流程**：草稿 → 進行中 → 審閱 → 交付 → 封存
- **不可變時間軸**：每次狀態變更、附件上傳、筆記新增都記錄為不可逆事件
- **雜湊鏈指示器**：視覺化顯示每個事件的完整性狀態
- **文件附加**：上傳工作底稿、證據文件，自動計算 SHA-256 雜湊值

### 治理 (Governance)

管理 30 個稽核控制點和組織架構：

- **控制點清單**：6 大領域的 30 個控制點全覽
  - AC：存取控制 (Access Control)
  - CM：變更管理 (Change Management)
  - PI：處理完整性 (Processing Integrity)
  - CF：機密性 (Confidentiality)
  - IR：事件回應 (Incident Response)
  - MN：監控 (Monitoring)
- **三框架映射**：每個控制點對應 SOC1 CC 目標、ISQM1 QC 段落、ISO 9001 條款
- **RACI 矩陣**：明確定義每個控制點的負責人 (R)、批准者 (A)、諮詢者 (C)、知悉者 (I)
- **角色權限矩陣**：6 個角色的完整權限對照

### 審計模組 (Audit)

執行抽樣測試、記錄發現事項、生成證據包：

- **抽樣引擎**：使用固定種子的偽隨機數生成器 (Mulberry32 PRNG)，相同種子 + 相同族群 = 完全相同的樣本
- **風險分層抽樣**：高風險 25 個、中風險 15 個、低風險 5 個（最低樣本數）
- **5 種偏差檢查**：證據缺失、SLA 超時、批准缺失、雜湊不符、編修錯誤
- **發現事項**：三種嚴重程度——控制缺失 (Control Deficiency)、重大 (Significant)、實質 (Material)
- **確定性證據包**：ZIP 封存使用固定壓縮、固定時間戳、字母排序，確保可重現性

### 品質管理系統 (QMS)

符合 ISQM1 和 ISO 9001 的品質管理要求：

- **風險登記簿**：可能性 × 影響評分、KRI 閾值追蹤、緩解策略
- **文件索引**：政策 (Policy)、標準作業程序 (SOP)、工作指引 (Work Instruction)、表單 (Form) 的版本管理
- **客訴管理**：客戶申訴記錄，自動與 GitHub Issue 雙向同步

### AI 問答助理 (Chat)

內建多模型 AI 助理，協助審計相關問題：

- **多供應商支援**：Anthropic Claude、OpenAI GPT、Google Gemini
- **@提及路由**：`@claude`、`@gpt`、`@gemini` 指定模型；`@all-ai` 同時詢問所有模型
- **即時串流**：AI 回應以 Server-Sent Events 即時顯示

---

## 使用者角色

| 角色 | 說明 | 主要權限 |
|---|---|---|
| **engagement-partner** | 業務合夥人：最高審閱與批准權限 | 所有模組讀寫 + 案件交付 + 客訴管理 |
| **quality-manager** | 品質經理：抽樣與證據簽署負責人 | 所有模組讀寫 + 抽樣執行 + 證據簽署 |
| **tech-lead** | 技術主管：系統架構與維護 | 案件/發現讀寫 + 系統設定管理 |
| **system-admin** | 系統管理員：使用者與基礎設施管理 | 唯讀 + 系統設定 + 使用者角色指派 |
| **auditor** | 審計師：測試與覆核 | 全部唯讀 + 可執行抽樣 |
| **viewer** | 觀察者：客戶或利害關係人 | 全部唯讀 |

新使用者預設為 `viewer` 角色，由 `system-admin` 在「設定 → 使用者管理」調整。

---

## 開始使用

### 登入

1. 前往平台部署網址
2. 點選「Sign in with Google」或「Sign in with LINE」
3. 首次登入將自動建立帳號（預設角色：viewer）
4. 如需更高權限，請聯繫系統管理員

### 介面導覽

- **左側選單**：7 個主要功能區（Dashboard、Cases、Governance、Audit、QMS、Chat、Settings）
- 選單項目會依您的角色權限自動顯示/隱藏
- **頂部導覽列**：麵包屑路徑 + 使用者選單
- **主題切換**：右上角可切換深色/淺色主題

---

## 常見工作流程

### 建立新案件

```
1. 點選左側選單「Cases」
2. 點選右上角「New Case」按鈕
3. 填寫案件標題、說明、指派給（可選）
4. 點選「Create」
   → 系統建立案件並記錄 CASE_CREATED 不可變事件
5. 案件狀態為「草稿」(draft)
6. 開始附加工作底稿、新增筆記
7. 準備好後，將狀態變更為「進行中」(active) 以開始正式審計
```

### 執行抽樣

```
1. 進入「Audit」→「Samples」→「New Sample」
2. 選擇控制點 (Control ID)、審計期間、族群大小
3. 輸入隨機種子 (seed)
   ⚠ 請記錄此數字！相同種子 + 相同族群 = 完全相同的樣本
4. 點選「Generate」
   → 系統使用確定性演算法生成可重現的樣本
5. 下載 CSV（包含種子、操作人員、程式版本等元資料）
6. 風險層級決定最低樣本數：
   高風險 = 25 個、中風險 = 15 個、低風險 = 5 個
```

### 生成證據包

```
1. 進入「Audit」→「Evidence Packs」→「Generate Pack」
2. 選擇審計期間（例如 2025-Q1）
3. 系統收集該期間所有相關文件並打包
4. 確定性 ZIP 保證：
   - 所有文件依字母順序排列
   - 固定壓縮等級，不含時間戳
   - manifest.json 記錄每個檔案的 SHA-256 雜湊值
   - pack_hash = 整個 ZIP 檔的 SHA-256
5. 由品質經理 (quality-manager) 簽署
   ⚠ 重新生成相同期間的封存，pack_hash 必須完全相同
```

### 管理發現事項

```
1. 進入「Audit」→「Findings」→「New Finding」
2. 填寫：關聯控制點、嚴重程度、說明、偵測方式
3. 點選「Create」
   → 系統自動在 GitHub 建立對應 Issue（標籤：finding）
4. 嚴重程度分類：
   - Control Deficiency（控制缺失）
   - Significant（重大）
   - Material（實質）
5. 記錄管理層回應 (Management Response)
6. 追蹤狀態：開放 → 補救中 → 已關閉
7. GitHub Issue 與平台狀態自動同步
```

### 使用 AI 問答助理

```
1. 進入「Chat」→「New Conversation」
2. 輸入問題，使用 @提及選擇 AI 模型：
   @claude  → Anthropic Claude
   @gpt     → OpenAI GPT
   @gemini  → Google Gemini
   @all-ai  → 同時詢問所有已啟用的模型
3. 不加 @提及 = 僅儲存訊息，不觸發 AI 回應
4. AI 回應以串流方式即時顯示

問題範例：
  @claude 請說明 AC-001 存取控制的查核程序
  @all-ai 這個發現事項的嚴重程度應如何分類？
  @gpt 如何撰寫 SOC1 Type II 的管理層聲明書？
```

---

## 架構概覽

### 不可變性保證

每一筆操作都記錄為一個「事件」(event)，寫入 GitHub Repository 中的 JSONL 檔案：

```
ledger/cases/{tenantId}/{caseId}/events.jsonl
```

每個事件包含前一個事件的密碼雜湊值，形成不可斷裂的鏈結——任何事後修改都會導致雜湊值不符，立即被偵測。

### 資料流

```
使用者操作 → API → writer.ts（單一寫入器，防並行衝突）
                        │
                        ├─ 1. 計算雜湊值，寫入 JSONL（GitHub Repo = 真相來源）
                        │
                        └─ 2. 投影到資料庫（供介面查詢用）

如果資料庫寫入失敗：
  → 自動加入重試佇列（最多 5 次）
  → 建立 GitHub Incident Issue
  → JSONL 記錄不受影響（它是唯一的真相來源）
```

### 每日自動驗證

GitHub Actions 每天 06:00 UTC 自動執行：
- 重新計算所有案件的完整雜湊鏈
- 如有任何鏈結斷裂，立即建立 Incident Issue 通知

---

## 管理員設置

> 以下內容適用於系統管理員，一般使用者無需閱讀。

### 系統需求

- Node.js >= 20
- pnpm >= 9
- Git
- GPG 金鑰（用於簽署提交，CI 會驗證）

### 安裝

```bash
git clone https://github.com/<owner>/assurance-ledger-platform.git
cd assurance-ledger-platform
cp .env.example .env
# 編輯 .env 填入所有必要的金鑰
pnpm install
```

### 環境變數

詳見 `.env.example`，以下為所有必要的設定項：

| 變數 | 說明 |
|---|---|
| `DATABASE_URL` | 資料庫連線（`file:./dev.db` 或 `postgresql://...`） |
| `DB_DRIVER` | `sqlite` 或 `postgresql` |
| `NEXTAUTH_SECRET` | NextAuth.js 密鑰（隨機字串） |
| `NEXTAUTH_URL` | 部署網址（`https://your-domain.com`） |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `LINE_CHANNEL_ID` | LINE Login Channel ID |
| `LINE_CHANNEL_SECRET` | LINE Login Channel Secret |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App Private Key（PEM 格式） |
| `GITHUB_INSTALLATION_ID` | GitHub App Installation ID |
| `GITHUB_REPOSITORY` | `owner/repo` 格式 |
| `ANTHROPIC_API_KEY` | Anthropic API 金鑰（選填） |
| `OPENAI_API_KEY` | OpenAI API 金鑰（選填） |
| `GOOGLE_AI_API_KEY` | Google AI Studio API 金鑰（選填） |

### 資料庫初始化

```bash
cd core/web
pnpm db:push       # 建立資料表（開發環境）
# 或 pnpm db:migrate  # 執行遷移（正式環境）
pnpm db:seed       # 填入 30 個控制點和系統設定
```

### 開發環境

```bash
cd core/web
pnpm dev           # 啟動開發伺服器 (http://localhost:3000)
```

### 正式部署

```bash
cd core/web
pnpm build         # 建置正式版本
pm2 start ecosystem.config.js   # 從專案根目錄執行
```

PM2 設定：單一實例 (fork mode)、Port 3000、日誌輸出至 `./logs/`。

### Nginx Proxy Manager

1. 新增 Proxy Host，目標指向 `http://localhost:3000`
2. 啟用 SSL（Let's Encrypt 自動憑證）
3. 設定 OAuth 回調 URL：
   - Google：`https://your-domain.com/api/auth/callback/google`
   - LINE：`https://your-domain.com/api/auth/callback/line`

---

## 授權

Proprietary

## 規格文件

`prompt/typeII-master-pack/v1.md` — 30 個控制點定義 + 三框架映射 + 抽樣矩陣 + 證據包結構
