const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const suggestGoal = async ({ roughIdea, department, thrustArea }) => {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are an HR performance management expert. 
Your job is to help employees write well-structured, 
measurable professional goals for their annual performance cycle. 
Always respond with valid JSON only. 
No markdown, no backticks, no code blocks, no extra text. 
Just raw JSON.`
        },
        {
          role: 'user',
          content: `An employee from the ${department} department 
wants to set a goal around: '${roughIdea}'
Thrust Area: ${thrustArea}

Generate a structured goal with:
- title: clear, action-oriented goal title (max 10 words)
- description: detailed description of what success looks like (2-3 sentences)
- uomType: one of 'min', 'max', 'timeline', 'zero'
- uomReason: one sentence explaining why this UoM type fits
- suggestedTarget: a realistic numeric target (null if zero type)
- targetUnit: unit of the target (e.g. Lakhs, %, Days, Count)
- weightageSuggestion: number between 10 and 40
- tips: array of exactly 3 short tips

Respond with raw JSON only. No markdown. No backticks. No explanation.`
        }
      ]
    });

    const rawText = response.choices[0]?.message?.content || '';

    // Strip markdown code blocks if Groq adds them
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return parsed;

  } catch (err) {
    console.error('Groq suggestion failed:', err.message);
    return null;
  }
};

module.exports = { suggestGoal };