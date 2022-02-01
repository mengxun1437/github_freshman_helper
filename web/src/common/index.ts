import process from 'process';
export const PROD_ENV = process?.env?.NODE_ENV === 'production'
export const DEV_ENV = process?.env?.NODE_ENV === 'development'

export const BASE_SERVER_URL = PROD_ENV ? "http://api.mengxun.online/gfh" : "http://localhost:10310"