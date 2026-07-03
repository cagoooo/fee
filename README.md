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
