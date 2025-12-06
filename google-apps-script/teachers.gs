/**
 * Teachers Management Functions & Reports Handler
 *
 * Add these functions to your existing Google Apps Script project
 */

const TEACHERS_SHEET_NAME = "المعلمون";

/**
 * Log error to the Errors sheet
 */
function logError(context, errorMessage) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("الأخطاء");

    if (!sheet) {
      sheet = ss.insertSheet("الأخطاء");
      sheet
        .getRange(1, 1, 1, 3)
        .setValues([["الطابع الزمني", "السياق", "الخطأ"]]);
    }

    sheet.appendRow([new Date().toISOString(), context, errorMessage]);
  } catch (e) {
    console.error("Failed to log error:", e);
  }
}

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
 * Validate device fingerprint (Supports Multi-Device)
 */
function validateDevice(registrationId, deviceFingerprint) {
  const result = getTeacherByRegistrationId(registrationId);

  if (!result.success) {
    logError("Security Check", `Teacher not found: ${registrationId}`);
    return { valid: false, error: "Teacher not found" };
  }

  const storedValue = result.teacher.deviceFingerprint || "";

  // Allow if no fingerprint is stored (First use)
  if (!storedValue) {
    return { valid: true }; // Will be saved on next update
  }

  // Split stored fingerprints by comma to support multiple devices
  // Clean up whitespace just in case
  const storedFingerprints = storedValue.split(",").map((f) => f.trim());

  // Check if current device is in the list
  if (storedFingerprints.includes(deviceFingerprint)) {
    return { valid: true };
  }

  // Security violation
  logError(
    "Security Violation",
    `Device mismatch for ${registrationId}. Stored: [${storedValue}], Provided: ${deviceFingerprint}`
  );
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
 * Update device fingerprint - Secured with Multi-Device Support
 * Adds new device to the list (Max 3 devices)
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
      const currentStored = ((data[i][deviceCol] || "") + "").toString();
      let newStoredValue = currentStored;

      // Split existing to array
      let devices = currentStored
        ? currentStored.split(",").map((s) => s.trim())
        : [];

      // If device already exists, success (nothing to do)
      if (devices.includes(deviceFingerprint)) {
        return { success: true };
      }

      // Add new device
      devices.push(deviceFingerprint);

      // Limit to 3 devices (FIFO - First In First Out if needed, or strict limit)
      // Here: Strict limit. If > 3, we can remove oldest or Refuse.
      // Let's implement FIFO (Remove the first one) to stay user friendly but secure against spam
      if (devices.length > 3) {
        devices.shift(); // Remove the oldest device
      }

      newStoredValue = devices.join(",");

      sheet.getRange(i + 1, deviceCol + 1).setValue(newStoredValue);
      return { success: true };
    }
  }

  return { success: false, error: "Teacher not found" };
}

/**
 * Link teacher email and device
 * This is the "Bootstrapping" function - allows setting email for the first time
 */
function linkTeacherEmail(registrationId, email, deviceFingerprint) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TEACHERS_SHEET_NAME);

  if (!sheet) {
    return { success: false, error: "Teachers sheet not found" };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idCol = headers.indexOf("رقم التسجيل");
  const emailCol = headers.indexOf("البريد الإلكتروني");
  const deviceCol = headers.indexOf("بصمة الجهاز");
  const linkDateCol = headers.indexOf("تاريخ الربط");
  // Check if email is already used by ANY other teacher (Global Uniqueness)
  for (let j = 1; j < data.length; j++) {
      // Skip the current teacher's row if found (we handle their row later)
      // But actually, we just want to ensure this email isn't used by a DIFFERENT ID
      if (data[j][emailCol] == email && data[j][idCol] != registrationId) {
          return {
              success: false,
              error: "This email is already registered to another teacher."
          };
      }
  }

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == registrationId) {
      // Check if already linked to a DIFFERENT email
      if (data[i][emailCol] && data[i][emailCol] !== email) {
        return {
          success: false,
          error: "Teacher already linked to another email",
        };
      }

      // Update Email
      sheet.getRange(i + 1, emailCol + 1).setValue(email);

      // Update Device Fingerprint (Append if multiple, or set if first)
      // For bootstrapping, we add this device as trusted
      const currentDevices = data[i][deviceCol]
        ? data[i][deviceCol].toString().split(",")
        : [];
      if (!currentDevices.includes(deviceFingerprint)) {
        if (currentDevices.length >= 3) currentDevices.shift(); // FIFO
        currentDevices.push(deviceFingerprint);
        sheet.getRange(i + 1, deviceCol + 1).setValue(currentDevices.join(","));
      }

      // Update Link Date
      sheet.getRange(i + 1, linkDateCol + 1).setValue(new Date().toISOString());

      // Enforce email requirement from now on
      sheet.getRange(i + 1, emailRequiredCol + 1).setValue("نعم");

      return { success: true };
    }
  }

  return { success: false, error: "Teacher not found" };
}

/**
 * Reset device fingerprints - Keeps only the provided one (Kill Switch)
 */
