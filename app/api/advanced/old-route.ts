import { FrameRequest, getFrameHtmlResponse } from "@coinbase/onchainkit/frame";
import { NextRequest, NextResponse } from "next/server";

// In-memory storage for votes (replace with a database in production)
let yesVotes = 0;
let noVotes = 0;
const votedUsers = new Set<string>();

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

  if (votedUsers.has(userId)) {
    // User has already voted, show results without buttons
    return getResultsResponse();
  }

  // Handle the vote
  if (untrustedData.buttonIndex === 1 || untrustedData.buttonIndex === 2) {
    if (untrustedData.buttonIndex === 1) {
      yesVotes++;
    } else {
      noVotes++;
    }
    votedUsers.add(userId);
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

function getResultsResponse(): NextResponse {
  const totalVotes = yesVotes + noVotes;
  const yesPercentage = Math.round((yesVotes / totalVotes) * 100) || 0;
  const noPercentage = Math.round((noVotes / totalVotes) * 100) || 0;

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
