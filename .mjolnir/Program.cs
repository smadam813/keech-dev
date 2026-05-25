// Parallel Planner with Review — four-phase orchestration loop.
//
//   Phase 1 (Plan):   a read-only agent analyzes the open backlog, builds a
//                      dependency graph, and emits a <plan> JSON object of
//                      unblocked issues with branch names. Runs under the Head
//                      branch strategy (no worktree — the planner only reads).
//   Phase 2 (Execute   for each issue, a reusable Sandbox is opened on the
//   + Review):         issue's branch. The implementer runs first; if it made
//                      commits, a reviewer runs in the SAME sandbox/worktree.
//                      Issues run concurrently, capped by MaxParallel.
//   Phase 3 (Merge):    one merger agent merges all completed branches into
//                       the host's current branch, resolving conflicts and
//                       running tests. Closes the corresponding issues via
//                       the configured backlog manager. No `git push` —
//                       pushing is left to the user.
//
// This workflow is one plan→implement→merge pass per invocation: branches
// are merged locally for the user to review before publishing. Re-run
// Mjolnir after pushing to pick up newly-unblocked work. MaxIterations is
// retained as a safety bound only.
//
//   Run:  dotnet run --project .mjolnir/

using System.Text.Json.Nodes;
using Mjolnir;
using Mjolnir.Agents.ClaudeCode;
using Mjolnir.Core;
using Mjolnir.Sandboxes.Docker;

// Safety bound on plan→implement→PR passes (normally exits after one pass via break).
const int MaxIterations = 10;

// Upper bound on issues worked concurrently. Each issue gets its own Docker
// container + worktree, so raise this only as far as your machine can take.
const int MaxParallel = 4;

// JSON schema the planner's <plan> output is validated against.
const string PlanSchema = """
{
  "type": "object",
  "required": ["issues"],
  "properties": {
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "title", "branch"],
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "branch": { "type": "string" }
        }
      }
    }
  }
}
""";

static ClaudeCodeOptions Model() => new() { Model = "claude-opus-4-7" };

for (var iteration = 1; iteration <= MaxIterations; iteration++)
{
    Console.WriteLine($"\n=== Iteration {iteration}/{MaxIterations} ===\n");

    // ---- Phase 1: Plan -----------------------------------------------------
    var plan = await MjolnirRunner.RunAsync(new RunOptions
    {
        Sandbox = Docker.Create(new DockerProviderOptions
        {
            BranchStrategy = new BranchStrategy.Head(),
        }),
        Agent = ClaudeCode.Create(Model()),
        PromptFile = new FileInfo(Path.Combine(AppContext.BaseDirectory, "plan-prompt.md")),
        MaxIterations = 1,
        Name = "plan",
        Output = Output.Object("plan", PlanSchema),
    });

    if (plan.StructuredOutput is not JsonNode planNode)
    {
        throw new InvalidOperationException("Planner did not emit a <plan> object.");
    }

    var issues = planNode["issues"]?.AsArray() ?? new JsonArray();
    if (issues.Count == 0)
    {
        Console.WriteLine("No unblocked issues to work on. Exiting.");
        break;
    }

    var work = issues
        .Select(i => (
            Id: (string)i!["id"]!,
            Title: (string)i!["title"]!,
            Branch: (string)i!["branch"]!))
        .ToList();

    Console.WriteLine($"Planned {work.Count} issue(s):");
    foreach (var w in work)
    {
        Console.WriteLine($"  {w.Id}: {w.Title} → {w.Branch}");
    }

    // ---- Phase 2: Execute + Review (concurrent, bounded) -------------------
    using var gate = new SemaphoreSlim(MaxParallel);

    var outcomes = await Task.WhenAll(work.Select(async issue =>
    {
        await gate.WaitAsync();
        try
        {
            var sandbox = await Sandbox.CreateAsync(new SandboxCreateOptions
            {
                Branch = issue.Branch,
                Sandbox = Docker.Create(new DockerProviderOptions()),
                CopyToWorktree = new[] { "node_modules" },
            });

            try
            {
                var implement = await sandbox.RunAsync(new SandboxRunOptions
                {
                    Agent = ClaudeCode.Create(Model()),
                    PromptFile = new FileInfo(Path.Combine(AppContext.BaseDirectory, "implement-prompt.md")),
                    MaxIterations = 100,
                    Name = $"implement-{issue.Id}",
                    PromptArgs = new Dictionary<string, string>
                    {
                        ["TASK_ID"] = issue.Id,
                        ["ISSUE_TITLE"] = issue.Title,
                        ["BRANCH"] = issue.Branch,
                    },
                });

                // Only review if the implementer actually produced commits.
                if (implement.Commits.Count > 0)
                {
                    await sandbox.RunAsync(new SandboxRunOptions
                    {
                        Agent = ClaudeCode.Create(Model()),
                        PromptFile = new FileInfo(Path.Combine(AppContext.BaseDirectory, "review-prompt.md")),
                        MaxIterations = 1,
                        Name = $"review-{issue.Id}",
                        PromptArgs = new Dictionary<string, string>
                        {
                            ["BRANCH"] = issue.Branch,
                        },
                    });
                }

                return (issue, HasCommits: implement.Commits.Count > 0);
            }
            finally
            {
                await sandbox.CloseAsync();
            }
        }
        catch (Exception ex)
        {
            // One failed pipeline must not cancel the others.
            Console.Error.WriteLine($"  ✗ {issue.Id} ({issue.Branch}) failed: {ex.Message}");
            return (issue, HasCommits: false);
        }
        finally
        {
            gate.Release();
        }
    }));

    var completed = outcomes.Where(o => o.HasCommits).Select(o => o.issue).ToList();
    if (completed.Count == 0)
    {
        Console.WriteLine("No commits produced. Nothing to PR.");
        continue;
    }

    Console.WriteLine($"\n{completed.Count} branch(es) with commits:");
    foreach (var c in completed)
    {
        Console.WriteLine($"  {c.Branch}");
    }

    // ---- Phase 3: Merge (single agent merges all completed branches) ------
    //
    // One agent merges all completed branches into the current branch,
    // resolving conflicts and running tests. Closes the corresponding issues
    // via gh issue close <ID> --comment "Completed by Mjolnir" after a successful merge. No `git push`:
    // pushing is left to the user so they can review before publishing.
    // -----------------------------------------------------------------------
    await MjolnirRunner.RunAsync(new RunOptions
    {
        Sandbox = Docker.Create(new DockerProviderOptions
        {
            BranchStrategy = new BranchStrategy.Head(),
        }),
        Agent = ClaudeCode.Create(Model()),
        PromptFile = new FileInfo(Path.Combine(AppContext.BaseDirectory, "merge-prompt.md")),
        MaxIterations = 1,
        Name = "merger",
        PromptArgs = new Dictionary<string, string>
        {
            ["BRANCHES"] = string.Join("\n", completed.Select(c => $"- {c.Branch}")),
            ["ISSUES"] = string.Join("\n", completed.Select(c => $"- {c.Id}: {c.Title}")),
        },
    });

    Console.WriteLine("\nBranches merged.");

    // The merger phase advanced the user's current branch; re-running Mjolnir
    // will re-plan against the now-larger set of merged issues. One pass per
    // invocation; break out of the outer iteration loop.
    break;
}

Console.WriteLine("\nAll done.");
