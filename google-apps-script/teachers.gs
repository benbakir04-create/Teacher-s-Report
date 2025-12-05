/**
 * Teachers Management Functions & Reports Handler
 *
 * Add these functions to your existing Google Apps Script project
 */

const TEACHERS_SHEET_NAME = "المعلمون";

/**
 * Get teacher by registration ID
 */
function getTeacherByRegistrationId(registrationId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TEACHERS_SHEET_NAME);

  if (!sheet) {
    return { success: false, error: "Teachers sheet not found" };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const idCol = headers.indexOf("رقم التسجيل");
  const nameCol = headers.indexOf("اسم المعلم");
  const schoolCol = headers.indexOf("المدرسة");
  const levelCol = headers.indexOf("المستوى");
  const sectionCol = headers.indexOf("القسم");
  const emailCol = headers.indexOf("البريد الإلكتروني");
  const deviceCol = headers.indexOf("بصمة الجهاز");
  const emailRequiredCol = headers.indexOf("إلزامية البريد");
  const firstUseCol = headers.indexOf("تاريخ أول استخدام");
  const linkDateCol = headers.indexOf("تاريخ الربط");

  // Find teacher row
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == registrationId) {
      return {
        success: true,
        teacher: {
          registrationId: data[i][idCol],
          name: data[i][nameCol],
          school: data[i][schoolCol],
          level: data[i][levelCol],
          section: data[i][sectionCol],
          email: data[i][emailCol] || "",
          deviceFingerprint: data[i][deviceCol] || "",
          emailRequired: data[i][emailRequiredCol] === "نعم",
          firstUseDate: data[i][firstUseCol] || "",
          linkDate: data[i][linkDateCol] || "",
        },
      };
    }
  }

  return { success: false, error: "Teacher not found" };
}

/**
 * Validate device fingerprint
 */
function validateDevice(registrationId, deviceFingerprint) {
  const result = getTeacherByRegistrationId(registrationId);
  
  if (!result.success) {
    logError("Security Check", `Teacher not found: ${registrationId}`);
    return { valid: false, error: "Teacher not found" };
  }

  const storedFingerprint = result.teacher.deviceFingerprint;

  // Allow if no fingerprint is stored (First use)
  if (!storedFingerprint) {
    return { valid: true };
  }

  // Check for exact match
  if (storedFingerprint === deviceFingerprint) {
    return { valid: true };
  }

  // Security violation
  logError("Security Violation", `Device mismatch for ${registrationId}. Stored: ${storedFingerprint}, Provided: ${deviceFingerprint}`);
  return { valid: false, error: "Device fingerprint mismatch" };
}

/**
 * Update teacher data (school, level, section) - Secured
 */
function updateTeacherData(registrationId, updates, deviceFingerprint) {
  // Security Check
  const security = validateDevice(registrationId, deviceFingerprint);
  if (!security.valid) {
    return { success: false, error: security.error };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TEACHERS_SHEET_NAME);

  if (!sheet) {
    return { success: false, error: "Teachers sheet not found" };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const idCol = headers.indexOf("رقم التسجيل");
  const schoolCol = headers.indexOf("المدرسة");
  const levelCol = headers.indexOf("المستوى");
  const sectionCol = headers.indexOf("القسم");
  const modifiedCol = headers.indexOf("تم التعديل؟");
  const modifiedDateCol = headers.indexOf("تاريخ آخر تعديل");

  // Find and update teacher row
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == registrationId) {
      let wasModified = false;

      if (updates.school && data[i][schoolCol] !== updates.school) {
        sheet.getRange(i + 1, schoolCol + 1).setValue(updates.school);
        wasModified = true;
      }

      if (updates.level && data[i][levelCol] !== updates.level) {
        sheet.getRange(i + 1, levelCol + 1).setValue(updates.level);
        wasModified = true;
      }

      if (updates.section && data[i][sectionCol] !== updates.section) {
        sheet.getRange(i + 1, sectionCol + 1).setValue(updates.section);
        wasModified = true;
      }

      if (wasModified) {
        sheet.getRange(i + 1, modifiedCol + 1).setValue("نعم");
        sheet
          .getRange(i + 1, modifiedDateCol + 1)
          .setValue(new Date().toISOString());
      }

      return { success: true };
    }
  }

  return { success: false, error: "Teacher not found" };
}

/**
 * Update device fingerprint - Secured
 * NOTE: This prevents device switching without clearing the field first via Admin/Email flow
 */
function updateDeviceFingerprint(registrationId, deviceFingerprint) {
  // Check if teacher exists only - we can't validate device because we are updating it!
  // BUT logic demands we validate 'something'. 
  // For 'Security Hardening', we should NOT allow overwriting an existing fingerprint freely.
  // We check against the stored one. If stored is present and different => Violation.
  
  const security = validateDevice(registrationId, deviceFingerprint);
  // If stored was empty, valid=true. If stored matches provided, valid=true.
  // If stored differs => Mismatch => Return Error.
  if (!security.valid) {
    return { success: false, error: "Cannot overwrite existing device fingerprint. Contact Admin." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TEACHERS_SHEET_NAME);

  if (!sheet) {
    return { success: false, error: "Teachers sheet not found" };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const idCol = headers.indexOf("رقم التسجيل");
  const deviceCol = headers.indexOf("بصمة الجهاز");

  // Find and update teacher row
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == registrationId) {
      sheet.getRange(i + 1, deviceCol + 1).setValue(deviceFingerprint);
      return { success: true };
    }
  }

  return { success: false, error: "Teacher not found" };
}

/**
 * Main POST Handler
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
    
    // بيانات الأمان (قد تكون غير موجودة في بعض الطلبات القديمة)
    const registrationId = data.registrationId || (data.auth ? data.auth.registrationId : null);
    const deviceFingerprint = data.deviceFingerprint || (data.auth ? data.auth.deviceFingerprint : null);

    // --- معالجة إضافة البيانات (للتقارير) ---
    if (action === "appendToSheet") {
      // Security Check for Reports
      if (data.range.startsWith("التقارير") || data.range.startsWith("Reports")) {
         if (!registrationId || !deviceFingerprint) {
             logError("Security Block", "Attempt to write report without auth credentials");
             return output.setContent(JSON.stringify({ success: false, error: "Missing authentication credentials" }));
         }
         const security = validateDevice(registrationId, deviceFingerprint);
         if (!security.valid) {
             return output.setContent(JSON.stringify({ success: false, error: security.error }));
         }
      }

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
    } 
    
    // --- معالجة بيانات المعلمين ---
    else if (action === "getTeacherByRegistrationId") {
      return ContentService.createTextOutput(
        JSON.stringify(getTeacherByRegistrationId(data.registrationId))
      ).setMimeType(ContentService.MimeType.JSON);
    }

    else if (action === "updateTeacherData") {
      return ContentService.createTextOutput(
        JSON.stringify(updateTeacherData(data.registrationId, data.updates, deviceFingerprint))
      ).setMimeType(ContentService.MimeType.JSON);
    }

    else if (action === "linkTeacherEmail") {
      return ContentService.createTextOutput(
        JSON.stringify(
          linkTeacherEmail(
            data.registrationId,
            data.email,
            data.deviceFingerprint
          )
        )
      ).setMimeType(ContentService.MimeType.JSON);
    }

    else if (action === "updateDeviceFingerprint") {
      return ContentService.createTextOutput(
        JSON.stringify(
          updateDeviceFingerprint(data.registrationId, data.deviceFingerprint)
        )
      ).setMimeType(ContentService.MimeType.JSON);
    }

    else {
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
