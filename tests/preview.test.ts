import { describe, expect, it } from "vitest";
import { buildDiscordDescription, buildEmbedDescription, buildPreviewBlurb, buildSocialDescription, excerptDescription } from "../src/format/stats";
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

describe("excerptDescription", () => {
  it("keeps the first few lines", () => {
    const text = "Line one\nLine two\nLine three\nLine four\nLine five";
    expect(excerptDescription(text, 3)).toBe("Line one\nLine two\nLine three");
  });
});

describe("buildDiscordDescription", () => {
  it("includes stats and excerpt without channel name", () => {
    const line = buildDiscordDescription({
      kind: "video",
      canonicalUrl: "https://www.youtube.com/watch?v=x",
      title: "Trump vs Bonnie",
      description: "First line\nSecond line",
      author: "Some Channel",
      viewCount: "1200000",
      likes: "50000",
      publishedAt: "Jan 2, 2024",
    });
    expect(line).not.toContain("Some Channel");
    expect(line).toContain("views");
    expect(line).toContain("First line");
  });

  it("shows stats when the video has no description", () => {
    const line = buildDiscordDescription({
      kind: "video",
      canonicalUrl: "https://www.youtube.com/watch?v=x",
      title: "Trump vs Bonnie",
      description: "",
      author: "Lynix_North",
      viewCount: "2914428",
      likes: "212448",
      publishedAt: "Aug 12, 2022",
    });
    expect(line).toContain("views");
    expect(line).toContain("likes");
    expect(line).not.toContain("Lynix_North");
  });
});

describe("buildSocialDescription", () => {
  it("is a single line with channel, stats, and description", () => {
    const line = buildSocialDescription({
      kind: "video",
      canonicalUrl: "https://www.youtube.com/watch?v=x",
      title: "Trump vs Bonnie",
      description: "First line\nSecond line\nThird line",
      author: "Some Channel",
      viewCount: "1200000",
      likes: "50000",
      publishedAt: "Jan 2, 2024",
    });
    expect(line).not.toContain("\n");
    expect(line).toContain("Some Channel");
    expect(line).toContain("views");
    expect(line).toContain("First line");
    expect(line).toContain("Second line");
  });
});

describe("buildEmbedDescription", () => {
  it("includes channel, stats, and description lines", () => {
    const desc = buildEmbedDescription({
      kind: "video",
      canonicalUrl: "https://www.youtube.com/watch?v=x",
      title: "Trump vs Bonnie",
      description: "First line\nSecond line\nThird line",
      author: "Some Channel",
      viewCount: "1200000",
      likes: "50000",
      publishedAt: "Jan 2, 2024",
    });
    expect(desc).toContain("Some Channel");
    expect(desc).toContain("views");
    expect(desc).toContain("First line");
    expect(desc).toContain("Second line");
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
