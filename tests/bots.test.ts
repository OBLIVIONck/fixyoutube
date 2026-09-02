import { describe, expect, it } from "vitest";
import { isEmbedBot } from "../src/bots";

const IMESSAGE_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0";

describe("isEmbedBot", () => {
  it("detects Discord", () => {
    expect(isEmbedBot("Discordbot/2.0")).toBe(true);
  });

  it("detects iMessage spoofed crawler UA", () => {
    expect(isEmbedBot(IMESSAGE_UA)).toBe(true);
  });

  it("detects Facebot alone", () => {
    expect(isEmbedBot("Facebot/1.0")).toBe(true);
  });

  it("does not treat normal Safari as a bot", () => {
    expect(
      isEmbedBot(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      )
    ).toBe(false);
  });
});
