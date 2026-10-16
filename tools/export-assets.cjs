// Export generated masters for the game without changing their aspect ratio or alpha.
// Usage: node tools/export-assets.cjs /path/to/generated_images
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require(require.resolve('sharp', { paths: [process.cwd(), process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean) }));
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'assets/v2/production.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!process.argv[2]) throw new Error('Usage: node tools/export-assets.cjs /path/to/generated_images');
fs.mkdirSync(path.join(root, 'assets/v2/images'), {recursive:true});
const labels = {
 chest_closed: ['宝箱・閉', 'treasure_chest.png', 'treasure'], chest_open: ['宝箱・開', null, 'treasure_open'],
 gold: ['金貨', 'treasure_gold.png', 'gold'], mine: ['地雷', 'mine.png', 'mine'], flag: ['旗', 'flag.png', 'flag'],
 wall: ['壁', 'wall.png', 'wall'], key_gold: ['金の鍵', 'key_gold.png', 'key'], sword: ['剣', 'sword.png', 'sword'],
 stairs: ['階段', 'stairs.png', 'stairs'], enemy_slime: ['スライム', 'enemy_slime.png', 'enemy'],
 enemy_defeated: ['撃破済みスライム', null, 'enemy_defeated'], menu_background: ['メニュー背景', null, 'menu_background'],
 enemy_bat: ['コウモリ', 'enemy_bat.png'], enemy_goblin: ['ゴブリン', 'enemy_goblin.png'], enemy_boss: ['ボス', 'enemy_boss.png'],
 key_iron: ['鉄の鍵', 'key_iron.png'], key_silver: ['銀の鍵', 'key_silver.png'],
 potion_red: ['赤い薬', 'potion_red.png'], potion_blue: ['青い薬', 'potion_blue.png'], potion_yellow: ['黄色い薬', 'potion_yellow.png'],
 shield: ['盾', 'shield.png'], pickaxe: ['つるはし', null, 'pickaxe'], chicken: ['鶏', 'chicken.png'],
 fire: ['炎', 'fire.png'], tree: ['木', 'tree.png'], water: ['水', 'water.png']
};
const soundLabels = { ui_click:'ボタン', cell_open:'セル公開', flag_toggle:'旗', chest_open:'宝箱', pickup:'取得', enemy_defeat:'撃破', stairs_unlock:'階段解放', next_floor:'次の階', explosion:'地雷・敗北', victory:'通常勝利', bgm_menu:'メニューBGM', bgm_explore:'探索BGM' };
(async () => {
 const images = [];
 for (const item of manifest.images) {
  const background = item.id === 'menu_background';
  const file = `assets/v2/images/${item.id}.${background ? 'jpg' : 'png'}`;
  let output = sharp(path.join(process.argv[2], item.sourceFile)).rotate();
  if (background) output = output.resize({width:960, height:720, fit:'inside'}).jpeg({quality:88});
  else output = output.resize(256,256,{fit:'contain', background:{r:0,g:0,b:0,alpha:0}}).png({compressionLevel:9});
  const data = await output.toBuffer();
  fs.writeFileSync(path.join(root,file),data);
  const meta = await sharp(data).metadata();
  item.export = {path:file, width:meta.width, height:meta.height, alpha:meta.hasAlpha, bytes:data.length, sha256:crypto.createHash('sha256').update(data).digest('hex')};
  const [label, legacy, key] = labels[item.id];
  images.push({id:item.id, label, path:file, legacy:legacy ? `assets/images/${legacy}` : null, key:key || null, active:!!key});
 }
 const audio = Object.entries(soundLabels).map(([key,label])=>({key,label,path:`assets/v2/audio/${key}.${key.startsWith('bgm_') ? 'ogg' : 'wav'}`,loop:key.startsWith('bgm_')}));
 fs.writeFileSync(path.join(root,'src/assets.js'),'// Generated from assets/v2/production.json by tools/export-assets.cjs.\nconst GAME_ASSETS = '+JSON.stringify({version:'v2',images,audio},null,2)+';\n');
 fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2)+'\n');
 console.log(`Exported ${images.length} images (${images.reduce((n,i)=>n+fs.statSync(path.join(root,i.path)).size,0)} bytes)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
