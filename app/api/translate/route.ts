// app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(request: NextRequest) {
    try {
        const { text, targetLanguage = 'English' } = await request.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { error: 'GROQ_API_KEY not configured' },
                { status: 500 }
            );
        }

        // If text is too short, skip translation
        if (text.trim().length < 10) {
            return NextResponse.json({
                original: text,
                translated: text,
                detectedLanguage: 'unknown',
                wasTranslated: false,
            });
        }

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator. Detect the language of the given text. 
If the text is already in ${targetLanguage}, return it unchanged. 
If it's in another language, translate it to ${targetLanguage} while preserving the original formatting, line breaks, and meaning.
Respond ONLY in this exact JSON format with no additional text:
{"detectedLanguage": "language name", "translated": "translated text here", "wasTranslated": true/false}`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000,
                response_format: { type: 'json_object' }
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Groq API error:', error);
            return NextResponse.json(
                { error: 'Translation service unavailable' },
                { status: 502 }
            );
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            // If JSON parsing fails, return original text
            return NextResponse.json({
                original: text,
                translated: text,
                detectedLanguage: 'unknown',
                wasTranslated: false,
            });
        }

        return NextResponse.json({
            original: text,
            translated: parsed.translated || text,
            detectedLanguage: parsed.detectedLanguage || 'unknown',
            wasTranslated: parsed.wasTranslated || false,
        });
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: 'Translation failed' },
            { status: 500 }
        );
    }
}