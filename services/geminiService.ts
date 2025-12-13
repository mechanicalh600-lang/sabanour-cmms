
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedTask } from "../types";
import { STATIC_CHECKLISTS } from "../data/JobcardActivity";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateChecklistForEquipment = async (equipmentName: string, activityName?: string, activityCode?: string): Promise<GeneratedTask[]> => {
  // 1. First Priority: Check if a static checklist exists for this activity code
  if (activityCode && STATIC_CHECKLISTS[activityCode]) {
      console.log(`Using static checklist for ${activityCode}`);
      return STATIC_CHECKLISTS[activityCode];
  }

  // 2. Second Priority: Use AI to generate
  const ai = getGeminiClient();
  if (!ai) {
      return getFallbackChecklist();
  }

  const context = activityName 
    ? `Task: ${activityName} for ${equipmentName}`
    : `Maintenance Checklist for ${equipmentName}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a professional technical checklist for: "${context}".
      
      If the task is "Inspection", focus on visual checks, wear and tear, and safety.
      If the task is "Lubrication", focus on grease points, oil levels, and leak checks.
      If the task is "Thermography", focus on hotspots, connections, and temperature readings.
      If the task is "Preventive Maintenance (PM)", include tightening, cleaning, and parts replacement checks.

      Keep descriptions concise, technical, and in Persian (Farsi).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              task: {
                type: Type.STRING,
                description: "The main action title of the checklist item in Persian",
              },
              description: {
                type: Type.STRING,
                description: "A brief instruction on what to check in Persian",
              },
            },
            required: ["task", "description"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return getFallbackChecklist();
    
    return JSON.parse(text) as GeneratedTask[];
  } catch (error) {
    console.error("Error generating checklist:", error);
    return getFallbackChecklist();
  }
};

const getFallbackChecklist = (): GeneratedTask[] => {
    return [
      { task: "بازرسی نشتی روغن و گریس", description: "بررسی کلیه اتصالات و درپوش‌ها جهت اطمینان از عدم نشتی" },
      { task: "بررسی صدا و لرزش غیرعادی", description: "گوش دادن به صدای تجهیز و بررسی لرزش‌های غیرمعمول در حین کار" },
      { task: "کنترل دمای بیرینگ‌ها و بدنه", description: "لمس یا استفاده از ترمومتر برای اطمینان از عدم داغ شدن بیش از حد" },
      { task: "بررسی وضعیت پیچ و مهره‌ها", description: "اطمینان از محکم بودن اتصالات و پیچ‌های فونداسیون" },
      { task: "نظافت عمومی تجهیز", description: "تمیز کردن گرد و غبار و مواد زائد از روی بدنه و محیط پیرامون" },
      { task: "بررسی ایمنی و حفاظ‌ها", description: "اطمینان از نصب صحیح گاردها و علائم هشدار دهنده" }
    ];
};

export const analyzeInspectionReport = async (form: any): Promise<string> => {
    const ai = getGeminiClient();
    if (!ai) return "تحلیل هوشمند در دسترس نیست (API Key تنظیم نشده است).";

    try {
        const failedItems = form.items.filter((i: any) => i.status === 'FAIL');
        const passItems = form.items.filter((i: any) => i.status === 'PASS');
        
        const prompt = `
        You are a CMMS Maintenance Manager. Analyze this inspection report.
        Equipment: ${form.equipmentName}
        Activity: ${form.activityName || 'General Inspection'}
        
        Summary:
        - Passed Checks: ${passItems.length}
        - Failed Checks: ${failedItems.length}
        
        Details of Failures:
        ${JSON.stringify(failedItems.map((f: any) => ({ task: f.task, comment: f.comment })))}
        
        Provide a short, 2-sentence summary in Persian (Farsi) regarding the equipment status and any urgent recommendations.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "گزارش با موفقیت ثبت شد.";
    } catch (e) {
        return "گزارش ثبت شد.";
    }
}
