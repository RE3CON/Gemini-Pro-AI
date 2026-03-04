import express from "express";
import { createServer as createViteServer } from "vite";
import { Octokit } from "octokit";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GitHub Push Route
  app.post("/api/github/push", async (req, res) => {
    const { token, repoOwner, repoName, branch = "main" } = req.body;

    if (!token || !repoOwner || !repoName) {
      return res.status(400).json({ error: "Missing required fields: token, repoOwner, repoName" });
    }

    try {
      const octokit = new Octokit({ auth: token });

      // 1. Get the current commit SHA
      const { data: refData } = await octokit.rest.git.getRef({
        owner: repoOwner,
        repo: repoName,
        ref: `heads/${branch}`,
      });
      const latestCommitSha = refData.object.sha;

      // 2. Get the tree SHA for the latest commit
      const { data: commitData } = await octokit.rest.git.getCommit({
        owner: repoOwner,
        repo: repoName,
        commit_sha: latestCommitSha,
      });
      const baseTreeSha = commitData.tree.sha;

      // 3. Read files to push (recursive)
      const filesToPush: { path: string; content: string; mode: "100644" | "100755" | "040000" | "160000" | "120000"; type: "blob" | "tree" | "commit" }[] = [];
      
      async function readDir(dir: string, base: string = "") {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.join(base, entry.name);

          // Skip node_modules, .git, dist
          if (["node_modules", ".git", "dist", ".next"].includes(entry.name)) continue;

          if (entry.isDirectory()) {
            await readDir(fullPath, relativePath);
          } else {
            const content = await fs.readFile(fullPath, "utf8");
            filesToPush.push({
              path: relativePath,
              content: content,
              mode: "100644",
              type: "blob",
            });
          }
        }
      }

      await readDir(process.cwd());

      // 4. Create blobs for each file
      const treeItems = await Promise.all(
        filesToPush.map(async (file) => {
          const { data: blobData } = await octokit.rest.git.createBlob({
            owner: repoOwner,
            repo: repoName,
            content: file.content,
            encoding: "utf-8",
          });
          return {
            path: file.path,
            mode: file.mode,
            type: file.type,
            sha: blobData.sha,
          };
        })
      );

      // 5. Create a new tree
      const { data: newTreeData } = await octokit.rest.git.createTree({
        owner: repoOwner,
        repo: repoName,
        base_tree: baseTreeSha,
        tree: treeItems,
      });

      // 6. Create a new commit
      const { data: newCommitData } = await octokit.rest.git.createCommit({
        owner: repoOwner,
        repo: repoName,
        message: "Update from Google AI Identity Hardener",
        tree: newTreeData.sha,
        parents: [latestCommitSha],
      });

      // 7. Update the reference
      await octokit.rest.git.updateRef({
        owner: repoOwner,
        repo: repoName,
        ref: `heads/${branch}`,
        sha: newCommitData.sha,
      });

      res.json({ success: true, commitSha: newCommitData.sha });
    } catch (error: any) {
      console.error("GitHub Push Error:", error);
      res.status(500).json({ error: error.message || "Failed to push to GitHub" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
