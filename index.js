const core = require("@actions/core");
const github = require("@actions/github");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");

try {
  const repoOwnersPath = core.getInput("owners-path");
  const numberReviewers = core.getInput("n-random-reviewers");

  console.log("OWNERS FILE", repoOwnersPath);

  const absoluteOwensersPath = path.resolve(
    process.env.GITHUB_WORKSPACE,
    repoOwnersPath
  );

  const owners = yaml.load(fs.readFileSync(absoluteOwensersPath, "utf8"));

  console.log(`Approvers ${owners.approvers}`);
  console.log(`Reviewers ${owners.reviewers}`);

  core.setOutput("approvers", owners.approvers);
  core.setOutput("reviewers", owners.reviewers);

  if (numberReviewers) {
    const context = github.context;
    const author = context.payload.sender?.login;

    console.log("selecting random reviewers excluding", author);

    const shuffled = [...owners.reviewers]
      .filter((reviewers) => reviewers !== author)
      .sort(() => 0.5 - Math.random());

    const selectedReviewers = shuffled.slice(0, numberReviewers);

    console.log("Random reviewers selected", selectedReviewers);
    core.setOutput("random-reviewers", selectedReviewers);

    const autoAdd = core.getInput("auto-add");

    if (autoAdd && context.payload.pull_request?.number !== undefined) {
      const token = process.env["GITHUB_TOKEN"] || core.getInput("token");
      const octokit = new github.getOctokit(token);

      const pullRequestNumber = context.payload.pull_request.number;

      octokit.pulls.requestReviewers({
        ...context.repo,
        pull_number: pullRequestNumber,
        reviewers: selectedReviewers,
      });
    }
  }
} catch (error) {
  core.setFailed(error.message);
}
