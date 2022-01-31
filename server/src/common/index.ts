import { octokits } from "./github"

export const formatGithubApi = (api) => api.slice(22)

export const randomRequest = async (api) => {
    if(!api) return null
    try{
        const octokit = octokits[Math.floor(Math.random()*octokits.length)]
        const resp = await octokit.request(`GET ${api}`)
        if(resp?.status === 200){
            return resp?.data || null
        }
        return null
    }catch{
        return null
    }
}