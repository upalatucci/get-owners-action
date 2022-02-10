const core = require("@actions/core");
const github = require("@actions/github");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");

const REPO_PATH = "/github/workspace/";

try {
  const repoOwnersPath = core.getInput("owners-path") || "OWNERS";
  const numberReviewers = core.getInput("n-random-reviewers");

  console.log("OWNERS FILE", repoOwnersPath);

  const absoluteOwensersPath = path.resolve(REPO_PATH, repoOwnersPath);

  const owners = yaml.load(fs.readFileSync(absoluteOwensersPath, "utf8"));

  console.log(`Approvers ${owners.approvers}`);
  console.log(`Reviewers ${owners.reviewers}`);

  core.setOutput("approvers", owners.approvers);
  core.setOutput("reviewers", owners.reviewers);

  if (numberReviewers) {
    console.log("selecting random reviewers");
    const shuffled = [...owners.reviewers].sort(() => 0.5 - Math.random());

    const selectedReviewers = shuffled.slice(0, numberReviewers);

    console.log("Random reviewers selected", selectedReviewers);
    core.setOutput("random-reviewers", selectedReviewers);
  }
} catch (error) {
  core.setFailed(error.message);
}
