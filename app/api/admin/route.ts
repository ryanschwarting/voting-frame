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
