/**
 * Web Bintang Jatuh & Bunga Kuningan Bercahaya
 * Fitur:
 * 1. Transisi pertanyaan halus (Matcha Theme -> Night Sky Theme)
 * 2. Canvas Falling Stars (Bintang Jatuh terus-menerus tanpa henti)
 * 3. Bunga Kuningan Bercahaya Interaktif dengan Partikel Emas
 * 4. Efek Suara Lonceng Angin Surgawi (Web Audio API - Offline & Ringan)
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');

  const btnCapekIya = document.getElementById('btnCapekIya');
  const btnCapekTidak = document.getElementById('btnCapekTidak');

  const btnBintangIya = document.getElementById('btnBintangIya');
  const btnBintangTidak = document.getElementById('btnBintangTidak');

  const reconsiderModal = document.getElementById('reconsiderModal');
  const btnModalIya = document.getElementById('btnModalIya');

  const flowerContainer = document.getElementById('flowerContainer');
  const flowerPollen = document.getElementById('flowerPollen');
  const ambientParticles = document.getElementById('ambientParticles');

  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const soundIcon = document.getElementById('soundIcon');
  const soundText = document.getElementById('soundText');

  // Canvas
  const canvas = document.getElementById('skyCanvas');
  const ctx = canvas.getContext('2d');

  let isNightActive = false;
  let isSoundEnabled = false;
  let audioCtx = null;

  /* ==========================================================================
     1. DEKORASI DAUN MATCHA MELAYANG (STEP 1 & 2)
     ========================================================================== */
  function createMatchaLeaves() {
    const leafCount = 18;
    for (let i = 0; i < leafCount; i++) {
      const leaf = document.createElement('div');
      leaf.className = 'matcha-leaf';
      leaf.style.left = `${Math.random() * 100}%`;
      leaf.style.animationDuration = `${8 + Math.random() * 10}s`;
      leaf.style.animationDelay = `${Math.random() * 8}s`;
      leaf.style.opacity = (0.2 + Math.random() * 0.4).toFixed(2);
      const scale = 0.6 + Math.random() * 0.8;
      leaf.style.transform = `scale(${scale})`;
      ambientParticles.appendChild(leaf);
    }
  }
  createMatchaLeaves();

  /* ==========================================================================
     2. LOGIKA TRANSISI ANTAR PERTANYAAN
     ========================================================================== */

  // Pertanyaan 1: Baik "Iya" maupun "Tidak" lanjut ke Pertanyaan 2
  function goToStep2() {
    step1.classList.add('fade-out');
    setTimeout(() => {
      step1.classList.remove('active');
      step1.classList.add('hidden');
      step1.classList.remove('fade-out');

      step2.classList.remove('hidden');
      step2.classList.add('fade-in');
    }, 450);
  }

  btnCapekIya.addEventListener('click', goToStep2);
  btnCapekTidak.addEventListener('click', goToStep2);

  // Pertanyaan 2: "Tidak" membuka modal bujukan lembut
  btnBintangTidak.addEventListener('click', () => {
    reconsiderModal.classList.remove('hidden');
  });

  // Pertanyaan 2: "Iya" atau dari Modal lanjut ke Pemandangan Malam
  function goToStep3() {
    reconsiderModal.classList.add('hidden');
    step2.classList.add('fade-out');

    // Ubah tema latar belakang menjadi malam
    body.classList.remove('matcha-theme');
    body.classList.add('night-theme');

    // Hapus daun matcha perlahan
    ambientParticles.style.opacity = '0';
    setTimeout(() => {
      ambientParticles.innerHTML = '';
    }, 1000);

    setTimeout(() => {
      step2.classList.add('hidden');
      step2.classList.remove('fade-out');

      step3.classList.remove('hidden');

      // Aktifkan mesin bintang jatuh & partikel bunga
      isNightActive = true;
      initNightSky();
      startPollenSpawner();

      // Play soft chime on entry if audio context is ready
      playCelestialChime(587.33); // D5
      setTimeout(() => playCelestialChime(880), 300); // A5
    }, 600);
  }

  btnBintangIya.addEventListener('click', goToStep3);
  btnModalIya.addEventListener('click', goToStep3);

  /* ==========================================================================
     3. MESIN BINTANG JATUH & LANGIT MALAM (CANVAS)
     ========================================================================== */
  let width = 0;
  let height = 0;
  let stars = [];
  let shootingStars = [];
  let animationFrameId = null;

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    createStaticStars();
  }

  window.addEventListener('resize', () => {
    if (isNightActive) {
      resizeCanvas();
    }
  });

  // Kumpulan Bintang Kelap-kelip di Latar Belakang
  function createStaticStars() {
    stars = [];
    const count = Math.floor((width * height) / 3800); // Kepadatan bintang proporsional
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: 0.005 + Math.random() * 0.02,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
        color: getRandomStarColor()
      });
    }
  }

  function getRandomStarColor() {
    const colors = [
      '#ffffff',
      '#ffffff',
      '#fff9e6', // warm star
      '#e0f7fa', // cool cyan star
      '#fff176'  // golden star
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Kelas Bintang Jatuh (Shooting Star / Meteor)
  class ShootingStar {
    constructor() {
      this.reset();
    }

    reset() {
      // Mulai dari atas atau samping kanan
      if (Math.random() > 0.4) {
        this.x = Math.random() * (width * 1.2);
        this.y = -30 - Math.random() * 80;
      } else {
        this.x = width + 30 + Math.random() * 50;
        this.y = Math.random() * (height * 0.6);
      }

      this.length = 100 + Math.random() * 180;
      this.speed = 12 + Math.random() * 14;
      this.angle = (Math.PI / 4) + (Math.random() * 0.3 - 0.15); // Sudut serong ~45 derajat
      this.dx = -Math.cos(this.angle) * this.speed;
      this.dy = Math.sin(this.angle) * this.speed;
      
      this.size = 1.2 + Math.random() * 1.8;
      this.opacity = 1;
      this.life = 0;
      this.maxLife = 40 + Math.random() * 45;
      this.active = true;

      // Warna kepala bintang jatuh (emas / putih menyilaukan)
      this.isGolden = Math.random() > 0.45;
    }

    update() {
      this.x += this.dx;
      this.y += this.dy;
      this.life++;

      // Fade out saat mendekati akhir hidup
      if (this.life > this.maxLife * 0.7) {
        this.opacity = 1 - (this.life - this.maxLife * 0.7) / (this.maxLife * 0.3);
      }

      if (this.life >= this.maxLife || this.y > height + 100 || this.x < -100) {
        this.active = false;
      }
    }

    draw() {
      if (!this.active || this.opacity <= 0) return;

      const tailX = this.x - Math.cos(this.angle) * (-this.length);
      const tailY = this.y - Math.sin(this.angle) * this.length;

      ctx.save();
      ctx.globalAlpha = Math.max(0, this.opacity);

      // Ekor Gradien Bercahaya
      const grad = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
      if (this.isGolden) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.15, 'rgba(255, 235, 59, 0.95)');
        grad.addColorStop(0.55, 'rgba(255, 179, 0, 0.4)');
        grad.addColorStop(1, 'rgba(255, 143, 0, 0)');
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, 'rgba(224, 247, 250, 0.9)');
        grad.addColorStop(0.6, 'rgba(128, 222, 234, 0.35)');
        grad.addColorStop(1, 'rgba(0, 188, 212, 0)');
      }

      ctx.strokeStyle = grad;
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // Kepala Bintang Jatuh (Kilauan Inti)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.isGolden ? '#ffca28' : '#e0f7fa';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Pengatur Munculnya Bintang Jatuh Secara Berkesinambungan
  let lastShootingStarTime = 0;
  let nextShootingStarInterval = 700; // milidetik

  function manageShootingStars(timestamp) {
    if (timestamp - lastShootingStarTime > nextShootingStarInterval) {
      lastShootingStarTime = timestamp;
      
      // Terkadang memunculkan 1 atau 2 bintang jatuh beruntun
      const spawnCount = Math.random() > 0.8 ? 2 : 1;
      for (let s = 0; s < spawnCount; s++) {
        shootingStars.push(new ShootingStar());
      }

      // Mainkan suara lembut lonceng bintang bila diaktifkan
      if (isSoundEnabled && Math.random() > 0.4) {
        playShootingStarSound();
      }

      // Interval acak antara 500ms s/d 1800ms agar alami dan tidak monoton
      nextShootingStarInterval = 500 + Math.random() * 1300;
    }
  }

  // Loop Animasi Utama Canvas (Berjalan Selama Web Dibuka)
  function renderNightSky(timestamp) {
    ctx.clearRect(0, 0, width, height);

    // 1. Gambar Bintang Latar Belakang (Twinkle)
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      star.alpha += star.twinkleSpeed * star.twinkleDir;
      if (star.alpha >= 1) {
        star.alpha = 1;
        star.twinkleDir = -1;
      } else if (star.alpha <= 0.15) {
        star.alpha = 0.15;
        star.twinkleDir = 1;
      }

      ctx.save();
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Kelola & Gambar Bintang Jatuh
    manageShootingStars(timestamp);

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const meteor = shootingStars[i];
      meteor.update();
      meteor.draw();
      if (!meteor.active) {
        shootingStars.splice(i, 1);
      }
    }

    animationFrameId = requestAnimationFrame(renderNightSky);
  }

  function initNightSky() {
    resizeCanvas();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(renderNightSky);
  }

  /* ==========================================================================
     4. EFEK PARTIKEL KILAU EMAS PADA BUNGA KUNINGAN BERCAHAYA
     ========================================================================== */
  function spawnSinglePollen() {
    if (!isNightActive) return;

    const pollen = document.createElement('div');
    pollen.className = 'golden-pollen';

    // Muncul di sekitar pusat kepala bunga (tinggi ~120px-160px dari atas container bunga)
    const startX = 145 + (Math.random() * 40 - 20);
    const startY = 135 + (Math.random() * 40 - 20);

    const size = 3 + Math.random() * 5;
    const dx = (Math.random() * 120 - 60) + 'px';
    const dy = (-60 - Math.random() * 120) + 'px';

    pollen.style.left = `${startX}px`;
    pollen.style.top = `${startY}px`;
    pollen.style.width = `${size}px`;
    pollen.style.height = `${size}px`;
    pollen.style.setProperty('--dx', dx);
    pollen.style.setProperty('--dy', dy);
    pollen.style.animationDuration = `${2.5 + Math.random() * 2}s`;

    flowerPollen.appendChild(pollen);

    setTimeout(() => {
      pollen.remove();
    }, 4500);
  }

  function startPollenSpawner() {
    setInterval(() => {
      spawnSinglePollen();
    }, 380);
  }

  // Interaksi: Klik Bunga menghasilkan semburan kilauan emas (Spark Burst)
  flowerContainer.addEventListener('click', (e) => {
    createFlowerSparkBurst(e);
    if (isSoundEnabled) {
      playCelestialChime(783.99); // G5
      setTimeout(() => playCelestialChime(1046.50), 120); // C6
    }
  });

  function createFlowerSparkBurst(e) {
    const rect = flowerContainer.getBoundingClientRect();
    const clickX = e ? e.clientX - rect.left : 150;
    const clickY = e ? e.clientY - rect.top : 140;

    const burstCount = 28;
    for (let i = 0; i < burstCount; i++) {
      const spark = document.createElement('div');
      spark.className = 'golden-pollen';

      const angle = (Math.PI * 2 * i) / burstCount + (Math.random() * 0.4);
      const distance = 40 + Math.random() * 95;
      const dx = `${Math.cos(angle) * distance}px`;
      const dy = `${Math.sin(angle) * distance - 30}px`;
      const size = 3 + Math.random() * 6;

      spark.style.left = `${clickX}px`;
      spark.style.top = `${clickY}px`;
      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      spark.style.setProperty('--dx', dx);
      spark.style.setProperty('--dy', dy);
      spark.style.animationDuration = `${1.8 + Math.random() * 1.5}s`;

      flowerPollen.appendChild(spark);

      setTimeout(() => spark.remove(), 3200);
    }
  }

  /* ==========================================================================
     5. EFEK SUARA LONCENG LANGIT (WEB AUDIO API - RINGAN & NATURAL)
     ========================================================================== */
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playCelestialChime(freq = 659.25) {
    const ctxAudio = getAudioContext();
    if (!ctxAudio) return;

    const now = ctxAudio.currentTime;
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();

    // Nada lembut lonceng kristal/angklung surgawi
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.002, now + 1.5);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    osc.connect(gain);
    gain.connect(ctxAudio.destination);

    osc.start(now);
    osc.stop(now + 2.3);
  }

  function playShootingStarSound() {
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    playCelestialChime(randomNote);
  }

  btnSoundToggle.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    getAudioContext();

    if (isSoundEnabled) {
      soundIcon.textContent = '🔊';
      soundText.textContent = 'Suara Langit Aktif';
      btnSoundToggle.style.borderColor = '#ffd54f';
      btnSoundToggle.style.background = 'rgba(255, 215, 0, 0.25)';
      playCelestialChime(880);
    } else {
      soundIcon.textContent = '🔔';
      soundText.textContent = 'Bunyi Lonceng Bintang';
      btnSoundToggle.style.borderColor = 'rgba(255, 215, 0, 0.3)';
      btnSoundToggle.style.background = 'rgba(255, 255, 255, 0.08)';
    }
  });
});
