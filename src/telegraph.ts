import axios, { AxiosInstance } from "axios";
import * as core from "@actions/core";

export interface TelegraphAccount {
  short_name: string;
  author_name: string;
  author_url?: string;
  access_token: string;
  auth_url?: string;
  page_count?: number;
}

export interface TelegraphPage {
  path: string;
  url: string;
  title: string;
  description: string;
  author_name?: string;
  author_url?: string;
  image_url?: string;
  content?: Node[];
  views: number;
  can_edit?: boolean;
}

export interface TelegraphPageList {
  total_count: number;
  pages: TelegraphPage[];
}

export interface Node {
  tag?: string;
  attrs?: Record<string, any>;
  children?: Array<Node | string>;
}

export class TelegraphClient {
  private api: AxiosInstance;
  private accessToken?: string;

  constructor() {
    this.api = axios.create({
      baseURL: "https://api.telegra.ph",
      timeout: 30000,
    });
  }

  async createAccount(
    shortName: string,
    authorName: string,
    authorUrl?: string
  ): Promise<TelegraphAccount> {
    try {
      const response = await this.api.post("/createAccount", {
        short_name: shortName,
        author_name: authorName,
        author_url: authorUrl,
      });

      if (!response.data.ok) {
        throw new Error(`Telegraph API error: ${response.data.error}`);
      }

      this.accessToken = response.data.result.access_token;
      core.info(`Telegraph account created: ${shortName}`);
      return response.data.result;
    } catch (error) {
      core.error(`Failed to create Telegraph account: ${error}`);
      throw error;
    }
  }

  async createPage(
    title: string,
    content: Node[],
    authorName?: string,
    authorUrl?: string,
    returnContent = false
  ): Promise<TelegraphPage> {
    if (!this.accessToken) {
      throw new Error("No access token available. Create an account first.");
    }

    try {
      const response = await this.api.post("/createPage", {
        access_token: this.accessToken,
        title,
        author_name: authorName,
        author_url: authorUrl,
        content: JSON.stringify(content),
        return_content: returnContent,
      });

      if (!response.data.ok) {
        throw new Error(`Telegraph API error: ${response.data.error}`);
      }

      const page = response.data.result;
      core.info(`Telegraph page created: ${page.url}`);
      return page;
    } catch (error) {
      core.error(`Failed to create Telegraph page: ${error}`);
      throw error;
    }
  }

  async editPage(
    path: string,
    title: string,
    content: Node[],
    authorName?: string,
    authorUrl?: string,
    returnContent = false
  ): Promise<TelegraphPage> {
    if (!this.accessToken) {
      throw new Error("No access token available. Create an account first.");
    }

    try {
      const response = await this.api.post("/editPage/" + path, {
        access_token: this.accessToken,
        title,
        author_name: authorName,
        author_url: authorUrl,
        content: JSON.stringify(content),
        return_content: returnContent,
      });

      if (!response.data.ok) {
        throw new Error(`Telegraph API error: ${response.data.error}`);
      }

      const page = response.data.result;
      core.info(`Telegraph page updated: ${page.url}`);
      return page;
    } catch (error) {
      core.error(`Failed to edit Telegraph page: ${error}`);
      throw error;
    }
  }

  async getPage(path: string, returnContent = true): Promise<TelegraphPage> {
    try {
      const response = await this.api.get(`/getPage/${path}`, {
        params: {
          return_content: returnContent,
        },
      });

      if (!response.data.ok) {
        throw new Error(`Telegraph API error: ${response.data.error}`);
      }

      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error("Telegraph page not found");
      }
      core.error(`Failed to get Telegraph page: ${error}`);
      throw error;
    }
  }

  async getPageList(offset = 0, limit = 50): Promise<TelegraphPageList> {
    if (!this.accessToken) {
      throw new Error("No access token available. Create an account first.");
    }

    try {
      const response = await this.api.get("/getPageList", {
        params: {
          access_token: this.accessToken,
          offset,
          limit,
        },
      });

      if (!response.data.ok) {
        throw new Error(`Telegraph API error: ${response.data.error}`);
      }

      return response.data.result;
    } catch (error) {
      core.error(`Failed to get Telegraph page list: ${error}`);
      throw error;
    }
  }

  async findExistingPageByTitle(title: string): Promise<TelegraphPage | null> {
    try {
      const pageList = await this.getPageList();

      // Look for a page with matching title
      const existingPage = pageList.pages.find(
        (page) =>
          page.title === title ||
          page.title.toLowerCase() === title.toLowerCase()
      );

      return existingPage || null;
    } catch (error) {
      core.warning(`Failed to search for existing page: ${error}`);
      return null;
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }
}
