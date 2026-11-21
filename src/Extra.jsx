import {useState} from 'react'
import {auth,gp} from './firebase.js'
import {signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithPopup,updateProfile,signOut,sendPasswordResetEmail} from 'firebase/auth'

export function Login({guest}){
  const [mode,setMode]=useState('in'),[n,setN]=useState(''),[e,setE]=useState(''),[p,setP]=useState(''),[err,setErr]=useState(''),[b,setB]=useState(false)
  const run=async f=>{setErr('');setB(true);try{await f()}catch(x){setErr(x.message.replace('Firebase: ','').replace(/\(auth\/.*\)\.?/,'').trim()||'Something went wrong')}setB(false)}
  const submit=ev=>{ev.preventDefault();run(async()=>{
    if(mode==='in')await signInWithEmailAndPassword(auth,e,p)
    else{const c=await createUserWithEmailAndPassword(auth,e,p);if(n)await updateProfile(c.user,{displayName:n})}})}
  return <div className="login"><div className="lbox"><b className="logo big">THADDEUS HUB</b>
    <h2>{mode==='in'?'Sign In':'Create Account'}</h2>
    <form onSubmit={submit}>{mode==='up'&&<input placeholder="Your name" value={n} onChange={x=>setN(x.target.value)} required/>}
      <input type="email" placeholder="Email" value={e} onChange={x=>setE(x.target.value)} required/>
      <input type="password" placeholder="Password (6+ characters)" minLength={6} value={p} onChange={x=>setP(x.target.value)} required/>
      {err&&<p className="err">{err}</p>}
      <button className="w red" disabled={b}>{mode==='in'?'Sign In':'Sign Up'}</button></form>
    <button className="g full" onClick={()=>run(()=>signInWithPopup(auth,gp))}>Continue with Google</button>
    {mode==='in'&&<a onClick={()=>e?run(async()=>{await sendPasswordResetEmail(auth,e);setErr('Reset link sent to '+e)}):setErr('Type your email first')}>Forgot password?</a>}
    <p className="meta">{mode==='in'?'New here? ':'Have an account? '}<a onClick={()=>setMode(mode==='in'?'up':'in')}>{mode==='in'?'Sign up now':'Sign in'}</a></p>
    <a onClick={guest}>Continue as guest</a></div></div>}

const Sw=({on,set,t,s})=><button className="li" onClick={()=>set(!on)}><div>{t}<small>{s}</small></div><span className={'sw'+(on?' on':'')}/></button>

export function Drawer({user,close,go,cfg,setCfg,clearList,view}){
  const [pane,setPane]=useState('menu')
  const nm=user?.displayName||user?.email?.split('@')[0]||'Guest'
  const set=(k,v)=>setCfg({...cfg,[k]:v})
  const nav=(v)=>{go(v);close()}
  return <div className="ov" onClick={close}><aside className="sheet" onClick={e=>e.stopPropagation()}>
    <div className="me"><div className="av">{nm[0].toUpperCase()}</div><div><b>{nm}</b><small>{user?.email||'Not signed in'}</small></div></div>
    {pane==='menu'?<>
      {[['home','🏠 Home'],['free','🎞️ Free Movies'],['list','❤️ My List']].map(([v,t])=><button key={v} className={'li'+(view===v?' act':'')} onClick={()=>nav(v)}><div>{t}</div></button>)}
      <button className="li" onClick={()=>setPane('set')}><div>⚙️ Settings<small>Appearance, playback, account</small></div></button>
      <button className="li" onClick={()=>navigator.share?navigator.share({title:'Thaddeus Hub',url:location.href}).catch(()=>{}):alert(location.href)}><div>📤 Invite friends</div></button>
      {user&&<button className="li" onClick={()=>{signOut(auth);close()}}><div>🚪 Sign out</div></button>}</>
    :<>
      <button className="li" onClick={()=>setPane('menu')}><div>← Settings</div></button>
      <div className="li"><div>🎨 Accent colour</div><div className="dots">{['#e50914','#25d366','#3b82f6','#f59e0b','#a855f7'].map(c=><i key={c} className={c===cfg.accent?'on':''} style={{background:c}} onClick={()=>set('accent',c)}/>)}</div></div>
      <Sw on={cfg.auto} set={v=>set('auto',v)} t="▶️ Autoplay trailers" s="Start playing when you open a title"/>
      <Sw on={cfg.intro} set={v=>set('intro',v)} t="✨ Opening animation" s="Show the Thaddeus Hub intro on launch"/>
      <button className="li" onClick={()=>{clearList();alert('My List cleared')}}><div>🗑️ Clear My List</div></button>
      <div className="li"><div>ℹ️ Thaddeus Hub v1.1<small>Movie data by TMDB · Free films by Internet Archive</small></div></div></>}
  </aside></div>}