function resetDeviceFingerprints(registrationId, currentFingerprint) {
  // Security Check: Must validate that the request comes from a valid device first
  const security = validateDevice(registrationId, currentFingerprint);
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

  const idCol = headers.indexOf("رقم التسجيل");
  const deviceCol = headers.indexOf("بصمة الجهاز");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == registrationId) {
      // Overwrite with ONLY the current fingerprint, removing all others
      sheet.getRange(i + 1, deviceCol + 1).setValue(currentFingerprint);
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
    const registrationId =
      data.registrationId || (data.auth ? data.auth.registrationId : null);
    const deviceFingerprint =
      data.deviceFingerprint ||
      (data.auth ? data.auth.deviceFingerprint : null);

    // --- معالجة إضافة البيانات (للتقارير) ---
    if (action === "appendToSheet") {
      // Security Check for Reports
      if (
        data.range.startsWith("التقارير") ||
        data.range.startsWith("Reports")
      ) {
        if (!registrationId || !deviceFingerprint) {
          logError(
            "Security Block",
            "Attempt to write report without auth credentials"
          );
          return output.setContent(
            JSON.stringify({
              success: false,
              error: "Missing authentication credentials",
            })
          );
        }
        const security = validateDevice(registrationId, deviceFingerprint);
        if (!security.valid) {
          return output.setContent(
            JSON.stringify({ success: false, error: security.error })
          );
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

    }

    // --- جلب تقارير المعلم (للمزامنة العكسية) ---
    else if (action === "getReports") {
        if (!registrationId || !deviceFingerprint) {
             return output.setContent(JSON.stringify({ success: false, error: "Missing Auth" }));
        }
        
        const security = validateDevice(registrationId, deviceFingerprint);
        if (!security.valid) {
             return output.setContent(JSON.stringify({ success: false, error: security.error }));
        }

        const sheetName = "التقارير";
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
             return output.setContent(JSON.stringify({ success: true, reports: [] }));
        }

        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) { // Only headers
             return output.setContent(JSON.stringify({ success: true, reports: [] }));
        }

        // Header mapping (Assuming standard order or dynamic lookup)
        const headers = data[0];
        const idCol = headers.indexOf("رقم التسجيل"); // Ensure this matches exactly "رقم التسجيل"

        if (idCol === -1) {
            return output.setContent(JSON.stringify({ success: false, error: "Invalid sheet structure" }));
        }

        // Filter reports for this teacher
        // We map rows back to Report Data structure
        const myReports = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[idCol] == registrationId) {
                // Construct Report Object (Reversing saveReport logic)
                try {
                    // Safe access helper
                    const get = (idx) => (row[idx] != null ? String(row[idx]) : "");
                    
                    // Simple reconstruction - Client might need to type cast properly
                    // Indices based on saveReport: 
                    // 0:Time, 1:ID, 2:Name, 3:School, 4:Level, 5:Section, 6:Date, 7:Quran, 
                    // 8:Sub1, 9:Gen1, 10:Less1, 11:Strat1, 12:Tools1, 13:Task1, 
                    // 14:Has2, 15:Sub2, 16:Gen2, 17:Less2, 18:Strat2, 19:Tools2, 20:Task2, 21:Notes
                    
                    const report = {
                        uid: get(0) + "-" + get(1), // Fake UID using Timestamp+ID if not stored
                        general: {
                            id: get(1),
                            name: get(2),
                            school: get(3),
                            level: get(4),
                            sectionId: get(5),
                            date: get(6).split("T")[0] // Ensure date format
                        },
                        quranReport: get(7),
                        firstClass: {
                            subject: get(8),
                            gender: get(9),
                            lesson: get(10),
                            strategies: get(11) ? get(11).split("، ") : [],
                            tools: get(12) ? get(12).split("، ") : [],
                            tasks: get(13) ? get(13).split("، ") : []
                        },
                        hasSecondClass: get(14) === 'نعم',
                        secondClass: {
                            subject: get(15),
                            gender: get(16),
                            lesson: get(17),
                            strategies: get(18) ? get(18).split("، ") : [],
                            tools: get(19) ? get(19).split("، ") : [],
                            tasks: get(20) ? get(20).split("، ") : []
                        },
                        notes: get(21),
                        savedAt: new Date(get(0)).getTime()
                    };
                    myReports.push(report);
                } catch (err) {
                    console.error("Error parsing row " + i, err);
                }
            }
        }
        
        return output.setContent(JSON.stringify({ success: true, reports: myReports }));
    }

    // --- معالجة بيانات المعلمين ---
    else if (action === "getTeacherByRegistrationId") {
      return ContentService.createTextOutput(
        JSON.stringify(getTeacherByRegistrationId(data.registrationId))
      ).setMimeType(ContentService.MimeType.JSON);
    } else if (action === "updateTeacherData") {
      return ContentService.createTextOutput(
        JSON.stringify(
          updateTeacherData(
            data.registrationId,
            data.updates,
            deviceFingerprint
          )
        )
      ).setMimeType(ContentService.MimeType.JSON);
    } else if (action === "linkTeacherEmail") {
      return ContentService.createTextOutput(
        JSON.stringify(
          linkTeacherEmail(
            data.registrationId,
            data.email,
            data.deviceFingerprint
          )
        )
      ).setMimeType(ContentService.MimeType.JSON);
    } else if (action === "updateDeviceFingerprint") {
      return ContentService.createTextOutput(
        JSON.stringify(
          updateDeviceFingerprint(data.registrationId, data.deviceFingerprint)
        )
      ).setMimeType(ContentService.MimeType.JSON);
    } else if (action === "resetDeviceFingerprints") {
      return ContentService.createTextOutput(
        JSON.stringify(
          resetDeviceFingerprints(data.registrationId, data.deviceFingerprint)
        )
      ).setMimeType(ContentService.MimeType.JSON);
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
