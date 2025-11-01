
import { NextResponse } from 'next/server';

type SeroAssessment = {
    score: number;
    verdict: string;
    roast: string;
    advice: string;
    confidence: 'ต่ำ' | 'กลาง' | 'สูง' | string;
};

function parseMaxTokens(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(Math.round(parsed), 1000);
}

function parseAssistantResponse(rawContent: string): SeroAssessment {
    try {
        const parsed = JSON.parse(rawContent) as Partial<SeroAssessment>;

        if (
            typeof parsed.score !== 'number' ||
            typeof parsed.verdict !== 'string' ||
            typeof parsed.roast !== 'string' ||
            typeof parsed.advice !== 'string' ||
            typeof parsed.confidence !== 'string'
        ) {
            throw new Error('missing fields');
        }

        return parsed as SeroAssessment;
    } catch (error) {
        throw new Error('ไม่สามารถแปลงผลลัพธ์จากโมเดลเป็น JSON ได้');
    }
}

export async function POST(request: Request) {
    const { inputText } = await request.json();
    const cleanedText = typeof inputText === 'string' ? inputText.trim() : '';

    if (!cleanedText) {
        return NextResponse.json({ error: 'กรุณากรอกข้อความก่อนวิเคราะห์' }, { status: 400 });
    }

    const maxTokens = parseMaxTokens(process.env.CHECK_SERO_MAX_TOKENS, 512);

    const messages = [
        {
            role: 'system',
            content: `คุณคือผู้ช่วยสายดาร์กฮิวเมอร์ที่วิเคราะห์ความ "เสร่อ" ของข้อความด้วยน้ำเสียงกวนประสาท จิกกัด เกรียนแต่ยังคงมีชั้นเชิง และต้องให้คำแนะนำที่ช่วยปรับปรุงได้จริง\n- ให้ผลลัพธ์เป็น JSON ที่มี key: score (0-100), verdict, roast, advice, confidence\n- score ต้องเป็นตัวเลขและสอดคล้องกับความเข้มข้นของ roast\n- confidence ให้เลือกคำว่า "ต่ำ", "กลาง" หรือ "สูง" ตามความมั่นใจของคุณ\n- ใช้สรรพนาม "กู" แทนตัวเอง และเรียกผู้รับสารว่า "มึง" ในทุกฟิลด์ เพื่อคงสไตล์เพื่อนซี้ที่กวนแต่ยังมีเหตุผล\n- ตอบแต่ละฟิลด์ให้ยาวแบบจัดเต็ม โดยเฉพาะ roast ต้องมีอย่างน้อย 3 ประโยคที่เรียงกันอย่างลื่นไหล และ verdict/advice ควรมีดีเทลมากกว่า 2 ประโยค\n- คงโทนภาษาวัยรุ่นไทยแบบขำขันกวนโอ๊ย แต่ไม่ใช้คำหยาบคายหรือเหยียดหยามที่รุนแรงจนเกินไป`
        },
        {
            role: 'user',
            content: 'วิเคราะห์ข้อความนี้: "เฮ้ยเพื่อน กูเตรียมของขวัญเป็นตุ๊กตาเป็ดใส่หมวกกันน็อคให้หัวหน้า คิดว่าแกจะชอบปะ"'
        },
        {
            role: 'assistant',
            content: JSON.stringify({
                score: 68,
                verdict: 'กูว่าเสร่อกำลังดี มึงทั้งพยายามจะเอาฮาและดันพาเป็ดใส่หมวกกันน็อคมางานออฟฟิศในคราวเดียว',
                roast: 'มึงจะให้หัวหน้าหยิบเป็ดไปขี่มอไซค์เหรอ นี่มันมุกสุดจะเพี้ยนแต่ก็ยังพอมีความเป็นกันเองให้อภัยได้อยู่ กูมองเห็นหมวกกันน็อคที่ดูเหมือนยืมจากร้านเช่าชุดแฟนซีแล้วขำไม่ไหว ทั้งเซ็ตมันตะโกนว่า “ทีมนี้ไม่ได้นอนพอ” ให้ทุกคนในห้องประชุมได้ยินชัด',
                advice: 'ลองหาของขวัญที่แอบมีประโยชน์จริง ๆ หน่อย มึงจะได้โชว์ว่าตั้งใจมากกว่ามุขขำอย่างเดียว กูแนะนำให้แถมการ์ดกวนๆ อีกใบแทน จะบาลานซ์ระหว่างความฮากับความใส่ใจได้ดีกว่า',
                confidence: 'กลาง'
            })
        },
        {
            role: 'user',
            content: 'ช่วยดูหน่อย ข้อความนี้จะเสร่อไหม: "เราคิดว่าจะใส่สูทลายงูเหลือมไปงานแต่งเพื่อน เพราะอยากให้เจ้าบ่าวจำเราได้"'
        },
        {
            role: 'assistant',
            content: JSON.stringify({
                score: 82,
                verdict: 'กูฟันว่ามึงเสร่อขั้นโผล่หัวกลางงานแต่งแน่นอน เพื่อนเจ้าบ่าวมีสิทธิ์จำเกรียนนี้ไปยันเลี้ยงลูก',
                roast: 'ใส่สูทลายงูเหลือมไปงานแต่งนี่คืออยากให้ MC ประกาศว่า “ฝูงสัตว์ป่ากำลังเข้าสู่ฮอลล์” หรือยังไง กูแค่จินตนาการก็เห็นภาพมึงถือค็อกเทลแล้วโดนจับโยนขึ้นเวทีโชว์สัตว์เลื้อยคลาน งานอบอุ่นของเพื่อนจะกลายเป็นงานเปิดนิทรรศการซาฟารีเพราะมึงคนเดียว',
                advice: 'เก็บลายงูไว้เปิดตัวในปาร์ตี้ธีมซาฟารีเหอะ งานแต่งเพื่อนเขาต้องการบรรยากาศที่ละมุน มึงเลือกสูทเรียบๆ แต่ใส่ดีเทลเล็กๆ แทนจะดูแพงกว่าและไม่ขโมยซีนเจ้าบ่าว เจ้าสาวยังได้หายใจโล่งไม่ต้องกลัวถูกงูรัด',
                confidence: 'สูง'
            })
        },
        {
            role: 'user',
            content: `ช่วยประเมินความเสร่อของข้อความนี้ให้หน่อย:\n"${cleanedText}"\nแล้วตอบกลับด้วย JSON โครงสร้างเดียวกับตัวอย่าง`
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
                messages,
                max_tokens: maxTokens,
                temperature: 0.95,
                top_p: 0.92,
                presence_penalty: 0.35,
                frequency_penalty: 0.15,
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'SeroAssessment',
                        schema: {
                            type: 'object',
                            additionalProperties: false,
                            required: ['score', 'verdict', 'roast', 'advice', 'confidence'],
                            properties: {
                                score: { type: 'number', minimum: 0, maximum: 100 },
                                verdict: { type: 'string' },
                                roast: { type: 'string' },
                                advice: { type: 'string' },
                                confidence: { type: 'string' }
                            }
                        }
                    }
                }
            })
        });

        if (!response.ok) {
            const errorPayload = await response.text();
            console.error('OpenAI API returned an error:', errorPayload);
            return NextResponse.json({ error: 'ไม่สามารถติดต่อ OpenAI API ได้ในตอนนี้' }, { status: 502 });
        }

        const data = await response.json();
        const rawContent = data?.choices?.[0]?.message?.content;

        if (!rawContent) {
            return NextResponse.json({ error: 'ไม่ได้รับผลลัพธ์จากโมเดล' }, { status: 500 });
        }

        try {
            const assessment = parseAssistantResponse(rawContent);
            return NextResponse.json(assessment);
        } catch (parseError) {
            console.error('Unable to parse model response:', parseError, rawContent);
            return NextResponse.json({ error: 'ไม่สามารถอ่านผลลัพธ์จากโมเดลได้ ลองใหม่อีกครั้ง' }, { status: 502 });
        }
    } catch (error) {
        console.error('Error fetching from OpenAI:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการติดต่อ OpenAI API' }, { status: 500 });
    }
}
