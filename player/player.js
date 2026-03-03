/* ═══════════════════════════════════════════════════════
   ACNOLOGIA — player.js
   Full-featured audio player with playlist, seek, volume
   ═══════════════════════════════════════════════════════ */

'use strict';

(function () {

    /* ─── Playlist ─────────────────────────────────────── */
    // Static fallback tracks (used when no admin-uploaded tracks exist).
    const STATIC_TRACKS = [
        { title: 'void//cascade', artist: 'acnologia', src: 'assets/audio/track1.mp3' },
        { title: 'midnight.exe', artist: 'unknown signal', src: 'assets/audio/track2.mp3' },
        { title: '3am static', artist: 'ghost protocol', src: 'assets/audio/track3.mp3' },
    ];

    let PLAYLIST = [];


    /* ─── Track Data (Loaded from Admin) ───────────────── */
    // HTML escaping for security
    function escHTML(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ─── State ─────────────────────────────────────────── */
    let audio = new Audio();
    let currentIdx = 0;
    let isPlaying = false;
    let shuffle = false;
    let repeat = false;   // 'none' | 'track' | 'all' — simplified to toggle
    let muted = false;

    /* ─── DOM refs ──────────────────────────────────────── */
    const $ = id => document.getElementById(id);

    const npTrack = $('np-track');
    const npArtist = $('np-artist');
    const progressBar = $('progress-bar');
    const timeCurrent = $('time-current');
    const timeTotal = $('time-total');
    const btnPlay = $('btn-play');
    const btnPrev = $('btn-prev');
    const btnNext = $('btn-next');
    const btnShuffle = $('btn-shuffle');
    const btnRepeat = $('btn-repeat');
    const volSlider = $('volume-slider');
    const volIcon = $('vol-icon');
    const playlistEl = $('playlist');
    const plToggle = $('playlist-toggle');
    const playerEl = $('music-player');
    const playerBody = $('player-body');
    const playerMin = $('player-min-btn');
    const playerClose = $('player-close-btn');

    /* ─── Helpers ───────────────────────────────────────── */
    function fmtTime(s) {
        if (!isFinite(s) || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${String(sec).padStart(2, '0')}`;
    }

    function nextIdx() {
        if (shuffle) {
            let n;
            do { n = Math.floor(Math.random() * PLAYLIST.length); } while (n === currentIdx && PLAYLIST.length > 1);
            return n;
        }
        return (currentIdx + 1) % PLAYLIST.length;
    }

    function prevIdx() {
        return (currentIdx - 1 + PLAYLIST.length) % PLAYLIST.length;
    }

    /* ─── Load & Play ───────────────────────────────────── */
    function loadTrack(idx, autoPlay) {
        currentIdx = (idx + PLAYLIST.length) % PLAYLIST.length;
        const t = PLAYLIST[currentIdx];

        audio.src = t.src;
        audio.load();

        if (npTrack) npTrack.textContent = t.title;
        if (npArtist) npArtist.textContent = t.artist;

        renderPlaylist();
        updateProgress();

        if (autoPlay) {
            play();
        } else {
            updatePlayBtn();
        }

        try { sessionStorage.setItem('acn-player-idx', currentIdx); } catch (_) { }
    }

    function play() {
        const p = audio.play();
        if (p) p.catch(() => { /* autoplay blocked — silent fail */ });
        isPlaying = true;
        updatePlayBtn();
    }

    function pause() {
        audio.pause();
        isPlaying = false;
        updatePlayBtn();
    }

    function togglePlay() {
        if (!PLAYLIST || !PLAYLIST.length) return;
        if (isPlaying) pause(); else play();
    }

    function updatePlayBtn() {
        if (btnPlay) btnPlay.textContent = isPlaying ? '⏸' : '▶';
    }

    /* ─── Progress / Seek ───────────────────────────────── */
    function updateProgress() {
        const cur = audio.currentTime || 0;
        const dur = audio.duration || 0;
        const pct = dur > 0 ? (cur / dur) * 100 : 0;

        if (progressBar) progressBar.value = pct;
        if (timeCurrent) timeCurrent.textContent = fmtTime(cur);
        if (timeTotal) timeTotal.textContent = fmtTime(dur);

        // Update CSS fill (webkit)
        if (progressBar) {
            progressBar.style.backgroundSize = `${pct}% 100%`;
        }
    }

    audio.addEventListener('timeupdate', updateProgress);

    audio.addEventListener('loadedmetadata', () => {
        updateProgress();
    });

    audio.addEventListener('ended', () => {
        if (repeat) {
            audio.currentTime = 0;
            play();
        } else {
            loadTrack(nextIdx(), true);
        }
    });

    if (progressBar) {
        progressBar.addEventListener('input', () => {
            const dur = audio.duration;
            if (isFinite(dur)) {
                audio.currentTime = (progressBar.value / 100) * dur;
            }
        });
    }

    setInterval(updateProgress, 500);

    /* ─── Volume ─────────────────────────────────────────── */
    function setVolume(v) {
        audio.volume = v / 100;
        muted = v === 0;
        if (volIcon) volIcon.textContent = muted ? '🔇' : v < 50 ? '🔉' : '🔊';
    }

    if (volSlider) {
        volSlider.addEventListener('input', () => setVolume(parseInt(volSlider.value, 10)));
        setVolume(70);
    }

    if (volIcon) {
        volIcon.addEventListener('click', () => {
            muted = !muted;
            audio.muted = muted;
            volIcon.textContent = muted ? '🔇' : '🔊';
        });
    }

    /* ─── Controls ──────────────────────────────────────── */
    if (btnPlay) btnPlay.addEventListener('click', togglePlay);
    if (btnPrev) btnPrev.addEventListener('click', () => {
        if (audio.currentTime > 3) { audio.currentTime = 0; }
        else { loadTrack(prevIdx(), isPlaying); }
    });
    if (btnNext) btnNext.addEventListener('click', () => loadTrack(nextIdx(), isPlaying));

    if (btnShuffle) {
        btnShuffle.addEventListener('click', () => {
            shuffle = !shuffle;
            btnShuffle.classList.toggle('active', shuffle);
        });
    }

    if (btnRepeat) {
        btnRepeat.addEventListener('click', () => {
            repeat = !repeat;
            btnRepeat.classList.toggle('active', repeat);
        });
    }

    /* ─── Playlist Render ───────────────────────────────── */
    function renderPlaylist() {
        if (!playlistEl) return;
        playlistEl.innerHTML = '';
        if (!PLAYLIST || !PLAYLIST.length) return;

        PLAYLIST.forEach((t, i) => {
            const li = document.createElement('div');
            li.className = 'playlist-item' + (i === currentIdx ? ' current' : '');
            li.innerHTML = `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHTML(t.title)}</span><span style="font-size:9px;color:var(--text-dim);">${escHTML(t.artist)}</span>`;
            li.addEventListener('click', () => loadTrack(i, true));
            playlistEl.appendChild(li);
        });
    }

    if (plToggle) {
        plToggle.addEventListener('click', () => {
            playlistEl.classList.toggle('open');
            plToggle.textContent = playlistEl.classList.contains('open')
                ? `▲ PLAYLIST (${PLAYLIST.length})`
                : `▼ PLAYLIST (${PLAYLIST.length})`;
        });
    }

    /* ─── Minimize / Close ───────────────────────────────── */
    if (playerMin) {
        playerMin.addEventListener('click', () => {
            playerEl.classList.toggle('minimized');
            playerMin.textContent = playerEl.classList.contains('minimized') ? '□' : '_';
        });
    }

    if (playerClose) {
        playerClose.addEventListener('click', () => {
            playerEl.style.display = 'none';
        });
    }

    /* ─── Draggable Player ───────────────────────────────── */
    (function makeDraggable() {
        const handle = $('player-drag-handle');
        if (!handle || !playerEl) return;
        let ox = 0, oy = 0, sx = 0, sy = 0;

        handle.addEventListener('mousedown', e => {
            e.preventDefault();
            sx = e.clientX;
            sy = e.clientY;
            const rect = playerEl.getBoundingClientRect();
            // Switch from right/bottom to left/top positioning
            playerEl.style.right = 'auto';
            playerEl.style.bottom = 'auto';
            playerEl.style.left = rect.left + 'px';
            playerEl.style.top = rect.top + 'px';
            ox = rect.left;
            oy = rect.top;

            function onMove(me) {
                const dx = me.clientX - sx;
                const dy = me.clientY - sy;
                playerEl.style.left = Math.max(0, ox + dx) + 'px';
                playerEl.style.top = Math.max(0, oy + dy) + 'px';
            }

            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    })();

    /* ─── Keyboard shortcuts ─────────────────────────────── */
    document.addEventListener('keydown', e => {
        // Don't hijack focus inside inputs / textareas
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
        if (e.code === 'ArrowRight') { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5); }
        if (e.code === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 5); }
        if (e.code === 'ArrowUp') { e.preventDefault(); if (volSlider) { volSlider.value = Math.min(100, +volSlider.value + 5); setVolume(+volSlider.value); } }
        if (e.code === 'ArrowDown') { e.preventDefault(); if (volSlider) { volSlider.value = Math.max(0, +volSlider.value - 5); setVolume(+volSlider.value); } }
        if (e.code === 'KeyN') loadTrack(nextIdx(), isPlaying);
        if (e.code === 'KeyP') loadTrack(prevIdx(), isPlaying);
    });

    /* ─── Init ───────────────────────────────────────────── */
    async function init() {
        try {
            const res = await fetch(`data/playlist.json?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                PLAYLIST = data.map(t => ({
                    title: t.title || 'Untitled',
                    artist: t.artist || 'Unknown',
                    src: t.url || t.src || ''
                }));
            }
        } catch (e) {
            console.error('Failed to load playlist.json', e);
        }

        renderPlaylist();

        let savedIdx = 0;
        try { savedIdx = parseInt(sessionStorage.getItem('acn-player-idx') || '0', 10); } catch (_) { }
        if (savedIdx >= PLAYLIST.length || isNaN(savedIdx)) savedIdx = 0;

        // Attempt autoplay — browsers may block; fine, user can click play
        if (PLAYLIST.length > 0) {
            loadTrack(savedIdx, true);
        }
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
