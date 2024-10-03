import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Default Title";
  const deadline = searchParams.get("deadline") || "No deadline set";

  try {
    // Load the background image
    const backgroundImageData = await fetch(
      new URL("../../public/vote.jpg", import.meta.url)
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundImage: `url(data:image/jpeg;base64,${Buffer.from(
              backgroundImageData
            ).toString("base64")})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              padding: "40px",
              borderRadius: "10px",
              maxWidth: "80%",
            }}
          >
            <h1
              style={{
                fontSize: 48,
                fontWeight: "bold",
                color: "white",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 32,
                color: "white",
                textAlign: "center",
                margin: 0,
              }}
            >
              Deadline: {new Date(deadline).toLocaleString()}
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
