// Dán toàn bộ code này vào Extensions -> Apps Script trong Google Sheet
// Lần đầu: Deploy -> New deployment -> Web app (Who has access: Anyone)
// Khi cập nhật code: Deploy -> Manage deployments -> biểu tượng Bút chì -> Version: New version -> Deploy

var THEME_COLOR = '#7075B8'; // Màu tím xanh T-Class
var ZEBRA_COLOR = '#F8FAFC';
var BORDER_COLOR = '#CBD5E1';

var HW_HEADERS = ['STT', 'Tên bài tập', 'Cập nhật lúc', 'Mã đề (ID)', 'Dữ liệu JSON'];
var SUB_HEADERS = [
  'STT',
  'Tên bài tập',
  'Họ và tên',
  'Lớp',
  'Điểm',
  'Tổng câu',
  'Tỷ lệ (%)',
  'Thời gian nộp',
  'Mã đề (ID)',
];

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'ping') {
    return jsonResponse({ ok: true, message: 'Ket noi Google Sheet thanh cong!' });
  }

  if (action === 'getHomework') {
    var id = (e.parameter && e.parameter.id) || '';
    var sheet = getOrCreatePrettySheet(ss, 'Homeworks', HW_HEADERS, [55, 320, 155, 190, 260]);
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      // Hỗ trợ cả cột mới (cột 4 = index 3) và cột cũ (cột 1 = index 0)
      var rowId = String(rows[i][3] || rows[i][0] || '');
      var rowJson = rows[i][4] || rows[i][3];
      if (rowId === String(id) && rowJson) {
        try {
          var hw = JSON.parse(rowJson);
          return jsonResponse({ ok: true, homework: hw });
        } catch (err) {
          return jsonResponse({ ok: false, error: 'Du lieu de bi loi JSON' });
        }
      }
    }
    return jsonResponse({ ok: false, error: 'Khong tim thay de bai trong Google Sheet' });
  }

  if (action === 'getSubmissions') {
    var homeworkId = (e.parameter && e.parameter.homeworkId) || '';
    var sheet = getOrCreatePrettySheet(
      ss,
      'Submissions',
      SUB_HEADERS,
      [55, 280, 190, 110, 75, 85, 90, 155, 190]
    );
    var rows = sheet.getDataRange().getValues();
    var list = [];
    for (var i = rows.length - 1; i >= 1; i--) {
      var rowHwId = String(rows[i][8] || '');
      if (rowHwId === String(homeworkId)) {
        list.push({
          id: 'sub_' + i,
          homeworkId: rowHwId,
          studentName: String(rows[i][2] || ''),
          studentClass: String(rows[i][3] || ''),
          score: Number(rows[i][4]) || 0,
          totalQuestions: Number(rows[i][5]) || 0,
          submittedAt: String(rows[i][7] || ''),
          answers: {},
          results: [],
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
      var sheet = getOrCreatePrettySheet(ss, 'Homeworks', HW_HEADERS, [55, 320, 155, 190, 260]);
      var rows = sheet.getDataRange().getValues();
      var jsonStr = JSON.stringify(hw);
      var vnTime = formatVnDateTime(new Date());
      var foundRow = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][3]) === String(hw.id)) {
          foundRow = i + 1;
          break;
        }
      }
      if (foundRow > 0) {
        var stt = foundRow - 1;
        sheet.getRange(foundRow, 1, 1, 5).setValues([[stt, hw.title || '', vnTime, hw.id, jsonStr]]);
        styleDataRow(sheet, foundRow, 5, [1, 3]);
      } else {
        var nextRow = sheet.getLastRow() + 1;
        var nextStt = nextRow - 1;
        sheet.getRange(nextRow, 1, 1, 5).setValues([[nextStt, hw.title || '', vnTime, hw.id, jsonStr]]);
        styleDataRow(sheet, nextRow, 5, [1, 3]);
      }
      return jsonResponse({ ok: true });
    }

    if (action === 'submitResult' && body.submission) {
      var sub = body.submission;
      var sheet = getOrCreatePrettySheet(
        ss,
        'Submissions',
        SUB_HEADERS,
        [55, 280, 190, 110, 75, 85, 90, 155, 190]
      );
      var nextRow = sheet.getLastRow() + 1;
      var stt = nextRow - 1;
      var score = Number(sub.score) || 0;
      var total = Number(sub.totalQuestions) || 0;
      var pct = total > 0 ? Math.round((score / total) * 100) + '%' : '0%';
      var vnTime = formatVnDateTime(sub.submittedAt ? new Date(sub.submittedAt) : new Date());

      sheet
        .getRange(nextRow, 1, 1, 9)
        .setValues([
          [
            stt,
            body.homeworkTitle || '',
            sub.studentName || '',
            sub.studentClass || '',
            score,
            total,
            pct,
            vnTime,
            sub.homeworkId || '',
          ],
        ]);
      styleDataRow(sheet, nextRow, 9, [1, 4, 5, 6, 7, 8]);
      // Làm nổi bật cột Điểm
      sheet.getRange(nextRow, 5).setFontWeight('bold').setFontColor('#1E3A8A');
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: 'Invalid payload' });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function getOrCreatePrettySheet(ss, name, headers, colWidths) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);

    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange
      .setBackground(THEME_COLOR)
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontSize(10)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    sheet.setRowHeight(1, 32);

    if (colWidths && colWidths.length) {
      for (var c = 0; c < colWidths.length; c++) {
        sheet.setColumnWidth(c + 1, colWidths[c]);
      }
    }
  }
  return sheet;
}

function styleDataRow(sheet, rowIndex, colCount, centerCols) {
  var range = sheet.getRange(rowIndex, 1, 1, colCount);
  range
    .setBackground(rowIndex % 2 === 0 ? '#FFFFFF' : ZEBRA_COLOR)
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(rowIndex, 26);

  if (centerCols && centerCols.length) {
    for (var i = 0; i < centerCols.length; i++) {
      sheet.getRange(rowIndex, centerCols[i]).setHorizontalAlignment('center');
    }
  }
}

function formatVnDateTime(dateObj) {
  var d = dateObj && !isNaN(dateObj.getTime()) ? dateObj : new Date();
  return Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
