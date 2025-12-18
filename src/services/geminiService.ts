
import { GoogleGenAI } from "@google/genai";
import { Invoice } from "../types";

export const generateInvoiceNote = async (invoice: Invoice, doctor: string, audiologist: string): Promise<string> => {
  try {
    // Initialize inside the function as per best practices for runtime key access
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are an expert Inventory Manager for a Hearing Aid Clinic.
        Analyze the provided inventory list and provide 3-5 strategic, actionable insights.
        
        Focus on:
        1. **Stock Levels**: Identify critical low stock for popular models.
        2. **Value Distribution**: Are we overstocked on expensive items?
        3. **Location Balance**: Is stock distributed evenly across locations?
        4. **Brand Mix**: Any over-reliance on a single brand?
        
        Format the output as a concise list of bullet points.
        
        Current Inventory Data:
        ${inventoryText}
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      return response.text || "No insights available.";
  } catch (e) {
      console.error(e);
      return "Could not analyze stock trends at this time.";
  }
}
