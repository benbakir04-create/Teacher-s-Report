import { GoogleGenAI } from "@google/genai";
import { ReportData } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateReportSummary = async (report: ReportData): Promise<string> => {
  const prompt = `
    بصفتك مشرفًا تربويًا خبيرًا، قم بتحليل تقرير المعلم التالي وقدم ملخصًا احترافيًا وملاحظات بناءة باللغة العربية.
    
    بيانات المعلم:
    الاسم: ${report.general.name}
    المدرسة: ${report.general.school}
    المستوى: ${report.general.level}
    
    الحصة الأولى:
    المادة: ${report.firstClass.subject}
    الدرس: ${report.firstClass.lesson}
    الاستراتيجيات: ${report.firstClass.strategies.join(', ')}
    الوسائل: ${report.firstClass.tools.join(', ')}
    
    الحصة الثانية (إن وجدت):
    ${report.hasSecondClass ? `المادة: ${report.secondClass.subject}, الدرس: ${report.secondClass.lesson}` : 'لا يوجد'}
    
    تقرير القرآن: ${report.quranReport}
    ملاحظات عامة: ${report.notes}
    
    المطلوب:
    1. ملخص سريع للإنجاز اليومي.
    2. نقطة قوة في اختيار الاستراتيجيات.
    3. اقتراح واحد للتحسين.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "لم يتم إنشاء ملخص.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
  }
};