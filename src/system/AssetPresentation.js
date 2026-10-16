// Small UI marks and tile surfaces remain editable, deterministic canvas graphics.
class AssetPresentation {
    static createTextures(scene) {
        const paint = (key, draw, size = 64) => {
            if (scene.textures.exists(key)) return;
            const texture = scene.textures.createCanvas(key, size, size);
            draw(texture.context, size);
            texture.refresh();
        };
        paint('dummy', () => {}, 16);
        paint('tile_hidden', (ctx, size) => {
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#bfc5bd'); gradient.addColorStop(1, '#89958e');
            ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
            ctx.strokeStyle = '#e7e7d7'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(2,62); ctx.lineTo(2,2); ctx.lineTo(62,2); ctx.stroke();
            ctx.strokeStyle = '#596b66'; ctx.beginPath(); ctx.moveTo(62,2); ctx.lineTo(62,62); ctx.lineTo(2,62); ctx.stroke();
        });
        paint('ui_time', ctx => {
            ctx.strokeStyle = '#536f79'; ctx.lineWidth = 6; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(32,34,23,0,Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(32,18); ctx.lineTo(32,34); ctx.lineTo(44,40); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(24,4); ctx.lineTo(40,4); ctx.stroke();
        });
        paint('ui_total', ctx => {
            ctx.fillStyle='#c89943'; ctx.strokeStyle='#725525'; ctx.lineWidth=3;
            ctx.beginPath(); ctx.moveTo(15,8); ctx.lineTo(49,8); ctx.lineTo(45,34);
            ctx.quadraticCurveTo(32,48,19,34); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillRect(29,38,6,14); ctx.fillRect(19,52,26,6);
            ctx.beginPath(); ctx.moveTo(14,14); ctx.lineTo(7,14); ctx.quadraticCurveTo(7,35,20,33);
            ctx.moveTo(50,14); ctx.lineTo(57,14); ctx.quadraticCurveTo(57,35,44,33); ctx.stroke();
        });
        paint('ui_check', ctx => {
            ctx.fillStyle='#2d7862'; ctx.beginPath(); ctx.arc(32,32,28,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle='#f7f5d9'; ctx.lineWidth=7; ctx.lineCap='round'; ctx.lineJoin='round';
            ctx.beginPath(); ctx.moveTo(17,32); ctx.lineTo(27,42); ctx.lineTo(47,21); ctx.stroke();
        });
        paint('ui_lock', ctx => {
            ctx.strokeStyle='#584b3e'; ctx.lineWidth=7;
            ctx.beginPath(); ctx.arc(32,25,13,Math.PI,Math.PI*2); ctx.stroke();
            ctx.fillStyle='#d4aa54'; ctx.fillRect(12,25,40,30); ctx.strokeRect(12,25,40,30);
            ctx.fillStyle='#584b3e'; ctx.beginPath(); ctx.arc(32,37,4,0,Math.PI*2); ctx.fill(); ctx.fillRect(30,37,4,9);
        });
        paint('ui_floor', ctx => {
            ctx.strokeStyle='#536f79'; ctx.lineWidth=7; ctx.lineJoin='round';
            ctx.beginPath(); ctx.moveTo(8,12); ctx.lineTo(23,12); ctx.lineTo(23,27); ctx.lineTo(39,27);
            ctx.lineTo(39,43); ctx.lineTo(55,43); ctx.lineTo(55,57); ctx.stroke();
        });
        paint('fx_spark', ctx => {
            ctx.fillStyle='#fff1b5'; ctx.beginPath(); ctx.moveTo(32,3); ctx.lineTo(38,25); ctx.lineTo(61,32);
            ctx.lineTo(38,39); ctx.lineTo(32,61); ctx.lineTo(25,39); ctx.lineTo(3,32); ctx.lineTo(25,25); ctx.closePath(); ctx.fill();
        });
    }

    static fit(icon, size) {
        const width = icon.frame ? icon.frame.realWidth : icon.width;
        const height = icon.frame ? icon.frame.realHeight : icon.height;
        icon.setScale(size / Math.max(width || 1, height || 1));
        return icon;
    }

    static menuBackground(scene) {
        const { width, height } = scene.cameras.main;
        const backdrop = scene.add.image(width / 2, height / 2, 'menu_background');
        backdrop.setScale(Math.max(width / backdrop.width, height / backdrop.height));
        scene.add.rectangle(width / 2, height / 2, 650, 530, 0xeee7d9, 0.94)
            .setStrokeStyle(2, 0xb49b70, 0.9);
    }

    static audioControls(scene, x, y) {
        const group = scene.add.container(x, y);
        const mixer = scene.game.audio;
        const style = {fontSize:'13px', fontFamily:'Arial', color:'#344841', backgroundColor:'#e1dbc9', padding:{x:8,y:8}};
        const mute = scene.add.text(-80,0,'',style).setOrigin(0.5).setInteractive({useHandCursor:true});
        const minus = scene.add.text(-5,0,'−',style).setOrigin(0.5).setInteractive({useHandCursor:true});
        const level = scene.add.text(40,0,'', {fontSize:'12px',color:'#344841'}).setOrigin(0.5);
        const plus = scene.add.text(85,0,'＋',style).setOrigin(0.5).setInteractive({useHandCursor:true});
        const update = () => { mute.setText(mixer && !mixer.isMuted ? '音: ON' : '音: OFF'); level.setText(mixer ? `${Math.round(mixer.volume*100)}%` : '0%'); };
        mute.on('pointerdown',()=>{ if(mixer) mixer.toggleMute(); update(); });
        minus.on('pointerdown',()=>{ if(mixer) mixer.setVolume(mixer.volume-0.1); update(); });
        plus.on('pointerdown',()=>{ if(mixer) mixer.setVolume(mixer.volume+0.1); update(); });
        group.add([mute,minus,level,plus]); update();
        return group;
    }

    static burst(cell, color = 0xffd775) {
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const spark = cell.scene.add.image(cell.size / 2, cell.size / 2, 'fx_spark').setTint(color);
            this.fit(spark, cell.size * 0.24); cell.add(spark);
            cell.scene.tweens.add({ targets:spark,
                x:spark.x + Math.cos(angle) * cell.size * 0.6,
                y:spark.y + Math.sin(angle) * cell.size * 0.6,
                alpha:0, duration:350, ease:'Quad.easeOut', onComplete:()=>spark.destroy() });
        }
    }
}
