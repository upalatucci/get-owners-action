import * as core from '@actions/core'
import * as github from '@actions/github'
import path from "path"
import fs from "fs"
import yaml from "js-yaml"

function pickRandomReviewers(allReviewers: string[], numberReviewers: number) {
  const author = github.context.payload.sender?.login;

  console.log("selecting random reviewers excluding", author);

  const shuffled = [...allReviewers]
    .filter((reviewers) => reviewers !== author)
    .sort(() => 0.5 - Math.random());

  const randomReviewers = shuffled.slice(0, numberReviewers);

  console.log("Random reviewers selected", randomReviewers);
  core.setOutput("random-reviewers", randomReviewers);

  return randomReviewers;
}

async function addReviewers(prNumber: number, reviewers: string[]) {
  const token = process.env["GITHUB_TOKEN"] || core.getInput("token");

  if (!token) {
    console.log("token not specified");
  }

  const client = github.getOctokit(token);

  await client.rest.pulls.requestReviewers({
    ...github.context.repo,
    pull_number: prNumber,
    reviewers,
  });
}

try {
  const repoOwnersPath = core.getInput("owners-path");
  const numberReviewers = core.getInput("n-random-reviewers");
  const autoAddReviewers = core.getInput("auto-add-reviewers");

  console.log("OWNERS FILE", repoOwnersPath);

  const absoluteOwensersPath = path.resolve(
    process.env.GITHUB_WORKSPACE as string,
    repoOwnersPath
  );

  const owners = yaml.load(fs.readFileSync(absoluteOwensersPath, "utf8")) as any;

  console.log(`Approvers ${owners.approvers}`);
  console.log(`Reviewers ${owners.reviewers}`);

  core.setOutput("approvers", owners.approvers);
  core.setOutput("reviewers", owners.reviewers);

  if (numberReviewers) {

    const selectedReviewers = pickRandomReviewers(
      owners.reviewers,
      parseInt(numberReviewers, 10)
    );

    if (
      autoAddReviewers &&
      github.context.payload.pull_request?.number !== undefined
    ) {
      addReviewers(github.context.payload.pull_request?.number, selectedReviewers).then(() =>
        console.log("Successfully added reviewers")
      );
    } else {
      console.log('No PR found')
    }

    console.log("End");
  }
} catch (error) {
  if (error instanceof Error) {
  console.error(error.message);
  core.setFailed(error.message);
  }
}
