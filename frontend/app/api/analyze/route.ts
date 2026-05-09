import { streamText } from "ai"

export async function POST(req: Request) {
  const formData = await req.formData()
  const images = formData.getAll("image") as File[]

  if (!images || images.length === 0) {
    return new Response("No images provided", { status: 400 })
  }

  // Convert each image to base64
  const imageContents = await Promise.all(
    images.map(async (image) => {
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString("base64")
      const mimeType = image.type || "image/png"
      return { base64, mimeType }
    })
  )

  const imageBlocks = imageContents.map(({ base64, mimeType }) => ({
    type: "image" as const,
    image: `data:${mimeType};base64,${base64}`,
  }))

  const photoCount = images.length
  const photoLabel = photoCount === 1 ? "photo" : `${photoCount} photos`

  const result = streamText({
    model: "anthropic/claude-sonnet-4-20250514",
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          {
            type: "text",
            text: `You are an expert accessibility consultant using computer vision to analyze real-world photos of physical spaces for ADA (Americans with Disabilities Act) compliance issues. A business owner has uploaded ${photoLabel} of the same space from different angles or areas.

Carefully examine all ${photoLabel} together and identify any accessibility barriers or issues visible across them.

Provide your analysis in the following JSON format:
{
  "summary": "A 2-3 sentence overview describing what you see across the ${photoLabel} and the space's overall accessibility status",
  "issues": [
    {
      "type": "error" | "warning" | "info",
      "title": "Brief title of the issue",
      "description": "Detailed explanation of what you observed, why it's a problem, and specific actionable recommendations to fix it",
      "regulation": "Relevant ADA section or guideline (e.g., 'ADA Section 4.3.3')"
    }
  ]
}

Look for these common accessibility issues across the photos:
1. **Pathways & Aisles**: Narrow pathways, obstacles blocking routes, uneven surfaces, trip hazards
2. **Entrances & Doors**: Heavy doors without automatic openers, high thresholds, narrow doorways, lack of accessible entrance signage
3. **Ramps & Steps**: Missing ramps, steep ramp gradients, no handrails, steps without ramp alternatives
4. **Signage**: Missing accessibility signage, poor contrast text, signage mounted too high/low, lack of Braille
5. **Lighting & Contrast**: Poor lighting, low contrast between surfaces, glare issues
6. **Restrooms**: Narrow stall doors, missing grab bars, inaccessible sink heights, blocked clearance space
7. **Counters & Service Areas**: Counters too high, no lowered section for wheelchair users
8. **Parking**: Missing accessible parking spaces, faded markings, blocked access aisles
9. **Furniture & Fixtures**: Protruding objects, tables/chairs blocking pathways, inaccessible seating
10. **Floor Surfaces**: Slippery surfaces, loose rugs/mats, abrupt level changes

Use "error" for critical ADA violations that must be fixed, "warning" for moderate concerns that should be addressed, and "info" for best practice recommendations to improve accessibility.

Be specific about what you SEE in the photos. Reference actual elements visible across the images. If an issue appears in multiple photos, mention that it is consistent throughout the space. If you cannot clearly see certain aspects, note that in your analysis.

Return ONLY valid JSON, no markdown code blocks or additional text.`,
          },
        ],
      },
    ],
  })

  return result.toTextStreamResponse()
}
