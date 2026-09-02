import { describe, expect, it } from "vitest";
import { buildStatsLine, formatPublishedLabel, formatViewLabel } from "../src/format/stats";
import { parseChannelFromNext, parseVideoDescriptionFromNext, parseVideoEngagementFromNext, parseVideoTitleFromNext } from "../src/providers/engagement";

describe("formatViewLabel", () => {
  it("formats raw counts", () => {
    expect(formatViewLabel("1810717469")).toBe("1.8B views");
  });

  it("keeps preformatted labels", () => {
    expect(formatViewLabel("1,810,717,469 views")).toBe("1,810,717,469 views");
  });
});

describe("formatPublishedLabel", () => {
  it("formats ISO dates", () => {
    expect(formatPublishedLabel("2009-10-24T23:57:33-07:00")).toBe("Oct 25, 2009");
  });

  it("keeps relative text", () => {
    expect(formatPublishedLabel("1 year ago")).toBe("1 year ago");
  });
});

describe("buildStatsLine", () => {
  it("joins available stats", () => {
    const line = buildStatsLine({
      kind: "video",
      canonicalUrl: "https://www.youtube.com/watch?v=x",
      title: "t",
      description: "d",
      viewCount: "1000",
      likes: "50",
      publishedAt: "Oct 24, 2009",
    });
    expect(line).toContain("views");
    expect(line).toContain("likes");
    expect(line).toContain("Oct 24, 2009");
  });
});

describe("parseVideoEngagementFromNext", () => {
  it("extracts likes and date from accessibility text", () => {
    const parsed = parseVideoEngagementFromNext({
      accessibilityText: "like this video along with 19,367,636 other people",
      dateText: { simpleText: "Oct 24, 2009" },
      viewCount: {
        videoViewCountRenderer: {
          viewCount: { simpleText: "1,810,717,469 views" },
        },
      },
    });
    expect(parsed.likes).toBe("19,367,636");
    expect(parsed.publishedAt).toBe("Oct 24, 2009");
    expect(parsed.viewCount).toBe("1,810,717,469");
  });
});

describe("parseVideoDescriptionFromNext", () => {
  it("extracts attributed description body", () => {
    const text = parseVideoDescriptionFromNext({
      attributedDescriptionBodyText: {
        content: "Line one\nLine two",
      },
    });
    expect(text).toBe("Line one\nLine two");
  });
});

describe("parseChannelFromNext", () => {
  it("extracts channel from videoSecondaryInfoRenderer", () => {
    const channel = parseChannelFromNext({
      videoSecondaryInfoRenderer: {
        owner: {
          videoOwnerRenderer: {
            title: { runs: [{ text: "Rick Astley" }] },
          },
        },
      },
    });
    expect(channel).toBe("Rick Astley");
  });
});

describe("parseVideoTitleFromNext", () => {
  it("extracts title from videoPrimaryInfoRenderer", () => {
    const title = parseVideoTitleFromNext({
      videoPrimaryInfoRenderer: {
        title: { runs: [{ text: "Me at the zoo" }] },
      },
    });
    expect(title).toBe("Me at the zoo");
  });
});
