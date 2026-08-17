import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

const AADHAR_REGEX = /^\d{4}\s*\d{4}\s*\d{4}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { verified: false, error: 'No image provided. Please upload an Aadhar card image.' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const prompt = `This is an Indian Aadhar card. Extract the following details precisely:
1. Aadhar Number (12 digits, may have spaces)
2. Full Name of the card holder
3. Date of Birth (DD/MM/YYYY format)
4. Gender (Male/Female)
5. Address (complete address as printed)

IMPORTANT: Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "aadharNumber": "",
  "name": "",
  "dob": "",
  "gender": "",
  "address": ""
}

If you cannot clearly read any field, leave it as empty string. If this is NOT an Aadhar card, return:
{"error": "Not a valid Aadhar card"}`

    const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const content = response.choices[0]?.message?.content || ''

    // Try to parse JSON from the response
    let parsed: any = {}
    try {
      // Extract JSON from possible markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
    } catch {
      return NextResponse.json({
        verified: false,
        error: 'Could not parse Aadhar card details. Please ensure the image is clear.',
        rawResponse: content,
      })
    }

    if (parsed.error) {
      return NextResponse.json({
        verified: false,
        error: parsed.error,
      })
    }

    // Validate Aadhar number format
    let aadharNumber = ''
    if (parsed.aadharNumber) {
      aadharNumber = parsed.aadharNumber.replace(/\s/g, '')
      if (!/^\d{12}$/.test(aadharNumber)) {
        aadharNumber = ''
      }
    }

    const isValid = !!(aadharNumber && parsed.name)

    return NextResponse.json({
      verified: isValid,
      aadharNumber: aadharNumber || parsed.aadharNumber || undefined,
      name: parsed.name || undefined,
      dob: parsed.dob || undefined,
      gender: parsed.gender || undefined,
      address: parsed.address || undefined,
    })
  } catch (error: any) {
    console.error('Aadhar verification error:', error)
    return NextResponse.json({
      verified: false,
      error: error.message || 'Aadhar verification failed. Please try again.',
    }, { status: 500 })
  }
}
