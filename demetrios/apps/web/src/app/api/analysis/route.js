import sql from "@/app/api/utils/sql";
import { upload } from "@/app/api/utils/upload";

export async function GET() {
  try {
    const results = await sql`
      SELECT * FROM analysis_results 
      ORDER BY timestamp DESC 
      LIMIT 10
    `;
    return Response.json(results);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch analysis results" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { base64, sensorSnapshot } = await request.json();

    // 1. Upload image
    const { url, error: uploadError } = await upload({ base64 });
    if (uploadError) throw new Error(uploadError);

    // 2. Run AI Analysis via Gemini Flash (called via internal fetch to keep logic clean or directly here)
    // We'll simulate the AI call prompt
    const prompt = `Analyze this crop image and current sensor data: ${JSON.stringify(sensorSnapshot)}. 
    Return a JSON with "health_status" (Good/At Risk/Poor) and "recommendation" (what to do next).`;

    const aiResponse = await fetch(
      `${process.env.NEXT_PUBLIC_CREATE_APP_URL}/integrations/google-gemini-2-5-flash/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an expert agronomist AI. Return ONLY JSON.",
            },
            { role: "user", content: prompt },
          ],
        }),
      },
    );

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const { health_status, recommendation } = JSON.parse(
      content.replace(/```json|```/g, ""),
    );

    // 3. Save to DB
    const result = await sql`
      INSERT INTO analysis_results (image_url, health_status, recommendation, sensor_snapshot)
      VALUES (${url}, ${health_status}, ${recommendation}, ${JSON.stringify(sensorSnapshot)})
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
