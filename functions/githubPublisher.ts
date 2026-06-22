/**
 * githubPublisher.ts
 *
 * Commits multiple JSON files to GitHub in a single atomic commit using the
 * Git Data API: blobs (parallel) → tree → commit → ref update.
 *
 * Required env vars (Firebase Secret Manager):
 *   GITHUB_TOKEN  — personal access token with repo write scope
 *   GITHUB_REPO   — "owner/repo-name"  e.g. "sky/minichess-io"
 *   GITHUB_BRANCH — branch to commit to (defaults to "main")
 */

const GITHUB_API = "https://api.github.com";

interface BatchFile {
  path: string;
  content: object;
}

function githubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Missing GITHUB_TOKEN");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "minichess-functions/1.0",
  };
}

/**
 * Commits all files in a single GitHub commit.
 */
export async function publishGamesBatch(
  files: BatchFile[],
  commitMessage: string
): Promise<void> {
  if (files.length === 0) return;

  const repo = process.env.GITHUB_REPO;
  if (!repo) throw new Error("Missing GITHUB_REPO");
  const branch = process.env.GITHUB_BRANCH ?? "main";
  const headers = githubHeaders();

  // 1. Resolve HEAD
  const refRes = await fetch(
    `${GITHUB_API}/repos/${repo}/git/refs/heads/${branch}`,
    { headers }
  );
  if (!refRes.ok) throw new Error(`GitHub GET ref failed (${refRes.status}): ${await refRes.text()}`);
  const latestCommitSha: string = (await refRes.json()).object.sha;

  // 2. Get base tree SHA
  const commitRes = await fetch(
    `${GITHUB_API}/repos/${repo}/git/commits/${latestCommitSha}`,
    { headers }
  );
  if (!commitRes.ok) throw new Error(`GitHub GET commit failed (${commitRes.status}): ${await commitRes.text()}`);
  const baseTreeSha: string = (await commitRes.json()).tree.sha;

  // 3. Create one blob per file (parallel)
  const treeItems = await Promise.all(
    files.map(async ({ path, content }) => {
      const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString("base64");
      const blobRes = await fetch(`${GITHUB_API}/repos/${repo}/git/blobs`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: encoded, encoding: "base64" }),
      });
      if (!blobRes.ok) throw new Error(`GitHub blob failed for ${path} (${blobRes.status}): ${await blobRes.text()}`);
      const blobSha: string = (await blobRes.json()).sha;
      return { path, mode: "100644", type: "blob", sha: blobSha };
    })
  );

  // 4. Create new tree
  const treeRes = await fetch(`${GITHUB_API}/repos/${repo}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });
  if (!treeRes.ok) throw new Error(`GitHub tree failed (${treeRes.status}): ${await treeRes.text()}`);
  const newTreeSha: string = (await treeRes.json()).sha;

  // 5. Create commit
  const newCommitRes = await fetch(`${GITHUB_API}/repos/${repo}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message: commitMessage, tree: newTreeSha, parents: [latestCommitSha] }),
  });
  if (!newCommitRes.ok) throw new Error(`GitHub commit failed (${newCommitRes.status}): ${await newCommitRes.text()}`);
  const newCommitSha: string = (await newCommitRes.json()).sha;

  // 6. Advance branch ref
  const updateRes = await fetch(
    `${GITHUB_API}/repos/${repo}/git/refs/heads/${branch}`,
    { method: "PATCH", headers, body: JSON.stringify({ sha: newCommitSha }) }
  );
  if (!updateRes.ok) throw new Error(`GitHub update ref failed (${updateRes.status}): ${await updateRes.text()}`);

  console.log(`[github] Committed ${files.length} puzzle files → ${repo}@${branch}`);
}
