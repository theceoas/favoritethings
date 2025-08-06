import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing image upload...')
    
    // Get the form data
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    console.log(`📁 File details:`)
    console.log(`  - Name: ${imageFile.name}`)
    console.log(`  - Type: ${imageFile.type}`)
    console.log(`  - Size: ${imageFile.size} bytes`)
    console.log(`  - Last Modified: ${new Date(imageFile.lastModified)}`)

    // Convert to ArrayBuffer
    const bytes = await imageFile.arrayBuffer()
    console.log(`  - ArrayBuffer size: ${bytes.byteLength}`)

    // Convert to Buffer
    const buffer = Buffer.from(bytes)
    console.log(`  - Buffer size: ${buffer.length}`)

    // Convert to base64
    const base64Image = buffer.toString('base64')
    console.log(`  - Base64 length: ${base64Image.length}`)
    console.log(`  - Base64 preview: ${base64Image.substring(0, 50)}...`)

    // Check if it's a valid image by reading magic bytes
    const magicBytes = buffer.slice(0, 8)
    console.log(`  - Magic bytes: ${magicBytes.toString('hex')}`)

    let detectedFormat = 'unknown'
    if (magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF) {
      detectedFormat = 'JPEG'
    } else if (magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4E && magicBytes[3] === 0x47) {
      detectedFormat = 'PNG'
    } else if (magicBytes[0] === 0x47 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46) {
      detectedFormat = 'GIF'
    } else if (magicBytes.slice(0, 4).toString() === 'RIFF' && magicBytes.slice(8, 12).toString() === 'WEBP') {
      detectedFormat = 'WEBP'
    }

    console.log(`  - Detected format: ${detectedFormat}`)

    return NextResponse.json({
      success: true,
      fileInfo: {
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size,
        detectedFormat,
        base64Length: base64Image.length,
        magicBytes: magicBytes.toString('hex')
      }
    })

  } catch (error: any) {
    console.error('❌ Test error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
} 