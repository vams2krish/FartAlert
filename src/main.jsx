import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import { Wind, Settings2, Volume2, Upload, Play, Trash2, Zap, MousePointer2, ShieldCheck, ArrowUpRight, Pause, Sparkles, Check } from 'lucide-react';
import { SoundEngine } from './audio';
import { soundsStore } from './storage';
import './style.css';

const engine = new SoundEngine();
const themes = ['Cartoon Chaos','Heavy Duty','Musical Farts'];
function readSettings() { try { return JSON.parse(localStorage.getItem('fart-settings')) || {}; } catch { return {}; } }
function App() {
  const [settings,setSettings] = useState(() => ({timeout:10,frequency:1,theme:themes[0],volume:.65,...readSettings()}));
  const [enabled,setEnabled] = useState(false), [idle,setIdle] = useState(0), [sounds,setSounds] = useState([]), [bursts,setBursts] = useState([]), [playing,setPlaying] = useState(false), [error,setError] = useState(''), [count,setCount] = useState(0), [loaded,setLoaded] = useState(false);
  const lastActivity = useRef(Date.now()), nextFart = useRef(0), busy = useRef(false), generation = useRef(0), cursor = useRef(null), playTimer = useRef(null);
  const state = useRef({}); state.current = {settings,enabled,sounds,idle};
  const isIdle = enabled && idle >= settings.timeout;
  const update = (key,value) => setSettings(s => ({...s,[key]:value}));
  useEffect(() => { localStorage.setItem('fart-settings',JSON.stringify(settings)); },[settings]);
  useEffect(() => { soundsStore('getAll').then(setSounds).catch(() => setError('Could not restore saved sounds.')).finally(() => setLoaded(true)); },[]);
  function stop() { generation.current++; engine.stop(); setPlaying(false); clearTimeout(playTimer.current); }
  async function play(sound) {
    if(busy.current) return;
    busy.current = true; const token = generation.current;
    try {
      const s = state.current, active = s.sounds.filter(x => x.enabled);
      const selected = sound || active[Math.floor(Math.random()*active.length)];
      const duration = await engine.play(s.settings.theme,s.settings.volume,selected);
      if(token !== generation.current) { engine.stop(); return; }
      setPlaying(true); setCount(c => c+1);
      const id = crypto.randomUUID(), pos = cursor.current || {x:innerWidth*.45,y:innerHeight*.4};
      setBursts(b => [...b,{id,...pos}]); setTimeout(() => setBursts(b => b.filter(x => x.id !== id)),1800);
      clearTimeout(playTimer.current); playTimer.current = setTimeout(() => setPlaying(false),duration*1000);
      nextFart.current = Date.now() + Math.max(duration*1000+350,[9000,4000,1200][s.settings.frequency]) * (.9+Math.random()*.2);
      setError('');
    } catch { setError('This sound could not play. Try a different WAV or MP3 file.'); nextFart.current=Date.now()+5000; }
    finally { busy.current=false; }
  }
  useEffect(() => {
    const activity = e => { lastActivity.current = Date.now(); if(e.clientX !== undefined) cursor.current={x:e.clientX,y:e.clientY}; if(!window.desktop) { setIdle(0); if(state.current.enabled && state.current.idle >= state.current.settings.timeout) stop(); } };
    const events=['pointermove','pointerdown','keydown','wheel']; events.forEach(e => window.addEventListener(e,activity,{passive:true}));
    let polling=false;
    const timer=setInterval(async () => {
      if(polling) return; polling=true;
      try {
        const seconds=window.desktop ? await window.desktop.getIdleSeconds() : (Date.now()-lastActivity.current)/1000;
        const s=state.current; setIdle(seconds);
        if(s.enabled && seconds>=s.settings.timeout) { if(Date.now()>=nextFart.current) play(); }
        else { nextFart.current=0; if(s.enabled && s.idle>=s.settings.timeout) stop(); }
      } catch { setError('Inactivity monitoring is unavailable. Restart the app.'); }
      finally { polling=false; }
    },250);
    return () => { clearInterval(timer); events.forEach(e => window.removeEventListener(e,activity)); engine.stop(); };
  },[]);
  async function toggle() { if(enabled) { setEnabled(false); stop(); } else { try { await engine.unlock(); nextFart.current=0; setEnabled(true); } catch { setError('Audio could not start. Check your audio output.'); } } }
  async function upload(event) {
    const files=Array.from(event.target.files); event.target.value='';
    for(const file of files) {
      if(!/\.(mp3|wav)$/i.test(file.name) || file.size>15*1024*1024) { setError('Choose a WAV or MP3 file under 15 MB.'); continue; }
      try {
        await engine.unlock(); await engine.context.decodeAudioData(await file.arrayBuffer());
        const sound={id:crypto.randomUUID(),name:file.name,blob:file,enabled:true};
        await soundsStore('put',sound); setSounds(s => [...s,sound]); setError('');
      } catch { setError(`Could not load ${file.name}. Please choose a valid audio file.`); }
    }
  }
  async function changeSound(sound,remove=false) { try { const updated={...sound,enabled:!sound.enabled}; await soundsStore(remove?'delete':'put',remove?sound.id:updated); setSounds(s => remove?s.filter(x => x.id!==sound.id):s.map(x => x.id===sound.id?updated:x)); stop(); } catch { setError('Could not save your sound changes.'); } }
  const customCount=sounds.filter(s=>s.enabled).length;
  return <div className="app"><header><a className="brand" href="#"><span className="brand-icon"><Wind size={25}/></span>fart alert<span className="brand-dot">®</span></a><span className="desktop-badge"><span/>{window.desktop?'DESKTOP EDITION':'BROWSER PREVIEW'}</span><span className="header-note">A little less silence. A lot more personality.</span></header>
    <main><div className="page-heading"><div><div className="eyebrow">YOUR SILENCE HAS A SOUNDTRACK</div><h1>Step away.<br/>Let it <span>rip.</span><Sparkles className="title-spark" size={34}/></h1><p>The world's least necessary productivity companion.<br/>Go idle. Get gassy. Come back to business.</p></div><div className="edition-stamp"><Wind size={26}/><span>100% NATURAL<br/>0% PRODUCTIVE</span></div></div>
    <div className="workspace"><section className={'monitor '+(isIdle?'gassy':'')}><div className="monitor-top"><span className="pill"><span className={enabled?'dot green':'dot'}/>{enabled ? isIdle?'CAUSING A STINK':'ON THE LOOKOUT':'STANDING BY'}</span><span className="live-label">LIVE MONITOR</span></div>
      <div className="mascot-scene"><motion.div className="stink-line one" animate={{y:[0,-12,0],opacity:[.3,.7,.3]}} transition={{repeat:Infinity,duration:3}}>~</motion.div><motion.div className="stink-line two" animate={{y:[0,-15,0]}} transition={{repeat:Infinity,duration:2.7}}>~</motion.div><motion.div className="cloud" animate={playing?{rotate:[0,-7,7,0],scale:[1,1.12,1]}:{y:[0,-9,0]}} transition={{duration:playing?.4:3,repeat:playing?0:Infinity}}><div className="cloud-bump a"/><div className="cloud-bump b"/><div className="cloud-bump c"/><div className="face"><span className="eye"/><span className="eye"/><div className={'mouth '+(playing?'open':'')}/><span className="cheek left"/><span className="cheek right"/></div></motion.div><div className="cloud-shadow"/><span className="floating-star">✳</span><span className="little-star">✦</span></div>
      <h2>{playing?'Oops. That was me.':isIdle?'Nobody here? Perfect.':enabled?'Silence is suspicious.':'Ready to make a stink?'}</h2><p className="monitor-description">{isIdle?'Your desk has officially entered the danger zone.':enabled?'You do your thing. We’ll listen for the quiet.':'Turn on the alert. We’ll take it from here.'}</p>
      <div className="idle-meter"><div><span>{enabled?'Time since last activity':'MONITORING PAUSED'}</span><strong>{enabled?`${Math.floor(idle)}s / ${settings.timeout}s`:'—'}</strong></div><div className="track"><div style={{width:enabled?`${Math.min(100,idle/settings.timeout*100)}%`:'0%'}}/></div><div className="meter-caption"><MousePointer2 size={12}/>{window.desktop?'Mouse + keyboard · across your desktop':'Preview monitors activity in this page only'}</div></div>
      <div className="main-actions"><button className={'primary '+(enabled?'armed':'')} onClick={toggle}>{enabled?<Pause size={18}/>:<Zap size={18}/>} {enabled?'Pause Fart Alert':'Activate Fart Alert'}<ArrowUpRight size={18}/></button><button className="test-button" onClick={()=>play()} disabled={busy.current}><Volume2 size={18}/>Test sound</button></div><div className="monitor-foot"><ShieldCheck size={14}/>All ears. No tracking. Everything stays on your device.</div></section>
    <aside className="settings"><div className="settings-heading"><span><Settings2 size={19}/>The control room</span><span className="tiny-tag">MAKE IT YOURS</span></div><div className="setting"><div className="label-row"><label htmlFor="timeout">Idle timeout</label><span className="value-tag">{settings.timeout} seconds</span></div><p>How long before we break the silence?</p><input id="timeout" type="range" min="5" max="120" step="5" value={settings.timeout} onChange={e=>update('timeout',+e.target.value)}/><div className="range-labels"><span>5 sec</span><span>2 min</span></div></div>
      <div className="setting"><div className="label-row"><label htmlFor="theme">Sound personality</label><Volume2 size={15}/></div><select id="theme" value={settings.theme} onChange={e=>update('theme',e.target.value)}>{themes.map(t=><option key={t}>{t}</option>)}</select><p>{customCount?`${customCount} custom sound${customCount>1?'s':''} active · overrides this theme`:'Handcrafted chaos. A different toot every time.'}</p></div>
      <div className="setting"><div className="label-row"><label htmlFor="frequency">Fart frequency</label><span className="frequency-icon">♨</span></div><input id="frequency" type="range" min="0" max="2" value={settings.frequency} onChange={e=>update('frequency',+e.target.value)}/><div className="frequency-labels">{['Gentle','Standard','Extreme'].map((n,i)=><button key={n} className={settings.frequency===i?'selected':''} onClick={()=>update('frequency',i)}>{n}{i===2?' ⚡':''}</button>)}</div></div>
      <div className="setting volume-setting"><div className="label-row"><label htmlFor="volume">Volume</label><span>{Math.round(settings.volume*100)}%</span></div><input id="volume" type="range" min="0" max="1" step=".01" value={settings.volume} onChange={e=>update('volume',+e.target.value)}/></div>
      <div className="custom-section"><div className="label-row"><label>Your secret weapons</label><span className="tiny-tag">CUSTOM SOUNDS</span></div><p>Bring your own brand of questionable audio.</p><label className="upload"><Upload size={20}/><strong>Drop a little personality in here</strong><span>Choose WAV or MP3 · up to 15 MB each</span><input aria-label="Upload custom sounds" type="file" accept=".wav,.mp3,audio/wav,audio/mpeg" multiple onChange={upload} disabled={!loaded}/></label><div className="sound-list">{sounds.map(sound=><div className="sound-row" key={sound.id}><button title={'Preview '+sound.name} aria-label={'Preview '+sound.name} onClick={()=>play(sound)}><Play size={14}/></button><span title={sound.name}>{sound.name}</span><button className={'sound-toggle '+(sound.enabled?'active':'')} aria-label={'Enable '+sound.name} aria-pressed={sound.enabled} onClick={()=>changeSound(sound)}>{sound.enabled?<Check size={12}/>:'Off'}</button><button aria-label={'Delete '+sound.name} onClick={()=>changeSound(sound,true)}><Trash2 size={14}/></button></div>)}</div><div className="upload-note"><span className="dot green"/>Uploads are active instantly. Only enabled sounds play.</div></div>
    </aside></div><div className="bottom-strip"><div><span className="stat-icon"><Wind size={21}/></span><strong>{count.toString().padStart(2,'0')}</strong><span>farts unleashed<br/><small>this session</small></span></div><div className="bottom-message">A moment of silence?<br/><strong>Not on our watch.</strong></div><span className="made-with">MADE WITH A QUESTIONABLE SENSE OF HUMOR ↗</span></div>{error&&<div className="error" role="alert">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}<footer><span>FART ALERT © {new Date().getFullYear()}</span><span>Stay curious. Stay hydrated. Stay upwind.</span><span>v1.0 · GOOD VIBES, BAD AIR</span></footer></main>
    <div className="particles" aria-hidden="true"><AnimatePresence>{bursts.flatMap(b=>Array.from({length:14},(_,i)=><motion.span key={b.id+i} initial={{x:b.x,y:b.y,scale:0,opacity:1}} animate={{x:b.x+Math.cos(i/14*Math.PI*2)*(90+i*9),y:b.y+Math.sin(i/14*Math.PI*2)*(80+i*7)-50,scale:[0,1.5,.5],opacity:0,rotate:i*57}} transition={{duration:1.6,ease:'easeOut'}} style={{background:['#bbcc75','#e9ad7b','#d5b9df','#e7cc63'][i%4],borderRadius:i%3?'50%':'4px'}}/>))}</AnimatePresence></div>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
