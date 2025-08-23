"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownConverter = void 0;
const marked_1 = require("marked");
const core = __importStar(require("@actions/core"));
const jsdom_1 = require("jsdom");
const path = __importStar(require("path"));
class MarkdownConverter {
    constructor() {
        this.setupRenderer();
    }
    setupRenderer() {
        marked_1.marked.setOptions({
            breaks: true,
            gfm: true,
        });
    }
    convertToTelegraphNodes(markdown) {
        try {
            const html = (0, marked_1.marked)(markdown);
            return this.htmlToTelegraphNodes(html);
        }
        catch (error) {
            core.error(`Failed to convert markdown: ${error}`);
            throw error;
        }
    }
    htmlToTelegraphNodes(html) {
        const nodes = [];
        // Remove frontmatter if present
        const cleanedHtml = this.removeFrontmatter(html);
        // Parse HTML and convert to Telegraph nodes using JSDOM
        const dom = new jsdom_1.JSDOM(`<div>${cleanedHtml}</div>`);
        const container = dom.window.document.querySelector("div");
        if (container) {
            for (const child of Array.from(container.childNodes)) {
                const node = this.convertHtmlNodeToTelegraphNode(child);
                if (node) {
                    if (typeof node === "string") {
                        // Wrap plain text in a paragraph node
                        nodes.push({ tag: "p", children: [node] });
                    }
                    else {
                        nodes.push(node);
                    }
                }
            }
        }
        return nodes;
    }
    removeFrontmatter(content) {
        if (content.startsWith("---")) {
            const endIndex = content.indexOf("---", 3);
            if (endIndex !== -1) {
                return content.substring(endIndex + 3).trim();
            }
        }
        return content;
    }
    convertHtmlNodeToTelegraphNode(node) {
        if (node.nodeType === 3) {
            // TEXT_NODE
            const text = node.textContent?.trim();
            return text ? text : null;
        }
        if (node.nodeType === 1) {
            // ELEMENT_NODE
            const element = node;
            const tagName = element.tagName.toLowerCase();
            // Map HTML tags to Telegraph supported tags
            const telegraphTag = this.mapHtmlTagToTelegraph(tagName);
            if (!telegraphTag) {
                // For unsupported tags, return the text content
                return element.textContent?.trim() || null;
            }
            const children = [];
            for (const child of Array.from(element.childNodes)) {
                const convertedChild = this.convertHtmlNodeToTelegraphNode(child);
                if (convertedChild !== null && typeof convertedChild === "string") {
                    children.push(convertedChild);
                }
                else if (convertedChild !== null &&
                    typeof convertedChild === "object") {
                    children.push(convertedChild);
                }
            }
            const telegraphNode = {
                tag: telegraphTag,
                children: children.length > 0 ? children : undefined,
            };
            // Add attributes for specific tags
            if (tagName === "a" && element.hasAttribute("href")) {
                telegraphNode.attrs = { href: element.getAttribute("href") };
            }
            else if (tagName === "img" && element.hasAttribute("src")) {
                telegraphNode.attrs = { src: element.getAttribute("src") };
            }
            return telegraphNode;
        }
        return null;
    }
    mapHtmlTagToTelegraph(htmlTag) {
        const tagMap = {
            p: "p",
            br: "br",
            strong: "strong",
            b: "strong",
            em: "em",
            i: "em",
            u: "u",
            del: "s",
            s: "s",
            strike: "s",
            code: "code",
            pre: "pre",
            a: "a",
            h1: "h3", // Telegraph doesn't support h1, h2
            h2: "h3",
            h3: "h3",
            h4: "h4",
            h5: "h4",
            h6: "h4",
            blockquote: "blockquote",
            figure: "figure",
            img: "img",
            video: "video",
            iframe: "iframe",
            figcaption: "figcaption",
            ul: "ul",
            ol: "ol",
            li: "li",
        };
        return tagMap[htmlTag] || null;
    }
    // Simplified version that works without DOM parser for Node.js environment
    convertToTelegraphNodesSimple(markdown, basePath, linkResolver) {
        // Remove frontmatter
        const cleanedMarkdown = this.removeFrontmatter(markdown);
        const nodes = [];
        const lines = cleanedMarkdown.split("\n");
        let skipFirstH1 = true; // Skip the first H1 since it's used as the page title
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
                continue;
            }
            // Handle headers
            if (line.startsWith("#")) {
                const level = line.match(/^#+/)?.[0].length || 1;
                const text = line.replace(/^#+\s*/, "");
                // Skip the first H1 header to avoid title duplication
                if (level === 1 && skipFirstH1) {
                    skipFirstH1 = false;
                    continue;
                }
                const tag = level <= 2 ? "h3" : "h4";
                nodes.push({ tag, children: [text] });
                continue;
            }
            // Handle code blocks
            if (line.startsWith("```")) {
                const codeLines = [];
                i++; // Skip opening ```
                while (i < lines.length && !lines[i].trim().startsWith("```")) {
                    codeLines.push(lines[i]);
                    i++;
                }
                if (codeLines.length > 0) {
                    nodes.push({ tag: "pre", children: [codeLines.join("\n")] });
                }
                continue;
            }
            // Handle blockquotes
            if (line.startsWith(">")) {
                const text = line.replace(/^>\s*/, "");
                nodes.push({ tag: "blockquote", children: [text] });
                continue;
            }
            // Regular paragraph
            const processedNodes = this.processInlineMarkdownToNodes(line, basePath, linkResolver);
            if (processedNodes.length > 0) {
                nodes.push({ tag: "p", children: processedNodes });
            }
        }
        return nodes;
    }
    processInlineMarkdown(text, basePath, linkResolver) {
        let processedText = text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/`(.*?)`/g, "<code>$1</code>");
        // Handle links with potential internal markdown resolution
        processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, href) => {
            const resolvedHref = this.resolveLink(href, basePath, linkResolver);
            return `<a href="${resolvedHref}">${linkText}</a>`;
        });
        return processedText;
    }
    processInlineMarkdownToNodes(text, basePath, linkResolver) {
        const nodes = [];
        let currentIndex = 0;
        // Define regex patterns for different markdown elements
        const patterns = [
            { regex: /\*\*(.*?)\*\*/g, tag: "strong" },
            { regex: /\*(.*?)\*/g, tag: "em" },
            { regex: /`(.*?)`/g, tag: "code" },
            { regex: /\[([^\]]+)\]\(([^)]+)\)/g, tag: "a" },
        ];
        // Find all matches and their positions
        const matches = [];
        for (const pattern of patterns) {
            pattern.regex.lastIndex = 0; // Reset regex
            let match;
            while ((match = pattern.regex.exec(text)) !== null) {
                if (pattern.tag === "a") {
                    // Special handling for links
                    const linkText = match[1];
                    const href = match[2];
                    const resolvedHref = this.resolveLink(href, basePath, linkResolver);
                    matches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: linkText,
                        tag: pattern.tag,
                        href: resolvedHref,
                    });
                }
                else {
                    matches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[1],
                        tag: pattern.tag,
                    });
                }
            }
        }
        // Sort matches by start position
        matches.sort((a, b) => a.start - b.start);
        // Remove overlapping matches (keep the first one)
        const filteredMatches = [];
        let lastEnd = -1;
        for (const match of matches) {
            if (match.start >= lastEnd) {
                filteredMatches.push(match);
                lastEnd = match.end;
            }
        }
        // Build nodes array
        for (const match of filteredMatches) {
            // Add any text before this match
            if (currentIndex < match.start) {
                const beforeText = text.substring(currentIndex, match.start);
                if (beforeText.trim()) {
                    nodes.push(beforeText);
                }
            }
            // Add the matched element as a node
            const node = {
                tag: match.tag,
                children: [match.text],
            };
            if (match.href) {
                node.attrs = { href: match.href };
            }
            nodes.push(node);
            currentIndex = match.end;
        }
        // Add any remaining text
        if (currentIndex < text.length) {
            const remainingText = text.substring(currentIndex);
            if (remainingText.trim()) {
                nodes.push(remainingText);
            }
        }
        // If no matches were found, return the original text
        if (nodes.length === 0 && text.trim()) {
            return [text];
        }
        return nodes;
    }
    resolveLink(href, basePath, linkResolver) {
        // Skip external URLs (http/https)
        if (href.startsWith("http://") || href.startsWith("https://")) {
            return href;
        }
        // Skip anchors, mailto, etc.
        if (href.startsWith("#") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:")) {
            return href;
        }
        // Handle internal markdown links
        if (href.includes(".md") && basePath && linkResolver) {
            // Extract just the path part, ignoring query parameters and anchors
            let pathPart = href.split("?")[0].split("#")[0];
            let resolvedPath;
            if (pathPart.startsWith("./") || pathPart.startsWith("../")) {
                // Relative path
                resolvedPath = path.resolve(path.dirname(basePath), pathPart);
                // Convert absolute path back to relative from workspace root
                resolvedPath = path.relative(process.cwd(), resolvedPath);
            }
            else if (pathPart.startsWith("/")) {
                // Absolute path from repo root
                resolvedPath = pathPart.substring(1);
            }
            else {
                // Relative to current directory
                resolvedPath = path.join(path.dirname(basePath), pathPart);
            }
            // Normalize path separators for consistent lookup
            resolvedPath = resolvedPath.replace(/\\/g, "/");
            const telegraphUrl = linkResolver(resolvedPath);
            if (telegraphUrl && telegraphUrl !== resolvedPath) {
                return telegraphUrl;
            }
            core.warning(`Could not resolve internal link: ${href} from ${basePath}`);
        }
        return href;
    }
}
exports.MarkdownConverter = MarkdownConverter;
//# sourceMappingURL=markdown-converter.js.map