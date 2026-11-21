import {useEffect,useState} from 'react'
const K=import.meta.env.VITE_TMDB_KEY,T='https://api.themoviedb.org/3',IMG='https://image.tmdb.org/t/p/'
const tm=(p,q='')=>fetch(`${T}${p}?api_key=${K}&language=en-US${q}`).then(r=>r.json())
const norm=m=>({id:m.id,title:m.title,over:m.overview,year:(m.release_date||'').slice(0,4),
  rate:m.vote_average,poster:m.poster_path&&IMG+'w342'+m.poster_path,back:m.backdrop_path&&IMG+'w1280'+m.backdrop_path})
const ROWS=[['Trending Now','/trending/movie/week',''],['Top Rated','/movie/top_rated',''],
['Action','/discover/movie','&with_genres=28'],['Comedy','/discover/movie','&with_genres=35'],
['Horror','/discover/movie','&with_genres=27'],['Sci-Fi','/discover/movie','&with_genres=878'],
['Animation','/discover/movie','&with_genres=16']]
const ls=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}

function Intro({done}){
  useEffect(()=>{const t=setTimeout(done,3600);return()=>clearTimeout(t)},[])
  return <div className="intro" onClick={done}><div className="beam"/><h1>THADDEUS<span>HUB</span></h1></div>}

function Card({m,open}){return <button className="card" onClick={()=>open(m)}>
  {m.poster?<img src={m.poster} alt={m.title} loading="lazy"/>:<div className="np">{m.title}</div>}</button>}

function Row({title,items,open}){if(!items?.length)return null
  return <section className="row"><h3>{title}</h3><div className="strip">{items.map(m=><Card key={m.id} m={m} open={open}/>)}</div></section>}

function Modal({m,close,mylist,toggle}){
  const [d,setD]=useState(null),[mode,setMode]=useState(''),[busy,setBusy]=useState(false)
  const arc=m.archive
  useEffect(()=>{if(!arc)tm('/movie/'+m.id,'&append_to_response=videos').then(setD)},[m])
  const tr=d?.videos?.results?.find(v=>v.site==='YouTube'&&v.type==='Trailer')||d?.videos?.results?.find(v=>v.site==='YouTube')
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
      {mode==='play'&&!arc&&tr&&<iframe src={`https://www.youtube.com/embed/${tr.key}?autoplay=1`} allow="autoplay;fullscreen" allowFullScreen title="trailer"/>}
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
    </div></div></div>}

export default function App(){
  const [intro,setIntro]=useState(true),[rows,setRows]=useState({}),[free,setFree]=useState([]),
    [hero,setHero]=useState(null),[sel,setSel]=useState(null),[q,setQ]=useState(''),[res,setRes]=useState(null),
    [sc,setSc]=useState(false),[mylist,setML]=useState(()=>ls('th_list',[])),[view,setView]=useState('home')
  useEffect(()=>{if(!K)return
    ROWS.forEach(([n,p,x])=>tm(p,x).then(j=>{const it=(j.results||[]).map(norm);setRows(r=>({...r,[n]:it}))
      if(n==='Trending Now')setHero(it.find(i=>i.back))}))},[])
  useEffect(()=>{fetch('https://archive.org/advancedsearch.php?q=collection%3Afeature_films+AND+mediatype%3Amovies&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&fl%5B%5D=description&sort%5B%5D=downloads+desc&rows=40&output=json')
    .then(r=>r.json()).then(j=>setFree(j.response.docs.map(d=>({id:'a:'+d.identifier,archive:d.identifier,title:d.title,year:d.year,
      over:[].concat(d.description||'').join(' ').replace(/<[^>]+>/g,'').slice(0,300),poster:`https://archive.org/services/img/${d.identifier}`,back:`https://archive.org/services/img/${d.identifier}`}))))
    .catch(()=>{})},[])
  useEffect(()=>{const f=()=>setSc(scrollY>40);addEventListener('scroll',f);return()=>removeEventListener('scroll',f)},[])
  useEffect(()=>{if(!q.trim()){setRes(null);return}
    const t=setTimeout(()=>tm('/search/movie','&query='+encodeURIComponent(q)).then(j=>setRes((j.results||[]).map(norm))),350);return()=>clearTimeout(t)},[q])
  const toggle=m=>setML(l=>{const n=l.some(x=>x.id===m.id)?l.filter(x=>x.id!==m.id):[...l,m];localStorage.setItem('th_list',JSON.stringify(n));return n})
  if(intro)return <Intro done={()=>setIntro(false)}/>
  return <>
    <nav className={sc?'nav solid':'nav'}><b className="logo" onClick={()=>{setView('home');scrollTo(0,0)}}>THADDEUS HUB</b>
      <div className="links"><a className={view==='home'?'on':''} onClick={()=>setView('home')}>Home</a>
        <a className={view==='free'?'on':''} onClick={()=>setView('free')}>Free Movies</a>
        <a className={view==='list'?'on':''} onClick={()=>setView('list')}>My List</a></div>
      <input className="search" placeholder="Search titles…" value={q} onChange={e=>setQ(e.target.value)}/></nav>
    {!K&&<div className="warn">Add your TMDB key as VITE_TMDB_KEY (see README) to load the movie catalog.</div>}
    {res?<main className="pad"><h3>Results for “{q}”</h3><div className="grid">{res.map(m=><Card key={m.id} m={m} open={setSel}/>)}</div></main>
    :view==='home'?<>
      {hero&&<header className="hero" style={{backgroundImage:`url(${hero.back})`}}><div className="fade"/><div className="ht">
        <h1>{hero.title}</h1><p>{hero.over}</p>
        <div className="btns"><button className="w" onClick={()=>setSel(hero)}>▶ Play</button><button className="g" onClick={()=>setSel(hero)}>ⓘ More Info</button></div></div></header>}
      <main className="rows">
        <Row title="Watch Free: Full Movies" items={free} open={setSel}/>
        {ROWS.map(([n])=><Row key={n} title={n} items={rows[n]} open={setSel}/>)}</main></>
    :view==='free'?<main className="pad"><h3>Free full movies (public domain)</h3><div className="grid">{free.map(m=><Card key={m.id} m={m} open={setSel}/>)}</div></main>
    :<main className="pad"><h3>My List</h3>{mylist.length?<div className="grid">{mylist.map(m=><Card key={m.id} m={m} open={setSel}/>)}</div>:<p className="meta">Nothing saved yet.</p>}</main>}
    {sel&&<Modal m={sel} close={()=>setSel(null)} mylist={mylist} toggle={toggle}/>}
    <footer>This product uses the TMDB API but is not endorsed or certified by TMDB. Full movies courtesy of the Internet Archive.</footer>
  </>}
