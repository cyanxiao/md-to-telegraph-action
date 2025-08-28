# Usage Guide

This guide provides detailed examples and configuration options for using the Markdown to Telegraph Action.

## Basic Example

```yaml
name: Convert Docs to Telegraph

on:
  push:
    branches: [main]
    paths: ["docs/**/*.md"]

jobs:
  convert-to-telegraph:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Cache Telegraph mappings
        uses: actions/cache@v3
        with:
          path: telegraph-pages.json
          key: telegraph-mappings-${{ hashFiles('docs/**/*.md', 'README.md') }}
          restore-keys: |
            telegraph-mappings-

      - name: Convert markdown to Telegraph
        uses: cyanxiao/md-to-telegraph-action@release
        with:
          account-name: "My Docs Site"
          author-name: "Documentation Team"
          include-patterns: "docs/**/*.md,README.md"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Advanced Example

```yaml
jobs:
  convert-to-telegraph:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Cache Telegraph mappings
        uses: actions/cache@v3
        with:
          path: my-telegraph-pages.json
          key: telegraph-mappings-${{ hashFiles('docs/**/*.md', 'guides/**/*.md', 'README.md') }}
          restore-keys: |
            telegraph-mappings-

      - name: Convert markdown to Telegraph
        uses: cyanxiao/md-to-telegraph-action@release
        with:
          account-name: "My Project Docs"
          author-name: "Author"
          author-url: "https://github.com/{author}"
          include-patterns: "docs/**/*.md,guides/**/*.md,README.md"
          exclude-patterns: "node_modules/**,dist/**,draft/**"
          output-file: "my-telegraph-pages.json"
          telegraph-token: ${{ secrets.TELEGRAPH_TOKEN }}
          one-entry-mode: "true"
          replace-existing-pages: "true"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

**Inputs:**

- **`account-name`**  
  _Telegraph account short name_  
  Required: No  
  Default: `'GitHub Action'`

- **`author-name`**  
  _Author name for Telegraph pages_  
  Required: No  
  Default: `'GitHub Action'`

- **`author-url`**  
  _Author URL for Telegraph pages_  
  Required: No  
  Default: _none_

- **`include-patterns`**  
  _Comma-separated glob patterns for files to include_  
  Required: No  
  Default: `'**/*.md'`

- **`exclude-patterns`**  
  _Comma-separated glob patterns for files to exclude_  
  Required: No  
  Default: `'node_modules/**'`

- **`output-file`**  
  _Output file to store page mappings_  
  Required: No  
  Default: `'telegraph-pages.json'`

- **`telegraph-token`**  
  _Existing Telegraph access token_  
  Required: No  
  Default: _none_

- **`one-entry-mode`**  
  _Update repository homepage URL when only one page is created_  
  Required: No  
  Default: `'false'`

- **`replace-existing-pages`**  
  _Reuse existing Telegraph pages instead of creating new ones_  
  Required: No  
  Default: `'false'`

## Outputs

- **`pages-created`**: Number of Telegraph pages created/updated
- **`mapping-file`**: Path to the file containing page mappings

## Telegraph Page Mapping

The action creates a JSON file (default: `telegraph-pages.json`) that maps your markdown files to Telegraph pages:

```json
[
  {
    "filePath": "docs/getting-started.md",
    "telegraphPath": "Getting-Started-12-15",
    "telegraphUrl": "https://telegra.ph/Getting-Started-12-15",
    "lastModified": "2023-12-15T10:30:00.000Z"
  }
]
```

### Caching Strategy

**⚠️ Important**: The mapping file should **not** be committed to your repository as it can cause git conflicts in CI/CD workflows. Instead, use GitHub Actions cache to persist the mapping file between workflow runs.

#### Recommended Setup with GitHub Actions Cache

Using cache provides several benefits:

- ✅ **Avoids git conflicts** - No need to commit mapping files
- ✅ **Faster builds** - Skips unchanged files on subsequent runs
- ✅ **Preserves functionality** - Internal links and page replacement still work
- ✅ **Automatic cleanup** - Old cache entries expire automatically

The cache key should include a hash of your markdown files to ensure the cache is invalidated when content changes:

```yaml
- name: Cache Telegraph mappings
  uses: actions/cache@v3
  with:
    path: telegraph-pages.json # or your custom output-file
    key: telegraph-mappings-${{ hashFiles('**/*.md') }}
    restore-keys: |
      telegraph-mappings-
```

#### Alternative Storage Options

If you can't use GitHub Actions cache, consider these alternatives:

1. **Temporary directory** (loses incremental update benefits):

   ```yaml
   with:
     output-file: "/tmp/telegraph-pages.json"
   ```

2. **Artifacts** (for cross-job persistence):

   ```yaml
   - name: Upload mappings
     uses: actions/upload-artifact@v3
     with:
       name: telegraph-mappings
       path: telegraph-pages.json
   ```

3. **Add to .gitignore** (if you don't mind the file in workspace):

   ```gitignore
   telegraph-pages.json
   ```

## Markdown Support

The action supports most standard markdown features:

✅ **Supported:**

- Headers (H1-H6, converted to H3-H4 for Telegraph compatibility)
- **Automatic title extraction** from the first H1 header in each file
- Bold and italic text
- Links (including automatic internal link resolution)
- Code blocks and inline code
- Block quotes
- Lists (unordered and ordered)
- Line breaks and paragraphs

⚠️ **Limited Support:**

- Images (must be publicly accessible URLs)
- Tables (converted to plain text)

❌ **Not Supported:**

- Front matter (automatically stripped)
- Complex HTML
- Custom markdown extensions
