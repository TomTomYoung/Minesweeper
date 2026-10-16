class InfoPanel extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width) {
        super(scene,x,y); scene.add.existing(this);
        this.width=width; this.height=80; this.uiElements={}; this.progress={};
        this.add(scene.add.rectangle(0,0,width,80,0xeee7d9).setStrokeStyle(1,0xc4b796));
        const items=[['flag','残り','flagsLeft'],['ui_time','時間','timer'],['gold','階得点','score'],['ui_total','総得点','totalScore']];
        items.forEach(([texture,label,key],i)=>this.createItem(-300+i*200,-15,texture,label,key));
        const progress=[['ui_floor','floor'],['key','key'],['sword','sword'],['enemy','enemy']];
        this.progressGroup=scene.add.container(0,20); this.add(this.progressGroup);
        progress.forEach(([texture,key],i)=>{
            const x=-250+i*155;
            const icon=scene.add.image(x,0,texture); AssetPresentation.fit(icon,22);
            const text=scene.add.text(x+16,0,'',{fontSize:'13px',fontFamily:'Arial',color:'#344841'}).setOrigin(0,.5);
            this.progressGroup.add([icon,text]); this.progress[key]={icon,text};
        });
        this.modeText=scene.add.text(0,20,'通常モード',{fontSize:'13px',color:'#344841'}).setOrigin(.5);
        this.add(this.modeText);
    }

    createItem(x,y,texture,label,key) {
        const wrapper=this.scene.add.container(x,y);
        const bg=this.scene.add.rectangle(0,0,180,35,0xe0d7c4).setStrokeStyle(1,0xc4b796);
        const icon=this.scene.add.image(-70,0,texture); AssetPresentation.fit(icon,26);
        const caption=this.scene.add.text(-50,0,label,{fontSize:'13px',color:'#536158'}).setOrigin(0,.5);
        const value=this.scene.add.text(78,0,'0',{fontSize:'16px',fontFamily:'Arial',color:'#273d34',fontStyle:'bold'}).setOrigin(1,.5);
        if (key === 'score') this.scoreCaption = caption;
        wrapper.add([bg,icon,caption,value]); this.add(wrapper); this.uiElements[key]=value;
    }

    updateData(flagsLeft,timer) {
        this.setValue('flagsLeft', flagsLeft);
        this.setValue('timer', timer);
    }

    setValue(key, value) {
        if (value === undefined) return;
        const text = this.uiElements[key];
        text.setText(String(value));
        text.setScale(Math.min(1, 76 / Math.max(1, text.width)));
    }

    updateUI(data) {
        for(const key of ['flagsLeft','timer','score','totalScore']) {
            this.setValue(key, data[key]);
        }
        if(!data.mode) return;
        const rpg=data.mode==='RPG_SIMPLE';
        this.scoreCaption.setText(rpg ? '階得点' : '得点');
        this.progressGroup.setVisible(rpg); this.modeText.setVisible(!rpg);
        if(rpg) {
            this.progress.floor.text.setText(`${data.level}階`);
            this.progress.key.text.setText(data.hasKey?'鍵あり':'鍵なし');
            this.progress.key.icon.setAlpha(data.hasKey?1:.35);
            this.progress.sword.text.setText(data.hasSword?'剣あり':'剣なし');
            this.progress.sword.icon.setAlpha(data.hasSword?1:.35);
            this.progress.enemy.text.setText(`${data.enemiesDefeated}/${data.totalEnemies}撃破`);
        }
    }
}
