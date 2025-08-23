import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { MarkdownProcessor } from '../markdown-processor';

jest.mock('fs');
jest.mock('glob');
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  setFailed: jest.fn(),
  getInput: jest.fn(),
  setOutput: jest.fn(),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedGlob = glob as jest.MockedFunction<typeof glob>;

describe('MarkdownProcessor', () => {
  let processor: MarkdownProcessor;
  const workspaceRoot = '/test/workspace';

  beforeEach(() => {
    processor = new MarkdownProcessor(workspaceRoot, ['**/*.md'], ['node_modules/**']);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default patterns when not provided', () => {
      const defaultProcessor = new MarkdownProcessor(workspaceRoot);
      expect(defaultProcessor).toBeInstanceOf(MarkdownProcessor);
    });

    it('should initialize with custom patterns', () => {
      const customProcessor = new MarkdownProcessor(
        workspaceRoot,
        ['docs/**/*.md', '*.md'],
        ['build/**', 'dist/**']
      );
      expect(customProcessor).toBeInstanceOf(MarkdownProcessor);
    });
  });

  describe('findMarkdownFiles', () => {
    it('should find and process markdown files successfully', async () => {
      const mockFiles = ['README.md', 'docs/guide.md'];
      const mockContent1 = '# README\n\nThis is a readme file.';
      const mockContent2 = '---\ntitle: User Guide\n---\n\n# User Guide\n\nContent here.';

      mockedGlob.mockResolvedValue(mockFiles);
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockedFs.readFileSync
        .mockReturnValueOnce(mockContent1)
        .mockReturnValueOnce(mockContent2);

      const result = await processor.findMarkdownFiles();

      expect(mockedGlob).toHaveBeenCalledWith('**/*.md', {
        cwd: workspaceRoot,
        ignore: ['node_modules/**'],
        absolute: false,
      });

      expect(result).toHaveLength(2);
      
      expect(result[0]).toEqual({
        filePath: path.join(workspaceRoot, 'README.md'),
        relativePath: 'README.md',
        content: mockContent1,
        title: 'README',
      });

      expect(result[1]).toEqual({
        filePath: path.join(workspaceRoot, 'docs/guide.md'),
        relativePath: 'docs/guide.md',
        content: mockContent2,
        title: 'User Guide',
      });
    });

    it('should handle empty glob results', async () => {
      mockedGlob.mockResolvedValue([]);

      const result = await processor.findMarkdownFiles();

      expect(result).toHaveLength(0);
    });

    it('should skip non-existent files', async () => {
      const mockFiles = ['README.md', 'missing.md'];
      mockedGlob.mockResolvedValue(mockFiles);
      mockedFs.existsSync
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      mockedFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockedFs.readFileSync.mockReturnValue('# README');

      const result = await processor.findMarkdownFiles();

      expect(result).toHaveLength(1);
      expect(result[0].relativePath).toBe('README.md');
    });

    it('should skip directories', async () => {
      const mockFiles = ['README.md', 'docs'];
      mockedGlob.mockResolvedValue(mockFiles);
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync
        .mockReturnValueOnce({ isFile: () => true } as any)
        .mockReturnValueOnce({ isFile: () => false } as any);
      mockedFs.readFileSync.mockReturnValue('# README');

      const result = await processor.findMarkdownFiles();

      expect(result).toHaveLength(1);
      expect(result[0].relativePath).toBe('README.md');
    });

    it('should handle multiple include patterns', async () => {
      const multiPatternProcessor = new MarkdownProcessor(
        workspaceRoot,
        ['*.md', 'docs/**/*.md'],
        []
      );

      mockedGlob
        .mockResolvedValueOnce(['README.md'])
        .mockResolvedValueOnce(['docs/guide.md']);
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockedFs.readFileSync
        .mockReturnValueOnce('# README')
        .mockReturnValueOnce('# Guide');

      const result = await multiPatternProcessor.findMarkdownFiles();

      expect(result).toHaveLength(2);
      expect(mockedGlob).toHaveBeenCalledTimes(2);
    });

    it('should handle glob errors gracefully', async () => {
      mockedGlob.mockRejectedValue(new Error('Glob error'));

      const result = await processor.findMarkdownFiles();

      expect(result).toHaveLength(0);
    });
  });

  describe('extractTitle', () => {
    it('should extract title from H1 header', () => {
      const processor = new MarkdownProcessor(workspaceRoot);
      const content = '# My Title\n\nSome content here.';
      
      const result = (processor as any).extractTitle(content, 'test.md');
      
      expect(result).toBe('My Title');
    });

    it('should extract title from frontmatter when no H1', () => {
      const processor = new MarkdownProcessor(workspaceRoot);
      const content = '---\ntitle: Frontmatter Title\nauthor: John\n---\n\nContent without H1.';
      
      const result = (processor as any).extractTitle(content, 'test.md');
      
      expect(result).toBe('Frontmatter Title');
    });

    it('should extract title from quoted frontmatter', () => {
      const processor = new MarkdownProcessor(workspaceRoot);
      const content = '---\ntitle: "Quoted Title"\n---\n\nContent.';
      
      const result = (processor as any).extractTitle(content, 'test.md');
      
      expect(result).toBe('Quoted Title');
    });

    it('should fallback to filename when no title found', () => {
      const processor = new MarkdownProcessor(workspaceRoot);
      const content = 'Just some content without a title.';
      
      const result = (processor as any).extractTitle(content, 'my-awesome-post.md');
      
      expect(result).toBe('My Awesome Post');
    });

    it('should prefer H1 over frontmatter', () => {
      const processor = new MarkdownProcessor(workspaceRoot);
      const content = '# H1 Title\n\nSome content.';
      
      const result = (processor as any).extractTitle(content, 'test.md');
      
      expect(result).toBe('H1 Title');
    });

    it('should handle empty content', () => {
      const processor = new MarkdownProcessor(workspaceRoot);
      const content = '';
      
      const result = (processor as any).extractTitle(content, 'empty-file.md');
      
      expect(result).toBe('Empty File');
    });
  });

  describe('readMarkdownFile', () => {
    it('should read a markdown file successfully', async () => {
      const filePath = '/test/workspace/README.md';
      const content = '# Test File\n\nContent here.';

      mockedFs.readFileSync.mockReturnValue(content);

      const result = await processor.readMarkdownFile(filePath);

      expect(mockedFs.readFileSync).toHaveBeenCalledWith(filePath, 'utf-8');
      expect(result).toEqual({
        filePath,
        relativePath: 'README.md',
        content,
        title: 'Test File',
      });
    });

    it('should handle file read errors', async () => {
      const filePath = '/test/workspace/nonexistent.md';
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: file not found');
      });

      await expect(processor.readMarkdownFile(filePath)).rejects.toThrow('ENOENT: file not found');
    });
  });

  describe('setIncludePatterns', () => {
    it('should update include patterns', () => {
      const newPatterns = ['src/**/*.md', 'docs/**/*.markdown'];
      processor.setIncludePatterns(newPatterns);
      
      expect(() => processor.setIncludePatterns(newPatterns)).not.toThrow();
    });
  });

  describe('setExcludePatterns', () => {
    it('should update exclude patterns', () => {
      const newPatterns = ['build/**', 'dist/**', '*.tmp.md'];
      processor.setExcludePatterns(newPatterns);
      
      expect(() => processor.setExcludePatterns(newPatterns)).not.toThrow();
    });
  });
});