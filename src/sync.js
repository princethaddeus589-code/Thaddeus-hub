import {useEffect,useRef} from 'react'
import {doc,getDoc,setDoc} from 'firebase/firestore'
import {db} from './firebase.js'
export function useCloud(user,state,apply){
  const ready=useRef(false)
  useEffect(()=>{ready.current=false
    if(!db||!user)return
    const nm=user.displayName||user.email?.split('@')[0]||'Guest'
    getDoc(doc(db,'users',user.uid)).then(s=>{
      apply(s.exists()?s.data():{profs:[{id:'p1',name:nm,c:'#1f6feb'}],cfg:{accent:'#e50914',auto:true,intro:true},lists:{}})
      ready.current=true}).catch(()=>{ready.current=true})
  },[user?.uid])
  useEffect(()=>{
    if(!db||!user||!ready.current)return
    const t=setTimeout(()=>setDoc(doc(db,'users',user.uid),state).catch(()=>{}),800)
    return()=>clearTimeout(t)
  },[JSON.stringify(state)])
}
