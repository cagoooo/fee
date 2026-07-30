# 課餘課程鐘點費申請 AI 機器人

這是一個 Google Apps Script MVP 骨架，用來協助桃園市龍潭區石門國民小學老師透過對話或表單提交課餘課程資料，並在指定 Google Drive 資料夾中產生與更新：

線上網頁：https://cagoooo.github.io/fee/

- 老師的實施計畫
- 課程簽呈
- 老師的印領清冊

## MVP 流程

1. 對話入口收集老師提供的課程資料。
2. 將資料整理成結構化 JSON。
3. 呼叫 Apps Script Web App 的 `upsertApplication` 動作。
4. 系統依據 `conversationId` 找到既有案件。
5. 第一次送出時建立三份文件；後續更新時覆寫原文件內容。

## 輸入資料格式

```json
{
  "action": "upsertApplication",
  "conversationId": "teacher-a-2026-soccer",
  "driveFolderId": "GOOGLE_DRIVE_FOLDER_ID",
  "teacherName": "王小明",
  "courseName": "課後足球社",
  "purpose": "提升學生體能、團隊合作與規律運動習慣。",
  "hourlyRate": 336,
  "sessions": [
    {
      "date": "2026-09-10",
      "startTime": "16:00",
      "endTime": "17:30",
      "periods": 2
    }
  ],
  "students": ["學生甲", "學生乙"]
}
```

## 部署步驟

1. 到 Google Drive 建立一個 Apps Script 專案。
2. 將 `appsscript.json` 與 `src/Code.gs` 貼入專案。
3. 在 Apps Script 中部署為 Web App。
4. 執行身分選擇擁有雲端硬碟資料夾權限的帳號。
5. 存取權限依校內情境選擇「網域內使用者」或受控入口。

## 後續可接的 AI 入口

- Google Chat Bot：最適合校內 Google Workspace。
- 簡易網頁表單 + AI 追問：最容易控制欄位完整性。
- LINE Bot：老師熟悉，但 Google 帳號與雲端硬碟權限要另外處理。

建議第一版先用「簡易網頁表單 + AI 追問」或 Google Chat Bot。

---

<!-- BEGIN:PROJECT_GUIDE -->
## 專案導覽

這個 repository 收錄 **fee** 專案的原始碼與相關資源。以下資訊依目前檔案結構整理；實際行為仍以程式碼與部署設定為準。

- 專案定位：校務／行政流程數位化專案
- Repository：`cagoooo/fee`
- 可見性：公開
- 主要技術：JavaScript
- 線上入口：未在 GitHub repository metadata 設定

### 可以怎麼應用

- 把紙本、試算表或人工通知流程轉成可追蹤的線上作業
- 依不同學校的欄位、角色與簽核方式進行客製化
- 作為校務系統、資料同步或自動通知整合的參考實作

這些是依目前專案定位整理的延伸方向，不代表所有情境都已內建完成；實作前請先確認現有功能與資料格式。

### 技術與專案結構

- `README.md`
- `appsscript.json`
- `docs`
- `index.html`
- `src`

檔案結構會隨版本演進；若本節與程式碼不一致，以目前預設分支的原始碼為準。

### 本機執行

這是可直接由瀏覽器載入的靜態網站。可用任一靜態檔案伺服器預覽，例如：
```bash
python -m http.server 8000
```
接著開啟 `http://localhost:8000`。請避免直接以 `file://` 測試需要模組、請求或 Service Worker 的功能。

### 給 AI Agent 的接手指南

1. 先閱讀本 README、`AGENTS.md`（若有）、套件腳本與部署設定。
2. 先畫出角色、資料流、權限與外部服務，再修改表單或資料結構。
3. 不得提交學生個資、憑證、API 金鑰或正式環境匯出資料。
4. 涉及 schema、驗證、權限或通知時，同步檢查前後端與部署設定。
5. 不要捏造尚未存在的功能；README 與實作有落差時，應同時更新文件。
6. 提交前只納入本次任務檔案，並記錄實際執行過的驗證。

### 安全與資料注意事項

- 不要提交 `.env`、服務帳號、API 金鑰、token、學生個資或正式環境匯出資料。
- 使用 Firebase、Supabase、Google API 或其他雲端服務時，請建立自己的測試專案並套用最小權限。
- 若要公開衍生作品，請先確認程式碼、圖片、音訊、字型與教材內容的授權。

### 貢獻與客製化

歡迎依教學現場、活動或工作流程需求進行 fork／客製化。建議在變更說明中交代使用情境、主要修改、測試方式，以及是否影響資料格式或部署設定。
<!-- END:PROJECT_GUIDE -->
