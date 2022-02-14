import core from"@actions/core";
import github, {context} from "@actions/github"
import path from "path"
import fs from "fs"
import yaml from "js-yaml"
import { Context } from "@actions/github/lib/context";

function pickRandomReviewers(context: Context, allReviewers: string[], numberReviewers: number) {
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

async function addReviewers(context: Context, prNumber: number, reviewers: string[]) {
  const token = process.env["GITHUB_TOKEN"] || core.getInput("token");

  if (!token) {
    console.log("token not specified");
  }

  const client = github.getOctokit(token);

  await client.rest.pulls.requestReviewers({
    ...context.repo,
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
    const context = github.context;

    const selectedReviewers = pickRandomReviewers(
      context,
      owners.reviewers,
      parseInt(numberReviewers, 10)
    );

    if (
      autoAddReviewers &&
      context.payload.pull_request?.number !== undefined
    ) {
      addReviewers(context, context.payload.pull_request?.number, selectedReviewers).then(() =>
        console.log("Successfully added reviewers")
      );
    }

    console.log("End");
  }
} catch (error) {
  if (error instanceof Error) {
  console.error(error.message);
  core.setFailed(error.message);
  }
}
