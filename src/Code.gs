const DEFAULT_HOURLY_RATE = 336;
const SCHOOL_NAME = '桃園市龍潭區石門國民小學';
const STORAGE_PREFIX = 'fee-application:';

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || '{}');

    if (payload.action !== 'upsertApplication') {
      return jsonResponse({ ok: false, error: 'Unsupported action.' });
    }

    const result = upsertApplication(payload);
    return jsonResponse({ ok: true, data: result });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function upsertApplication(payload) {
  const normalized = normalizePayload(payload);
  const storageKey = STORAGE_PREFIX + normalized.conversationId;
  const previous = loadRecord(storageKey);
  const record = mergeRecord(previous, normalized);
  const folder = DriveApp.getFolderById(record.driveFolderId);

  record.planDocId = upsertDoc({
    folder,
    fileId: record.planDocId,
    title: buildFileName(record, '實施計畫'),
    writer: function (body) {
      writeImplementationPlan(body, record);
    }
  });

  record.approvalDocId = upsertDoc({
    folder,
    fileId: record.approvalDocId,
    title: buildFileName(record, '課程簽呈'),
    writer: function (body) {
      writeApprovalMemo(body, record);
    }
  });

  record.payrollSheetId = upsertPayrollSheet({
    folder,
    fileId: record.payrollSheetId,
    title: buildFileName(record, '印領清冊'),
    record
  });

  record.updatedAt = new Date().toISOString();
  saveRecord(storageKey, record);

  return {
    conversationId: record.conversationId,
    planDocUrl: DocumentApp.openById(record.planDocId).getUrl(),
    approvalDocUrl: DocumentApp.openById(record.approvalDocId).getUrl(),
    payrollSheetUrl: SpreadsheetApp.openById(record.payrollSheetId).getUrl(),
    totalPeriods: getTotalPeriods(record.sessions),
    totalAmount: getTotalAmount(record.sessions, record.hourlyRate)
  };
}

function normalizePayload(payload) {
  assertRequired(payload.conversationId, 'conversationId');
  assertRequired(payload.driveFolderId, 'driveFolderId');

  return {
    conversationId: String(payload.conversationId).trim(),
    driveFolderId: String(payload.driveFolderId).trim(),
    teacherName: optionalText(payload.teacherName),
    courseName: optionalText(payload.courseName),
    purpose: optionalText(payload.purpose),
    hourlyRate: Number(payload.hourlyRate || DEFAULT_HOURLY_RATE),
    sessions: Array.isArray(payload.sessions) ? payload.sessions.map(normalizeSession) : undefined,
    students: Array.isArray(payload.students) ? payload.students.map(String).map(trimText).filter(Boolean) : undefined
  };
}

function normalizeSession(session) {
  return {
    date: requiredText(session.date, 'sessions[].date'),
    startTime: requiredText(session.startTime, 'sessions[].startTime'),
    endTime: requiredText(session.endTime, 'sessions[].endTime'),
    periods: Number(session.periods || 0)
  };
}

function mergeRecord(previous, incoming) {
  const record = Object.assign({}, previous || {}, incoming);

  assertRequired(record.teacherName, 'teacherName');
  assertRequired(record.courseName, 'courseName');
  assertRequired(record.purpose, 'purpose');

  if (!Array.isArray(record.sessions) || record.sessions.length === 0) {
    throw new Error('sessions 至少需要一筆上課時間。');
  }

  if (!Array.isArray(record.students) || record.students.length === 0) {
    throw new Error('students 至少需要一位學生。');
  }

  record.hourlyRate = Number(record.hourlyRate || DEFAULT_HOURLY_RATE);
  record.createdAt = record.createdAt || new Date().toISOString();
  return record;
}

function upsertDoc(options) {
  const doc = options.fileId ? DocumentApp.openById(options.fileId) : DocumentApp.create(options.title);
  const file = DriveApp.getFileById(doc.getId());

  if (!options.fileId) {
    options.folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  }

  file.setName(options.title);

  const body = doc.getBody();
  body.clear();
  options.writer(body);
  doc.saveAndClose();

  return doc.getId();
}

function writeImplementationPlan(body, record) {
  body.appendParagraph(SCHOOL_NAME + '課餘課程實施計畫').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  appendField(body, '課程名稱', record.courseName);
  appendField(body, '授課教師', record.teacherName);
  appendField(body, '課程目的', record.purpose);

  body.appendParagraph('上課時間').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  record.sessions.forEach(function (session, index) {
    body.appendParagraph((index + 1) + '. ' + formatSession(session));
  });

  body.appendParagraph('學生名單').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(record.students.join('、'));
}

