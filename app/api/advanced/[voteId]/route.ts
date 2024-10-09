import {
  FrameRequest,
  getFrameHtmlResponse,
  FrameButtonMetadata,
} from "@coinbase/onchainkit/frame";
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * Handles the main logic for processing a vote request.
 * This function:
 * 1. Retrieves vote data from the KV store
 * 2. Checks if the user has already voted
 * 3. Processes the vote if a valid button was clicked
 * 4. Returns either the initial vote page or the results page
 */
async function getResponse(
  req: NextRequest,
  voteId: string
): Promise<NextResponse> {
  // Parse the incoming request body
  const body: FrameRequest = await req.json();
  const { untrustedData } = body;

  // Retrieve vote data from KV store
  const voteData = await kv.hgetall(`vote:${voteId}`);
  console.log("voteData:", voteData);

  // Handle case where vote is not found
  // Use getFrameHtmlResponse for user verification error

  if (!voteData) {
    return new NextResponse(
      getFrameHtmlResponse({
        image: {
          src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?title=Error: Vote not found`,
        },
      })
    );
  }

  const { title, deadline, options } = voteData;
  console.log("options:", options);

  // Ensure options is always an array
  const parsedOptions = Array.isArray(options) ? options : [options];

  // Extract user ID from untrusted data
  const userId = untrustedData.fid?.toString();
  if (!userId) {
    return new NextResponse(
      getFrameHtmlResponse({
        image: {
          src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?title=Error: Unable to verify user`,
        },
      })
    );
  }

  // Check if user has already voted
  const hasVoted = await kv.sismember(`votedUsers:${voteId}`, userId);
  if (hasVoted) {
    return getResultsResponse(voteId, title as string);
  }

  // Process the vote if a valid button was clicked
  if (
    untrustedData.buttonIndex &&
    untrustedData.buttonIndex <= parsedOptions.length
  ) {
    // Increment vote count and add user to voted set
    await kv.incr(`votes:${voteId}:${untrustedData.buttonIndex}`);
    await kv.sadd(`votedUsers:${voteId}`, userId);
    return getResultsResponse(voteId, title as string);
  }

  // Prepare buttons for initial vote page
  // Prepare buttons using FrameButtonMetadata type
  const buttons: [FrameButtonMetadata, ...FrameButtonMetadata[]] =
    parsedOptions.length > 0
      ? (parsedOptions.map((option: string) => ({ label: option })) as [
          FrameButtonMetadata,
          ...FrameButtonMetadata[]
        ])
      : [{ label: "No options available" }];

  // Return initial vote page response
  // Use getFrameHtmlResponse to create the initial vote page response
  return new NextResponse(
    getFrameHtmlResponse({
      buttons: buttons,
      image: {
        src: `${
          process.env.NEXT_PUBLIC_SITE_URL
        }/frame-image?title=${encodeURIComponent(
          title as string
        )}&deadline=${encodeURIComponent(deadline as string)}`,
      },
      postUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced/${voteId}`,
    })
  );
}

/**
 * Generates and returns the results page for a completed vote.
 * This function:
 * 1. Retrieves the vote data and calculates the results
 * 2. Prepares the results image URL with vote statistics
 * 3. Returns a frame response with the results image
 */
async function getResultsResponse(
  voteId: string,
  title: string
): Promise<NextResponse> {
  // Retrieve vote data
  const voteData = await kv.hgetall(`vote:${voteId}`);

  if (!voteData || !voteData.options) {
    throw new Error("Invalid vote data");
  }

  // Parse options, handling different data formats
  let options: string[];
  if (typeof voteData.options === "string") {
    try {
      options = JSON.parse(voteData.options);
    } catch {
      options = voteData.options.split(",");
    }
  } else if (Array.isArray(voteData.options)) {
    options = voteData.options;
  } else {
    throw new Error("Invalid options format");
  }

  console.log("Parsed options:", options);

  // Fetch vote counts for each option
  const voteCounts = await Promise.all(
    options.map((_, index) => kv.get(`votes:${voteId}:${index + 1}`))
  );

  // Convert vote counts to numbers and calculate total
  const typedVoteCounts = voteCounts.map((count) => Number(count) || 0);
  const totalVotes = typedVoteCounts.reduce((sum, count) => sum + count, 0);

  // Calculate results with percentages
  const results = options.map((option, index) => {
    const count = typedVoteCounts[index];
    const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
    return {
      option,
      count,
      percentage: percentage.toFixed(1),
    };
  });

  console.log("Calculated results:", results);

  // Prepare URL parameters for results image
  const searchParams = new URLSearchParams({
    title,
    results: JSON.stringify(results),
  });

  const imageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/og?${searchParams}`;

  // Return results response
  // Use getFrameHtmlResponse to create the results response
  return new NextResponse(
    getFrameHtmlResponse({
      image: {
        src: imageUrl,
      },
      postUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced/${voteId}`,
    })
  );
}

/**
 * Main POST handler for the API route.
 * This function serves as the entry point for incoming POST requests,
 * delegating the processing to the getResponse function.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { voteId: string } }
): Promise<Response> {
  return getResponse(req, params.voteId);
}

// Ensure the route is not cached
export const dynamic = "force-dynamic";
