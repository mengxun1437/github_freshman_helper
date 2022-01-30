import { Octokit, App } from "octokit";
import { GITHUB_AUTH } from "./constants";

const octokit = new Octokit({ auth: GITHUB_AUTH });


export {
    octokit
}

