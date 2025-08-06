# AI Image Generation Setup

## Overview
The AI Image Generator allows admin users to upload a single bedding product image and automatically generate 5 professional e-commerce views using OpenAI's DALL-E 3 and GPT-4 Vision.

## Generated Image Types
1. **Front-Facing Bed View** - Professional front-facing product shot on a bed
2. **Styled Bedroom Scene** - Angled lifestyle bedroom setting 
3. **Folded Product Display** - Clean product shot on white background
4. **Fabric Texture Close-up** - Detailed macro shot showing material quality
5. **Minimal Lifestyle Setting** - Cozy corner scene with natural lighting

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 2. Add API Key to Environment
Add the following to your `.env.local` file:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Access the Feature
1. Log in as an admin user
2. Navigate to **AI Images** in the admin sidebar
3. Upload a clear bedding product image
4. Click "Generate 5 AI Images"
5. Wait for processing (30-60 seconds per image)
6. Download individual images or all at once

## Requirements
- OpenAI API key with DALL-E 3 and GPT-4 Vision access
- Admin user account
- High-quality source images work best

## Tips for Best Results
- Use well-lit, high-resolution images
- Ensure the bedding product is the main focus
- Avoid heavily filtered or edited images
- Clear, uncluttered backgrounds work best
- Each generation uses OpenAI credits

## Technical Details
- Uses GPT-4 Vision to analyze uploaded images
- Generates detailed product descriptions
- Creates 5 unique prompts for different view types
- Uses DALL-E 3 for high-quality image generation
- Images are returned as downloadable URLs

## Cost Considerations
- Each image analysis uses GPT-4 Vision tokens
- Each generated image uses DALL-E 3 credits
- 5 images per generation = significant API usage
- Monitor your OpenAI usage dashboard

## Troubleshooting
- Ensure OpenAI API key is correctly set in environment
- Check API key has sufficient credits
- Verify API key has access to DALL-E 3 and GPT-4 Vision
- Large images may take longer to process
- Network timeouts may occur with slow connections 