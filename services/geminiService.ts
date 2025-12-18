import { GoogleGenAI } from "@google/genai";
import { Invoice } from "../types";

// FIX: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY}); as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateInvoiceNote = async (invoice: Invoice, doctor: string, audiologist: string): Promise<string> => {
  try {
    // FIX: Use gemini-3-flash-preview for text tasks
    const model = 'gemini-3-flash-preview';
    const itemsList = invoice.items.map(i => `${i.brand} ${i.model}`).join(', ');
    const warrantyInfo = invoice.warranty || "Standard 1 Year Warranty";
    
    const prompt = `
      You are a professional medical assistant at BRG Hearing Clinic.
      Write a polite, professional, and warm invoice note/summary for a patient.
      
      Details:
      Patient Name: ${invoice.patientName}
      Items Purchased: ${itemsList}
      Total Amount: ₹${invoice.finalTotal}
      Referred By: ${doctor}
      Audiologist: ${audiologist}
      Warranty: ${warrantyInfo}
      
      The note should thank them for choosing us, mention the warranty (${warrantyInfo}), and suggest a follow-up visit in 7 days.
      Keep it under 100 words.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Thank you for your business.";
  } catch (error) {
    console.error("Error generating note:", error);
    return "Thank you for your purchase. Please visit us again.";
  }
};

export const analyzeStockTrends = async (inventoryText: string): Promise<string> => {
  try {
      const prompt = `
        Analyze this hearing aid inventory data and give 3 short, bulleted strategic insights about stock levels, brand distribution, or sales potential.
        Data: ${inventoryText}
      `;
      
      const response = await ai.models.generateContent({
        // FIX: Use gemini-3-flash-preview for text tasks
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      return response.text || "No insights available.";
  } catch (e) {
      console.error(e);
      return "Could not analyze stock.";
  }
}