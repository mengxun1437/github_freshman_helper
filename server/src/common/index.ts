import { octokits } from "./github"
import process from 'process'

export const formatGithubApi = (api:any) => api.slice(22)

export const randomRequest = async (api:any) => {
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

export const PROD_ENV = process?.env?.NODE_ENV === 'production'
export const DEV_ENV = process?.env?.NODE_ENV === 'development'