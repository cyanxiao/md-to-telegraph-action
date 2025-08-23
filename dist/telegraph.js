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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegraphClient = void 0;
const axios_1 = __importDefault(require("axios"));
const core = __importStar(require("@actions/core"));
class TelegraphClient {
    constructor() {
        this.api = axios_1.default.create({
            baseURL: "https://api.telegra.ph",
            timeout: 30000,
        });
    }
    async createAccount(shortName, authorName, authorUrl) {
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
        }
        catch (error) {
            core.error(`Failed to create Telegraph account: ${error}`);
            throw error;
        }
    }
    async createPage(title, content, authorName, authorUrl, returnContent = false) {
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
        }
        catch (error) {
            core.error(`Failed to create Telegraph page: ${error}`);
            throw error;
        }
    }
    async editPage(path, title, content, authorName, authorUrl, returnContent = false) {
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
        }
        catch (error) {
            core.error(`Failed to edit Telegraph page: ${error}`);
            throw error;
        }
    }
    async getPage(path, returnContent = true) {
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
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
                throw new Error("Telegraph page not found");
            }
            core.error(`Failed to get Telegraph page: ${error}`);
            throw error;
        }
    }
    async getPageList(offset = 0, limit = 50) {
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
        }
        catch (error) {
            core.error(`Failed to get Telegraph page list: ${error}`);
            throw error;
        }
    }
    async findExistingPageByTitle(title) {
        try {
            const pageList = await this.getPageList();
            // Look for a page with matching title
            const existingPage = pageList.pages.find((page) => page.title === title ||
                page.title.toLowerCase() === title.toLowerCase());
            return existingPage || null;
        }
        catch (error) {
            core.warning(`Failed to search for existing page: ${error}`);
            return null;
        }
    }
    setAccessToken(token) {
        this.accessToken = token;
    }
}
exports.TelegraphClient = TelegraphClient;
//# sourceMappingURL=telegraph.js.map