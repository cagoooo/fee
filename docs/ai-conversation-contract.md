# AI 對話輸出規格

AI 對話入口的任務不是直接產文件，而是把老師的自然語言整理成可覆寫、可更新的案件資料。

## 必填欄位

- `conversationId`：同一位老師、同一個課程申請需維持同一個 ID。
- `driveFolderId`：指定產出文件的 Google Drive 資料夾 ID。
- `teacherName`：老師姓名。
- `courseName`：課餘課程開課名稱。
- `purpose`：課程目的。
- `sessions`：所有上課時間。
- `students`：所有學生名單。

## 更新規則

同一個 `conversationId` 代表同一件申請案。

- 第一次提交：建立實施計畫、課程簽呈、印領清冊。
- 後續提交：更新同一批文件，不另建新檔。
- 若只更新 `sessions`，系統保留原學生名單。
- 若只更新 `students`，系統保留原上課時間。
- 若更新課程名稱或老師姓名，檔名也會跟著更新。

## AI 追問原則

當老師提供資訊不完整時，AI 應先追問缺漏欄位，不要送出文件產生請求。

建議追問順序：

1. 老師姓名
2. 課程名稱
3. 課程目的
4. 上課日期、起訖時間、節次
5. 學生名單
6. 鐘點費單價，若校內固定可使用預設值

## 輸出格式

AI 收齊資料後，應送出：

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
