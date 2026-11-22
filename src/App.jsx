import {useEffect,useState} from 'react'
import {on as FB,auth} from './firebase.js'
import {onAuthStateChanged} from 'firebase/auth'
import {Login,Drawer} from './Extras.jsx'
import {useCloud} from './sync.js'
const K=import.meta.env.VITE_TMDB_KEY,T='https://api.themoviedb.org/3',IMG='https://image.tmdb.org/t/p/'
const tm=(p,q='')=>fetch(`${T}${p}?api_key=${K}&language=en-US${q}`).then(r=>r.json())
const GN=[[28,'Action'],[12,'Adventure'],[16,'Animation'],[35,'Comedy'],[80,'Crime'],[99,'Documentary'],[18,'Drama'],[10751,'Family'],[14,'Fantasy'],[27,'Horror'],[9648,'Mystery'],[10749,'Romance'],[878,'Sci-Fi'],[53,'Thriller'],[10752,'War']]
const gname=id=>GN.find(g=>g[0]===id)?.[1]
const norm=m=>({id:m.id,title:m.title,over:m.overview,year:(m.release_date||'').slice(0,4),rate:m.vote_average,
  gen:(m.genre_ids||[]).map(gname).filter(Boolean).slice(0,3).join(' • '),
  poster:m.poster_path&&IMG+'w342'+m.poster_path,big:m.poster_path&&IMG+'w780'+m.poster_path,back:m.backdrop_path&&IMG+'w1280'+m.backdrop_path})
const ROWS=[['Your Next Watch','/trending/movie/week','',1],['Top Rated','/movie/top_rated',''],['Action','/discover/movie','&with_genres=28'],
['Comedy','/discover/movie','&with_genres=35'],['Horror','/discover/movie','&with_genres=27'],['Sci-Fi','/discover/movie','&with_genres=878'],['Animation','/discover/movie','&with_genres=16']]
const COL=['#1f6feb','#e8b410','#e50914','#25d366','#a855f7','#f97316']
const ls=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}

function Intro({done}){
  useEffect(()=>{const t=setTimeout(done,3600);return()=>clearTimeout(t)},[])
  return <div className="intro" onClick={done}><div className="beam"/><h1>THADDEUS<span>HUB</span></h1></div>}
const Face=({c})=><div className="face" style={{background:`linear-gradient(160deg,${c},${c}bb)`}}><i/><i/><u/></div>

function Profiles({list,setList,pick,bg}){
  const [ed,setEd]=useState(false)
  const add=()=>{const n=prompt('Profile name');if(n&&n.trim())setList([...list,{id:Date.now()+'',name:n.trim(),c:COL[list.length%COL.length]}])}
  const tap=p=>{if(!ed)return pick(p)
    const n=prompt('Rename profile (leave empty to delete)',p.name);if(n===null)return
    if(n.trim())setList(list.map(x=>x.id===p.id?{...x,name:n.trim()}:x))
    else if(list.length>1&&confirm('Delete '+p.name+'?'))setList(list.filter(x=>x.id!==p.id))}
  return <div className="prof" style={{backgroundImage:bg?`url(${bg})`:'none'}}><div className="pf"/><div className="pin">
    <h2>Choose Your Profile</h2><div className="pg">
    {list.map(p=><button key={p.id} onClick={()=>tap(p)}><Face c={p.c}/><span>{p.name}</span>{ed&&<b className="pen">✎</b>}</button>)}
    <button onClick={add}><div className="face plus">＋</div><span>Add</span></button>
    <button onClick={()=>setEd(!ed)}><div className="face plus">{ed?'✓':'✎'}</div><span>{ed?'Done':'Edit'}</span></button></div></div></div>}

function Card({m,open,top}){return <button className="card" onClick={()=>open(m)}>
  {m.poster?<img src={m.poster} alt={m.title} loading="lazy"/>:<div className="np">{m.title}</div>}{top&&<em className="t10">TOP<br/>10</em>}</button>}
function Row({title,items,open,top}){if(!items?.length)return null
  return <section className="row"><h3>{title}</h3><div className="strip">{items.map((m,i)=><Card key={m.id} m={m} open={open} top={top&&i<10}/>)}</div></section>}

