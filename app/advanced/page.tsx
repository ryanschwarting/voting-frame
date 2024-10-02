import { getFrameMetadata } from "@coinbase/onchainkit/frame";
import type { Metadata } from "next";

const frameMetadata = getFrameMetadata({
  buttons: [{ label: "Yes" }, { label: "No" }],
  image: {
    src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?title=Will Dune: Part II gross over $100M on opening weekend?`,
  },
  postUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced`,
});

export const metadata: Metadata = {
  title: "Kramer Contest Voting",
  description: "Vote on the Dune: Part II box office prediction",
  openGraph: {
    title: "Kramer Contest Voting",
    description: "Vote on the Dune: Part II box office prediction",
    images: [
      `${process.env.NEXT_PUBLIC_SITE_URL}/og?title=Will Dune: Part II gross over $100M on opening weekend?`,
    ],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Page() {
  return (
    <>
      <h1>Kramer Contest Voting</h1>
    </>
  );
}
