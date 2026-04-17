# GitHub Actions Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions workflow that packages and publishes the extension to VS Code Marketplace and Open VSX on version tags or manual dispatch, plus document the required secrets and first-time setup.

**Architecture:** Keep the existing local publish scripts unchanged and add a dedicated CI workflow that installs dependencies, builds the extension, validates tag-to-version alignment, and publishes with CI tokens. Document the required GitHub Secrets and the one-time Open VSX namespace setup in the README.

**Tech Stack:** GitHub Actions, pnpm, Node.js 20, `@vscode/vsce`, `ovsx`

---

### Task 1: Add CI publish workflow

**Files:**
- Create: `.github/workflows/publish.yml`

- [ ] **Step 1: Create the workflow file**

```yaml
name: Publish Extension

on:
  push:
    tags:
      - "v*"
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: publish-${{ github.ref }}
  cancel-in-progress: false

jobs:
  publish:
    runs-on: ubuntu-latest
    env:
      VSCE_PAT: ${{ secrets.VSCE_PAT }}
      OVSX_PAT: ${{ secrets.OVSX_PAT }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Validate publish secrets
        run: |
          test -n "$VSCE_PAT" || (echo "Missing VSCE_PAT secret" && exit 1)
          test -n "$OVSX_PAT" || (echo "Missing OVSX_PAT secret" && exit 1)

      - name: Validate tag matches package version
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          PACKAGE_VERSION=$(node -p "require('./package.json').version")
          TAG_VERSION="${GITHUB_REF_NAME#v}"
          test "$PACKAGE_VERSION" = "$TAG_VERSION" || (echo "Tag version $TAG_VERSION does not match package.json version $PACKAGE_VERSION" && exit 1)

      - name: Lint
        run: pnpm lint

      - name: Compile tests
        run: pnpm compile-tests

      - name: Build webviews
        run: pnpm build-webviews

      - name: Package extension
        run: pnpm package

      - name: Publish to VS Code Marketplace
        run: pnpm dlx @vscode/vsce publish --no-dependencies --pat "$VSCE_PAT"

      - name: Publish to Open VSX
        run: pnpm dlx ovsx publish --no-dependencies -p "$OVSX_PAT"
```

- [ ] **Step 2: Sanity-check the YAML structure**

Run: `Get-Content .github/workflows/publish.yml`
Expected: Workflow contains `push.tags`, `workflow_dispatch`, install/build/package/publish steps, and token-based publishing commands.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/publish.yml
git commit -m "ci: add extension publish workflow"
```

### Task 2: Document the release setup

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a short release section**

```md
## 自动发布

项目支持通过 GitHub Actions 自动发布到：

- VS Code Marketplace
- Open VSX

首次使用前需要在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 中配置：

- `VSCE_PAT`: VS Code Marketplace 发布令牌
- `OVSX_PAT`: Open VSX 发布令牌

说明：

- 推送形如 `v14.6.1` 的 tag 会自动触发发布
- 也可以在 GitHub Actions 页面手动触发 `Publish Extension`
- tag 版本必须和 `package.json` 中的 `version` 一致
- Open VSX 首次发布前，需要先为 `publisher: ylw` 创建 namespace
```

- [ ] **Step 2: Sanity-check the inserted docs**

Run: `rg -n "自动发布|VSCE_PAT|OVSX_PAT|namespace" README.md`
Expected: New release section is present with both secret names and the Open VSX namespace note.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add automated release instructions"
```

### Task 3: Verify the release files

**Files:**
- Test: `.github/workflows/publish.yml`
- Test: `README.md`

- [ ] **Step 1: Review the workflow diff**

Run: `git diff -- .github/workflows/publish.yml README.md docs/superpowers/plans/2026-04-17-github-actions-publish.md`
Expected: Diff shows only the new workflow, plan doc, and release documentation.

- [ ] **Step 2: Verify workspace status**

Run: `git status --short`
Expected: Only intended changes appear for the new workflow and docs, plus any pre-existing unrelated user changes remain untouched.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-04-17-github-actions-publish.md .github/workflows/publish.yml README.md
git commit -m "chore: document CI release flow"
```
