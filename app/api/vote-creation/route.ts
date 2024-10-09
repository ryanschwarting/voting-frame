import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  // Extract vote details from the request body
  const { title, deadline, options } = await request.json();

  // Generate a unique ID for the new vote
  const voteId = nanoid();

  console.log("Received options:", options);

  // Ensure options is an array of strings
  const parsedOptions = Array.isArray(options) ? options : [options];

  // Convert deadline to UTC
  const utcDeadline = new Date(deadline);

  // Store vote data in KV store
  await kv.hset(`vote:${voteId}`, {
    title,
    deadline: utcDeadline.toISOString(),
    options: JSON.stringify(parsedOptions), // Store as JSON string of array
  });

  // Return the generated voteId
  return NextResponse.json({ voteId });
}
