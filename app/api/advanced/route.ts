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

  const totalVotes = (Number(yesVotes) || 0) + (Number(noVotes) || 0);
  const yesPercentage =
    totalVotes > 0 ? Math.round((Number(yesVotes) / totalVotes) * 100) : 0;
  const noPercentage =
    totalVotes > 0 ? Math.round((Number(noVotes) / totalVotes) * 100) : 0;

  const searchParams = new URLSearchParams({
    title: "Current Voting Results",
    description: `Yes: ${yesPercentage}% | No: ${noPercentage}%`,
  });

  return new NextResponse(
    getFrameHtmlResponse({
      image: {
        src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?${searchParams}`,
      },
    })
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = "force-dynamic";
