import { describe, expect, it } from "vitest";
import { renderEmbedPage } from "../src/embed/html";

describe("renderEmbedPage meta tags", () => {
  it("keeps og:description on one HTML line", () => {
    const html = renderEmbedPage(
      {
        kind: "video",
        canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Never Gonna Give You Up",
        description: "Line one\nLine two\nLine three",
        author: "Rick Astley",
        viewCount: "1800000000",
        likes: "19000000",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      },
      "https://fixyoutube.com"
    );

    const match = html.match(/<meta property="og:description" content="([^"]*)">/);
    expect(match).toBeTruthy();
    expect(match![0].includes("\n")).toBe(false);
    expect(match![1]).toContain("Line one");
    expect(match![1]).toContain("views");
    expect(html).not.toContain("og:video");
    expect(html).toContain("property=\"og:type\" content=\"website\"");
    expect(html).toContain("property=\"article:author\" content=\"Rick Astley\"");
  });
});
