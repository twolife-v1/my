/* app.js - Waktu Solat main logic (split file) */
const APP = {
  name: 'Waktu Solat',
  kaaba: { lat: 21.422487, lon: 39.826206 },
  use24: false,
  location: null
};

// storage helper
const storage = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)) } catch(e){ return null } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
};

function formatTimeStr(str){
  if(!str) return '--:--';
  const [hh, mm] = String(str).split(':').map(n => parseInt(n,10));
  if(Number.isNaN(hh) || Number.isNaN(mm)) return '--:--';
  const now = new Date();
  now.setHours(hh, mm, 0, 0);
  return now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: !APP.use24});
}
function formatDateTime(dt){
  return dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:!APP.use24});
}

// Get location: always try navigator.geolocation first then stored/fallback
async function getLocation(){
  // if storage exists and is recent (<24h) we still try to refresh
  const stored = storage.get('loc');
  if(navigator.geolocation){
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout:15000, enableHighAccuracy:true })
      );
      const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude, name:'Current Location', accuracy: pos.coords.accuracy || 0, ts: Date.now() };
      APP.location = loc;
      storage.set('loc', loc);
      return loc;
    } catch(err){
      // permission denied or unavailable: fallback to stored or default
      if(stored) { APP.location = stored; return stored; }
      APP.location = { lat:3.1390, lon:101.6869, name:'Kuala Lumpur (fallback)', ts: Date.now() };
      return APP.location;
    }
  } else {
    if(stored) { APP.location = stored; return stored; }
    APP.location = { lat:3.1390, lon:101.6869, name:'Kuala Lumpur (fallback)', ts: Date.now() };
    return APP.location;
  }
}

// Timings: Aladhan then adhan fallback
async function getTimingsForDate(date, lat, lon){
  try {
    const ts = Math.floor(date.getTime()/1000);
    const url = `https://api.aladhan.com/v1/timings/${ts}?latitude=${lat}&longitude=${lon}&method=2`;
    const res = await fetch(url);
    if(res.ok){
      const json = await res.json();
      if(json && json.data && json.data.timings) return json.data.timings;
    }
  } catch(e){
    console.warn('Aladhan API failed', e);
  }

  // fallback to adhan
  try {
    const coords = new adhan.Coordinates(lat, lon);
    const params = adhan.CalculationMethod.MuslimWorldLeague();
    params.madhab = adhan.Madhab.Shafi;
    params.adjustments = { fajr:2, dhuhr:1, asr:1, maghrib:2, isha:2 };
    const times = new adhan.PrayerTimes(coords, date, params);
    return {
      Fajr: times.fajr.toTimeString().slice(0,5),
      Sunrise: times.sunrise.toTimeString().slice(0,5),
      Dhuhr: times.dhuhr.toTimeString().slice(0,5),
      Asr: times.asr.toTimeString().slice(0,5),
      Maghrib: times.maghrib.toTimeString().slice(0,5),
      Isha: times.isha.toTimeString().slice(0,5)
    };
  } catch(e){ console.warn('Adhan compute failed', e); }
  return null;
}

function showPrayerTimesObj(t){
  if(!t) return;
  const map = {Fajr:'fajr', Dhuhr:'dhuhr', Asr:'asr', Maghrib:'maghrib', Isha:'isha'};
  Object.keys(map).forEach(k=>{
    const el = document.getElementById('pt-'+map[k]);
    if(el){
      const val = t[k] || t[k.charAt(0).toUpperCase()+k.slice(1)];
      el.textContent = formatTimeStr(val);
    }
  });
}

/* HERO */
let heroInterval = null;
const prayerBackgrounds = {
  Fajr:"./Images/fajr.jpg", Dhuhr:"./Images/dhuhr.jpg", Asr:"./Images/asr.jpg",
  Maghrib:"./Images/maghrib.jpg", Isha:"./Images/isha.jpg"
};
for(const k in prayerBackgrounds){ const i=new Image(); i.src=prayerBackgrounds[k]; }

