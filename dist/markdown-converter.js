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
        // Convert nodes back to HTML for this method
        const nodes = this.parseMarkdownRecursively(text, basePath, linkResolver);
        return this.nodesToHtml(nodes);
    }
    nodesToHtml(nodes) {
        return nodes.map(node => {
            if (typeof node === 'string') {
                return node;
            }
            else {
                const children = this.nodesToHtml(node.children);
                if (node.attrs?.href) {
                    return `<${node.tag} href="${node.attrs.href}">${children}</${node.tag}>`;
                }
                return `<${node.tag}>${children}</${node.tag}>`;
            }
        }).join('');
    }
    processInlineMarkdownToNodes(text, basePath, linkResolver) {
        return this.parseMarkdownRecursively(text, basePath, linkResolver);
    }
    parseMarkdownRecursively(text, basePath, linkResolver) {
        const nodes = [];
        let currentIndex = 0;
        // Define regex patterns for different markdown elements in order of precedence
        // Code blocks should be processed first to avoid interference with other patterns
        const patterns = [
            { regex: /`([^`]+)`/g, tag: "code", priority: 1 },
            { regex: /\*\*([^*]+)\*\*/g, tag: "strong", priority: 2 },
            { regex: /\*([^*]+)\*/g, tag: "em", priority: 3 },
            { regex: /_([^_]+)_/g, tag: "em", priority: 3 },
            { regex: /\[([^\]]+)\]\(([^)]+)\)/g, tag: "a", priority: 4 },
        ];
        // Find the earliest match
        let earliestMatch = null;
        for (const pattern of patterns) {
            pattern.regex.lastIndex = 0; // Reset regex
            const match = pattern.regex.exec(text);
            if (match && (earliestMatch === null || match.index < earliestMatch.start)) {
                if (pattern.tag === "a") {
                    // Special handling for links
                    const linkText = match[1];
                    const href = match[2];
                    const resolvedHref = this.resolveLink(href, basePath, linkResolver);
                    earliestMatch = {
                        start: match.index,
                        end: match.index + match[0].length,
                        text: linkText,
                        tag: pattern.tag,
                        href: resolvedHref,
                        innerContent: linkText,
                    };
                }
                else {
                    earliestMatch = {
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[1],
                        tag: pattern.tag,
                        innerContent: match[1],
                    };
                }
            }
        }
        if (earliestMatch) {
            // Add any text before this match
            if (currentIndex < earliestMatch.start) {
                const beforeText = text.substring(currentIndex, earliestMatch.start);
                if (beforeText.trim()) {
                    nodes.push(beforeText);
                }
            }
            // Process the inner content recursively for nested formatting
            let children;
            if (earliestMatch.tag === "code") {
                // Code should not have nested formatting
                children = [earliestMatch.text];
            }
            else {
                // Recursively process the inner content
                children = this.parseMarkdownRecursively(earliestMatch.innerContent, basePath, linkResolver);
                // If no nested formatting found, use the original text
                if (children.length === 0) {
                    children = [earliestMatch.text];
                }
            }
            const node = {
                tag: earliestMatch.tag,
                children: children,
            };
            if (earliestMatch.href) {
                node.attrs = { href: earliestMatch.href };
            }
            nodes.push(node);
            // Process the remaining text after this match
            const remainingText = text.substring(earliestMatch.end);
            if (remainingText) {
                const remainingNodes = this.parseMarkdownRecursively(remainingText, basePath, linkResolver);
                nodes.push(...remainingNodes);
            }
        }
        else {
            // No matches found, return the text as-is
            if (text.trim()) {
                nodes.push(text);
            }
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