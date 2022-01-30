import { Octokit, App } from "octokit";
import { GITHUB_AUTH_LIST } from "./constants";

const octokits = GITHUB_AUTH_LIST.map(auth => new Octokit({auth}))


export {
    octokits
}

