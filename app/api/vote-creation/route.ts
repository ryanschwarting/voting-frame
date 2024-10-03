import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  const { title, deadline, options } = await request.json();
  const voteId = nanoid();

  console.log("Received options:", options);

  // Ensure options is an array of strings
  const parsedOptions = Array.isArray(options) ? options : [options];

  // Store options as an array
  await kv.hset(`vote:${voteId}`, {
    title,
    deadline,
    options: JSON.stringify(parsedOptions), // Store as JSON string of array
  });

  return NextResponse.json({ voteId });
}
