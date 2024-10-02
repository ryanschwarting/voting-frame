import { getFrameMetadata } from "@coinbase/onchainkit/frame";
import type { Metadata } from "next";

const question =
  "There will be over 10,000 Kramer predictions before 10/29 midnight";
const deadline = "2024-10-29T23:59:59Z";

const frameMetadata = getFrameMetadata({
  buttons: [{ label: "Yes" }, { label: "No" }],
  image: {
    src: `${
      process.env.NEXT_PUBLIC_SITE_URL
    }/frame-image?title=${encodeURIComponent(
      question
    )}&deadline=${encodeURIComponent(deadline)}`,
  },
  postUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced`,
});

export const metadata: Metadata = {
  title: "Kramer Contest Prediction",
  description: "Predict the number of Kramer predictions before the deadline",
  openGraph: {
    title: "Kramer Contest Prediction",
    description: "Predict the number of Kramer predictions before the deadline",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL}/vote.jpg`],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Page() {
  return (
    <>
      <h1>Kramer Contest Prediction</h1>
      <p>{question}</p>
      <p>Deadline: {new Date(deadline).toLocaleString()}</p>
    </>
  );
}
