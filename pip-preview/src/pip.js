(async () => {
  // Sites where moving the <video> element breaks DRM playback.
  // For these, fall back to the legacy PiP API (no custom controls, but DRM works).
  const DRM_HOSTS = [
    'netflix.com',
    'primevideo.com',
    'amazon.com',
    'amazon.co.uk',
    'disneyplus.com',
    'hbomax.com',
    'max.com',
    'hulu.com',
    'paramountplus.com',
    'peacocktv.com',
    'apple.com', // Apple TV+
  ];

  const isDrmHost = () =>
    DRM_HOSTS.some((host) => location.hostname.endsWith(host));

  // Find the most relevant video: prefer playing, then largest.
  const findVideo = () => {
    const videos = Array.from(document.querySelectorAll('video'))
      .filter((v) => v.readyState > 0 && v.videoWidth > 0);
    if (!videos.length) return null;

    const playing = videos.find((v) => !v.paused && !v.ended);
    if (playing) return playing;

    return videos.reduce((biggest, v) =>
      v.videoWidth * v.videoHeight > biggest.videoWidth * biggest.videoHeight ? v : biggest
    );
  };

  const video = findVideo();
  if (!video) {
    console.warn('[PiP Preview] No playable video found.');
    return;
  }

  // Strip block on sites that disable PiP.
  video.removeAttribute('disablePictureInPicture');
  video.disablePictureInPicture = false;

  // ----- Legacy PiP path (DRM-safe) -----
  const useLegacyPip = async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
    try {
      await video.requestPictureInPicture();
    } catch (err) {
      console.warn('[PiP Preview] Legacy PiP failed:', err);
    }
  };

  if (isDrmHost()) {
    await useLegacyPip();
    return;
  }

  // ----- Document PiP path (custom controls) -----
  if (!('documentPictureInPicture' in window)) {
    // Browser doesn't support Document PiP, fall back.
    await useLegacyPip();
    return;
  }

  if (window.documentPictureInPicture.window) {
    window.documentPictureInPicture.window.close();
  }

  const pipWindow = await window.documentPictureInPicture.requestWindow({
    width: 480,
    height: 270,
  });

  const style = pipWindow.document.createElement('style');
  style.textContent = `
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      overflow: hidden;
      font-family: -apple-system, sans-serif;
    }
    #stage {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 8px;
      overflow: hidden;
      background: #000;
    }
    #stage video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }
    .btn {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.55);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      transition: opacity 0.2s, background 0.2s;
      opacity: 0;
      padding: 0;
    }
    .btn:hover { background: rgba(0, 0, 0, 0.8); }
    #stage:hover .btn,
    #stage:focus-within .btn { opacity: 1; }
    #close { top: 8px; left: 8px; }
    #return { top: 8px; right: 8px; }
    #playpause {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 64px;
      height: 64px;
    }
    .btn svg { width: 18px; height: 18px; fill: #fff; }
    #playpause svg { width: 28px; height: 28px; }
  `;
  pipWindow.document.head.appendChild(style);

  const stage = pipWindow.document.createElement('div');
  stage.id = 'stage';
  pipWindow.document.body.appendChild(stage);

  const originalParent = video.parentNode;
  const originalNextSibling = video.nextSibling;
  stage.appendChild(video);

  const ICONS = {
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
    returnTab: '<svg viewBox="0 0 24 24"><path d="M19 7h-8v6h8V7zm2-4H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16.01H3V4.98h18v14.03z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
  };

  const makeBtn = (id, svg) => {
    const b = pipWindow.document.createElement('button');
    b.id = id;
    b.className = 'btn';
    b.innerHTML = svg;
    stage.appendChild(b);
    return b;
  };

  const closeBtn = makeBtn('close', ICONS.close);
  const returnBtn = makeBtn('return', ICONS.returnTab);
  const playPauseBtn = makeBtn('playpause', video.paused ? ICONS.play : ICONS.pause);

  const syncPlayPause = () => {
    playPauseBtn.innerHTML = video.paused ? ICONS.play : ICONS.pause;
  };
  video.addEventListener('play', syncPlayPause);
  video.addEventListener('pause', syncPlayPause);

  playPauseBtn.addEventListener('click', () => {
    if (video.paused) video.play();
    else video.pause();
  });

  closeBtn.addEventListener('click', () => pipWindow.close());

  returnBtn.addEventListener('click', () => {
    pipWindow.close();
    window.focus();
  });

  pipWindow.addEventListener('pagehide', () => {
    video.removeEventListener('play', syncPlayPause);
    video.removeEventListener('pause', syncPlayPause);
    if (originalParent) {
      originalParent.insertBefore(video, originalNextSibling);
    }
  });
})();
