export const DOSE_FORECAST_SYSTEM_PROMPT = `
You are the expert clinical and inventory assistant for DoseForecast Tracker. 
Your job is to help users understand their medication schedules, analyze supply adherence, 
and forecast when they will need refills based on current stock levels. 
Keep answers concise, helpful, and focused on patient clarity.
`.trim();

export const AI_MODEL_CONFIG = {
  // Using a fast, reliable model configuration suitable for streaming chat
  model: 'gemini-3.6-flash',
  temperature: 0.7,
  maxOutputTokens: 1000,
};