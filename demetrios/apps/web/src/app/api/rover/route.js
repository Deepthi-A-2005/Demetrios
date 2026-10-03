import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const state = await sql`SELECT * FROM rover_state WHERE id = 1`;
    return Response.json(state[0]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch rover state" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { command, is_watering } = await request.json();

    let result;
    if (command !== undefined && is_watering !== undefined) {
      result = await sql`
        UPDATE rover_state 
        SET command = ${command}, is_watering = ${is_watering}, last_updated = CURRENT_TIMESTAMP
        WHERE id = 1
        RETURNING *
      `;
    } else if (command !== undefined) {
      result = await sql`
        UPDATE rover_state 
        SET command = ${command}, last_updated = CURRENT_TIMESTAMP
        WHERE id = 1
        RETURNING *
      `;
    } else if (is_watering !== undefined) {
      result = await sql`
        UPDATE rover_state 
        SET is_watering = ${is_watering}, last_updated = CURRENT_TIMESTAMP
        WHERE id = 1
        RETURNING *
      `;
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to update rover state" },
      { status: 500 },
    );
  }
}
