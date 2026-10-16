(() => {
    const gallery = document.getElementById('gallery');
    const makeImage = (path, label, size) => {
        const image = document.createElement('img');
        image.src = path; image.alt = label; image.width = size; image.height = size;
        image.loading = 'lazy'; return image;
    };
    function render() {
        const filter = document.getElementById('filter').value;
        const entries = GAME_ASSETS.images.filter(entry => filter === 'all' || entry.active === (filter === 'active'));
        gallery.replaceChildren();
        document.getElementById('count').textContent = `${entries.length}点`;
        for (const entry of entries) {
            const card = document.createElement('article'); card.className = 'card';
            const title = document.createElement('h2'); title.textContent = entry.label;
            const state = document.createElement('p'); state.className = 'state';
            state.textContent = entry.active ? 'ゲームで使用中' : '今後のために保管';
            const samples = document.createElement('div'); samples.className = 'samples';
            for (const size of [30, 40, 120]) {
                const figure = document.createElement('figure');
                const caption = document.createElement('figcaption'); caption.textContent = `${size}px`;
                figure.append(makeImage(entry.path, entry.label, size), caption); samples.append(figure);
            }
            const legacy = document.createElement('div'); legacy.className = 'legacy';
            const label = document.createElement('span'); label.textContent = entry.legacy ? '旧素材（保存済み）' : '今回追加した素材';
            if (entry.legacy) {
                const oldImage = makeImage(entry.legacy, `旧・${entry.label}`, 48);
                oldImage.addEventListener('error', () => { oldImage.hidden = true; label.textContent = '旧素材を読み込めませんでした'; });
                legacy.append(oldImage);
            }
            const link = document.createElement('a'); link.href = entry.path; link.textContent = '画像を開く';
            legacy.append(label, link); card.append(title, state, samples, legacy); gallery.append(card);
        }
    }
    document.getElementById('filter').addEventListener('change', render);
    document.getElementById('surface').addEventListener('change', event => document.body.dataset.surface = event.target.value);
    render();

    const names = { tile_hidden:'未開放', ui_time:'時間', ui_total:'総得点', ui_check:'達成', ui_lock:'ロック', ui_floor:'階数', fx_spark:'光' };
    AssetPresentation.createTextures({ textures: {
        exists: () => false,
        createCanvas(key, width, height) {
            const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
            if (names[key]) {
                const figure = document.createElement('figure');
                const caption = document.createElement('figcaption'); caption.textContent = names[key];
                canvas.setAttribute('aria-label', names[key]);
                figure.append(canvas, caption); document.getElementById('marks').append(figure);
            }
            return {context:canvas.getContext('2d'), refresh() {}};
        }
    }});
    for (const sound of GAME_ASSETS.audio) {
        const card = document.createElement('div'); card.className = 'audio-card';
        const label = document.createElement('label'); label.textContent = sound.label; label.htmlFor = sound.key;
        const audio = document.createElement('audio'); audio.id = sound.key; audio.src = sound.path;
        audio.controls = true; audio.preload = 'none'; audio.loop = sound.loop; audio.volume = 0.35;
        audio.addEventListener('play', () => {
            for (const other of document.querySelectorAll('audio')) if (other !== audio) other.pause();
        });
        card.append(label, audio); document.getElementById('audio-list').append(card);
    }
})();