function Modal({m,close,mylist,toggle,auto}){
  const [d,setD]=useState(null),[mode,setMode]=useState(''),[busy,setBusy]=useState(false)
  const arc=m.archive,rg=((navigator.language||'en-US').split('-')[1]||'US').toUpperCase()
  useEffect(()=>{if(!arc)tm('/movie/'+m.id,'&append_to_response=videos,watch/providers').then(setD)},[m])
  const tr=d?.videos?.results?.find(v=>v.site==='YouTube'&&v.type==='Trailer')||d?.videos?.results?.find(v=>v.site==='YouTube')
  const wp=d?.['watch/providers']?.results,pr=wp&&(wp[rg]||wp.US)
  const provs=pr?[...(pr.flatrate||[]),...(pr.rent||[]),...(pr.buy||[])].filter((p,i,a)=>a.findIndex(x=>x.provider_id===p.provider_id)===i):[]
  async function dl(){setBusy(true)
    try{const j=await fetch('https://archive.org/metadata/'+arc).then(r=>r.json())
      const f=j.files.filter(x=>/\.mp4$/i.test(x.name)).sort((a,b)=>b.size-a.size)[0]||j.files.find(x=>/\.(ogv|mkv|avi)$/i.test(x.name))
      if(!f)throw 0; const a=document.createElement('a');a.href=`https://archive.org/download/${arc}/${encodeURIComponent(f.name)}`;a.download=f.name;a.target='_blank';a.click()
    }catch{alert('No downloadable file found for this title.')}setBusy(false)}
  const saved=mylist.some(x=>x.id===m.id)
  return <div className="modal" onClick={close}><div className="box" onClick={e=>e.stopPropagation()}>
    <button className="x" onClick={close}>✕</button>
    <div className="player">
      {mode==='play'&&arc&&<iframe src={`https://archive.org/embed/${arc}`} allowFullScreen title={m.title}/>}
      {mode==='play'&&!arc&&tr&&<iframe src={`https://www.youtube.com/embed/${tr.key}?autoplay=${auto?1:0}`} allow="autoplay;fullscreen" allowFullScreen title="trailer"/>}
      {mode!=='play'&&<div className="pb" style={{backgroundImage:`url(${m.back||m.poster})`}}><div className="fade"/></div>}
    </div>
    <div className="info"><h2>{m.title}</h2>
      <p className="meta">{m.rate?<b>{Math.round(m.rate*10)}% Match</b>:null} {m.year} {d?.runtime?` · ${Math.floor(d.runtime/60)}h ${d.runtime%60}m`:''} {arc&&' · Full movie (free, public domain)'}</p>
      <div className="btns">
        <button className="w" onClick={()=>setMode('play')} disabled={!arc&&!tr}>▶ {arc?'Play movie':tr?'Play trailer':'No trailer'}</button>
        {arc&&<button className="g" onClick={dl} disabled={busy}>⬇ {busy?'Preparing…':'Download'}</button>}
        <button className="g" onClick={()=>toggle(m)}>{saved?'✓ In My List':'＋ My List'}</button>
      </div>
      <p>{m.over||d?.overview||'Public-domain feature film from the Internet Archive.'}</p>
      {d?.genres&&<p className="meta">{d.genres.map(g=>g.name).join(' • ')}</p>}
      {!arc&&d&&<div className="wtw"><h4>Where to watch</h4>{provs.length?<div className="pv">{provs.map(p=><a key={p.provider_id} href={pr.link} target="_blank" rel="noreferrer" title={p.provider_name}><img src={IMG+'w92'+p.logo_path} alt={p.provider_name}/></a>)}</div>:<p className="meta">Not listed for your region yet.</p>}
        {provs.length>0&&<p className="meta">Tap a logo to open the watch options. Data from TMDB / JustWatch.</p>}</div>}
    </div></div></div>}

