"""Original synthesized sounds; no recordings or third-party compositions.
Run with Python + numpy + ffmpeg. Gameplay does not require these build tools.
"""
from pathlib import Path
import wave, json, subprocess, tempfile
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/v2/audio'; OUT.mkdir(parents=True,exist_ok=True)
SR=22050
rng=np.random.default_rng(20261016)
def tone(hz,duration,decay=6):
 t=np.arange(round(SR*duration))/SR
 env=np.minimum(t/.008,1)*np.exp(-decay*t/duration)*np.minimum((duration-t)/.02,1)
 return (np.sin(2*np.pi*hz*t)+.23*np.sin(4*np.pi*hz*t)+.08*np.sin(6*np.pi*hz*t))*env

def sequence(notes,step=.12,duration=.36):
 out=np.zeros(round(SR*(step*len(notes)+duration)))
 for i,n in enumerate(notes):
  wave=tone(440*2**((n-69)/12),duration)
  pos=round(i*step*SR);out[pos:pos+len(wave)]+=wave
 return out

def save(key,data,peak=.65):
 data=np.array(data,dtype=float)
 data*=peak/max(abs(data).max(),1e-12)
 fade=min(128,len(data)//2); data[:fade]*=np.linspace(0,1,fade);data[-fade:]*=np.linspace(1,0,fade)
 def wav(path):
  with wave.open(str(path),'wb') as f:
   f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR);f.writeframes((data*32767).astype('<i2').tobytes())
 if key.startswith('bgm_'):
  with tempfile.TemporaryDirectory() as temp:
   tmp=Path(temp)/'source.wav';wav(tmp)
   subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(tmp),'-c:a','libvorbis','-q:a','4',str(OUT/(key+'.ogg'))],check=True)
 else: wav(OUT/(key+'.wav'))
 return {'key':key,'seconds':round(len(data)/SR,3),'peak':round(float(abs(data).max()),3),'rms':round(float(np.sqrt(np.mean(data**2))),3)}

stats=[]
for key,notes,step,duration in [
 ('ui_click',[79],.04,.1),('cell_open',[67],.04,.14),('flag_toggle',[72,67],.05,.14),
 ('chest_open',[48,55,60],.07,.25),('pickup',[76,79,84],.07,.4),
 ('stairs_unlock',[67,71,74,79],.1,.55),('next_floor',[64,67,71,76],.14,.7),
 ('victory',[72,76,79,84,79,84],.13,.65)]:
 stats.append(save(key,sequence(notes,step,duration)))
t=np.arange(round(SR*.28))/SR
stats.append(save('enemy_defeat',(np.sin(2*np.pi*(450*t-600*t*t))+.13*rng.normal(size=len(t)))*np.exp(-14*t)))
t=np.arange(round(SR*.85))/SR
noise=rng.normal(size=len(t));noise=np.convolve(noise,np.ones(9)/9,mode='same')
stats.append(save('explosion',(noise+.3*np.sin(2*np.pi*(100*t-30*t*t)))*np.exp(-5*t)))

def music(key,roots,chords,melody,bpm):
 beat=60/bpm;length=round(32*beat*SR);out=np.zeros(length)
 def add(note,start,duration,volume):
  wav=tone(440*2**((note-69)/12),duration,3)*volume
  pos=round(start*beat*SR);end=min(pos+len(wav),length)
  out[pos:end]+=wav[:end-pos]
 for bar in range(8):
  chord=chords[bar%4];root=roots[bar%4]
  add(root,bar*4,beat*3.8,.65)
  for half in range(8): add(chord[half%len(chord)],bar*4+half*.5,beat*.8,.22)
  for j in range(2): add(melody[(bar*2+j)%len(melody)],bar*4+j*2,beat*1.7,.3)
 return save(key,out,.38)
stats.append(music('bgm_menu',[48,45,41,43],[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,69]], [76,79,74,76,72,69,71,74,79,76,72,71,69,72,74,71],96))
stats.append(music('bgm_explore',[40,36,33,35],[[52,55,59,66],[48,52,55,59],[45,48,52,55],[47,50,54,57]], [71,66,67,64,64,59,62,66,67,71,64,67,59,62,66,63],84))
(OUT/'analysis.json').write_text(json.dumps({'method':'deterministic additive synthesis, seed 20261016','sampleRate':SR,'sounds':stats},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(stats,ensure_ascii=False))
