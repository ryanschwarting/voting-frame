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
          <p style={{ ...FONT_STYLE, marginBottom: 20, fontSize: 60 }}>
            {title}
          </p>
          <p style={{ ...FONT_STYLE, marginBottom: 30, fontSize: 50 }}>
            Results:
          </p>
          {results &&
            results.map((result: any, index: number) => (
              <p
                key={index}
                style={{ ...FONT_STYLE, fontSize: 30, marginBottom: 10 }}
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
