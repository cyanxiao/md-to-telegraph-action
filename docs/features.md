# Features

This document details the advanced features available in the Markdown to Telegraph Action.

## Overview

The action provides these key features:

- 🚀 Converts markdown files to Telegraph pages automatically
- 📝 Supports most markdown syntax (headers, bold, italic, links, code blocks, etc.)
- 🔗 **Resolves internal markdown links** between files automatically
- 📖 Automatically extracts page titles from H1 headers
- 🔄 Tracks file changes and only updates modified files
- 📋 Maintains a mapping file of all created pages
- ⚙️ Configurable file patterns for inclusion/exclusion
- 🎯 Uses existing Telegraph account or creates a new one
- 🔀 **One Entry Mode**: Automatically updates repository homepage URL with Telegraph URL when only one page is created
- 🔄 **Page Replacement**: Reuse existing Telegraph pages instead of creating new ones (maintains same URLs)

## One Entry Mode

When enabled with `one-entry-mode: "true"`, this feature automatically updates your repository homepage URL with the Telegraph URL when exactly one markdown file is processed. This is perfect for single-page documentation repositories, personal profiles, or project showcases.

### How One Entry Mode Works

1. **Enable the feature**: Set `one-entry-mode: "true"` in your workflow
2. **Single page detection**: When exactly one markdown file is processed, the action detects this scenario
3. **Repository update**: The GitHub repository homepage URL is automatically updated with the Telegraph page URL
4. **Permission handling**: Gracefully handles cases where the GitHub token lacks repository write permissions

### One Entry Mode Example

```yaml
- name: Cache Telegraph mappings
  uses: actions/cache@v3
  with:
    path: telegraph-pages.json
    key: telegraph-mappings-${{ hashFiles('README.md') }}
    restore-keys: |
      telegraph-mappings-

- name: Convert README to Telegraph
  uses: cyanxiao/md-to-telegraph-action@release
  with:
    account-name: "My Profile"
    author-name: "Your Name"
    include-patterns: "README.md"
    one-entry-mode: "true"
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Result**: If only `README.md` is processed, your repository homepage URL will be automatically updated to point to the Telegraph page (e.g., `https://telegra.ph/My-Profile-12-15`).

### One Entry Mode Requirements

- **GITHUB_TOKEN**: Must be provided via `env` for repository homepage updates
- The GitHub token must have `metadata: write` or `contents: write` permissions
- If permissions are insufficient, the action will show a warning but continue successfully
- Only works when exactly one markdown file is processed

## Page Replacement Mode

When enabled with `replace-existing-pages: "true"`, this feature prevents the creation of duplicate Telegraph pages by reusing existing pages with the same title. This is perfect for documentation that gets updated regularly, as it maintains consistent URLs for bookmarks and external links.

### How Page Replacement Works

1. **Enable the feature**: Set `replace-existing-pages: "true"` in your workflow
2. **Provide consistent token**: A `telegraph-token` is **required** for this feature to work
3. **Title matching**: The action searches for existing pages with matching titles
4. **Content replacement**: If a match is found, the existing page content is replaced
5. **URL preservation**: The Telegraph page URL remains the same (e.g., `https://telegra.ph/My-Guide-12-15`)

### Page Replacement Example

```yaml
- name: Cache Telegraph mappings
  uses: actions/cache@v3
  with:
    path: telegraph-pages.json
    key: telegraph-mappings-${{ hashFiles('docs/**/*.md') }}
    restore-keys: |
      telegraph-mappings-

- name: Update Documentation
  uses: cyanxiao/md-to-telegraph-action@release
  with:
    account-name: "Project Docs"
    author-name: "Documentation Team"
    telegraph-token: ${{ secrets.TELEGRAPH_TOKEN }}
    include-patterns: "docs/**/*.md"
    replace-existing-pages: "true"
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Result**: Each time the action runs, it will update the existing Telegraph pages instead of creating new ones, preserving URLs and preventing duplicates.

### Page Replacement Requirements

- **Telegraph token is mandatory**: This feature requires a consistent `telegraph-token` to access your existing pages
- **Title-based matching**: Pages are matched by title (case-insensitive)
- **Account ownership**: You can only replace pages that belong to your Telegraph account

### Benefits

- 📌 **Consistent URLs**: Links to your documentation never break
- 🚫 **No duplicates**: Prevents accumulation of old versions
- 🔄 **Seamless updates**: Content gets refreshed while maintaining the same URL
- 📚 **Clean account**: Your Telegraph account stays organized

### Important Notes

- If no existing page with a matching title is found, a new page will be created
- The action will show clear logs indicating whether it's replacing or creating pages
- This feature works alongside the existing mapping file for tracking changes

## Internal Link Resolution

One of the key features of this action is **automatic internal link resolution**. When you have markdown files that link to each other, the action intelligently converts these internal links to point to the corresponding Telegraph pages.

### How it works

1. **First Pass**: All markdown files are converted to Telegraph pages
2. **Second Pass**: Internal links are resolved and pages are updated

### Example

If you have a file `docs/guide.md` with content like:

```markdown
# User Guide

See our [Getting Started](./getting-started.md) guide first.
Also check out the [API Reference](../api/reference.md).
```

The action will:

- Convert `./getting-started.md` → `https://telegra.ph/Getting-Started-12-15`
- Convert `../api/reference.md` → `https://telegra.ph/API-Reference-12-15`
- Update the Telegraph page with the resolved links

### Supported link formats

- Relative links: `./other.md`, `../folder/file.md`
- Links with fragments: `./other.md#section`
- Links to files in subdirectories: `subfolder/file.md`
