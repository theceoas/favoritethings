import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Professional prompt for bedding product images
const BEDDING_PRODUCT_PROMPT = `Generate a high-resolution website-ready product image for a bedding business. Use the exact same design, color, and fabric details as the reference image — do not alter or stylize the bedding in any way.

The final image should look realistic and professional, not artistic or AI-stylized.

Zoom out to show the full bed, making the bed and bedding the central and dominant focus of the frame. Use soft studio lighting with a clean, neutral background to highlight the bedding's texture and quality.

This image must be suitable for use on an e-commerce product page — clean, minimal, and commercial in presentation.`

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get image index and custom prompt
    const imageIndex = request.headers.get('X-Image-Index') || '1'
    const customPrompt = decodeURIComponent(request.headers.get('X-Custom-Prompt') || '')

    // Get the form data
    const requestFormData = await request.formData()
    const imageFile = requestFormData.get('image') as File

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    console.log(`📁 Received file: ${imageFile.name}, type: ${imageFile.type}, size: ${imageFile.size} bytes`)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(imageFile.type)) {
      console.error(`❌ Unsupported file type: ${imageFile.type}`)
      return NextResponse.json(
        { error: `Unsupported image format: ${imageFile.type}. Please use JPG, PNG, GIF, or WebP.` },
        { status: 400 }
      )
    }

    // Convert file to base64 for OpenAI Vision
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    
    // Normalize MIME type for OpenAI
    let mimeType = imageFile.type
    if (mimeType === 'image/jpg') {
      mimeType = 'image/jpeg'
    }

    console.log(`🔍 Analyzing uploaded image with OpenAI Vision (${mimeType}, ${base64Image.length} chars)`)

    // Validate base64 data
    if (!base64Image || base64Image.length < 100) {
      console.error(`❌ Invalid base64 data length: ${base64Image.length}`)
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      )
    }

    // First, analyze the uploaded image to extract detailed design elements
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this bedding/fabric image and provide a detailed extraction report for realistic mockup creation. Describe:\n\n1. EXACT COLORS: Primary, secondary, accent colors (with approximate hex codes)\n2. PATTERNS & DESIGNS: Specific motifs, geometric shapes, florals, stripes, etc.\n3. FABRIC TEXTURE: Material type, weave, surface finish, sheen level\n4. STYLE ELEMENTS: Modern, vintage, minimalist, bold, subtle, etc.\n5. SCALE & PROPORTION: Size of patterns, repeat intervals\n6. SPECIAL FEATURES: Embroidery, prints, textures, borders\n\nBe extremely specific about every visual element - this will be used to recreate the design realistically on bed mockups and material shots. Focus on details that would help a designer extract and apply this design to different contexts."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 700
    })

    const productDescription = analysisResponse.choices[0]?.message?.content || "A bedding product"

    console.log(`📝 Product analysis: ${productDescription.substring(0, 100)}...`)

    // Use custom prompt if provided, otherwise use default
    const finalPrompt = customPrompt || BEDDING_PRODUCT_PROMPT

    // Enhanced prompt with specific requirements for realistic product photography
    const enhancedPrompt = `${finalPrompt}

DESIGN EXTRACTION REPORT:
${productDescription}

CRITICAL REQUIREMENTS FOR E-COMMERCE PRODUCT IMAGE:
- Extract and apply the EXACT design elements from the analysis above
- Use the precise colors, patterns, and proportions identified
- Maintain the original bedding design without any modifications
- Create a clean, professional product photograph suitable for online sales
- Focus on accurate color reproduction and fabric texture representation
- Use even, professional lighting that showcases the bedding clearly
- Ensure the image looks commercial and trustworthy, not artistic

TECHNICAL SPECIFICATIONS:
- Ultra-high resolution and sharp detail
- Professional e-commerce photography lighting
- Clean, neutral background that doesn't distract from the product
- Accurate color reproduction for online shopping
- Commercial photography standards
- Ready for immediate use on product pages

Style: Professional e-commerce product photography, clean and minimal presentation, accurate representation, commercial quality, website-ready`

    console.log(`🎨 Generating image ${imageIndex} with DALL-E`)

    // Use the OpenAI SDK's image generation instead of direct fetch
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url"
      })

      const generatedImageUrl = response.data[0]?.url

      if (!generatedImageUrl) {
        throw new Error('No image generated by OpenAI')
      }

      console.log(`✅ Successfully generated image ${imageIndex}`)

      return NextResponse.json({
        success: true,
        imageUrl: generatedImageUrl,
        imageIndex,
        prompt: enhancedPrompt
      })
    } catch (openaiError: any) {
      console.error('OpenAI image generation error:', openaiError)
      throw openaiError
    }

  } catch (error: any) {
    console.error('Error generating AI image:', error)
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your billing.' },
        { status: 429 }
      )
    }
    
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      )
    }

    if (error.code === 'model_not_found') {
      return NextResponse.json(
        { error: 'OpenAI model not available. Please check your API access.' },
        { status: 400 }
      )
    }

    if (error.code === 'invalid_image_format') {
      return NextResponse.json(
        { error: 'Invalid image format. Please upload a JPG, PNG, GIF, or WebP image.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Image-Index, X-Custom-Prompt',
    },
  })
} 