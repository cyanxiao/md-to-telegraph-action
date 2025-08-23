import axios from "axios";
import { TelegraphClient, Node } from "../telegraph";

jest.mock("axios");
jest.mock("@actions/core", () => ({
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  setFailed: jest.fn(),
  getInput: jest.fn(),
  setOutput: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("TelegraphClient", () => {
  let client: TelegraphClient;

  beforeEach(() => {
    client = new TelegraphClient();
    jest.clearAllMocks();

    mockedAxios.create = jest.fn().mockReturnValue({
      post: jest.fn(),
      get: jest.fn(),
    });
  });

  describe("createAccount", () => {
    it("should create a Telegraph account successfully", async () => {
      const mockResponse = {
        data: {
          ok: true,
          result: {
            short_name: "test-account",
            author_name: "Test Author",
            access_token: "test-token-123",
          },
        },
      };

      const mockApi = {
        post: jest.fn().mockResolvedValue(mockResponse),
        get: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockApi as any);

      client = new TelegraphClient();
      const result = await client.createAccount(
        "test-account",
        "Test Author",
        "https://example.com"
      );

      expect(mockApi.post).toHaveBeenCalledWith("/createAccount", {
        short_name: "test-account",
        author_name: "Test Author",
        author_url: "https://example.com",
      });

      expect(result.short_name).toBe("test-account");
      expect(result.author_name).toBe("Test Author");
      expect(result.access_token).toBe("test-token-123");
    });

    it("should throw error when Telegraph API returns error", async () => {
      const mockResponse = {
        data: {
          ok: false,
          error: "FLOOD_WAIT_X",
        },
      };

      const mockApi = {
        post: jest.fn().mockResolvedValue(mockResponse),
        get: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockApi as any);

      client = new TelegraphClient();

      await expect(
        client.createAccount("test-account", "Test Author")
      ).rejects.toThrow("Telegraph API error: FLOOD_WAIT_X");
    });

    it("should handle network errors", async () => {
      const mockApi = {
        post: jest.fn().mockRejectedValue(new Error("Network error")),
        get: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockApi as any);

      client = new TelegraphClient();

      await expect(
        client.createAccount("test-account", "Test Author")
      ).rejects.toThrow("Network error");
    });
  });

  describe("createPage", () => {
    beforeEach(() => {
      const mockApi = {
        post: jest.fn(),
        get: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockApi as any);
      client = new TelegraphClient();
      client.setAccessToken("test-token");
    });

    it("should create a Telegraph page successfully", async () => {
      const mockNodes: Node[] = [{ tag: "p", children: ["Hello World"] }];

      const mockResponse = {
        data: {
          ok: true,
          result: {
            path: "test-page-123",
            url: "https://telegra.ph/test-page-123",
            title: "Test Page",
            description: "",
            views: 0,
          },
        },
      };

      const mockApi = mockedAxios.create() as any;
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await client.createPage(
        "Test Page",
        mockNodes,
        "Test Author"
      );

      expect(mockApi.post).toHaveBeenCalledWith("/createPage", {
        access_token: "test-token",
        title: "Test Page",
        author_name: "Test Author",
        author_url: undefined,
        content: JSON.stringify(mockNodes),
        return_content: false,
      });

      expect(result.path).toBe("test-page-123");
      expect(result.url).toBe("https://telegra.ph/test-page-123");
      expect(result.title).toBe("Test Page");
    });

    it("should throw error when no access token is available", async () => {
      const client = new TelegraphClient();
      const mockNodes: Node[] = [{ tag: "p", children: ["Hello"] }];

      await expect(client.createPage("Test Page", mockNodes)).rejects.toThrow(
        "No access token available. Create an account first."
      );
    });

    it("should handle API errors when creating page", async () => {
      const mockNodes: Node[] = [{ tag: "p", children: ["Hello"] }];
      const mockResponse = {
        data: {
          ok: false,
          error: "PAGE_TITLE_REQUIRED",
        },
      };

      const mockApi = mockedAxios.create() as any;
      mockApi.post.mockResolvedValue(mockResponse);

      await expect(client.createPage("", mockNodes)).rejects.toThrow(
        "Telegraph API error: PAGE_TITLE_REQUIRED"
      );
    });
  });

  describe("editPage", () => {
    beforeEach(() => {
      const mockApi = {
        post: jest.fn(),
        get: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockApi as any);
      client = new TelegraphClient();
      client.setAccessToken("test-token");
    });

    it("should edit a Telegraph page successfully", async () => {
      const mockNodes: Node[] = [{ tag: "p", children: ["Updated content"] }];

      const mockResponse = {
        data: {
          ok: true,
          result: {
            path: "test-page-123",
            url: "https://telegra.ph/test-page-123",
            title: "Updated Page",
            description: "",
            views: 42,
          },
        },
      };

      const mockApi = mockedAxios.create() as any;
      mockApi.post.mockResolvedValue(mockResponse);

      const result = await client.editPage(
        "test-page-123",
        "Updated Page",
        mockNodes
      );

      expect(mockApi.post).toHaveBeenCalledWith("/editPage/test-page-123", {
        access_token: "test-token",
        title: "Updated Page",
        author_name: undefined,
        author_url: undefined,
        content: JSON.stringify(mockNodes),
        return_content: false,
      });

      expect(result.path).toBe("test-page-123");
      expect(result.title).toBe("Updated Page");
    });

    it("should throw error when no access token is available", async () => {
      const client = new TelegraphClient();
      const mockNodes: Node[] = [{ tag: "p", children: ["Hello"] }];

      await expect(
        client.editPage("test-path", "Test Page", mockNodes)
      ).rejects.toThrow("No access token available. Create an account first.");
    });
  });

  describe("getPage", () => {
    beforeEach(() => {
      const mockApi = {
        post: jest.fn(),
        get: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockApi as any);
      client = new TelegraphClient();
    });

    it("should get a Telegraph page successfully", async () => {
      const mockResponse = {
        data: {
          ok: true,
          result: {
            path: "test-page-123",
            url: "https://telegra.ph/test-page-123",
            title: "Test Page",
            description: "Test description",
            views: 100,
            content: [{ tag: "p", children: ["Page content"] }],
          },
        },
      };

      const mockApi = mockedAxios.create() as any;
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await client.getPage("test-page-123");

      expect(mockApi.get).toHaveBeenCalledWith("/getPage/test-page-123", {
        params: {
          return_content: true,
        },
      });

      expect(result.path).toBe("test-page-123");
      expect(result.title).toBe("Test Page");
      expect(result.views).toBe(100);
    });

    it("should handle 404 errors gracefully", async () => {
      const mockError = {
        isAxiosError: true,
        response: { status: 404 },
      };

      const mockApi = mockedAxios.create() as any;
      mockApi.get.mockRejectedValue(mockError);
      jest.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(client.getPage("nonexistent-page")).rejects.toThrow(
        "Telegraph page not found"
      );
    });

    it("should handle API errors when getting page", async () => {
      const mockResponse = {
        data: {
          ok: false,
          error: "PAGE_NOT_FOUND",
        },
      };

      const mockApi = mockedAxios.create() as any;
      mockApi.get.mockResolvedValue(mockResponse);

      await expect(client.getPage("invalid-path")).rejects.toThrow(
        "Telegraph API error: PAGE_NOT_FOUND"
      );
    });
  });

  describe("getPageList", () => {
    beforeEach(() => {
      const mockApi = {
        post: jest.fn(),
        get: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockApi as any);
      client = new TelegraphClient();
      client.setAccessToken("test-token");
    });

    it("should get page list successfully", async () => {
      const mockResponse = {
        data: {
          ok: true,
          result: {
            total_count: 2,
            pages: [
              {
                path: "page-1-123",
                url: "https://telegra.ph/page-1-123",
                title: "Page 1",
                description: "First page",
                views: 100,
              },
              {
                path: "page-2-456",
                url: "https://telegra.ph/page-2-456",
                title: "Page 2",
                description: "Second page",
                views: 50,
              },
            ],
          },
        },
      };

      const mockApi = mockedAxios.create() as any;
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await client.getPageList();

      expect(mockApi.get).toHaveBeenCalledWith("/getPageList", {
        params: {
          access_token: "test-token",
          offset: 0,
          limit: 50,
        },
      });

      expect(result.total_count).toBe(2);
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].title).toBe("Page 1");
    });

    it("should throw error when no access token is available", async () => {
      const client = new TelegraphClient();

      await expect(client.getPageList()).rejects.toThrow(
        "No access token available. Create an account first."
      );
    });
  });

  describe("findExistingPageByTitle", () => {
    beforeEach(() => {
      const mockApi = {
        post: jest.fn(),
        get: jest.fn(),
      };
      mockedAxios.create.mockReturnValue(mockApi as any);
      client = new TelegraphClient();
      client.setAccessToken("test-token");
    });

    it("should find existing page by exact title match", async () => {
      const mockPageList = {
        total_count: 2,
        pages: [
          {
            path: "test-page-123",
            url: "https://telegra.ph/test-page-123",
            title: "Test Page",
            description: "A test page",
            views: 10,
          },
          {
            path: "another-page-456",
            url: "https://telegra.ph/another-page-456",
            title: "Another Page",
            description: "Another test page",
            views: 20,
          },
        ],
      };

      jest.spyOn(client, "getPageList").mockResolvedValue(mockPageList);

      const result = await client.findExistingPageByTitle("Test Page");

      expect(result).not.toBeNull();
      expect(result?.title).toBe("Test Page");
      expect(result?.path).toBe("test-page-123");
    });

    it("should find existing page by case-insensitive title match", async () => {
      const mockPageList = {
        total_count: 1,
        pages: [
          {
            path: "test-page-123",
            url: "https://telegra.ph/test-page-123",
            title: "Test Page",
            description: "A test page",
            views: 10,
          },
        ],
      };

      jest.spyOn(client, "getPageList").mockResolvedValue(mockPageList);

      const result = await client.findExistingPageByTitle("test page");

      expect(result).not.toBeNull();
      expect(result?.title).toBe("Test Page");
    });

    it("should return null when no matching page is found", async () => {
      const mockPageList = {
        total_count: 1,
        pages: [
          {
            path: "different-page-123",
            url: "https://telegra.ph/different-page-123",
            title: "Different Page",
            description: "A different page",
            views: 10,
          },
        ],
      };

      jest.spyOn(client, "getPageList").mockResolvedValue(mockPageList);

      const result = await client.findExistingPageByTitle("Nonexistent Page");

      expect(result).toBeNull();
    });

    it("should handle API errors gracefully", async () => {
      jest
        .spyOn(client, "getPageList")
        .mockRejectedValue(new Error("API Error"));

      const result = await client.findExistingPageByTitle("Test Page");

      expect(result).toBeNull();
    });
  });

  describe("setAccessToken", () => {
    it("should set access token correctly", () => {
      const token = "new-test-token";
      client.setAccessToken(token);

      expect(() => client.setAccessToken(token)).not.toThrow();
    });
  });
});