function renderHeroPrayers(timings){
  const prayerOrder = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  const namesDiv = document.getElementById('prayerNames');
  const timesDiv = document.getElementById('prayerTimes');
  if(!namesDiv || !timesDiv) return;
  namesDiv.innerHTML=''; timesDiv.innerHTML='';
  prayerOrder.forEach(p=>{
    const n=document.createElement('div'); n.textContent=p; namesDiv.appendChild(n);
    const t=document.createElement('div'); t.textContent=formatTimeStr(timings[p]||''); timesDiv.appendChild(t);
  });
}
function getNextPrayerKey(timings){
  const order=['Fajr','Dhuhr','Asr','Maghrib','Isha']; const now=new Date();
  for(const p of order){
    if(!timings[p]) continue;
    const parts = (timings[p]||'00:00').split(':').map(x=>parseInt(x,10));
    if(parts.length<2 || Number.isNaN(parts[0])) continue;
    const t=new Date(); t.setHours(parts[0], parts[1], 0, 0);
    if(t > now) return p;
  }
  return 'Fajr';
}
function updateHeroTiming(timings){
  if(heroInterval) clearInterval(heroInterval);
  heroInterval = setInterval(()=>{
    try {
      const next = getNextPrayerKey(timings);
      let countdown='--:--:--';
      if(timings[next]){
        const parts = timings[next].split(':').map(x=>parseInt(x,10));
        let tDate = new Date(); tDate.setHours(parts[0]||0, parts[1]||0, 0, 0);
        if(next==='Fajr' && tDate <= new Date()) tDate.setDate(tDate.getDate()+1);
        const diff = Math.max(0, tDate - new Date());
        const h = Math.floor(diff/3600000);
        const m = Math.floor((diff/60000)%60);
        const s = Math.floor((diff/1000)%60);
        countdown = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      }
      const nextLabel = document.getElementById('nextPrayer');
      const cdEl = document.getElementById('countdown');
      const heroTimeEl = document.getElementById('heroTime');
      if(nextLabel) nextLabel.textContent = 'Next: ' + next;
      if(cdEl) cdEl.textContent = countdown;
      if(heroTimeEl) heroTimeEl.textContent = formatDateTime(new Date());

      if(next && prayerBackgrounds[next]){
        const heroEl = document.getElementById('hero');
        if(heroEl) heroEl.style.backgroundImage = `url(${prayerBackgrounds[next]})`;
      }
    } catch(e){ console.warn('hero tick err', e); }
  },1000);
}

/* QIBLA + device orientation */
function calcQibla(lat, lon){
  const toRad=Math.PI/180, toDeg=180/Math.PI;
  const lat1 = lat*toRad, lon1 = lon*toRad, lat2 = APP.kaaba.lat*toRad, lon2 = APP.kaaba.lon*toRad;
  const y = Math.sin(lon2-lon1)*Math.cos(lat2);
  const x = Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1);
  return (Math.atan2(y,x)*toDeg+360)%360;
}
function updateQiblaNeedle(deg, alpha=0){
  // send to iframe and also update deg display
  const degDisplay = document.getElementById('qiblaDegDisplay');
  if(degDisplay) degDisplay.textContent = `${Math.round(deg)}°`;
  // post to qibla iframe if available
  const qf = document.getElementById('qiblatFrame');
  try { if(qf && qf.contentWindow) qf.contentWindow.postMessage({type:'app.qibla', bearing:deg, heading:alpha}, '*'); } catch(e){}
}

// init device orientation: try to attach and send alpha to iframe if available
function initDeviceOrientation(bearing){
  function handleOrientation(event){
    const alpha = (typeof event.alpha === 'number') ? event.alpha : (event.webkitCompassHeading || 0);
    updateQiblaNeedle(bearing, alpha);
  }
  if(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'){
    DeviceOrientationEvent.requestPermission().then(resp=>{
      if(resp==='granted') window.addEventListener('deviceorientation', handleOrientation, true);
    }).catch(()=>{ window.addEventListener('deviceorientation', handleOrientation, true); });
  } else {
    window.addEventListener('deviceorientation', handleOrientation, true);
  }
}

/* takwim messaging */
function sendLocationToTakwim(loc, timings){
  const f = document.getElementById('takwimFrame');
  try { f && f.contentWindow && f.contentWindow.postMessage({type:'app.location.update', detail:{ loc, timings }}, '*'); } catch(e){}
}

/* hadith */
function drawHadith(text){
  const canvas = document.getElementById('hadithCanvas'); if(!canvas) return;
  const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#2e2a24'; ctx.font='14px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
  const words=(text||'').split(' '); let line=''; const lines=[];
  words.forEach(w=>{
    const test = (line + ' ' + w).trim();
    if(ctx.measureText(test).width > canvas.width - 12){ if(line) lines.push(line); line = w; } else { line = test; }
  });
  if(line) lines.push(line);
  const startY = canvas.height/2 - (lines.length-1)*10;
  lines.forEach((l,i)=>ctx.fillText(l, canvas.width/2, startY + i*20));
}