export default function App(){
  const [intro,setIntro]=useState(true),[rows,setRows]=useState({}),[free,setFree]=useState([]),[hero,setHero]=useState(null),[sel,setSel]=useState(null),
    [q,setQ]=useState(''),[res,setRes]=useState([]),[mylist,setML]=useState([]),[view,setView]=useState('home'),
    [user,setUser]=useState(FB?undefined:null),[guest,setGuest]=useState(false),[drawer,setDrawer]=useState(false),
    [cfg,setCfg]=useState(()=>ls('th_cfg',{accent:'#e50914',auto:true,intro:true})),
    [profs,setProfs]=useState(()=>ls('th_profs',[])),[prof,setProf]=useState(null),[lv,setLv]=useState(null),[gi,setGi]=useState([]),[cat,setCat]=useState(false)
  useEffect(()=>{if(FB)return onAuthStateChanged(auth,setUser)},[])
  useEffect(()=>{document.documentElement.style.setProperty('--r',cfg.accent);localStorage.setItem('th_cfg',JSON.stringify(cfg))},[cfg])
  useEffect(()=>{setProf(null)},[user?.uid])
  useEffect(()=>{if(user===undefined)return;if(!profs.length){const n=user?.displayName||user?.email?.split('@')[0]||'Guest';setProfs([{id:'p1',name:n,c:COL[0]}])}},[user])
  useEffect(()=>{localStorage.setItem('th_profs',JSON.stringify(profs))},[profs])
    const [tick,setTick]=useState(0)
  useEffect(()=>{setML(prof?ls('th_list_'+prof.id,[]):[])},[prof,tick])
  const lists=Object.fromEntries(profs.map(p=>[p.id,p.id===prof?.id?mylist:ls('th_list_'+p.id,[])]))
  useCloud(user,{profs,cfg,lists},d=>{
    setProfs(d.profs);setCfg(d.cfg)
    d.profs.forEach(p=>localStorage.setItem('th_list_'+p.id,JSON.stringify(d.lists?.[p.id]||[])))
    setTick(t=>t+1)})
  useEffect(()=>{if(!K)return
    ROWS.forEach(([n,p,x])=>tm(p,x).then(j=>{const it=(j.results||[]).map(norm);setRows(r=>({...r,[n]:it}))
      if(n==='Your Next Watch')setHero(it.find(i=>i.big))}))},[])
  useEffect(()=>{fetch('https://archive.org/advancedsearch.php?q=collection%3Afeature_films+AND+mediatype%3Amovies&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&fl%5B%5D=description&sort%5B%5D=downloads+desc&rows=40&output=json')
    .then(r=>r.json()).then(j=>setFree(j.response.docs.map(d=>({id:'a:'+d.identifier,archive:d.identifier,title:d.title,year:d.year,
      over:[].concat(d.description||'').join(' ').replace(/<[^>]+>/g,'').slice(0,300),poster:`https://archive.org/services/img/${d.identifier}`,back:`https://archive.org/services/img/${d.identifier}`}))))
    .catch(()=>{})},[])
  useEffect(()=>{if(!lv)return;setGi([]);tm(lv.p,lv.x||'').then(j=>setGi((j.results||[]).map(norm)))},[lv])
  useEffect(()=>{if(!q.trim()){setRes([]);return}
    const t=setTimeout(()=>tm('/search/movie','&query='+encodeURIComponent(q)).then(j=>setRes((j.results||[]).map(norm))),350);return()=>clearTimeout(t)},[q])
  const lk='th_list_'+prof?.id
  const toggle=m=>setML(l=>{const n=l.some(x=>x.id===m.id)?l.filter(x=>x.id!==m.id):[...l,m];localStorage.setItem(lk,JSON.stringify(n));return n})
  if(intro&&cfg.intro)return <Intro done={()=>setIntro(false)}/>
  if(user===undefined)return <div className="intro"/>
  if(FB&&!user&&!guest)return <Login guest={()=>setGuest(true)}/>
  if(!prof)return <Profiles list={profs} setList={setProfs} pick={setProf} bg={hero?.big}/>
  const go=v=>{setView(v==='list'?'hub':v);setQ('');scrollTo(0,0)}
  const chip=(t,p,x)=>{setLv({t,p,x});go('grid')}
  const grid=items=><div className="grid">{items.map(m=><Card key={m.id} m={m} open={setSel}/>)}</div>
  const title={home:'Home',grid:lv?.t,free:'Free Movies',search:'Search',hub:'My Hub'}[view]
  const inList=hero&&mylist.some(x=>x.id===hero.id)
  const NV=[['home','🏠','Home'],['free','🎞️','Free'],['search','🔍','Search'],['hub','😀','My Hub']]
  return <>
    <header className="top"><b className="tm">T</b><h1>{title}</h1>
      <button className="ic" onClick={()=>go('free')} title="Free movies">⬇</button>
      <button className="ic" onClick={()=>chip('New & Hot','/movie/now_playing')} title="New & Hot">🔔</button></header>
    {!K&&<div className="warn">Add your TMDB key as VITE_TMDB_KEY to load the movie catalog.</div>}
    {(view==='home'||view==='grid')&&<div className="chips">
      <button className={'ch'+(lv?.t==='Movies'&&view==='grid'?' on':'')} onClick={()=>chip('Movies','/movie/popular')}>Movies</button>
      <button className={'ch'+(lv?.t==='New & Hot'&&view==='grid'?' on':'')} onClick={()=>chip('New & Hot','/movie/now_playing')}>New &amp; Hot</button>
      <button className="ch" onClick={()=>setCat(true)}>Categories ▾</button>
      {view==='grid'&&<button className="ch" onClick={()=>go('home')}>✕ Clear</button>}</div>}
    {view==='home'&&<>
      {hero&&<div className="hc" style={{'--p':`url(${hero.big})`,'--b':`url(${hero.back||hero.big})`}}><div className="fade"/><div className="ht">
        <h1>{hero.title}</h1><p className="meta">Movie{hero.gen&&' • '+hero.gen}</p>
        <div className="btns two"><button className="w" onClick={()=>setSel(hero)}>▶ Play</button>
          <button className="g" onClick={()=>toggle(hero)}>{inList?'✓ My List':'＋ My List'}</button></div></div></div>}
      <main className="rows"><Row title="Watch Free: Full Movies" items={free} open={setSel}/>
        {ROWS.map(([n,,,t])=><Row key={n} title={n} items={rows[n]} open={setSel} top={t}/>)}</main></>}
    {view==='grid'&&<main className="pad">{gi.length?grid(gi):<p className="meta">Loading…</p>}</main>}
    {view==='free'&&<main className="pad"><p className="meta">Public-domain full movies. Play or download them.</p>{grid(free)}</main>}
    {view==='search'&&<main className="pad"><input className="sb" autoFocus placeholder="Search movies…" value={q} onChange={e=>setQ(e.target.value)}/>{res.length?grid(res):<p className="meta">{q?'No results.':'Type a movie title.'}</p>}</main>}
    {view==='hub'&&<main className="pad"><div className="hubh"><Face c={prof.c}/><h2>{prof.name}</h2>
      <div className="btns"><button className="g" onClick={()=>setProf(null)}>Switch profile</button><button className="g" onClick={()=>setDrawer(true)}>⚙ Settings</button></div></div>
      <h3 className="rt">My List</h3>{mylist.length?grid(mylist):<p className="meta">Nothing saved yet. Tap ＋ My List on any movie.</p>}</main>}
    <nav className="pill">{NV.map(([v,i,t])=><button key={v} className={view===v?'on':''} onClick={()=>go(v)}><span>{i}</span>{t}</button>)}</nav>
    {cat&&<div className="ov" onClick={()=>setCat(false)}><div className="cs" onClick={e=>e.stopPropagation()}><h3>Categories</h3>
      {GN.map(([id,n])=><button key={id} onClick={()=>{setCat(false);chip(n,'/discover/movie','&with_genres='+id)}}>{n}</button>)}</div></div>}
    {drawer&&<Drawer user={user} view={view} cfg={cfg} setCfg={setCfg} go={go} close={()=>setDrawer(false)} clearList={()=>{setML([]);localStorage.removeItem(lk)}}/>}
    {sel&&<Modal m={sel} auto={cfg.auto} close={()=>setSel(null)} mylist={mylist} toggle={toggle}/>}
    <footer>This product uses the TMDB API but is not endorsed or certified by TMDB. Full movies courtesy of the Internet Archive.</footer>
  </>}
