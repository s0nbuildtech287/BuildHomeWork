// Dán toàn bộ code này vào Extensions -> Apps Script trong Google Sheet
// Sau đó bấm Deploy -> New deployment -> Web app (Who has access: Anyone)

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'ping') {
    return jsonResponse({ ok: true, message: 'Ket noi Google Sheet thanh cong!' });
  }

  if (action === 'getHomework') {
    var id = (e && e.parameter && e.parameter.id) || '';
    var sheet = getOrCreateSheet(ss, 'Homeworks', ['id', 'title', 'updatedAt', 'homeworkJson']);
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        try {
          var hw = JSON.parse(rows[i][3]);
          return jsonResponse({ ok: true, homework: hw });
        } catch (err) {
          return jsonResponse({ ok: false, error: 'Du lieu de bi loi JSON' });
        }
      }
    }
    return jsonResponse({ ok: false, error: 'Khong tim thay de bai trong Google Sheet' });
  }

  if (action === 'getSubmissions') {
    var homeworkId = (e && e.parameter && e.parameter.homeworkId) || '';
    var sheet = getOrCreateSheet(ss, 'Submissions', [
      'id', 'homeworkId', 'homeworkTitle', 'studentName', 'studentClass', 'score', 'totalQuestions', 'submittedAt'
    ]);
    var rows = sheet.getDataRange().getValues();
    var list = [];
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][1]) === String(homeworkId)) {
        list.push({
          id: String(rows[i][0]),
          homeworkId: String(rows[i][1]),
          studentName: String(rows[i][3]),
          studentClass: String(rows[i][4]),
          score: Number(rows[i][5]) || 0,
          totalQuestions: Number(rows[i][6]) || 0,
          submittedAt: String(rows[i][7]),
          answers: {},
          results: []
        });
      }
    }
    return jsonResponse({ ok: true, submissions: list });
  }

  return jsonResponse({ ok: false, error: 'Unknown action' });
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '{}';
    var body = JSON.parse(raw);
    var action = body.action || '';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'saveHomework' && body.homework) {
      var hw = body.homework;
      var sheet = getOrCreateSheet(ss, 'Homeworks', ['id', 'title', 'updatedAt', 'homeworkJson']);
      var rows = sheet.getDataRange().getValues();
      var jsonStr = JSON.stringify(hw);
      var now = new Date().toISOString();
      var foundRow = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(hw.id)) {
          foundRow = i + 1;
          break;
        }
      }
      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, 4).setValues([[hw.id, hw.title || '', now, jsonStr]]);
      } else {
        sheet.appendRow([hw.id, hw.title || '', now, jsonStr]);
      }
      return jsonResponse({ ok: true });
    }

    if (action === 'submitResult' && body.submission) {
      var sub = body.submission;
      var sheet = getOrCreateSheet(ss, 'Submissions', [
        'id', 'homeworkId', 'homeworkTitle', 'studentName', 'studentClass', 'score', 'totalQuestions', 'submittedAt'
      ]);
      sheet.appendRow([
        sub.id || '',
        sub.homeworkId || '',
        body.homeworkTitle || '',
        sub.studentName || '',
        sub.studentClass || '',
        sub.score || 0,
        sub.totalQuestions || 0,
        sub.submittedAt || new Date().toISOString()
      ]);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: 'Invalid payload' });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