/* MAIN: runAll */
let latestTimings = null;
async function runAll(){
  try {
    const now = new Date();
    const heroDateEl = document.getElementById('heroDate');
    const worldTimeEl = document.getElementById('worldTime');
    if(heroDateEl) heroDateEl.textContent = now.toDateString();
    if(worldTimeEl) worldTimeEl.textContent = formatDateTime(now);

    const loc = await getLocation();
    if(loc){
      const locEl = document.getElementById('locationName');
      const locSmall = document.getElementById('locationNameSmall');
      if(locEl) locEl.textContent = loc.name || `${loc.lat.toFixed(3)},${loc.lon.toFixed(3)}`;
      if(locSmall) locSmall.textContent = loc.name || `${loc.lat.toFixed(3)},${loc.lon.toFixed(3)}`;
    }

    const timings = await getTimingsForDate(new Date(), APP.location.lat, APP.location.lon) || {Fajr:'05:45', Dhuhr:'13:00', Asr:'16:30', Maghrib:'19:00', Isha:'20:15'};
    latestTimings = timings;
    renderHeroPrayers(timings);
    showPrayerTimesObj(timings);
    updateHeroTiming(timings);

    sendLocationToTakwim(APP.location, timings);

    const deg = calcQibla(APP.location.lat, APP.location.lon);
    updateQiblaNeedle(deg, 0);
    initDeviceOrientation(deg);

    const hadithText = '“The best among you are those who have the best manners and character.”';
    const hadithEl = document.getElementById('hadithText');
    if(hadithEl) hadithEl.textContent = hadithText;
    drawHadith(hadithText);

  } catch(e){ console.warn('runAll error', e); }
}

// auto refresh prayer times every 5 hours
setInterval(async ()=> {
  if(APP.location) {
    try{
      const newT = await getTimingsForDate(new Date(), APP.location.lat, APP.location.lon);
      if(newT){ latestTimings = newT; renderHeroPrayers(newT); showPrayerTimesObj(newT); }
    }catch(e){}
  }
}, 5 * 60 * 60 * 1000); // 5 hours

/* event listeners / UI */
document.getElementById('toggle24')?.addEventListener('click', ()=>{
  APP.use24 = !APP.use24;
  document.getElementById('toggle24').textContent = '24h: ' + (APP.use24 ? 'On' : 'Off');
  runAll();
});

document.getElementById('setLocationBtn')?.addEventListener('click', async ()=>{
  const lat = prompt('Enter latitude:', APP.location?.lat || 3.1390);
  const lon = prompt('Enter longitude:', APP.location?.lon || 101.6869);
  const name = prompt('Enter location name:', APP.location?.name || 'Custom');
  if(lat && lon){
    APP.location = { lat: parseFloat(lat), lon: parseFloat(lon), name: name || 'Custom', ts: Date.now() };
    storage.set('loc', APP.location);
    await runAll();
  }
});

document.getElementById('openTakwimFull')?.addEventListener('click', ()=> window.open('takwim-hijri.html','_blank') );

/* listen postMessage from iframes (e.g qibla iframe or takwim) */
window.addEventListener('message', (ev)=>{
  const msg = ev.data;
  if(!msg || !msg.type) return;
  if(msg.type === 'qibla.update' && typeof msg.bearing === 'number'){
    const d = document.getElementById('qiblaDegDisplay'); if(d) d.textContent = `${Math.round(msg.bearing)}°`;
  }
  if(msg.type === 'takwim.request.location'){
    if(APP.location) sendLocationToTakwim(APP.location, latestTimings);
  }
});

/* Run on load */
window.addEventListener('DOMContentLoaded', async ()=>{
  await runAll();
  setInterval(()=> {
    const heroTime = document.getElementById('heroTime');
    if(heroTime) heroTime.textContent = formatDateTime(new Date());
  },1000);
});

/* PWA install popup logic */
let deferredPrompt = null;
const installPopup = document.getElementById("pwaInstallPrompt");
const installBtn = document.getElementById("installBtn");
const closeInstall = document.getElementById("closeInstall");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // show popup after short delay and only if not seen
  if(!localStorage.getItem('pwa_install_shown')){
    setTimeout(()=> {
      if(installPopup) { installPopup.classList.remove('hidden'); installPopup.classList.add('show'); }
    }, 1200);
  }
});

installBtn?.addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  installPopup.classList.remove('show');
  try {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if(choice.outcome === 'accepted') console.log('PWA installed');
    else console.log('User dismissed');
  } catch(e){ console.warn('install err', e); }
  deferredPrompt = null;
  localStorage.setItem('pwa_install_shown', '1');
});

closeInstall?.addEventListener('click', ()=>{
  if(installPopup) { installPopup.classList.remove('show'); installPopup.classList.add('hidden'); }
  localStorage.setItem('pwa_install_shown', '1');
});

window.addEventListener('appinstalled', ()=> {
  console.log('App installed'); localStorage.setItem('pwa_install_shown','1');
});

/* Service worker registration (path relative) */
if('serviceWorker' in navigator){
  // register from same folder - ensure service-worker.js is at /my/service-worker.js
  navigator.serviceWorker.register('./service-worker.js').then(reg=>{
    console.log('SW registered', reg.scope);
  }).catch(err=> console.warn('SW register failed', err));
}

