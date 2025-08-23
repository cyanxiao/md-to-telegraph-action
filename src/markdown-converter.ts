import { marked } from 'marked';
import { Node } from './telegraph';
import * as core from '@actions/core';
import { JSDOM } from 'jsdom';
import * as path from 'path';

export class MarkdownConverter {
  constructor() {
    this.setupRenderer();
  }

  private setupRenderer(): void {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }

  convertToTelegraphNodes(markdown: string): Node[] {
    try {
      const html = marked(markdown);
      return this.htmlToTelegraphNodes(html);
    } catch (error) {
      core.error(`Failed to convert markdown: ${error}`);
      throw error;
    }
  }

  private htmlToTelegraphNodes(html: string): Node[] {
    const nodes: Node[] = [];
    
    // Remove frontmatter if present
    const cleanedHtml = this.removeFrontmatter(html);
    
    // Parse HTML and convert to Telegraph nodes using JSDOM
    const dom = new JSDOM(`<div>${cleanedHtml}</div>`);
    const container = dom.window.document.querySelector('div');
    
    if (container) {
      for (const child of Array.from(container.childNodes)) {
        const node = this.convertHtmlNodeToTelegraphNode(child);
        if (node) {
          if (typeof node === 'string') {
            // Wrap plain text in a paragraph node
            nodes.push({ tag: 'p', children: [node] });
          } else {
            nodes.push(node);
          }
        }
      }
    }
    
    return nodes;
  }

  private removeFrontmatter(content: string): string {
    if (content.startsWith('---')) {
      const endIndex = content.indexOf('---', 3);
      if (endIndex !== -1) {
        return content.substring(endIndex + 3).trim();
      }
    }
    return content;
  }

  private convertHtmlNodeToTelegraphNode(node: any): Node | string | null {
    if (node.nodeType === 3) { // TEXT_NODE
      const text = node.textContent?.trim();
      return text ? text : null;
    }

    if (node.nodeType === 1) { // ELEMENT_NODE
      const element = node as any;
      const tagName = element.tagName.toLowerCase();
      
      // Map HTML tags to Telegraph supported tags
      const telegraphTag = this.mapHtmlTagToTelegraph(tagName);
      
      if (!telegraphTag) {
        // For unsupported tags, return the text content
        return element.textContent?.trim() || null;
      }

      const children: Array<Node | string> = [];
      for (const child of Array.from(element.childNodes)) {
        const convertedChild = this.convertHtmlNodeToTelegraphNode(child);
        if (convertedChild !== null && typeof convertedChild === 'string') {
          children.push(convertedChild);
        } else if (convertedChild !== null && typeof convertedChild === 'object') {
          children.push(convertedChild as Node);
        }
      }

      const telegraphNode: Node = {
        tag: telegraphTag,
        children: children.length > 0 ? children : undefined,
      };

      // Add attributes for specific tags
      if (tagName === 'a' && element.hasAttribute('href')) {
        telegraphNode.attrs = { href: element.getAttribute('href') };
      } else if (tagName === 'img' && element.hasAttribute('src')) {
        telegraphNode.attrs = { src: element.getAttribute('src') };
      }

      return telegraphNode;
    }

    return null;
  }

  private mapHtmlTagToTelegraph(htmlTag: string): string | null {
    const tagMap: Record<string, string> = {
      'p': 'p',
      'br': 'br',
      'strong': 'strong',
      'b': 'strong',
      'em': 'em',
      'i': 'em',
      'u': 'u',
      'del': 's',
      's': 's',
      'strike': 's',
      'code': 'code',
      'pre': 'pre',
      'a': 'a',
      'h1': 'h3', // Telegraph doesn't support h1, h2
      'h2': 'h3',
      'h3': 'h3',
      'h4': 'h4',
      'h5': 'h4',
      'h6': 'h4',
      'blockquote': 'blockquote',
      'figure': 'figure',
      'img': 'img',
      'video': 'video',
      'iframe': 'iframe',
      'figcaption': 'figcaption',
      'ul': 'ul',
      'ol': 'ol',
      'li': 'li',
    };

    return tagMap[htmlTag] || null;
  }

  // Simplified version that works without DOM parser for Node.js environment
  convertToTelegraphNodesSimple(markdown: string, basePath?: string, linkResolver?: (link: string) => string): Node[] {
    // Remove frontmatter
    const cleanedMarkdown = this.removeFrontmatter(markdown);
    
    const nodes: Node[] = [];
    const lines = cleanedMarkdown.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        continue;
      }
      
      // Handle headers
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        const tag = level <= 2 ? 'h3' : 'h4';
        nodes.push({ tag, children: [text] });
        continue;
      }
      
      // Handle code blocks
      if (line.startsWith('```')) {
        const codeLines: string[] = [];
        i++; // Skip opening ```
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (codeLines.length > 0) {
          nodes.push({ tag: 'pre', children: [codeLines.join('\n')] });
        }
        continue;
      }
      
      // Handle blockquotes
      if (line.startsWith('>')) {
        const text = line.replace(/^>\s*/, '');
        nodes.push({ tag: 'blockquote', children: [text] });
        continue;
      }
      
      // Regular paragraph
      const processedLine = this.processInlineMarkdown(line, basePath, linkResolver);
      if (processedLine) {
        nodes.push({ tag: 'p', children: [processedLine] });
      }
    }
    
    return nodes;
  }

  private processInlineMarkdown(text: string, basePath?: string, linkResolver?: (link: string) => string): string {
    let processedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');

    // Handle links with potential internal markdown resolution
    processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, href) => {
      const resolvedHref = this.resolveLink(href, basePath, linkResolver);
      return `<a href="${resolvedHref}">${linkText}</a>`;
    });

    return processedText;
  }

  private resolveLink(href: string, basePath?: string, linkResolver?: (link: string) => string): string {
    // Skip external URLs (http/https)
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }

    // Skip anchors, mailto, etc.
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return href;
    }

    // Handle internal markdown links
    if (href.includes('.md') && basePath && linkResolver) {
      // Extract just the path part, ignoring query parameters and anchors
      let pathPart = href.split('?')[0].split('#')[0];
      
      let resolvedPath: string;
      
      if (pathPart.startsWith('./') || pathPart.startsWith('../')) {
        // Relative path
        resolvedPath = path.resolve(path.dirname(basePath), pathPart);
        // Convert absolute path back to relative from workspace root
        resolvedPath = path.relative(process.cwd(), resolvedPath);
      } else if (pathPart.startsWith('/')) {
        // Absolute path from repo root
        resolvedPath = pathPart.substring(1);
      } else {
        // Relative to current directory
        resolvedPath = path.join(path.dirname(basePath), pathPart);
      }

      // Normalize path separators for consistent lookup
      resolvedPath = resolvedPath.replace(/\\/g, '/');
      
      const telegraphUrl = linkResolver(resolvedPath);
      if (telegraphUrl && telegraphUrl !== resolvedPath) {
        return telegraphUrl;
      }
      
      core.warning(`Could not resolve internal link: ${href} from ${basePath}`);
    }

    return href;
  }
}