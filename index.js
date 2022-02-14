const core = require("@actions/core");
const github = require("@actions/github");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");

function pickRandomReviewers(context, allReviewers, numberReviewers) {
  const author = context.payload.sender?.login;

  console.log("selecting random reviewers excluding", author);

  const shuffled = [...allReviewers]
    .filter((reviewers) => reviewers !== author)
    .sort(() => 0.5 - Math.random());

  const randomReviewers = shuffled.slice(0, numberReviewers);

  console.log("Random reviewers selected", randomReviewers);
  core.setOutput("random-reviewers", randomReviewers);

  return randomReviewers;
}

async function addReviewers(context, reviewers) {
  const token = process.env["GITHUB_TOKEN"] || core.getInput("token");

  if (!token) {
    console.log("token not specified");
  }

  const client = github.getOctokit(token);

  const pullRequestNumber = context.payload.pull_request.number;

  await client.pulls.createReviewRequest({
    owner: context.owner,
    repo: context.repo,
    pull_number: pullRequestNumber,
    reviewers,
  });
}

try {
  const repoOwnersPath = core.getInput("owners-path");
  const numberReviewers = core.getInput("n-random-reviewers");
  const autoAddReviewers = core.getInput("auto-add-reviewers");

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

    const selectedReviewers = pickRandomReviewers(
      context,
      owners.reviewers,
      numberReviewers
    );

    if (
      autoAddReviewers &&
      context.payload.pull_request?.number !== undefined
    ) {
      addReviewers(context, selectedReviewers).then(() =>
        console.log("Successfully added reviewers")
      );
    }

    console.log("End");
  }
} catch (error) {
  console.error(error.message);
  core.setFailed(error.message);
}
