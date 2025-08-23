import { MarkdownConverter } from "../markdown-converter";
import { marked } from "marked";
import { JSDOM } from "jsdom";

jest.mock("marked");
jest.mock("jsdom");
jest.mock("@actions/core", () => ({
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  setFailed: jest.fn(),
  getInput: jest.fn(),
  setOutput: jest.fn(),
}));

const mockedMarked = marked as jest.MockedFunction<typeof marked>;

describe("MarkdownConverter", () => {
  let converter: MarkdownConverter;

  beforeEach(() => {
    converter = new MarkdownConverter();
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize marked with correct options", () => {
      new MarkdownConverter();
      expect(marked.setOptions).toHaveBeenCalledWith({
        breaks: true,
        gfm: true,
      });
    });
  });

  describe("convertToTelegraphNodes", () => {
    it("should convert markdown to Telegraph nodes", () => {
      const markdown = "# Hello World\n\nThis is **bold** text.";
      const mockHtml =
        "<h1>Hello World</h1><p>This is <strong>bold</strong> text.</p>";

      mockedMarked.mockReturnValue(mockHtml);

      const mockDocument = {
        querySelector: jest.fn().mockReturnValue({
          childNodes: [
            {
              nodeType: 1,
              tagName: "H1",
              childNodes: [{ nodeType: 3, textContent: "Hello World" }],
            },
            {
              nodeType: 1,
              tagName: "P",
              childNodes: [
                { nodeType: 3, textContent: "This is " },
                {
                  nodeType: 1,
                  tagName: "STRONG",
                  childNodes: [{ nodeType: 3, textContent: "bold" }],
                },
                { nodeType: 3, textContent: " text." },
              ],
            },
          ],
        }),
      };

      (JSDOM as jest.MockedClass<typeof JSDOM>).mockImplementation(
        () => ({ window: { document: mockDocument } }) as any
      );

      const result = converter.convertToTelegraphNodes(markdown);

      expect(mockedMarked).toHaveBeenCalledWith(markdown);
      expect(result).toHaveLength(2);
      expect(result[0].tag).toBe("h3");
      expect(result[1].tag).toBe("p");
    });

    it("should handle conversion errors", () => {
      const markdown = "# Test";
      mockedMarked.mockImplementation(() => {
        throw new Error("Conversion error");
      });

      expect(() => converter.convertToTelegraphNodes(markdown)).toThrow(
        "Conversion error"
      );
    });
  });

  describe("convertToTelegraphNodesSimple", () => {
    it("should convert simple markdown headers", () => {
      const markdown = "# H1 Title\n## H2 Title\n### H3 Title";

      const result = converter.convertToTelegraphNodesSimple(markdown);

      expect(result).toHaveLength(2); // H1 is skipped to avoid title duplication
      expect(result[0]).toEqual({ tag: "h3", children: ["H2 Title"] });
      expect(result[1]).toEqual({ tag: "h4", children: ["H3 Title"] });
    });

    it("should convert code blocks", () => {
      const markdown = '```javascript\nconsole.log("hello");\n```';

      const result = converter.convertToTelegraphNodesSimple(markdown);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tag: "pre",
        children: ['console.log("hello");'],
      });
    });

    it("should convert blockquotes", () => {
      const markdown = "> This is a quote\n> Second line";

      const result = converter.convertToTelegraphNodesSimple(markdown);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        tag: "blockquote",
        children: ["This is a quote"],
      });
      expect(result[1]).toEqual({
        tag: "blockquote",
        children: ["Second line"],
      });
    });

    it("should convert regular paragraphs with inline formatting", () => {
      const markdown = "This is **bold** and *italic* text with `code`.";

      const result = converter.convertToTelegraphNodesSimple(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].tag).toBe("p");
      const children = result[0].children as Array<any>;
      expect(children).toContain("This is ");
      expect(children).toContainEqual({ tag: "strong", children: ["bold"] });
      expect(children).toContain(" and ");
      expect(children).toContainEqual({ tag: "em", children: ["italic"] });
      expect(children).toContain(" text with ");
      expect(children).toContainEqual({ tag: "code", children: ["code"] });
      expect(children).toContain(".");
    });

    it("should convert links", () => {
      const markdown = "Check out [Google](https://google.com) for search.";

      const result = converter.convertToTelegraphNodesSimple(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].tag).toBe("p");
      const children = result[0].children as Array<any>;
      expect(children).toContain("Check out ");
      expect(children).toContainEqual({
        tag: "a",
        children: ["Google"],
        attrs: { href: "https://google.com" },
      });
      expect(children).toContain(" for search.");
    });

    it("should skip empty lines", () => {
      const markdown = "# Title\n\n\n\nContent here\n\n";

      const result = converter.convertToTelegraphNodesSimple(markdown);

      expect(result).toHaveLength(1); // H1 is skipped to avoid title duplication
      expect(result[0]).toEqual({ tag: "p", children: ["Content here"] });
    });

    it("should handle frontmatter removal", () => {
      const markdown = "---\ntitle: Test\n---\n\n# Real Content";

      const result = converter.convertToTelegraphNodesSimple(markdown);

      expect(result).toHaveLength(0); // H1 is skipped to avoid title duplication
    });

    it("should handle empty markdown", () => {
      const markdown = "";

      const result = converter.convertToTelegraphNodesSimple(markdown);

      expect(result).toHaveLength(0);
    });

    it("should handle multiline code blocks correctly", () => {
      const markdown =
        '```python\ndef hello():\n    print("world")\n    return True\n```';

      const result = converter.convertToTelegraphNodesSimple(markdown);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tag: "pre",
        children: ['def hello():\n    print("world")\n    return True'],
      });
    });
  });

  describe("processInlineMarkdown", () => {
    it("should process bold text", () => {
      const text = "This is **bold** text";

      const result = (converter as any).processInlineMarkdown(text);

      expect(result).toBe("This is <strong>bold</strong> text");
    });

    it("should process italic text", () => {
      const text = "This is *italic* text";

      const result = (converter as any).processInlineMarkdown(text);

      expect(result).toBe("This is <em>italic</em> text");
    });

    it("should process inline code", () => {
      const text = "Use `console.log()` to debug";

      const result = (converter as any).processInlineMarkdown(text);

      expect(result).toBe("Use <code>console.log()</code> to debug");
    });

    it("should process links", () => {
      const text = "Visit [Google](https://google.com) website";

      const result = (converter as any).processInlineMarkdown(text);

      expect(result).toBe(
        'Visit <a href="https://google.com">Google</a> website'
      );
    });

    it("should process multiple formatting types", () => {
      const text =
        "**Bold** and *italic* with `code` and [link](https://example.com)";

      const result = (converter as any).processInlineMarkdown(text);

      expect(result).toBe(
        '<strong>Bold</strong> and <em>italic</em> with <code>code</code> and <a href="https://example.com">link</a>'
      );
    });

    it("should process internal markdown links with resolver", () => {
      const text = "Check [guide](./guide.md) for details.";
      const basePath = "README.md";
      const linkResolver = (path: string) => {
        if (path === "guide.md") return "https://telegra.ph/Guide-123";
        return path;
      };

      const result = (converter as any).processInlineMarkdown(
        text,
        basePath,
        linkResolver
      );

      expect(result).toBe(
        'Check <a href="https://telegra.ph/Guide-123">guide</a> for details.'
      );
    });

    it("should handle nested formatting", () => {
      const text = "**Bold with *nested italic* text**";

      const result = (converter as any).processInlineMarkdown(text);

      expect(result).toContain("<strong>");
      expect(result).toContain("<em>");
    });
  });

  describe("removeFrontmatter", () => {
    it("should remove frontmatter", () => {
      const content = "---\ntitle: Test\nauthor: John\n---\n\n# Content";

      const result = (converter as any).removeFrontmatter(content);

      expect(result).toBe("# Content");
    });

    it("should return content unchanged if no frontmatter", () => {
      const content = "# Just content here";

      const result = (converter as any).removeFrontmatter(content);

      expect(result).toBe(content);
    });

    it("should handle incomplete frontmatter", () => {
      const content = "---\ntitle: Test\n# Content without closing dashes";

      const result = (converter as any).removeFrontmatter(content);

      expect(result).toBe(content);
    });
  });

  describe("mapHtmlTagToTelegraph", () => {
    it("should map common HTML tags correctly", () => {
      const converter = new MarkdownConverter();

      expect((converter as any).mapHtmlTagToTelegraph("p")).toBe("p");
      expect((converter as any).mapHtmlTagToTelegraph("strong")).toBe("strong");
      expect((converter as any).mapHtmlTagToTelegraph("b")).toBe("strong");
      expect((converter as any).mapHtmlTagToTelegraph("em")).toBe("em");
      expect((converter as any).mapHtmlTagToTelegraph("i")).toBe("em");
      expect((converter as any).mapHtmlTagToTelegraph("h1")).toBe("h3");
      expect((converter as any).mapHtmlTagToTelegraph("h2")).toBe("h3");
      expect((converter as any).mapHtmlTagToTelegraph("h3")).toBe("h3");
      expect((converter as any).mapHtmlTagToTelegraph("h4")).toBe("h4");
      expect((converter as any).mapHtmlTagToTelegraph("code")).toBe("code");
      expect((converter as any).mapHtmlTagToTelegraph("a")).toBe("a");
    });

    it("should return null for unsupported tags", () => {
      const converter = new MarkdownConverter();

      expect((converter as any).mapHtmlTagToTelegraph("div")).toBeNull();
      expect((converter as any).mapHtmlTagToTelegraph("span")).toBeNull();
      expect((converter as any).mapHtmlTagToTelegraph("table")).toBeNull();
    });
  });
});
