/**
 * Google Apps Script - Web App للكتابة إلى Sheets
 *
 * كيفية النشر:
 * 1. افتح https://script.google.com
 * 2. أنشئ مشروع جديد
 * 3. الصق هذا الكود
 * 4. Deploy > New deployment > Web app
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. انسخ الرابط وضعه في VITE_GOOGLE_WEBAPP_URL
 */

function doPost(e) {
  try {
    // السماح بـ CORS
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    // قراءة البيانات
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // الحصول على الملف النشط
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "appendToSheet") {
      const range = data.range;
      const values = data.values;

      // استخراج اسم الورقة من النطاق
      const sheetName = range.split("!")[0];
      let sheet = ss.getSheetByName(sheetName);

      // إنشاء الورقة إذا لم تكن موجودة
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);

        // إضافة رؤوس حسب نوع الورقة
        if (sheetName === "التقارير") {
          const headers = [
            "الطابع الزمني",
            "رقم التسجيل",
            "الاسم",
            "المدرسة",
            "المستوى",
            "القسم",
            "التاريخ",
            "تقرير القرآن",
            "مادة الحصة 1",
            "جنس 1",
            "درس الحصة 1",
            "استراتيجيات 1",
            "وسائل 1",
            "مهام 1",
            "يوجد حصة ثانية",
            "مادة الحصة 2",
            "جنس 2",
            "درس الحصة 2",
            "استراتيجيات 2",
            "وسائل 2",
            "مهام 2",
            "ملاحظات",
          ];
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        } else if (sheetName === "النسخ_الاحتياطي") {
          sheet.getRange(1, 1, 1, 2).setValues([["الطابع الزمني", "البيانات"]]);
        } else if (sheetName === "الأخطاء") {
          sheet
            .getRange(1, 1, 1, 3)
            .setValues([["الطابع الزمني", "السياق", "الخطأ"]]);
        }
      }

      // إضافة الصفوف
      values.forEach((row) => {
        sheet.appendRow(row);
      });

      return output.setContent(
        JSON.stringify({
          success: true,
          message: "Data added successfully",
        })
      );
    } else {
      return output.setContent(
        JSON.stringify({
          success: false,
          message: "Unknown action",
        })
      );
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// للسماح بطلبات OPTIONS (CORS preflight)
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "ready",
      message: "Web App is running",
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
