
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { inputText } = await request.json();

    const messages = [
        {
            role: 'system',
            content: 'คุณคือผู้ช่วยที่สนุกสนานและกวนๆ ที่จะประเมินความ "เสร่อ" ของข้อความและให้คะแนนพร้อมคำแนะนำในรูปแบบที่ขำๆ'
        },
        {
            role: 'user',
            content: `วิเคราะห์ความเสร่อของข้อความต่อไปนี้: "${inputText}" 
                      ให้คะแนนจาก 0-100 พร้อมคำอธิบายที่กวนๆ และพูดจาแรงๆ
                     และใช้คำพูดแบบเป็นกันเอง มึงกู ใช้คำพูดแบบวัยรุ่น`
        }
    ];

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.API_OPENAI_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messages,
                max_tokens: 150
            })
        });

        const data = await response.json();


        return NextResponse.json(data.choices[0].message.content);

    } catch (error) {
        console.error('Error fetching from OpenAI:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการติดต่อ OpenAI API' }, { status: 500 });
    }
}
