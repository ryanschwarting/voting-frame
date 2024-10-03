import { getFrameMetadata } from "@coinbase/onchainkit/frame";
import type { Metadata } from "next";
import { kv } from "@vercel/kv";

export async function generateMetadata({
  params,
}: {
  params: { voteId: string };
}): Promise<Metadata> {
  const voteData = await kv.hgetall(`vote:${params.voteId}`);

  if (!voteData) {
    return {
      title: "Vote not found",
    };
  }

  const { title, deadline, options } = voteData;
  let parsedOptions: string[] = [];

  if (typeof options === "string") {
    parsedOptions = options.split(",").map((option) => option.trim());
  } else if (Array.isArray(options)) {
    parsedOptions = options.map(String);
  }

  // Ensure we always have at least one button
  const buttons =
    parsedOptions.length > 0
      ? parsedOptions.map((option: string) => ({ label: option }))
      : [{ label: "No options available" }];

  const frameMetadata = getFrameMetadata({
    buttons: buttons as [{ label: string }, ...{ label: string }[]],
    image: {
      src: `${
        process.env.NEXT_PUBLIC_SITE_URL
      }/frame-image?title=${encodeURIComponent(
        title as string
      )}&deadline=${encodeURIComponent(deadline as string)}`,
    },
    postUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced/${params.voteId}`,
  });

  return {
    title: title as string,
    description: `Vote on: ${title}`,
    openGraph: {
      title: title as string,
      description: `Vote on: ${title}`,
      images: [`${process.env.NEXT_PUBLIC_SITE_URL}/vote.jpg`],
    },
    other: {
      ...frameMetadata,
    },
  };
}

export default async function Page({ params }: { params: { voteId: string } }) {
  const voteData = await kv.hgetall(`vote:${params.voteId}`);

  if (!voteData) {
    return <div>Vote not found</div>;
  }

  const { title, deadline, options } = voteData;
  let parsedOptions: string[] = [];

  if (typeof options === "string") {
    parsedOptions = options.split(",").map((option) => option.trim());
  } else if (Array.isArray(options)) {
    parsedOptions = options.map(String);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{title as string}</h1>
      <p className="mb-4">
        Deadline: {new Date(deadline as string).toLocaleString()}
      </p>
      <h2 className="text-2xl font-semibold mb-2">Options:</h2>
      <ul className="list-disc pl-5">
        {parsedOptions.map((option: string, index: number) => (
          <li key={index}>{option}</li>
        ))}
      </ul>
    </div>
  );
}
