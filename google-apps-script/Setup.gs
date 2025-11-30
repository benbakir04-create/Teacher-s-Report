/**
 * سكربت إعداد قاعدة البيانات
 *
 * هذا السكربت يقوم بإنشاء جميع الصفحات والأعمدة المطلوبة تلقائيًا.
 *
 * طريقة الاستخدام:
 * 1. انسخ هذا الكود
 * 2. اذهب إلى Google Sheet > Extensions > Apps Script
 * 3. الصق الكود في ملف جديد أو فوق الكود القديم
 * 4. اختر الدالة setupDatabase من القائمة في الأعلى
 * 5. اضغط Run
 */
/**
 * دالة مساعدة لإنشاء الصفحة وإعداد العناوين
 */
function setupSheet(ss, name, headers, sampleData) {
  let sheet = ss.getSheetByName(name);

  // إنشاء الصفحة إذا لم تكن موجودة
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  // إذا كانت الصفحة فارغة، أضف العناوين والبيانات
  if (sheet.getLastRow() === 0) {
    // تنسيق العناوين
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f3f4f6");
    headerRange.setHorizontalAlignment("center");

    // تجميد الصف الأول
    sheet.setFrozenRows(1);

    // إضافة بيانات تجريبية إذا وجدت
    if (sampleData && sampleData.length > 0) {
      sheet
        .getRange(2, 1, sampleData.length, sampleData[0].length)
        .setValues(sampleData);
    }

    // توسيع الأعمدة لتناسب المحتوى
    sheet.autoResizeColumns(1, headers.length);
  }
}
