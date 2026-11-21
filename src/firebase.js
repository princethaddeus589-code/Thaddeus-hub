import {initializeApp} from 'firebase/app'
import {getAuth,GoogleAuthProvider} from 'firebase/auth'
const e=import.meta.env
const c={apiKey:e.VITE_FB_API_KEY,authDomain:e.VITE_FB_AUTH_DOMAIN,projectId:e.VITE_FB_PROJECT_ID,appId:e.VITE_FB_APP_ID}
export const on=!!c.apiKey
export const auth=on?getAuth(initializeApp(c)):null
export const gp=new GoogleAuthProvider()
