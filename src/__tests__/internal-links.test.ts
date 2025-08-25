import { describe, test, expect, beforeEach, mock } from "bun:test";
import { MarkdownConverter } from "../markdown-converter";

// Mock the marked function with setOptions method
const mockMarked = mock(() => "") as any;
mockMarked.setOptions = mock(() => {});

mock.module("marked", () => ({
  marked: mockMarked,
}));

const mockWarning = mock(() => {});

mock.module("@actions/core", () => ({
  info: mock(() => {}),
  warning: mockWarning,
  error: mock(() => {}),
}));

describe("Internal Link Resolution", () => {
  let converter: MarkdownConverter;

  beforeEach(() => {
    converter = new MarkdownConverter();
    mock.restore();
  });

  describe("convertToTelegraphNodesSimple with link resolution", () => {
    test("should resolve relative markdown links", () => {
      const markdown = "Check out the [guide](./docs/guide.md) for more info.";
      const basePath = "README.md";
      const linkResolver = (path: string): string => {
        const links: Record<string, string> = {
          "docs/guide.md": "https://telegra.ph/Guide-123",
        };
        return links[path] || path;
      };

      const result = converter.convertToTelegraphNodesSimple(
        markdown,
        basePath,
        linkResolver
      );

      expect(result).toHaveLength(1);
      expect(result[0].tag).toBe("p");
      const children = result[0].children as Array<any>;
      expect(children).toContain("Check out the ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["guide"],
        attrs: { href: "https://telegra.ph/Guide-123" },
      });
    });

    test("should resolve parent directory markdown links", () => {
      const markdown = "See the [README](../README.md) file.";
      const basePath = "docs/guide.md";
      const linkResolver = (path: string): string => {
        const links: Record<string, string> = {
          "README.md": "https://telegra.ph/README-456",
        };
        return links[path] || path;
      };

      const result = converter.convertToTelegraphNodesSimple(
        markdown,
        basePath,
        linkResolver
      );

      expect(result).toHaveLength(1);
      const children = result[0].children as Array<any>;
      expect(children).toContain("See the ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["README"],
        attrs: { href: "https://telegra.ph/README-456" },
      });
      expect(children).toContain(" file.");
    });

    test("should leave external URLs unchanged", () => {
      const markdown = "Visit [Google](https://google.com) for search.";
      const basePath = "README.md";
      const linkResolver = () => "should-not-be-called";

      const result = converter.convertToTelegraphNodesSimple(
        markdown,
        basePath,
        linkResolver
      );

      expect(result).toHaveLength(1);
      const children = result[0].children as Array<any>;
      expect(children).toContain("Visit ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["Google"],
        attrs: { href: "https://google.com" },
      });
    });

    test("should leave anchor links unchanged", () => {
      const markdown = "Jump to [section](#header).";
      const basePath = "README.md";
      const linkResolver = () => "should-not-be-called";

      const result = converter.convertToTelegraphNodesSimple(
        markdown,
        basePath,
        linkResolver
      );

      expect(result).toHaveLength(1);
      const children = result[0].children as Array<any>;
      expect(children).toContain("Jump to ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["section"],
        attrs: { href: "#header" },
      });
      expect(children).toContain(".");
    });

    test("should handle mailto and tel links", () => {
      const markdown =
        "Contact [email](mailto:test@example.com) or [phone](tel:123-456-7890).";
      const basePath = "README.md";
      const linkResolver = () => "should-not-be-called";

      const result = converter.convertToTelegraphNodesSimple(
        markdown,
        basePath,
        linkResolver
      );

      expect(result).toHaveLength(1);
      const children = result[0].children as Array<any>;
      expect(children).toContain("Contact ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["email"],
        attrs: { href: "mailto:test@example.com" },
      });
      expect(children).toContain(" or ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["phone"],
        attrs: { href: "tel:123-456-7890" },
      });
    });

    test("should handle absolute path markdown links", () => {
      const markdown = "Check the [config](/config/settings.md).";
      const basePath = "docs/guide.md";
      const linkResolver = (path: string): string => {
        const links: Record<string, string> = {
          "config/settings.md": "https://telegra.ph/Config-789",
        };
        return links[path] || path;
      };

      const result = converter.convertToTelegraphNodesSimple(
        markdown,
        basePath,
        linkResolver
      );

      expect(result).toHaveLength(1);
      const children = result[0].children as Array<any>;
      expect(children).toContain("Check the ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["config"],
        attrs: { href: "https://telegra.ph/Config-789" },
      });
    });

    test("should handle complex relative paths", () => {
      const markdown = "See [API docs](../../api/reference.md).";
      const basePath = "docs/guides/tutorial.md";
      const linkResolver = (path: string): string => {
        const links: Record<string, string> = {
          "api/reference.md": "https://telegra.ph/API-Reference-999",
        };
        return links[path] || path;
      };

      const result = converter.convertToTelegraphNodesSimple(
        markdown,
        basePath,
        linkResolver
      );

      expect(result).toHaveLength(1);
      const children = result[0].children as Array<any>;
      expect(children).toContain("See ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["API docs"],
        attrs: { href: "https://telegra.ph/API-Reference-999" },
      });
    });

    test("should handle mixed link types in same content", () => {
      const markdown =
        "Check [guide](./guide.md), visit [Google](https://google.com), go to [section](#top), and see [config](/config.md).";
      const basePath = "README.md";
      const linkResolver = (path: string): string => {
        const links: Record<string, string> = {
          "guide.md": "https://telegra.ph/Guide-111",
          "config.md": "https://telegra.ph/Config-222",
        };
        return links[path] || path;
      };

      const result = converter.convertToTelegraphNodesSimple(
        markdown,
        basePath,
        linkResolver
      );

      expect(result).toHaveLength(1);
      const children = result[0].children as Array<any>;
      expect(children).toContain("Check ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["guide"],
        attrs: { href: "https://telegra.ph/Guide-111" },
      });
      expect(children).toContain(", visit ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["Google"],
        attrs: { href: "https://google.com" },
      });
      expect(children).toContain(", go to ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["section"],
        attrs: { href: "#top" },
      });
      expect(children).toContain(", and see ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["config"],
        attrs: { href: "https://telegra.ph/Config-222" },
      });
      expect(children).toContain(".");
    });

    test("should warn for unresolvable internal links", () => {
      // Reset the mock before the test
      mockWarning.mockClear();

      const markdown = "See [missing](./missing.md).";
      const basePath = "README.md";
      const linkResolver = (): string => ""; // Returns empty string for unresolved

      const result = converter.convertToTelegraphNodesSimple(
        markdown,
        basePath,
        linkResolver
      );

      expect(result).toHaveLength(1);
      expect(mockWarning).toHaveBeenCalledWith(
        expect.stringContaining(
          "Could not resolve internal link: ./missing.md from README.md"
        )
      );
    });

    test("should work without link resolver for backwards compatibility", () => {
      const markdown =
        "Check [guide](./guide.md) and [Google](https://google.com).";

      const result = converter.convertToTelegraphNodesSimple(markdown);

      expect(result).toHaveLength(1);
      const children = result[0].children as Array<any>;
      expect(children).toContain("Check ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["guide"],
        attrs: { href: "./guide.md" },
      });
      expect(children).toContain(" and ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["Google"],
        attrs: { href: "https://google.com" },
      });
      expect(children).toContain(".");
    });
  });

  describe("Link path resolution", () => {
    test("should normalize Windows-style paths", () => {
      const markdown = "Check [guide](docs\\guide.md).";
      const basePath = "README.md";
      const linkResolver = (path: string): string => {
        expect(path).toBe("docs/guide.md"); // Should be normalized
        return "https://telegra.ph/Guide-Normalized";
      };

      converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);
    });

    test("should handle paths with query parameters and anchors", () => {
      const markdown = "Check [guide](./guide.md#section?param=value).";
      const basePath = "README.md";
      const linkResolver = () => "https://telegra.ph/Guide-WithParams";

      const result = converter.convertToTelegraphNodesSimple(
        markdown,
        basePath,
        linkResolver
      );

      expect(result).toHaveLength(1);
      const children = result[0].children as Array<any>;
      expect(children).toContain("Check ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["guide"],
        attrs: { href: "https://telegra.ph/Guide-WithParams" },
      });
    });
  });
});
