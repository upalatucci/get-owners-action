"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __importDefault(require("@actions/core"));
const github_1 = __importDefault(require("@actions/github"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
function pickRandomReviewers(context, allReviewers, numberReviewers) {
    var _a;
    const author = (_a = context.payload.sender) === null || _a === void 0 ? void 0 : _a.login;
    console.log("selecting random reviewers excluding", author);
    const shuffled = [...allReviewers]
        .filter((reviewers) => reviewers !== author)
        .sort(() => 0.5 - Math.random());
    const randomReviewers = shuffled.slice(0, numberReviewers);
    console.log("Random reviewers selected", randomReviewers);
    core_1.default.setOutput("random-reviewers", randomReviewers);
    return randomReviewers;
}
function addReviewers(context, prNumber, reviewers) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = process.env["GITHUB_TOKEN"] || core_1.default.getInput("token");
        if (!token) {
            console.log("token not specified");
        }
        const client = github_1.default.getOctokit(token);
        yield client.rest.pulls.requestReviewers(Object.assign(Object.assign({}, context.repo), { pull_number: prNumber, reviewers }));
    });
}
try {
    const repoOwnersPath = core_1.default.getInput("owners-path");
    const numberReviewers = core_1.default.getInput("n-random-reviewers");
    const autoAddReviewers = core_1.default.getInput("auto-add-reviewers");
    console.log("OWNERS FILE", repoOwnersPath);
    const absoluteOwensersPath = path_1.default.resolve(process.env.GITHUB_WORKSPACE, repoOwnersPath);
    const owners = js_yaml_1.default.load(fs_1.default.readFileSync(absoluteOwensersPath, "utf8"));
    console.log(`Approvers ${owners.approvers}`);
    console.log(`Reviewers ${owners.reviewers}`);
    core_1.default.setOutput("approvers", owners.approvers);
    core_1.default.setOutput("reviewers", owners.reviewers);
    if (numberReviewers) {
        const context = github_1.default.context;
        const selectedReviewers = pickRandomReviewers(context, owners.reviewers, parseInt(numberReviewers, 10));
        if (autoAddReviewers &&
            ((_a = context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.number) !== undefined) {
            addReviewers(context, (_b = context.payload.pull_request) === null || _b === void 0 ? void 0 : _b.number, selectedReviewers).then(() => console.log("Successfully added reviewers"));
        }
        console.log("End");
    }
}
catch (error) {
    if (error instanceof Error) {
        console.error(error.message);
        core_1.default.setFailed(error.message);
    }
}
