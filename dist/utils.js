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
exports.getConfig = getConfig;
exports.loadPageMappings = loadPageMappings;
exports.savePageMappings = savePageMappings;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
function getConfig() {
    const includeInput = core.getInput("include-patterns");
    const excludeInput = core.getInput("exclude-patterns");
    const oneEntryModeInput = core.getInput("one-entry-mode");
    const replaceExistingPagesInput = core.getInput("replace-existing-pages");
    return {
        accountName: core.getInput("account-name") || "GitHub Action",
        authorName: core.getInput("author-name") || "GitHub Action",
        authorUrl: core.getInput("author-url") || undefined,
        includePatterns: includeInput
            ? includeInput.split(",").map((p) => p.trim())
            : ["**/*.md"],
        excludePatterns: excludeInput
            ? excludeInput.split(",").map((p) => p.trim())
            : ["node_modules/**"],
        outputFile: core.getInput("output-file") || "telegraph-pages.json",
        accessToken: core.getInput("telegraph-token") || undefined,
        oneEntryMode: oneEntryModeInput === "true",
        replaceExistingPages: replaceExistingPagesInput === "true",
    };
}
function loadPageMappings(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, "utf-8");
            return JSON.parse(content);
        }
    }
    catch (error) {
        core.warning(`Failed to load existing mappings from ${filePath}: ${error}`);
    }
    return [];
}
function savePageMappings(filePath, mappings) {
    try {
        const content = JSON.stringify(mappings, null, 2);
        fs.writeFileSync(filePath, content, "utf-8");
        core.info(`Saved page mappings to ${filePath}`);
    }
    catch (error) {
        core.error(`Failed to save mappings to ${filePath}: ${error}`);
        throw error;
    }
}
//# sourceMappingURL=utils.js.map