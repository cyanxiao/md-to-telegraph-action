import { MarkdownConverter } from '../markdown-converter';

jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
}));

describe('Internal Link Resolution', () => {
  let converter: MarkdownConverter;

  beforeEach(() => {
    converter = new MarkdownConverter();
    jest.clearAllMocks();
  });

  describe('convertToTelegraphNodesSimple with link resolution', () => {
    it('should resolve relative markdown links', () => {
      const markdown = 'Check out the [guide](./docs/guide.md) for more info.';
      const basePath = 'README.md';
      const linkResolver = (path: string): string => {
        const links: Record<string, string> = {
          'docs/guide.md': 'https://telegra.ph/Guide-123',
        };
        return links[path] || path;
      };

      const result = converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);

      expect(result).toHaveLength(1);
      expect(result[0].tag).toBe('p');
      expect(result[0].children?.[0]).toContain('https://telegra.ph/Guide-123');
      expect(result[0].children?.[0]).toContain('guide');
    });

    it('should resolve parent directory markdown links', () => {
      const markdown = 'See the [README](../README.md) file.';
      const basePath = 'docs/guide.md';
      const linkResolver = (path: string): string => {
        const links: Record<string, string> = {
          'README.md': 'https://telegra.ph/README-456',
        };
        return links[path] || path;
      };

      const result = converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);

      expect(result).toHaveLength(1);
      expect(result[0].children?.[0]).toContain('https://telegra.ph/README-456');
    });

    it('should leave external URLs unchanged', () => {
      const markdown = 'Visit [Google](https://google.com) for search.';
      const basePath = 'README.md';
      const linkResolver = () => 'should-not-be-called';

      const result = converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);

      expect(result).toHaveLength(1);
      expect(result[0].children?.[0]).toContain('https://google.com');
    });

    it('should leave anchor links unchanged', () => {
      const markdown = 'Jump to [section](#header).';
      const basePath = 'README.md';
      const linkResolver = () => 'should-not-be-called';

      const result = converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);

      expect(result).toHaveLength(1);
      expect(result[0].children?.[0]).toContain('#header');
    });

    it('should handle mailto and tel links', () => {
      const markdown = 'Contact [email](mailto:test@example.com) or [phone](tel:123-456-7890).';
      const basePath = 'README.md';
      const linkResolver = () => 'should-not-be-called';

      const result = converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);

      expect(result).toHaveLength(1);
      expect(result[0].children?.[0]).toContain('mailto:test@example.com');
      expect(result[0].children?.[0]).toContain('tel:123-456-7890');
    });

    it('should handle absolute path markdown links', () => {
      const markdown = 'Check the [config](/config/settings.md).';
      const basePath = 'docs/guide.md';
      const linkResolver = (path: string): string => {
        const links: Record<string, string> = {
          'config/settings.md': 'https://telegra.ph/Config-789',
        };
        return links[path] || path;
      };

      const result = converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);

      expect(result).toHaveLength(1);
      expect(result[0].children?.[0]).toContain('https://telegra.ph/Config-789');
    });

    it('should handle complex relative paths', () => {
      const markdown = 'See [API docs](../../api/reference.md).';
      const basePath = 'docs/guides/tutorial.md';
      const linkResolver = (path: string): string => {
        const links: Record<string, string> = {
          'api/reference.md': 'https://telegra.ph/API-Reference-999',
        };
        return links[path] || path;
      };

      const result = converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);

      expect(result).toHaveLength(1);
      expect(result[0].children?.[0]).toContain('https://telegra.ph/API-Reference-999');
    });

    it('should handle mixed link types in same content', () => {
      const markdown = 'Check [guide](./guide.md), visit [Google](https://google.com), go to [section](#top), and see [config](/config.md).';
      const basePath = 'README.md';
      const linkResolver = (path: string): string => {
        const links: Record<string, string> = {
          'guide.md': 'https://telegra.ph/Guide-111',
          'config.md': 'https://telegra.ph/Config-222',
        };
        return links[path] || path;
      };

      const result = converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);

      expect(result).toHaveLength(1);
      const content = result[0].children?.[0] as string;
      expect(content).toContain('https://telegra.ph/Guide-111');
      expect(content).toContain('https://google.com');
      expect(content).toContain('#top');
      expect(content).toContain('https://telegra.ph/Config-222');
    });

    it('should warn for unresolvable internal links', () => {
      const mockWarning = jest.fn();
      (require('@actions/core').warning as jest.Mock) = mockWarning;

      const markdown = 'See [missing](./missing.md).';
      const basePath = 'README.md';
      const linkResolver = (): string => ''; // Returns empty string for unresolved

      const result = converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);

      expect(result).toHaveLength(1);
      expect(mockWarning).toHaveBeenCalledWith(
        expect.stringContaining('Could not resolve internal link: ./missing.md from README.md')
      );
    });

    it('should work without link resolver for backwards compatibility', () => {
      const markdown = 'Check [guide](./guide.md) and [Google](https://google.com).';

      const result = converter.convertToTelegraphNodesSimple(markdown);

      expect(result).toHaveLength(1);
      expect(result[0].children?.[0]).toContain('./guide.md');
      expect(result[0].children?.[0]).toContain('https://google.com');
    });
  });

  describe('Link path resolution', () => {
    it('should normalize Windows-style paths', () => {
      const markdown = 'Check [guide](docs\\guide.md).';
      const basePath = 'README.md';
      const linkResolver = (path: string): string => {
        expect(path).toBe('docs/guide.md'); // Should be normalized
        return 'https://telegra.ph/Guide-Normalized';
      };

      converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);
    });

    it('should handle paths with query parameters and anchors', () => {
      const markdown = 'Check [guide](./guide.md#section?param=value).';
      const basePath = 'README.md';
      const linkResolver = () => 'https://telegra.ph/Guide-WithParams';

      const result = converter.convertToTelegraphNodesSimple(markdown, basePath, linkResolver);

      expect(result).toHaveLength(1);
      expect(result[0].children?.[0]).toContain('https://telegra.ph/Guide-WithParams');
    });
  });
});