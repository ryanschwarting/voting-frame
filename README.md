# Comprehensive Documentation: Warpcast Voting Frame Web Application

## Table of Contents

1. [Introduction](#introduction)
2. [Technology Stack](#technology-stack)
3. [Application Flow and Design](#application-flow-and-design)
4. [API Endpoints](#api-endpoints)
5. [Key Components](#key-components)
6. [Database and Storage](#database-and-storage)
7. [Image Generation](#image-generation)
8. [Deployment and Hosting](#deployment-and-hosting)
9. [Advantages of the Tech Stack](#advantages-of-the-tech-stack)
10. [Conclusion](#conclusion)

## 1. Introduction

This documentation provides an in-depth explanation of a web application designed to create and manage voting frames for Warpcast users. The application allows users to create custom polls, which can be shared and interacted with on the Warpcast platform. It leverages modern web technologies to provide a seamless, efficient, and scalable solution for creating and managing votes.

## 2. Technology Stack

The application is built using the following technologies:

- **Next.js**: A React framework for building server-side rendered and statically generated web applications.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom user interfaces.
- **Vercel KV**: A key-value storage solution provided by Vercel for efficient data storage and retrieval.
- **Vercel**: A cloud platform for static sites and Serverless Functions.

This stack combines powerful front-end technologies with serverless backend capabilities, allowing for rapid development and easy scaling.

## 3. Application Flow and Design

The application follows a user-centric design, focusing on simplicity and efficiency. Here's an overview of the main flow:

1. **Home Page**: Users land on the home page, which presents an interface to create a new voting contest.

2. **Contest Creation**: Users fill out a form with details about their voting contest, including title, options, and deadline.

3. **Contest Submission**: Upon submission, the application generates a unique ID for the contest and stores the data in Vercel KV.

4. **Frame Generation**: The application creates a Warpcast-compatible frame for the contest, including dynamic images and interactive buttons.

5. **Voting Process**: Users can vote on the contest through the Warpcast interface. Each vote is recorded and associated with the user's Farcaster ID to prevent duplicate voting.

6. **Results Display**: After voting, users see the current results of the contest, dynamically generated as an image.

The design prioritizes responsiveness and user experience, with smooth animations and intuitive interfaces. The application makes extensive use of server-side rendering and API routes to ensure fast load times and real-time updates.

## 4. API Endpoints

The application features several key API endpoints that handle various aspects of the voting process:

### 4.1. Vote Creation API

```1:25:app/api/vote-creation/route.ts
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  const { title, deadline, options } = await request.json();
  const voteId = nanoid();

  console.log("Received options:", options);

  // Ensure options is an array of strings
  const parsedOptions = Array.isArray(options) ? options : [options];

  // Convert deadline to UTC
  const utcDeadline = new Date(deadline);

  // Store options as an array and deadline in UTC
  await kv.hset(`vote:${voteId}`, {
    title,
    deadline: utcDeadline.toISOString(),
    options: JSON.stringify(parsedOptions), // Store as JSON string of array
  });

  return NextResponse.json({ voteId });
}
```

This API endpoint handles the creation of new voting contests. It performs the following actions:

1. Receives POST requests with contest details (title, deadline, options).
2. Generates a unique ID for the contest using `nanoid()`.
3. Parses and validates the received options.
4. Converts the deadline to UTC format.
5. Stores the contest data in Vercel KV using the generated ID as the key.
6. Returns the generated vote ID to the client.

The use of Vercel KV allows for efficient storage and retrieval of contest data, while the unique ID ensures that each contest can be accessed and managed independently.

### 4.2. Advanced Voting API

```1:152:app/api/advanced/[voteId]/route.ts
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
```

This API endpoint manages the voting process and result display. Its key functions include:

1. Handling POST requests for vote submissions.
2. Verifying user authentication using Farcaster ID.
3. Checking if a user has already voted to prevent duplicate votes.
4. Incrementing vote counts for chosen options.
5. Generating and returning updated result images.
6. Managing the initial vote page and subsequent result pages.

The API makes extensive use of Vercel KV for storing and retrieving vote data, ensuring real-time updates and consistent data across requests.

### 4.3. Admin API

```1:60:app/api/admin/route.ts
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  try {
    const [yesVotes, noVotes, votedUsers] = await Promise.all([
      kv.get("yesVotes"),
      kv.get("noVotes"),
      kv.smembers("votedUsers"),
    ]);

    return NextResponse.json({
      yesVotes,
      noVotes,
      votedUsers,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { action, userId } = await req.json();

  try {
    switch (action) {
      case "reset-user":
        if (userId) {
          await kv.srem("votedUsers", userId);
          return NextResponse.json({ message: "User reset successfully" });
        }
        break;
      case "reset-yes":
        await kv.set("yesVotes", 0);
        return NextResponse.json({ message: "Yes votes reset successfully" });
      case "reset-no":
        await kv.set("noVotes", 0);
        return NextResponse.json({ message: "No votes reset successfully" });
      case "reset-all":
        await Promise.all([
          kv.set("yesVotes", 0),
          kv.set("noVotes", 0),
          kv.del("votedUsers"),
        ]);
        return NextResponse.json({ message: "All data reset successfully" });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error resetting data:", error);
    return NextResponse.json(
      { error: "Failed to reset data" },
      { status: 500 }
    );
  }
}
```

This API provides administrative functions for managing the voting system:

1. GET requests retrieve current voting statistics and user data.
2. POST requests handle various reset actions:
   - Resetting individual user votes
   - Resetting vote counts for specific options
   - Performing a complete reset of all data

These admin functions are crucial for maintaining the integrity of the voting system and allowing for manual interventions when necessary.

## 5. Key Components

### 5.1. Create Contest Form

The `CreateContestForm` component is a crucial part of the application, handling the user interface for creating new voting contests.

```1:293:app/components/create-contest-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Confetti from "react-confetti";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
// Add these imports
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  deadline: z.date({
    required_error: "A deadline is required.",
  }),
  options: z.array(z.string().min(1, "Option cannot be empty")).length(2),
});
export function CreateContestForm() {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  // Add these state variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voteUrl, setVoteUrl] = useState("");

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      options: ["", ""],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/vote-creation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to create vote");
      }

      const data = await response.json();
      console.log("Vote created:", data);

      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        const newVoteUrl = `${window.location.origin}/advanced/${data.voteId}`;
        setVoteUrl(newVoteUrl);
        setIsModalOpen(true);
      }, 3000);
    } catch (error) {
      console.error("Error creating vote:", error);
      alert("Failed to create vote. Please try again.");
    }
  }
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 0.95 },
    tap: { scale: 0.9 },
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
      {showConfetti && <Confetti />}
      <motion.div
        className={`
          relative rounded-2xl p-1
          ${isAnimating ? "animate-gradient-x" : ""}
          bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#9945FF]
          bg-[length:200%_100%]
        `}
        initial="hidden"
        animate="visible"
        variants={formVariants}
      >
        <div className="bg-[#2C2C2C] rounded-2xl p-2 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="The topic of your vote"
                        {...field}
                        className="bg-white text-black placeholder-gray-400"
                      />
                    </FormControl>
                    {/* <FormDescription className="text-gray-200">
                      Enter the title for your contest.
                    </FormDescription> */}
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-white">Deadline</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-gray-400",
                              field.value && "text-black"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span className="text-gray-400">
                                Pick a deadline
                              </span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-75 text-gray-600" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              const endOfDay = new Date(
                                Date.UTC(
                                  date.getUTCFullYear(),
                                  date.getUTCMonth(),
                                  date.getUTCDate(),
                                  23,
                                  59,
                                  59,
                                  999
                                )
                              );
                              field.onChange(endOfDay);
                            }
                          }}
                          disabled={(date) =>
                            date < new Date() || date > new Date("2100-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-gray-300">
                      This is the expiry date (end of the selected day)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4">
                <FormLabel className="text-white">Vote Options</FormLabel>
                {[0, 1].map((index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`options.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Type option"
                            {...field}
                            className="bg-white text-black placeholder-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <motion.div
                  variants={buttonVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  className="mt-8"
                >
                  <Button
                    type="submit"
                    className={`
                      w-full text-[#1A1A1A] font-bold py-2 px-4 rounded
                      bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#9945FF]
                      bg-[length:200%_100%] hover:bg-[length:100%_100%]
                      transition-all duration-300 ease-in-out
                      ${isAnimating ? "animate-gradient-x" : ""}
                    `}
                  >
                    Create Vote
                  </Button>
                </motion.div>
              </div>
            </form>
          </Form>
        </div>
      </motion.div>

      {/* Add the Dialog component */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vote Created Successfully!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Your vote has been created. Here is the URL:</p>
            <Input
              value={voteUrl}
              readOnly
              className="mt-2"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(voteUrl);
                setIsModalOpen(false);
                router.push(voteUrl);
              }}
            >
              Copy URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

Key features of this component include:

1. **Form Handling**: Uses `react-hook-form` for efficient form state management and validation.
2. **Dynamic Styling**: Employs Tailwind CSS for responsive design and Framer Motion for animations.
3. **Date Picker**: Integrates a calendar component for selecting the contest deadline.
4. **API Integration**: Submits form data to the vote creation API and handles the response.
5. **Success Feedback**: Displays a confetti animation and a modal with the new vote URL upon successful creation.

The component demonstrates effective use of React hooks and modern form handling techniques, resulting in a smooth and interactive user experience.

### 5.2. Admin Dashboard

```1:151:app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [resetUserId, setResetUserId] = useState("");
  const [voteId, setVoteId] = useState("");
  const [voteData, setVoteData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch("/api/admin")
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error fetching data:", error));
  };

  const handleReset = async (action: string) => {
    try {
      const body =
        action === "reset-user"
          ? JSON.stringify({ action, userId: resetUserId })
          : action === "reset-vote"
          ? JSON.stringify({ action, voteId })
          : JSON.stringify({ action });

      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (response.ok) {
        alert("Reset successful");
        fetchData(); // Refresh the data
        if (action === "reset-user") setResetUserId("");
        if (action === "reset-vote") setVoteId("");
      } else {
        alert("Failed to reset");
      }
    } catch (error) {
      console.error("Error resetting:", error);
      alert("Error resetting");
    }
  };
  const handleLookupVote = async () => {
    try {
      const response = await fetch(`/api/admin/vote/${voteId}`);
      if (response.ok) {
        const data = await response.json();
        setVoteData(data);
      } else {
        alert("Failed to fetch vote data");
        setVoteData(null);
      }
    } catch (error) {
      console.error("Error looking up vote:", error);
      alert("Error looking up vote");
    }
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Reset Vote</h2>
        <input
          type="text"
          value={voteId}
          onChange={(e) => setVoteId(e.target.value)}
          placeholder="Enter vote ID to reset"
          className="border p-2 mr-2"
        />
        <button
          onClick={() => handleReset("reset-vote")}
          className="bg-red-500 text-white p-2 rounded"
        >
          Reset Vote
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Look Up Vote</h2>
        <input
          type="text"
          value={voteId}
          onChange={(e) => setVoteId(e.target.value)}
          placeholder="Enter vote ID to look up"
          className="border p-2 mr-2"
        />
        <button
          onClick={handleLookupVote}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Look Up Vote
        </button>
      </div>

      {voteData && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Vote Data:</h3>
          <pre>{JSON.stringify(voteData, null, 2)}</pre>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Reset User</h2>
        <input
          type="text"
          value={resetUserId}
          onChange={(e) => setResetUserId(e.target.value)}
          placeholder="Enter user ID to reset"
          className="border p-2 mr-2"
        />
        <button
          onClick={() => handleReset("reset-user")}
          className="bg-yellow-500 text-white p-2 rounded"
        >
          Reset User
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Global Actions</h2>
        <button
          onClick={() => handleReset("reset-all")}
          className="bg-red-700 text-white p-2 rounded mr-2"
        >
          Reset All Data
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Voted Users:</h2>
        <ul className="list-disc pl-5">
          {data.votedUsers.map((user: string) => (
            <li key={user}>{user}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

The Admin Dashboard component provides an interface for managing the voting system:

1. Displays current voting statistics and user data.
2. Allows resetting of individual votes, specific contests, or all data.
3. Provides a lookup function for specific vote details.

This component is crucial for maintaining the system and troubleshooting issues that may arise during the voting process.

## 6. Database and Storage

The application uses Vercel KV, a key-value storage solution, for data persistence. This choice offers several advantages:

1. **Simplicity**: Key-value storage provides a straightforward data model that aligns well with the application's needs.
2. **Performance**: Vercel KV offers low-latency access to data, crucial for real-time voting applications.
3. **Scalability**: As a cloud-based solution, it can handle increasing data volumes without significant configuration changes.
4. **Integration**: Tight integration with Vercel's serverless functions allows for efficient data operations.

The application uses Vercel KV to store contest details, vote counts, and user voting records. The use of unique IDs as keys allows for efficient retrieval and updating of contest-specific data.

## 7. Image Generation

A key feature of the application is its ability to generate dynamic images for Warpcast frames. This is handled by the `og/route.tsx` file:

```1:67:app/og/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

const MAX_LENGTH = 100;
const GRADIENT = "linear-gradient(90deg, #9945FF, #14F195)";
const FONT_STYLE = {
  backgroundImage: GRADIENT,
  backgroundClip: "text",
  color: "transparent",
  fontSize: 40,
  fontWeight: 700,
  margin: 0,
  marginTop: 20,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title =
      searchParams.get("title")?.slice(0, MAX_LENGTH) || "Default Title";
    const resultsParam = searchParams.get("results");
    const results = resultsParam ? JSON.parse(resultsParam) : null;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            backgroundColor: "#2C2C2C",
            fontWeight: 700,
            textAlign: "center",
            padding: "40px",
          }}
        >
          <p style={{ ...FONT_STYLE, marginBottom: 20, fontSize: 50 }}>
            {title}
          </p>
          <p style={{ ...FONT_STYLE, marginBottom: 30, fontSize: 50 }}>
            Results:
          </p>
          {results &&
            results.map((result: any, index: number) => (
              <p
                key={index}
                style={{ ...FONT_STYLE, fontSize: 40, marginBottom: 10 }}
              >
                {result.option}: {result.percentage}% ({result.count} votes)
              </p>
            ))}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e instanceof Error ? e.message : "An unknown error occurred");
    return new Response(`Failed to generate the image`, { status: 500 });
  }
}
```

This component uses Next.js's `ImageResponse` to create dynamic OpenGraph images. Its features include:

1. **Dynamic Content**: Generates images based on contest titles and results.
2. **Styling**: Applies custom styles to create visually appealing images.
3. **Error Handling**: Provides fallback responses in case of generation failures.

The dynamic image generation is crucial for creating engaging Warpcast frames and displaying up-to-date voting results visually.

## 8. Deployment and Hosting

The application is deployed and hosted on Vercel, which offers several benefits:

1. **Serverless Architecture**: Allows the application to scale automatically based on demand.
2. **Edge Network**: Provides low-latency access to users worldwide.
3. **Integrated CI/CD**: Simplifies the deployment process with automatic builds and deployments.
4. **Environment Variables**: Securely manages sensitive information like API keys.

Vercel's platform is particularly well-suited for Next.js applications, providing optimized builds and seamless integration with other Vercel services like Vercel KV.

## 9. Advantages of the Tech Stack

The chosen technology stack offers numerous advantages for rapid and efficient application development:

1. **Next.js**:

   - Server-side rendering improves initial load times and SEO.
   - API routes simplify backend logic implementation.
   - Automatic code splitting optimizes performance.

2. **TypeScript**:

   - Static typing reduces runtime errors and improves code quality.
   - Enhanced IDE support increases developer productivity.
   - Improved code maintainability and refactoring capabilities.

3. **Tailwind CSS**:

   - Rapid UI development with utility classes.
   - Consistent design system across the application.
   - Smaller CSS bundle sizes due to purging unused styles.

4. **Vercel KV**:

   - Simplified data storage without the need for a traditional database setup.
   - Low-latency access to data improves application responsiveness.
   - Seamless integration with Vercel's serverless functions.

5. **Vercel Hosting**:
   - Optimized for Next.js applications.
   - Automatic HTTPS and custom domain support.
   - Easy scaling and global content delivery.

## 10. Conclusion

This web application demonstrates an efficient and modern approach to creating interactive voting frames for Warpcast users. By leveraging Next.js, TypeScript, Tailwind CSS, and Vercel's ecosystem, it achieves a balance of performance, scalability, and developer productivity.

The application's architecture, centered around serverless functions and key-value storage, allows for rapid development and easy scaling. The use of dynamic image generation and real-time data updates creates an engaging user experience.

While there's always room for improvement and expansion, this application serves as a solid foundation for building interactive, real-time voting systems integrated with social platforms like Warpcast.
