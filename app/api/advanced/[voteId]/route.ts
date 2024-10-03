import {
  FrameRequest,
  getFrameHtmlResponse,
  FrameButtonMetadata,
} from "@coinbase/onchainkit/frame";
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

async function getResponse(
  req: NextRequest,
  voteId: string
): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { untrustedData } = body;

  const voteData = await kv.hgetall(`vote:${voteId}`);
  console.log("voteData:", voteData);

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

  // Ensure options is an array
  const parsedOptions = Array.isArray(options) ? options : [options];

  // Check if the user has already voted
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

  const hasVoted = await kv.sismember(`votedUsers:${voteId}`, userId);
  if (hasVoted) {
    return getResultsResponse(voteId, title as string);
  }

  // Handle the vote
  if (
    untrustedData.buttonIndex &&
    untrustedData.buttonIndex <= parsedOptions.length
  ) {
    await kv.incr(`votes:${voteId}:${untrustedData.buttonIndex}`);
    await kv.sadd(`votedUsers:${voteId}`, userId);
    return getResultsResponse(voteId, title as string);
  }

  // Initial vote page
  const buttons: [FrameButtonMetadata, ...FrameButtonMetadata[]] =
    parsedOptions.length > 0
      ? (parsedOptions.map((option: string) => ({ label: option })) as [
          FrameButtonMetadata,
          ...FrameButtonMetadata[]
        ])
      : [{ label: "No options available" }];

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

async function getResultsResponse(
  voteId: string,
  title: string
): Promise<NextResponse> {
  const voteData = await kv.hgetall(`vote:${voteId}`);

  if (!voteData || !voteData.options) {
    throw new Error("Invalid vote data");
  }

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

  const voteCounts = await Promise.all(
    options.map((_, index) => kv.get(`votes:${voteId}:${index + 1}`))
  );

  const typedVoteCounts = voteCounts.map((count) => Number(count) || 0);
  const totalVotes = typedVoteCounts.reduce((sum, count) => sum + count, 0);

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

  const searchParams = new URLSearchParams({
    title,
    results: JSON.stringify(results),
  });

  const imageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/og?${searchParams}`;

  return new NextResponse(
    getFrameHtmlResponse({
      image: {
        src: imageUrl,
      },
      postUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced/${voteId}`,
    })
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { voteId: string } }
): Promise<Response> {
  return getResponse(req, params.voteId);
}

export const dynamic = "force-dynamic";
