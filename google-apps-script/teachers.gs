/**
 * Teachers Management Functions
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
 * Update teacher data (school, level, section)
 */
function updateTeacherData(registrationId, updates) {
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
 * Link teacher email
 */
function linkTeacherEmail(registrationId, email, deviceFingerprint) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TEACHERS_SHEET_NAME);

  if (!sheet) {
    return { success: false, error: "Teachers sheet not found" };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const idCol = headers.indexOf("رقم التسجيل");
  const emailCol = headers.indexOf("البريد الإلكتروني");
  const deviceCol = headers.indexOf("بصمة الجهاز");
  const linkDateCol = headers.indexOf("تاريخ الربط");
  const firstUseCol = headers.indexOf("تاريخ أول استخدام");

  // Find and update teacher row
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == registrationId) {
      sheet.getRange(i + 1, emailCol + 1).setValue(email);
      sheet.getRange(i + 1, deviceCol + 1).setValue(deviceFingerprint);
      sheet.getRange(i + 1, linkDateCol + 1).setValue(new Date().toISOString());

      // Set first use date if not set
      if (!data[i][firstUseCol]) {
        sheet
          .getRange(i + 1, firstUseCol + 1)
          .setValue(new Date().toISOString());
      }

      return { success: true };
    }
  }

  return { success: false, error: "Teacher not found" };
}

/**
 * Update device fingerprint
 */
function updateDeviceFingerprint(registrationId, deviceFingerprint) {
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
 * Update existing doPost to handle new actions
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Existing actions...
    if (data.action === "appendToSheet") {
      // ... existing code
    }

    // New teacher actions
    if (data.action === "getTeacherByRegistrationId") {
      return ContentService.createTextOutput(
        JSON.stringify(getTeacherByRegistrationId(data.registrationId))
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "updateTeacherData") {
      return ContentService.createTextOutput(
        JSON.stringify(updateTeacherData(data.registrationId, data.updates))
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "linkTeacherEmail") {
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

    if (data.action === "updateDeviceFingerprint") {
      return ContentService.createTextOutput(
        JSON.stringify(
          updateDeviceFingerprint(data.registrationId, data.deviceFingerprint)
        )
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: "Unknown action" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
