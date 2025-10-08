(() => {
  // Faster progression for 6-year-olds: 120 total points to max level
  const thresholds = [0, 10, 22, 36, 52, 70, 90, 112, 136, 162, 190];

  const levelArt = {
    0: 'images/level0_potato.png',
    1: 'images/level1_adult.png',
    2: 'images/level2_younger.png',
    3: 'images/level3_rosy.png',
    4: 'images/level4_bows.png',
    5: 'images/level5_friends.png',
    6: 'images/level6_beach.png',
    7: 'images/level7_ice.png'
  };

  const particles = ['💖', '💕', '✨', '⭐', '🌟', '💫', '🎀', '🌸', '🦴', '🥔'];

  const els = {
    level: document.getElementById('level'),
    bar: document.getElementById('bar'),
    art: document.getElementById('art'),
    stage: document.getElementById('stage'),
    particles: document.getElementById('particles'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    closeSettings: document.getElementById('closeSettings'),
    soundToggle: document.getElementById('soundToggle'),
    vibrateToggle: document.getElementById('vibrateToggle'),
    motionBtn: document.getElementById('motionBtn'),
    resetBtn: document.getElementById('resetBtn'),
    levelUpOverlay: document.getElementById('levelUpOverlay'),
    newLevel: document.getElementById('newLevel'),
    introOverlay: document.getElementById('introOverlay')
  };

  let state = { points: 0, level: 0, soundEnabled: true, vibrateEnabled: true };
  try {
    const saved = JSON.parse(localStorage.getItem('puggyPotatoV2'));
    if (saved && Number.isFinite(saved.points)) state = saved;
  } catch(e){}

  function save(){
    localStorage.setItem('puggyPotatoV2', JSON.stringify(state));
  }

  function nextThreshold(){
    return thresholds[state.level] ?? thresholds[thresholds.length-1];
  }

  function setArtForLevel(){
    const src = levelArt[state.level] || levelArt[5];
    els.art.src = src;
  }

  function updateUI(){
    els.level.textContent = state.level;
    const prev = thresholds[state.level-1] || 0;
    const need = nextThreshold() - prev;
    const have = Math.min(state.points - prev, need);
    const pct = Math.max(0, Math.min(100, Math.round((have/need)*100)));
    els.bar.style.width = pct + '%';
    setArtForLevel();
  }

  // Audio system
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  function playTapSound() {
    if (!state.soundEnabled) return;
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800 + Math.random() * 200;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch(e) {}
  }

  function playLevelUpSound() {
    if (!state.soundEnabled) return;
    try {
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = freq;
          oscillator.type = 'triangle';

          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }, i * 100);
      });
    } catch(e) {}
  }

  function playBalloonSound() {
    if (!state.soundEnabled) return;
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Start low and sweep up like a balloon inflating
      oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.8);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch(e) {}
  }

  function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.textContent = particles[Math.floor(Math.random() * particles.length)];
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    els.particles.appendChild(particle);

    setTimeout(() => particle.remove(), 1000);
  }

  function haptic() {
    if (state.vibrateEnabled && navigator.vibrate) {
      navigator.vibrate(20);
    }
  }

  function wiggle() {
    els.art.classList.remove('wiggle');
    void els.art.offsetWidth; // Force reflow
    els.art.classList.add('wiggle');
    setTimeout(() => els.art.classList.remove('wiggle'), 300);
  }

  function celebrate() {
    els.art.classList.add('celebrate');
    setTimeout(() => els.art.classList.remove('celebrate'), 600);
  }

  function showLevelUpOverlay() {
    els.newLevel.textContent = state.level;
    els.levelUpOverlay.classList.remove('hidden');
    playLevelUpSound();

    // Auto-hide after 2 seconds
    setTimeout(() => {
      els.levelUpOverlay.classList.add('hidden');
    }, 2000);
  }

  function maybeLevelUp(){
    const before = state.level;
    while (state.level < 10 && state.points >= nextThreshold()){
      state.level++;

      // Special handling for level 0 → 1 transition
      if (before === 0 && state.level === 1) {
        // Hide intro overlay
        if (els.introOverlay) {
          els.introOverlay.classList.add('hidden');
        }

        // Play balloon sound and grow animation
        playBalloonSound();
        els.art.classList.add('grow');
        setTimeout(() => els.art.classList.remove('grow'), 1200);
        haptic();
        // Don't show level up overlay for first transition
      } else {
        // Normal level up for levels 2+
        haptic();
        celebrate();
        showLevelUpOverlay();
      }
    }
  }

  function addPoints(n=1){
    state.points += n;
    maybeLevelUp();
    updateUI();
    save();
  }

  // Direct character tap
  els.stage.addEventListener('click', (e) => {
    addPoints(1);
    playTapSound();
    wiggle();
    haptic();

    // Create particles at tap location
    const rect = els.stage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const offsetX = x + (Math.random() - 0.5) * 60;
        const offsetY = y + (Math.random() - 0.5) * 60;
        createParticle(offsetX, offsetY);
      }, i * 50);
    }
  });

  // Spacebar support
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      addPoints(1);
      playTapSound();
      wiggle();
      haptic();

      // Create particles in center
      const rect = els.stage.getBoundingClientRect();
      const x = rect.width / 2;
      const y = rect.height / 2;
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const offsetX = x + (Math.random() - 0.5) * 60;
          const offsetY = y + (Math.random() - 0.5) * 60;
          createParticle(offsetX, offsetY);
        }, i * 50);
      }
    }
  });

  // Shake detection
  let motionOn = false;
  let last = {x: null, y: null, z: null};

  function onMotion(e){
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const threshold = 16;
    if (last.x !== null){
      const dx = Math.abs(a.x - last.x);
      const dy = Math.abs(a.y - last.y);
      const dz = Math.abs(a.z - last.z);
      if (dx + dy + dz > threshold){
        addPoints(1);
        playTapSound();
        wiggle();
        haptic();
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
      els.motionBtn.textContent = 'Motion Enabled ✓';
    }catch(e){ console.warn(e); }
  }

  // Settings
  els.settingsBtn.addEventListener('click', () => {
    els.settingsPanel.classList.remove('hidden');
  });

  els.closeSettings.addEventListener('click', () => {
    els.settingsPanel.classList.add('hidden');
  });

  els.soundToggle.addEventListener('change', (e) => {
    state.soundEnabled = e.target.checked;
    save();
  });

  els.vibrateToggle.addEventListener('change', (e) => {
    state.vibrateEnabled = e.target.checked;
    save();
  });

  els.motionBtn.addEventListener('click', enableMotion);

  els.resetBtn.addEventListener('click', () => {
    if (confirm('Reset all progress? This cannot be undone!')) {
      state = {points: 0, level: 0, soundEnabled: state.soundEnabled, vibrateEnabled: state.vibrateEnabled};
      save();
      updateUI();
      els.settingsPanel.classList.add('hidden');
      // Show intro overlay again
      if (els.introOverlay) {
        els.introOverlay.classList.remove('hidden');
      }
    }
  });

  // Close level up overlay on tap
  els.levelUpOverlay.addEventListener('click', () => {
    els.levelUpOverlay.classList.add('hidden');
  });

  // Initialize
  els.soundToggle.checked = state.soundEnabled;
  els.vibrateToggle.checked = state.vibrateEnabled;
  updateUI();

  // Hide intro overlay if player is already past level 0
  if (state.level > 0 && els.introOverlay) {
    els.introOverlay.classList.add('hidden');
  }

  // PWA
  if ('serviceWorker' in navigator){
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
})();
