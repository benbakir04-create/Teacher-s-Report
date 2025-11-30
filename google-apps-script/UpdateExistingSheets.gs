/**
 * سكربت تحديث قاعدة البيانات الموجودة
 *
 * هذا السكربت يقوم بتغيير أسماء الصفحات والعناوين من الإنجليزية إلى العربية
 * للصفحات الموجودة بالفعل.
 *
 * طريقة الاستخدام:
 * 1. انسخ هذا الكود
 * 2. اذهب إلى Google Sheet > Extensions > Apps Script
 * 3. الصق الكود
 * 4. اختر الدالة updateExistingDatabase من القائمة
 * 5. اضغط Run
 */

function updateExistingDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // دالة مساعدة لتغيير الاسم والعناوين
  const updateSheet = (oldName, newName, newHeaders) => {
    let sheet = ss.getSheetByName(oldName);

    // إذا لم نجد الصفحة بالاسم القديم، نحاول البحث بالاسم الجديد (ربما تم تغييرها يدوياً)
    if (!sheet) {
      sheet = ss.getSheetByName(newName);
    }

    if (sheet) {
      // تغيير الاسم
      sheet.setName(newName);

      // تحديث العناوين (الصف الأول)
      const headerRange = sheet.getRange(1, 1, 1, newHeaders.length);
      headerRange.setValues([newHeaders]);

      // تنسيق العناوين
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f3f4f6");
      headerRange.setHorizontalAlignment("center");

      // توسيع الأعمدة
      sheet.autoResizeColumns(1, newHeaders.length);
    }
  };

  // 1. Config -> الإعدادات
  updateSheet("Config", "الإعدادات", ["النوع", "القيمة"]);

  // 2. Subjects -> المواد
  updateSheet("Subjects", "المواد", ["المستوى", "المادة"]);

  // 3. Lessons -> الدروس
  updateSheet("Lessons", "الدروس", ["المادة", "الدرس", "الجنس"]);

  // 4. Reports -> التقارير
  updateSheet("Reports", "التقارير", [
    "الطابع الزمني",
    "رقم التسجيل",
    "الاسم",
    "المدرسة",
    "المستوى",
    "القسم",
    "التاريخ",
    "تقرير القرآن",
    "مادة الحصة 1",
    "درس الحصة 1",
    "استراتيجيات 1",
    "وسائل 1",
    "مهام 1",
    "جنس 1",
    "يوجد حصة ثانية",
    "مادة الحصة 2",
    "درس الحصة 2",
    "استراتيجيات 2",
    "وسائل 2",
    "مهام 2",
    "جنس 2",
    "ملاحظات",
  ]);

  // 5. Backups -> النسخ_الاحتياطي
  updateSheet("Backups", "النسخ_الاحتياطي", ["الطابع الزمني", "البيانات"]);

  // 6. Errors -> الأخطاء
  updateSheet("Errors", "الأخطاء", ["الطابع الزمني", "السياق", "الخطأ"]);

  ui.alert("✅ تم تحديث أسماء الصفحات والعناوين إلى العربية بنجاح!");
}
