import { describe, expect, it } from "vitest";
import { buildPreviewBlurb } from "../src/format/stats";
import { normalizePreviewImage } from "../src/providers/innertube";

describe("normalizePreviewImage", () => {
  it("converts youtube webp thumbs to jpg", () => {
    expect(
      normalizePreviewImage("https://i.ytimg.com/vi_webp/dQw4w9WgXcQ/maxresdefault.webp")
    ).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });

  it("falls back to hqdefault when only video id is known", () => {
    expect(normalizePreviewImage(undefined, "dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    );
  });
});

describe("buildPreviewBlurb", () => {
  it("includes author and stats", () => {
    const blurb = buildPreviewBlurb({
      kind: "video",
      canonicalUrl: "https://www.youtube.com/watch?v=x",
      title: "Trump vs Bonnie",
      description: "A cool video",
      author: "Some Channel",
      viewCount: "1200000",
      likes: "50000",
      publishedAt: "Jan 2, 2024",
    });
    expect(blurb).toContain("Some Channel");
    expect(blurb).toContain("views");
    expect(blurb).toContain("likes");
  });
});
