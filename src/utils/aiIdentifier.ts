import { ProblemAnalysis } from '../types/problem';
import { identifyProblem } from './problemIdentifier';
import { SupportedLanguage } from '../types/trace';

export async function identifyProblemWithAI(
  code: string,
  language: SupportedLanguage,
  apiKey?: string
): Promise<ProblemAnalysis> {
  // Always compute local heuristic first as ground truth / instant result
  const localResult = identifyProblem(code, language);

  if (!apiKey || apiKey.trim().length === 0) {
    return localResult;
  }

  const cleanKey = apiKey.trim();

  // 1. Try Gemini API if key starts with AIzaSy
  if (cleanKey.startsWith('AIzaSy') || cleanKey.length === 39) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this ${language} code and identify what algorithm or LeetCode problem it solves. Output strictly a JSON object with keys:
"problemName" (string),
"description" (one sentence string),
"technique" (string),
"timeComplexity" (string, e.g. "O(N)"),
"spaceComplexity" (string, e.g. "O(1)"),
"confidence" ("high" | "medium" | "low").

Code:
\`\`\`${language}
${code}
\`\`\``
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          return {
            ...localResult,
            problemName: parsed.problemName || localResult.problemName,
            description: parsed.description || localResult.description,
            technique: parsed.technique || localResult.technique,
            timeComplexity: parsed.timeComplexity || localResult.timeComplexity,
            spaceComplexity: parsed.spaceComplexity || localResult.spaceComplexity,
            confidence: parsed.confidence || 'high',
            source: 'ai_gemini'
          };
        }
      }
    } catch (e) {
      console.warn('Gemini AI identification fallback to local:', e);
    }
  }

  // 2. Try OpenAI API if key starts with sk-
  if (cleanKey.startsWith('sk-')) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an algorithmic code analyzer. Return valid JSON only with keys: problemName, description, technique, timeComplexity, spaceComplexity, confidence ("high"|"medium"|"low").'
            },
            {
              role: 'user',
              content: `Analyze this ${language} code:\n\n${code}`
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            ...localResult,
            problemName: parsed.problemName || localResult.problemName,
            description: parsed.description || localResult.description,
            technique: parsed.technique || localResult.technique,
            timeComplexity: parsed.timeComplexity || localResult.timeComplexity,
            spaceComplexity: parsed.spaceComplexity || localResult.spaceComplexity,
            confidence: parsed.confidence || 'high',
            source: 'ai_openai'
          };
        }
      }
    } catch (e) {
      console.warn('OpenAI identification fallback to local:', e);
    }
  }

  return localResult;
}