function writeApprovalMemo(body, record) {
  body.appendParagraph(SCHOOL_NAME + '課餘課程鐘點費簽呈').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  appendField(body, '主旨', '擬辦理「' + record.courseName + '」課餘課程，並依實際授課節數支給鐘點費。');
  appendField(body, '說明一', '課程目的：' + record.purpose);
  appendField(body, '說明二', '授課教師：' + record.teacherName);
  appendField(body, '說明三', '授課節數合計：' + getTotalPeriods(record.sessions) + ' 節。');
  appendField(body, '說明四', '鐘點費單價：每節 ' + record.hourlyRate + ' 元，總金額 ' + getTotalAmount(record.sessions, record.hourlyRate) + ' 元。');
  appendField(body, '擬辦', '奉核後依課程實施情形辦理鐘點費印領作業。');
}

function upsertPayrollSheet(options) {
  const spreadsheet = options.fileId ? SpreadsheetApp.openById(options.fileId) : SpreadsheetApp.create(options.title);
  const file = DriveApp.getFileById(spreadsheet.getId());

  if (!options.fileId) {
    options.folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  }

  file.setName(options.title);

  const sheet = spreadsheet.getSheets()[0];
  sheet.setName('印領清冊');
  sheet.clear();
  writePayrollSheet(sheet, options.record);

  return spreadsheet.getId();
}

function writePayrollSheet(sheet, record) {
  const headers = ['老師姓名', '課程名稱', '上課日期', '上課時間', '節次', '鐘點費單價', '小計'];
  const rows = record.sessions.map(function (session) {
    return [
      record.teacherName,
      record.courseName,
      session.date,
      session.startTime + '-' + session.endTime,
      session.periods,
      record.hourlyRate,
      session.periods * record.hourlyRate
    ];
  });

  sheet.getRange(1, 1).setValue(SCHOOL_NAME + ' 課餘課程鐘點費印領清冊');
  sheet.getRange(2, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(3, 1, rows.length, headers.length).setValues(rows);

  const totalRow = rows.length + 4;
  sheet.getRange(totalRow, 1).setValue('總節次');
  sheet.getRange(totalRow, 2).setValue(getTotalPeriods(record.sessions));
  sheet.getRange(totalRow + 1, 1).setValue('總金額');
  sheet.getRange(totalRow + 1, 2).setValue(getTotalAmount(record.sessions, record.hourlyRate));

  sheet.getRange(1, 1, 1, headers.length).merge();
  sheet.getRange(1, 1, totalRow + 1, headers.length).setFontFamily('Noto Sans TC');
  sheet.getRange(1, 1).setFontSize(16).setFontWeight('bold');
  sheet.getRange(2, 1, 1, headers.length).setFontWeight('bold').setBackground('#e8f0fe');
  sheet.autoResizeColumns(1, headers.length);
}

function buildFileName(record, suffix) {
  return record.teacherName + '-' + record.courseName + '-' + suffix;
}

function formatSession(session) {
  return session.date + ' ' + session.startTime + '-' + session.endTime + '，' + session.periods + ' 節';
}

function appendField(body, label, value) {
  body.appendParagraph(label + '：' + value);
}

function getTotalPeriods(sessions) {
  return sessions.reduce(function (total, session) {
    return total + Number(session.periods || 0);
  }, 0);
}

function getTotalAmount(sessions, hourlyRate) {
  return getTotalPeriods(sessions) * Number(hourlyRate || DEFAULT_HOURLY_RATE);
}

function loadRecord(storageKey) {
  const raw = PropertiesService.getScriptProperties().getProperty(storageKey);
  return raw ? JSON.parse(raw) : null;
}

function saveRecord(storageKey, record) {
  PropertiesService.getScriptProperties().setProperty(storageKey, JSON.stringify(record));
}

function assertRequired(value, fieldName) {
  if (!value) {
    throw new Error(fieldName + ' is required.');
  }
}

function requiredText(value, fieldName) {
  const text = optionalText(value);
  assertRequired(text, fieldName);
  return text;
}

function optionalText(value) {
  return value === undefined || value === null ? undefined : trimText(String(value));
}

function trimText(value) {
  return value.trim();
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
