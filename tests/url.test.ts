import { describe, expect, it } from "vitest";
import { parseYouTubeInput, parseYouTubePath } from "../src/parsers/url";

describe("parseYouTubePath", () => {
  it("parses watch URLs", () => {
    const parsed = parseYouTubePath("/watch", "?v=dQw4w9WgXcQ");
    expect(parsed?.kind).toBe("video");
    expect(parsed?.videoId).toBe("dQw4w9WgXcQ");
  });

  it("parses shorts", () => {
    const parsed = parseYouTubePath("/shorts/abcdEFGhijk", "");
    expect(parsed?.kind).toBe("short");
    expect(parsed?.videoId).toBe("abcdEFGhijk");
  });

  it("parses community posts", () => {
    const parsed = parseYouTubePath("/post/UgkxAbCdEfGh", "");
    expect(parsed?.kind).toBe("post");
    expect(parsed?.postId).toBe("UgkxAbCdEfGh");
  });
});

describe("parseYouTubeInput", () => {
  it("parses youtu.be links", () => {
    const parsed = parseYouTubeInput("https://youtu.be/dQw4w9WgXcQ");
    expect(parsed?.videoId).toBe("dQw4w9WgXcQ");
  });

  it("parses fixyoutube links", () => {
    const parsed = parseYouTubeInput("https://fixyoutube.com/watch?v=dQw4w9WgXcQ");
    expect(parsed?.videoId).toBe("dQw4w9WgXcQ");
  });
});
