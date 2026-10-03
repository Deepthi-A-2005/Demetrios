import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const latest = await sql`
      SELECT * FROM sensor_data 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;

    const history = await sql`
      SELECT * FROM sensor_data 
      ORDER BY timestamp DESC 
      LIMIT 20
    `;

    return Response.json({
      latest: latest[0] || null,
      history: history.reverse(),
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch sensor data" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      moisture,
      temperature,
      humidity,
      ph,
      ultrasonic,
      latitude,
      longitude,
    } = data;

    const result = await sql`
      INSERT INTO sensor_data (moisture, temperature, humidity, ph, ultrasonic, latitude, longitude)
      VALUES (${moisture}, ${temperature}, ${humidity}, ${ph}, ${ultrasonic}, ${latitude}, ${longitude})
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to save sensor data" },
      { status: 500 },
    );
  }
}
