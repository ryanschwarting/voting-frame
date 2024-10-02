import { FrameRequest, getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { untrustedData } = body;

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

  const hasVoted = await kv.sismember("votedUsers", userId);
  if (hasVoted) {
    return getResultsResponse();
  }

  // Handle the vote
  if (untrustedData.buttonIndex === 1 || untrustedData.buttonIndex === 2) {
    if (untrustedData.buttonIndex === 1) {
      await kv.incr("yesVotes");
    } else {
      await kv.incr("noVotes");
    }
    await kv.sadd("votedUsers", userId);
    return getResultsResponse();
  }

  // Initial vote page
  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [{ label: "Yes" }, { label: "No" }],
      image: {
        src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?title=Will Dune: Part II gross over $100M on opening weekend?`,
      },
      postUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced`,
    })
  );
}

async function getResultsResponse(): Promise<NextResponse> {
  const [yesVotes, noVotes] = await Promise.all([
    kv.get("yesVotes"),
    kv.get("noVotes"),
  ]);

  const yesCount = Number(yesVotes) || 0;
  const noCount = Number(noVotes) || 0;
  const totalVotes = yesCount + noCount;

  const yesPercentage =
    totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 0;
  const noPercentage =
    totalVotes > 0 ? Math.round((noCount / totalVotes) * 100) : 0;

  const question = "There will be over 10,000 Kramer predictions before 10/29";
  const searchParams = new URLSearchParams({
    title: question,
    description1: "Results:",
    description2: `Yes: ${yesPercentage}% (${yesCount}) | No: ${noPercentage}% (${noCount})`,
    // description: `Current Voting Results: \nYes: ${yesPercentage}% (${yesCount}) | No: ${noPercentage}% (${noCount})`,
  });

  return new NextResponse(
    getFrameHtmlResponse({
      image: {
        src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?${searchParams}`,
      },
      postUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced`,
    })
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";
