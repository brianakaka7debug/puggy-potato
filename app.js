
(() => {
  const thresholds = [0,5,25,55,90,135,190,255,330,415,510]; // levels 0..10 // cumulative for levels 1..10
  const levelArt = {
    0: 'images/level0_potato.png',
    1: 'images/level1_adult.png',
    2: 'images/level2_younger.png',
    3: 'images/level3_rosy.png',
    4: 'images/level4_bows.png',
    5: 'images/level5_friends.png'
    // levels 6-10 reuse 5 with extra flair
  };
  const levelRewards = {
    2: ['Rosy cheeks'],
    3: ['Bigger eyes'],
    4: ['Pink bows', 'Background hearts'],
    5: ['New friend appears'],
    6: ['Story: Whippy finds a squeaky toy'],
    7: ['Sparkle trail'],
    8: ['Party hat moment'],
    9: ['Angel wings daydream'],
    10:['Royal cape finale']
  };

  const els = {
    level: document.getElementById('level'),
    points: document.getElementById('points'),
    next: document.getElementById('next'),
    bar: document.getElementById('bar'),
    art: document.getElementById('art'),
    bgHearts: document.getElementById('bgHearts'),
    startBtn: document.getElementById('startBtn'),
    tapBtn: document.getElementById('tapBtn'),
    resetBtn: document.getElementById('resetBtn'),
    accTags: document.getElementById('accessoryTags'),
    stage: document.getElementById('stage')
  };

  let state = { points: 0, level: 0, unlocked: [] };
  try {
    const saved = JSON.parse(localStorage.getItem('puggyPotatoV1'));
    if (saved && Number.isFinite(saved.points)) state = saved;
  } catch(e){}

  function save(){ localStorage.setItem('puggyPotatoV1', JSON.stringify(state)); }

  function nextThreshold(){ return thresholds[state.level] ?? thresholds[thresholds.length-1]; }

  function setArtForLevel(){
    const src = levelArt[state.level] || levelArt[5];
    els.art.src = src;
    // flair for 6+
    els.bgHearts.style.opacity = state.level >= 4 ? .28 : .0;
    const hasBadge = document.querySelector('.badge');
    if (state.level >= 6 && !hasBadge){
      const b = document.createElement('div'); b.className='badge'; b.textContent='Level '+state.level+'!'; els.stage.appendChild(b);
      setTimeout(()=>b.remove(), 1800);
    }
  }

  function updateUI(){
    els.level.textContent = state.level;
    els.points.textContent = state.points;
    els.next.textContent = nextThreshold();
    const prev = thresholds[state.level-1] || 0;
    const need = nextThreshold() - prev;
    const have = Math.min(state.points - prev, need);
    const pct = Math.max(0, Math.min(100, Math.round((have/need)*100)));
    els.bar.style.width = pct + '%';
    // tags
    els.accTags.innerHTML = '';
    const unlocked = state.unlocked || [];
    unlocked.forEach(t => { const span = document.createElement('span'); span.className='tag'; span.textContent = t; els.accTags.appendChild(span); });
    setArtForLevel();
  }

  function maybeLevelUp(){
    const before = state.level;
    while (state.level < 10 && state.points >= nextThreshold()){
      state.level++;
      const reward = levelRewards[state.level] || []; 
      if(before === 0 && state.level === 1){ sproutAnimation(); }
      if (reward.length){ state.unlocked = Array.from(new Set([...(state.unlocked||[]), ...reward])); }
      haptic();
      flash();
    }
  }

  function addPoints(n=1){
    state.points += n;
    maybeLevelUp();
    updateUI();
    save();
  }

  function flash(){
    els.art.classList.add('wiggle');
    setTimeout(()=>els.art.classList.remove('wiggle'), 300);
  }

  function haptic(){ if (navigator.vibrate) { navigator.vibrate(20); } }

  // Shake detection
  let motionOn = false;
  let last = {x: null, y: null, z: null};
  function onMotion(e){
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const threshold = 16; // tune for sensitivity
    if (last.x !== null){
      const dx = Math.abs(a.x - last.x);
      const dy = Math.abs(a.y - last.y);
      const dz = Math.abs(a.z - last.z);
      if (dx + dy + dz > threshold){
        addPoints(1);
      }
    }
    last = {x:a.x, y:a.y, z:a.z};
  }

  async function enableMotion(){
    try{
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'){
        const perm = await DeviceMotionEvent.requestPermission();
        if (perm !== 'granted') return;
      }
      window.addEventListener('devicemotion', onMotion);
      motionOn = true;
      els.startBtn.textContent = 'Motion On ✓';
    }catch(e){ console.warn(e); }
  }

  // events
  els.startBtn.addEventListener('click', enableMotion);
  els.tapBtn.addEventListener('click', () => { addPoints(1); flash(); haptic(); });
  document.addEventListener('keydown', (e)=>{ if (e.code === 'Space'){ e.preventDefault(); addPoints(1); flash(); haptic(); }});
  els.resetBtn.addEventListener('click', ()=>{ state = {points:0,level:1,unlocked:[]}; save(); updateUI(); });

  
  function sproutAnimation(){
    // add a temporary class for a bouncy reveal
    els.art.classList.remove('wiggle');
    els.art.classList.add('sprout');
    setTimeout(()=>els.art.classList.remove('sprout'), 700);
  }

  // boot
  updateUI();

  // PWA
  if ('serviceWorker' in navigator){
    window.addEventListener('load', ()=> navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
})();
