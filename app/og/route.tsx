import { ImageResponse } from "next/og";

// Specify that this route should use the Edge Runtime
export const runtime = "edge";

// Constants for image generation
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

// Handle GET requests to generate the OG image
export async function GET(request: Request) {
  try {
    // Extract query parameters from the URL
    const { searchParams } = new URL(request.url);
    const title =
      searchParams.get("title")?.slice(0, MAX_LENGTH) || "Default Title";
    const resultsParam = searchParams.get("results");
    const results = resultsParam ? JSON.parse(resultsParam) : null;

    // Generate and return the image response
    return new ImageResponse(
      (
        <div
          style={{
            // Styles for the main container
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
          {/* Display the title */}
          <p style={{ ...FONT_STYLE, marginBottom: 20, fontSize: 50 }}>
            {title}
          </p>
          {/* Display "Results:" text */}
          <p style={{ ...FONT_STYLE, marginBottom: 30, fontSize: 50 }}>
            Results:
          </p>
          {/* Map through and display results if available */}
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
    // Error handling
    console.error(e instanceof Error ? e.message : "An unknown error occurred");
    return new Response(`Failed to generate the image`, { status: 500 });
  }
}
