import process from 'process';
export const PROD_ENV = process?.env?.NODE_ENV === 'production'
export const DEV_ENV = process?.env?.NODE_ENV === 'development'