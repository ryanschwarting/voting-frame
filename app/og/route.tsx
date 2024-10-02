import { ImageResponse } from "next/og";
// App router includes @vercel/og.
// No need to install it.

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ?title=<title>
    const hasTitle = searchParams.has("title");
    const title = hasTitle
      ? searchParams.get("title")?.slice(0, 100)
      : "Default Title";

    // ?description1=
    const hasDescription1 = searchParams.has("description1");
    const description1 = hasDescription1
      ? searchParams.get("description1")?.slice(0, 100)
      : "";
    // ?description2=
    const hasDescription2 = searchParams.has("description2");
    const description2 = hasDescription2
      ? searchParams.get("description2")?.slice(0, 100)
      : "";

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
            // fontSize: ,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          <p
            style={{
              backgroundImage: "linear-gradient(90deg, #9945FF, #14F195)",
              backgroundClip: "text",
              color: "transparent",
              fontSize: 40,
              fontWeight: 700,
              marginBottom: 30,
            }}
          >
            {title}
          </p>
          {description1 && (
            <p
              style={{
                backgroundImage: "linear-gradient(90deg, #9945FF, #14F195)",
                backgroundClip: "text",
                color: "transparent",
                fontSize: 40,
                fontWeight: 700,
                margin: 0,
                marginTop: 20,
              }}
            >
              {description1}
            </p>
          )}
          {description2 && (
            <p
              style={{
                backgroundImage: "linear-gradient(90deg, #9945FF, #14F195)",
                backgroundClip: "text",
                color: "transparent",
                fontSize: 40,
                fontWeight: 700,
                margin: 0,
                marginTop: 20,
              }}
            >
              {description2}
            </p>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log(`${e.message}`);
    } else {
      console.log("An unknown error occurred");
    }
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
