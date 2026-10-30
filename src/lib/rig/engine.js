const D=Math.PI/180;
const I3=[1,0,0,0,1,0,0,0,1];
function rx(d){const c=Math.cos(d*D),s=Math.sin(d*D);return[1,0,0,0,c,-s,0,s,c];}
function ry(d){const c=Math.cos(d*D),s=Math.sin(d*D);return[c,0,s,0,1,0,-s,0,c];}
function rz(d){const c=Math.cos(d*D),s=Math.sin(d*D);return[c,-s,0,s,c,0,0,0,1];}
function mm(a,b){const r=new Array(9);for(let i=0;i<3;i++)for(let j=0;j<3;j++)r[i*3+j]=a[i*3]*b[j]+a[i*3+1]*b[3+j]+a[i*3+2]*b[6+j];return r;}
function mv(m,v){return[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];}
function eul(e){return mm(ry(e[1]||0),mm(rz(e[2]||0),rx(e[0]||0)));}
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const len=a=>Math.hypot(a[0],a[1],a[2]);
const norm=a=>{const l=len(a)||1;return[a[0]/l,a[1]/l,a[2]/l];};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];


const NODES=[
 ['root',null,[0,0.95,0],''],['spine','root',[0,0.10,0],'torso'],['chest','spine',[0,0.19,0],'torso'],
 ['neck','chest',[0,0.16,0],'torso'],['head','neck',[0,0.075,0],'neck'],
 ['shL','chest',[0.18,0.12,0],'shoulder'],['shR','chest',[-0.18,0.12,0],'shoulder'],
 ['elL','shL',[0,-0.285,0],'arm'],['elR','shR',[0,-0.285,0],'arm'],
 ['wrL','elL',[0,-0.25,0],'arm'],['wrR','elR',[0,-0.25,0],'arm'],
 ['haL','wrL',[0,-0.085,0],'arm'],['haR','wrR',[0,-0.085,0],'arm'],
 ['hipL','root',[0.092,-0.05,0],'hip'],['hipR','root',[-0.092,-0.05,0],'hip'],
 ['knL','hipL',[0,-0.42,0],'leg'],['knR','hipR',[0,-0.42,0],'leg'],
 ['anL','knL',[0,-0.40,0],'leg'],['anR','knR',[0,-0.40,0],'leg'],
 ['toL','anL',[0,-0.05,0.14],'foot'],['toR','anR',[0,-0.05,0.14],'foot']];
const JOINT_LABEL={root:'Pelvis',spine:'Spine',chest:'Chest',neck:'Neck',head:'Head',shL:'Upper arm.L',elL:'Forearm.L',wrL:'Hand.L',shR:'Upper arm.R',elR:'Forearm.R',wrR:'Hand.R',hipL:'Thigh.L',knL:'Shin.L',anL:'Foot.L',hipR:'Thigh.R',knR:'Shin.R',anR:'Foot.R'};
const JOINT_ORDER=Object.keys(JOINT_LABEL);
const B0={s:1,headR:0.115,torso:1,neck:1,shoulder:1,hip:1,arm:1,leg:1,foot:1,limb:1,torsoR:1,thighR:1};
function offFor(off,cat,b){let[x,y,z]=off;
  if(cat==='torso')y*=b.torso;else if(cat==='neck')y*=b.neck;else if(cat==='shoulder'){x*=b.shoulder;y*=b.torso;}
  else if(cat==='arm')y*=b.arm;else if(cat==='hip')x*=b.hip;else if(cat==='leg')y*=b.leg;else if(cat==='foot'){y*=b.foot;z*=b.foot;}
  return[x*b.s,y*b.s,z*b.s];}
function fk(rot,b){const P={},W={};
  for(const[n,p,off,cat]of NODES){const R=rot[n]?eul(rot[n]):I3;const o=offFor(off,cat,b);
    if(!p){P[n]=o;W[n]=R;}else{P[n]=add(P[p],mv(W[p],o));W[n]=mm(W[p],R);}}
  return{P,W};}


const S=(x,y,z)=>({L:[x,y,z],R:[x,-y,-z]});
const SYM=['sh','el','wr','hip','kn','an'];
function expand(r){const o={};for(const k in r){if(SYM.includes(k)){o[k+'L']=r[k].L;o[k+'R']=r[k].R;}else o[k]=r[k];}return o;}
const POSE_CATS=['Standing','Gestures','Sitting','Kneeling','Lying','Crouching','Action','Pairs'];
const RAW_POSES=[
 ['Rest pose','Standing','rig check · neutral',{sh:S(0,0,18),el:S(-8,0,0)}],
 ['T-pose','Standing','rig check · skinning',{sh:S(0,0,90)}],
 ['Contrapposto','Standing','weight shift · relaxed',{root:[0,-8,4],chest:[0,10,-6],head:[0,-8,4],shL:[5,0,10],elL:[-12,0,0],shR:[8,0,-30],elR:[0,0,100],wrR:[0,0,-30],hipL:[-12,10,-8],knL:[22,0,0],anL:[10,0,0],hipR:[0,0,-3]}],
 ['Hands on hips','Standing','confident · symmetric',{sh:S(5,0,35),el:S(0,0,-100),wr:S(0,0,30),hip:S(0,0,6)}],
 ['Wave hello','Standing','greeting · friendly',{shL:[0,0,15],elL:[-10,0,0],shR:[-15,0,-80],elR:[0,0,-95],wrR:[0,0,-10],head:[0,-10,5]}],
 ['Reach up on tiptoe','Standing','stretch · tiptoe',{sh:S(0,0,168),chest:[-10,0,0],head:[-20,0,0],an:S(55,0,0)}],
 ['Look over shoulder','Standing','back view · turn',{root:[0,180,0],spine:[0,20,0],chest:[0,22,0],neck:[0,25,0],head:[0,20,-5],sh:S(0,0,12),hipL:[-10,0,0],knL:[15,0,0]}],
 ['Point to the side','Standing','direct · show',{shR:[-85,-30,0],shL:[0,0,12],chest:[0,-10,0],head:[0,-25,0]}],
 ['Thinking','Standing','hand to chin',{head:[12,0,6],shR:[-40,0,8],elR:[-135,0,0],wrR:[-20,0,0],shL:[-30,0,-5],elL:[-95,-45,0],hipL:[-6,0,2],knL:[10,0,0]}],
 ['Hero stance','Standing','wide stance · fists on hips',{hip:S(0,0,13),sh:S(5,0,38),el:S(0,0,-100),wr:S(0,0,30),chest:[-6,0,0],head:[-8,0,0]}],
 ['Walk, contact','Standing','walk cycle · key 1',{hipL:[-25,0,0],knL:[8,0,0],hipR:[18,0,0],knR:[28,0,0],anR:[20,0,0],shL:[22,0,6],elL:[-10,0,0],shR:[-22,0,-6],elR:[-30,0,0],chest:[0,-8,0],spine:[4,0,0]}],
 ['Run, passing','Standing','run cycle · airborne',{hipL:[-65,0,0],knL:[75,0,0],anL:[10,0,0],hipR:[28,0,0],knR:[100,0,0],anR:[35,0,0],shL:[45,0,8],elL:[-95,0,0],shR:[-55,0,-8],elR:[-95,0,0],spine:[14,0,0],head:[-8,0,0],chest:[0,-10,0]}],
 ['Star jump','Standing','jump · open',{sh:S(0,0,135),hip:S(0,0,28),head:[-10,0,0],an:S(30,0,0)}],
 ['Arms crossed','Standing','closed · waiting',{sh:S(-18,0,10),el:S(-95,-62,0),hipL:[0,0,4]}],
 ['Shrug','Gestures','upper body · unsure',{sh:S(-5,0,22),el:S(-85,35,0),head:[0,0,12]},{frame:'upper'}],
 ['Salute','Gestures','upper body · formal',{shR:[-30,0,-75],elR:[0,0,-155],wrR:[0,0,-15],shL:[0,0,8]},{frame:'upper'}],
 ['Facepalm','Gestures','upper body · comic',{head:[22,0,0],neck:[10,0,0],shR:[-50,0,-5],elR:[-128,25,0],shL:[0,0,8]},{frame:'upper'}],
 ['Hand on heart','Gestures','upper body · sincere',{shL:[-12,0,4],elL:[-115,-45,0],shR:[0,0,-8],head:[-5,0,0]},{frame:'upper'}],
 ['Heart above head','Gestures','upper body · cute',{sh:S(0,0,150),el:S(0,0,70),wr:S(0,0,25)},{frame:'upper'}],
 ['Phone call','Gestures','upper body · listening',{shR:[-20,0,-25],elR:[-145,30,0],head:[0,0,-10],shL:[-20,0,10],elL:[-80,-20,0]},{frame:'upper'}],
 ['Side stretch','Gestures','upper body · warm-up',{sh:S(0,0,165),spine:[0,0,-12],chest:[0,0,-12],head:[0,0,-5]},{frame:'upper'}],
 ['Victory V','Gestures','upper body · cheer',{sh:S(0,0,140),head:[-10,0,0]},{frame:'upper'}],
 ['Chair sit','Sitting','seat 45 cm · hands on thighs',{hip:S(-88,0,5),kn:S(90,0,0),sh:S(-30,0,6),el:S(-45,0,0)},{prop:'block'}],
 ['Chair sit, chin on hand','Sitting','seat 45 cm · thoughtful',{hip:S(-88,0,5),kn:S(90,0,0),spine:[18,0,0],shR:[-60,0,5],elR:[-140,0,0],shL:[-35,0,5],elL:[-50,0,0]},{prop:'block'}],
 ['Lean back on hands','Sitting','floor · relaxed',{hip:S(-80,0,8),kn:S(5,0,0),spine:[-22,0,0],chest:[-5,0,0],sh:S(62,0,15),head:[10,0,0]}],
 ['Hug knees','Sitting','floor · compact',{hip:S(-125,0,6),kn:S(140,0,0),an:S(-15,0,0),spine:[15,0,0],chest:[10,0,0],sh:S(-50,0,8),el:S(-40,-20,0),head:[5,0,0]}],
 ['Forward fold','Sitting','floor · stretch',{hip:S(-90,0,4),spine:[35,0,0],chest:[25,0,0],head:[10,0,0],sh:S(-115,0,5)}],
 ['Kneel upright','Kneeling','both knees · tall',{kn:S(90,0,0),an:S(70,0,0),sh:S(0,0,10)}],
 ['Sit on heels','Kneeling','seiza · hands on thighs',{hip:S(-90,0,6),kn:S(175,0,0),an:S(70,0,0),sh:S(-25,0,4),el:S(-45,0,0)}],
 ['One knee down','Kneeling','proposal · rest',{hipL:[-90,0,4],knL:[90,0,0],hipR:[8,0,-4],knR:[92,0,0],anR:[70,0,0],shL:[-30,0,10],elL:[-60,0,0],shR:[0,0,-10]}],
 ['On back','Lying','supine · arms down',{root:[-90,90,0],sh:S(0,0,12)}],
 ['On back, knees up','Lying','supine · arms out',{root:[-90,90,0],hip:S(-50,0,4),kn:S(100,0,0),sh:S(0,0,70)}],
 ['On side, arm under head','Lying','side · resting',{root:[0,0,90],shR:[0,0,-170],shL:[0,0,10],hipL:[-45,0,0],knL:[60,0,0],hipR:[-10,0,0],knR:[20,0,0]}],
 ['On front, on elbows','Lying','prone · reading',{root:[90,-90,0],sh:S(-68,0,10),el:S(-90,0,0),spine:[-25,0,0],chest:[-10,0,0],head:[-15,0,0],kn:S(80,0,0),an:S(30,0,0)}],
 ['Deep squat','Crouching','heels down · counterweight',{hip:S(-118,0,14),kn:S(135,0,0),an:S(-20,0,0),spine:[25,0,0],sh:S(-105,0,8)}],
 ['Crouch, hand down','Crouching','ready · landing',{hipL:[-100,0,8],knL:[110,0,0],hipR:[-40,0,-8],knR:[130,0,0],anR:[50,0,0],spine:[40,0,0],chest:[10,0,0],head:[-30,0,0],shR:[-60,0,-5],shL:[-20,0,10],elL:[-60,0,0]}],
 ['Straight punch','Action','combat · right hand',{root:[0,-25,0],chest:[0,30,0],shR:[-88,0,0],shL:[-45,0,15],elL:[-125,-20,0],hipL:[-30,0,6],knL:[30,0,0],hipR:[20,0,-6],knR:[12,0,0],anR:[15,0,0]}],
 ['Front kick','Action','combat · left leg',{hipL:[-95,0,0],knL:[15,0,0],knR:[8,0,0],spine:[-12,0,0],sh:S(-50,0,15),el:S(-110,-20,0),head:[5,0,0]}],
 ['Lunge','Action','stride · fitness',{hipL:[-75,0,6],knL:[80,0,0],hipR:[35,0,-6],knR:[15,0,0],anR:[40,0,0],sh:S(0,0,10)}],
 ['Throw, wind-up','Action','sport · coil',{chest:[0,-35,0],shR:[40,0,-80],elR:[0,0,-90],shL:[-80,20,0],hipL:[-30,0,8],knL:[15,0,0],hipR:[10,0,-10],knR:[20,0,0]}],
 ['Arabesque','Action','dance · balance',{hipL:[80,0,0],anL:[40,0,0],hipR:[0,0,-3],spine:[30,0,0],chest:[10,0,0],head:[-25,0,0],shR:[-140,0,-5],shL:[10,0,80]}],
 ['Passé, arms overhead','Action','dance · turn',{hipL:[-75,55,0],knL:[130,0,0],anL:[40,0,0],sh:S(0,0,160),el:S(0,0,25)}],
 ['Handshake','Pairs','two figures · greeting',null,{figures:[{at:[-0.46,0],rot:{root:[0,90,0],shR:[-55,22,0],elR:[-8,0,0],shL:[0,0,10]}},{at:[0.46,0],rot:{root:[0,-90,0],shR:[-55,22,0],elR:[-8,0,0],shL:[0,0,10]}}]}],
 ['High five','Pairs','two figures · celebrate',null,{figures:[{at:[-0.44,0],rot:{root:[0,90,0],shR:[-130,23,0],shL:[0,0,10]}},{at:[0.44,0],rot:{root:[0,-90,0],shR:[-130,23,0],shL:[0,0,10]}}]}],
 ['Back to back','Pairs','two figures · arms crossed',null,{figures:[{at:[-0.17,0],rot:expand({root:[0,-90,0],sh:S(-18,0,10),el:S(-95,-62,0)})},{at:[0.17,0],rot:expand({root:[0,90,0],sh:S(-18,0,10),el:S(-95,-62,0)})}]}]
];
const POSES=RAW_POSES.map((p,i)=>{const[name,cat,tags,rot,opts]=p;const o=opts||{};
  return{id:'MP-'+String(i+1).padStart(4,'0'),name,cat,tags:tags.split(' · '),
    figures:o.figures?o.figures.map(f=>({at:f.at,rot:expand(f.rot)})):[{at:[0,0],rot:expand(rot)}],frame:o.frame||'full',prop:o.prop||null};});

const BODIES=[
 {id:'MB-01',name:'Standard adult',note:'Neutral reference proportions',p:{}},
 {id:'MB-02',name:'Tall, broad',note:'Wide shoulders, long limbs',p:{s:1.07,headR:0.112,shoulder:1.15,hip:0.96,limb:1.12,torsoR:1.08}},
 {id:'MB-03',name:'Curvy',note:'Wide hips, fuller thighs',p:{s:0.97,shoulder:0.93,hip:1.22,limb:1.05,thighR:1.18}},
 {id:'MB-04',name:'Heroic',note:'Stylised action proportions',p:{s:1.1,headR:0.102,shoulder:1.3,hip:0.95,limb:1.22,torsoR:1.2,leg:1.08}},
 {id:'MB-05',name:'Slender',note:'Narrow frame, light limbs',p:{shoulder:0.95,limb:0.82,torsoR:0.86,thighR:0.9}},
 {id:'MB-06',name:'Teen',note:'Growing, slightly larger head',p:{s:0.9,headR:0.12,limb:0.88,torsoR:0.9,leg:0.97}},
 {id:'MB-07',name:'Child',note:'Around eight years old',p:{s:0.72,headR:0.135,torso:0.95,leg:0.85,arm:0.9,limb:0.88,shoulder:0.85,torsoR:0.95}},
 {id:'MB-08',name:'Anime',note:'Long legs, slim limbs',p:{s:0.95,headR:0.128,limb:0.74,torsoR:0.84,leg:1.12,shoulder:0.86}},
 {id:'MB-09',name:'Chibi',note:'Super-deformed, big head',p:{s:0.62,headR:0.2,torso:0.7,leg:0.52,arm:0.58,limb:1.1,shoulder:0.82,torsoR:1.05,neck:0.3,foot:0.8}}
].map(b=>({...b,b:Object.assign({},B0,b.p)}));


const TORSO=['abdomen','chest','shoulders'];
function top(pad,sleeve,extra){const p=[{seg:TORSO,pad}];
  if(sleeve==='short')p.push({seg:['uarmL','uarmR'],pad,to:0.45});
  if(sleeve==='elbow')p.push({seg:['uarmL','uarmR'],pad});
  if(sleeve==='long'||sleeve==='wide')p.push({seg:['uarmL','uarmR'],pad},{seg:['farmL','farmR'],pad:sleeve==='wide'?pad*3:pad,to:0.92});
  return p.concat(extra||[]);}
function bodice(pad){return[{seg:['chest','shoulders'],pad},{seg:['abdomen'],pad,to:0.6}];}
function pants(pad,l){const p=[{seg:['pelvis'],pad},{seg:['abdomen'],pad,to:0.32}];
  if(l==='long')p.push({seg:['thighL','thighR'],pad},{seg:['shinL','shinR'],pad,to:0.92});
  if(l==='knee')p.push({seg:['thighL','thighR'],pad});
  if(l==='mid')p.push({seg:['thighL','thighR'],pad,to:0.6});
  if(l==='short')p.push({seg:['thighL','thighR'],pad,to:0.38});
  return p;}
const shoes=(pad,high)=>[{seg:['footL','footR'],pad}].concat(high?[{seg:['shinL','shinR'],pad,from:1-high}]:[]);
const socks=(from)=>[{seg:['shinL','shinR'],pad:0.004,from}];
const cone=(top,len,r0,r1)=>[{cone:{top,len,r0,r1}}];
const hat=t=>[{hat:t}];
const L=(n,f,p,c,parts)=>({n,f,p,c,parts});
const OUTFIT_CATS=['Everyday','Summer','Formal','Work','Sport','Winter','Costume'];
const OUTFITS=[
 ['Tee and jeans','Everyday',[L('T-shirt','Cotton jersey','Cotton','#F1F0EA',top(0.012,'short')),L('Jeans','Denim','Denim','#3F5D88',pants(0.012,'long')),L('Sneakers','Canvas, rubber sole','Rubber','#FBFBF8',shoes(0.014))]],
 ['Hoodie and joggers','Everyday',[L('Hoodie','Brushed fleece','Cotton','#8C929B',top(0.024,'long',[{seg:['neck'],pad:0.03}])),L('Joggers','Fleece','Cotton','#2F343A',pants(0.018,'long')),L('Sneakers','Leather','Leather','#E7E1D4',shoes(0.014))]],
 ['Cardigan and pleated skirt','Everyday',[L('Cardigan','Fine knit','Cotton','#D8C6A4',top(0.016,'long')),L('Pleated skirt','Wool blend','Cotton','#2E3A5A',cone('waist',0.34,0.135,0.27)),L('Knee socks','Rib knit','Cotton','#F3F3F1',socks(0.08)),L('Loafers','Leather','Leather','#5A3A28',shoes(0.012))]],
 ['Sundress','Summer',[L('Sundress','Cotton lawn','Cotton','#F0BE4E',bodice(0.01).concat(cone('waist',0.5,0.135,0.3))),L('Sandals','Leather','Leather','#9B6B43',shoes(0.006))]],
 ['Swim set','Summer',[L('Rash guard','Lycra','Rubber','#2A9D8F',top(0.005,'long')),L('Board shorts','Quick-dry','Cotton','#F2A25F',pants(0.022,'knee'))]],
 ['Business suit','Formal',[L('Shirt collar','Poplin','Cotton','#F6F6F3',[{seg:['neck'],pad:0.01,to:0.7}]),L('Jacket','Wool','Cotton','#27324A',top(0.022,'long')),L('Trousers','Wool','Cotton','#27324A',pants(0.014,'long')),L('Oxfords','Leather','Leather','#17191D',shoes(0.012))]],
 ['Evening gown','Formal',[L('Gown','Satin','Silk','#8E1F2F',bodice(0.008).concat(cone('waist',0.98,0.13,0.36)))]],
 ['Yukata','Formal',[L('Yukata','Cotton, indigo dyed','Cotton','#2C3E73',top(0.02,'wide').concat(cone('waist',0.9,0.15,0.2))),L('Obi sash','Woven','Silk','#C8553D',[{seg:['abdomen'],pad:0.032,from:0.1,to:0.95}]),L('Geta','Wood, cord','Rigid','#B98A5B',shoes(0.01))]],
 ['Chef whites','Work',[L('Chef jacket','Twill','Cotton','#F8F8F4',top(0.02,'long')),L('Kitchen trousers','Check twill','Cotton','#565B62',pants(0.016,'long')),L('Toque','Starched cotton','Rigid','#FFFFFF',hat('chef')),L('Clogs','Rubber','Rubber','#1C1E22',shoes(0.016))]],
 ['Scrubs','Work',[L('Scrub top','Poly-cotton','Cotton','#3A8C8C',top(0.014,'short')),L('Scrub trousers','Poly-cotton','Cotton','#3A8C8C',pants(0.016,'long')),L('Clogs','Rubber','Rubber','#F4F4F2',shoes(0.016))]],
 ['Site worker','Work',[L('Work shirt','Twill','Cotton','#6D7480',top(0.012,'long')),L('Hi-vis vest','Mesh','Cotton','#FF7A1A',[{seg:TORSO,pad:0.026}]),L('Work trousers','Canvas','Denim','#3B3F46',pants(0.016,'long')),L('Boots','Leather','Leather','#5B3B22',shoes(0.02,0.35)),L('Hard hat','Plastic','Rigid','#F5C518',hat('hard'))]],
 ['Running kit','Sport',[L('Singlet','Mesh','Cotton','#D9412B',top(0.006,'none')),L('Shorts','Nylon','Silk','#1F2329',pants(0.012,'short')),L('Running shoes','Mesh, foam','Rubber','#3D7BD9',shoes(0.016))]],
 ['Football kit','Sport',[L('Jersey','Polyester','Cotton','#2E7D4F',top(0.012,'short')),L('Shorts','Polyester','Cotton','#F4F4F2',pants(0.016,'mid')),L('Socks','Rib knit','Cotton','#2E7D4F',socks(0.05)),L('Boots','Synthetic','Leather','#17191D',shoes(0.012))]],
 ['Yoga set','Sport',[L('Fitted top','Stretch knit','Rubber','#7B6CF6',bodice(0.005)),L('Leggings','Stretch knit','Rubber','#2B2D42',pants(0.005,'long'))]],
 ['Winter parka','Winter',[L('Parka','Nylon, down fill','Cotton','#3C5A4A',top(0.045,'long').concat(cone('waist',0.34,0.17,0.21))),L('Scarf','Wool','Cotton','#E3B23C',[{seg:['neck'],pad:0.04}]),L('Trousers','Twill','Cotton','#2F343A',pants(0.016,'long')),L('Snow boots','Leather','Leather','#4A3426',shoes(0.03,0.4)),L('Beanie','Knit','Cotton','#C8553D',hat('beanie'))]],
 ['Trench coat','Winter',[L('Trench coat','Gabardine','Cotton','#B89B72',top(0.026,'long').concat(cone('waist',0.58,0.15,0.27))),L('Trousers','Wool','Cotton','#2B2F36',pants(0.014,'long')),L('Boots','Leather','Leather','#3A2A20',shoes(0.014,0.2))]],
 ['Knight armour','Costume',[L('Cuirass','Steel plate','Rigid','#9AA3AD',top(0.05,'long')),L('Tassets','Steel plate','Rigid','#87909B',cone('waist',0.24,0.17,0.22)),L('Leg plate','Steel plate','Rigid','#9AA3AD',pants(0.03,'long')),L('Sabatons','Steel plate','Rigid','#87909B',shoes(0.03,0.3)),L('Helm','Steel','Rigid','#A7AFB8',hat('helm'))]],
 ['Wizard robe','Costume',[L('Robe','Velvet','Silk','#4B3B8F',top(0.03,'wide').concat(cone('chest',1.25,0.17,0.38))),L('Pointed hat','Felt','Leather','#3F327A',hat('cone'))]],
 ['Space suit','Costume',[L('Suit','Coated nylon','Rubber','#F2F3F5',top(0.05,'long').concat(pants(0.05,'long'))),L('Gloves','Coated nylon','Rubber','#E3E5E8',[{seg:['handL','handR'],pad:0.02}]),L('Boots','Coated nylon','Rubber','#D6D9DE',shoes(0.04,0.35)),L('Helmet','Polycarbonate','Rigid','#BFD4E6',hat('bubble'))]]
].map((o,i)=>({id:'MO-'+String(i+1).padStart(4,'0'),name:o[0],cat:o[1],layers:o[2]}));


function bodySegs(R,b){const{P,W}=R;const s=b.s,Lm=b.limb*s,T=b.torsoR*s,hr=b.headR*s;const g={};
  const seg=(k,a,c,ra,rb)=>{g[k]={a,b:c,ra,rb};};
  seg('abdomen',P.root,P.spine,0.125*T,0.115*T);
  seg('chest',P.spine,add(P.chest,mv(W.chest,[0,0.05*s,0])),0.115*T,0.13*T);
  seg('shoulders',P.shL,P.shR,0.062*T,0.062*T);
  const hp=0.088*T*Math.sqrt(b.hip);seg('pelvis',P.hipL,P.hipR,hp,hp);
  seg('neck',P.neck,P.head,0.046*T,0.042*T);
  for(const X of['L','R']){
    seg('uarm'+X,P['sh'+X],P['el'+X],0.05*Lm,0.04*Lm);seg('farm'+X,P['el'+X],P['wr'+X],0.04*Lm,0.031*Lm);
    seg('hand'+X,P['wr'+X],P['ha'+X],0.031*Lm,0.024*Lm);
    seg('thigh'+X,P['hip'+X],P['kn'+X],0.08*Lm*b.thighR,0.055*Lm);seg('shin'+X,P['kn'+X],P['an'+X],0.053*Lm,0.038*Lm);
    seg('foot'+X,P['an'+X],P['to'+X],0.037*Lm,0.03*Lm);}
  const hc=add(P.head,mv(W.head,[0,hr,0]));
  return{g,hc,hr,up:mv(W.head,[0,1,0]),fw:mv(W.head,[0,0,1])};}

function buildFigure(fig,body,outfit,opt){const R=fk(fig.rot,body.b);const at=[fig.at[0],0,fig.at[1]];
  for(const k in R.P)R.P[k]=add(R.P[k],at);
  const geo=bodySegs(R,body.b);const s=body.b.s;const prims=[];const hidden=new Set();
  if(outfit){outfit.layers.forEach((Ly,li)=>{for(const pc of Ly.parts){
    if(pc.seg){for(const k of pc.seg){const q=geo.g[k];if(!q)continue;const f=pc.from||0,t=pc.to==null?1:pc.to;
      if(f===0&&t===1)hidden.add(k);
      prims.push({k:'cap',a:lerp(q.a,q.b,f),b:lerp(q.a,q.b,t),ra:q.ra+(q.rb-q.ra)*f+pc.pad*s,rb:q.ra+(q.rb-q.ra)*t+pc.pad*s,c:Ly.c,layer:li+1});}}
    if(pc.cone){const P=R.P;const c=pc.cone;
      const topPt=c.top==='waist'?lerp(P.root,P.spine,0.55):c.top==='chest'?add(P.chest,mv(R.W.chest,[0,0.04*s,0])):P.root;
      const down=mv(R.W.root,[0,-1,0]);const th=norm(add(sub(P.knL,P.hipL),sub(P.knR,P.hipR)));
      const axis=norm(add(mul(down,1.2),th));const bot=add(P.root,mul(axis,c.len*s-(len(sub(topPt,P.root)))));
      prims.push({k:'ring',a:topPt,b:bot,ra:c.r0*s*body.b.torsoR,rb:c.r1*s*Math.max(body.b.torsoR,body.b.hip),c:Ly.c,layer:li+1,bias:0.6});}
    if(pc.hat){const{hc,hr,up}=geo;const at=(k)=>add(hc,mul(up,k*hr));const t=pc.hat;
      if(t==='beanie')prims.push({k:'ring',a:at(0.15),b:at(1.08),ra:1.07*hr,rb:0.55*hr,c:Ly.c,layer:li+1,bias:0.4});
      if(t==='hard'){prims.push({k:'ring',a:at(0.28),b:at(0.36),ra:1.32*hr,rb:1.32*hr,c:Ly.c,layer:li+1,bias:0.3});prims.push({k:'ring',a:at(0.32),b:at(1.15),ra:1.1*hr,rb:0.62*hr,c:Ly.c,layer:li+1,bias:0.45});}
      if(t==='chef')prims.push({k:'ring',a:at(0.55),b:at(2.4),ra:0.98*hr,rb:1.12*hr,c:Ly.c,layer:li+1,bias:0.4});
      if(t==='cone'){prims.push({k:'ring',a:at(0.42),b:at(0.5),ra:1.9*hr,rb:1.9*hr,c:Ly.c,layer:li+1,bias:0.3});prims.push({k:'ring',a:at(0.48),b:at(3.1),ra:1.0*hr,rb:0.04*hr,c:Ly.c,layer:li+1,bias:0.45});}
      if(t==='helm'){hidden.add('head');prims.push({k:'ball',c:hc,r:1.13*hr,col:Ly.c,layer:li+1});}
      if(t==='bubble')prims.push({k:'ball',c:add(hc,mul(up,0.15*hr)),r:1.5*hr,col:Ly.c,layer:li+1,glass:true,bias:2});}}});}
  const ghost=opt&&opt.ghost;
  for(const k in geo.g){if(hidden.has(k))continue;const q=geo.g[k];prims.push({k:'cap',a:q.a,b:q.b,ra:q.ra,rb:q.rb,body:true,ghost});}
  if(!hidden.has('head')){prims.push({k:'ball',c:geo.hc,r:geo.hr,body:true,ghost});
    prims.push({k:'ball',c:add(geo.hc,add(mul(geo.fw,0.9*geo.hr),mul(geo.up,-0.12*geo.hr))),r:0.2*geo.hr,body:true,ghost,bias:0.02});}
  return{prims,R};}

function buildScene(pose,body,outfit,opt){opt=opt||{};let prims=[];const rigs=[];
  for(const f of pose.figures){const fig=opt.mirror?mirrorFig(f):f;const r=buildFigure(fig,body,outfit,opt);prims=prims.concat(r.prims);rigs.push(r.R);}
  let minY=Infinity;for(const p of prims){if(p.k==='cap'||p.k==='ring'){minY=Math.min(minY,p.a[1]-p.ra,p.b[1]-p.rb);}else if(p.k==='ball'&&!p.glass)minY=Math.min(minY,p.c[1]-p.r);}
  const sh=[0,-minY,0];
  for(const p of prims){if(p.a){p.a=add(p.a,sh);p.b=add(p.b,sh);}if(p.c&&p.k==='ball')p.c=add(p.c,sh);}
  for(const R of rigs)for(const k in R.P)R.P[k]=add(R.P[k],sh);
  if(pose.prop==='block'){const P=rigs[0].P;const s=body.b.s;const top=P.root[1]-0.1*s*body.b.torsoR;const cx=P.root[0],cz=P.root[2]-0.02*s;const hw=0.2*s;
    prims.push({k:'box',min:[cx-hw,0,cz-hw],max:[cx+hw,top,cz+hw*0.9]});}
  return{prims,rigs,upperY:rigs[0].P.root[1]-0.04*body.b.s};}

function mirrorRot(rot){const o={};for(const k in rot){const v=rot[k];const m=k.endsWith('L')?k.slice(0,-1)+'R':k.endsWith('R')?k.slice(0,-1)+'L':k;o[m]=[v[0],-(v[1]||0),-(v[2]||0)];}return o;}
function mirrorFig(f){return{at:[-f.at[0],f.at[1]],rot:mirrorRot(f.rot)};}


function hull(pts){pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];
  for(const p of pts){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}
  for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}
  up.pop();lo.pop();return lo.concat(up);}
function hexRgb(h){const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];}
function mixC(c,t,k){const a=hexRgb(c);return'rgb('+a.map((v,i)=>Math.round(v+(t[i]-v)*k)).join(',')+')';}
function tokens(){const cs=getComputedStyle(document.documentElement);const g=n=>cs.getPropertyValue(n).trim();
  return{hi:g('--clay-hi'),mid:g('--clay'),lo:g('--clay-lo'),line:g('--clay-line'),shadow:g('--shadow'),prop:g('--prop'),ruler:g('--ruler'),muted:g('--muted')};}
const ANGLES=[{id:'front',label:'Front',yaw:0,pitch:0},{id:'tq',label:'¾',yaw:35,pitch:8},{id:'side',label:'Side',yaw:90,pitch:0},{id:'back',label:'Back',yaw:180,pitch:0},{id:'above',label:'Above',yaw:30,pitch:42},{id:'below',label:'Below',yaw:20,pitch:-20}];

function drawScene(canvas,scene,view,opt){opt=opt||{};const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const tk=tokens();const V=mm(rx(view.pitch),ry(-view.yaw));const pr=p=>{const q=mv(V,p);return[q[0],-q[1],q[2]];};
  const items=[];
  const ring=(a,b,ra,rb,n)=>{const d=norm(sub(b,a));const u=norm(cross(d,Math.abs(d[1])<0.9?[0,1,0]:[1,0,0]));const v=cross(d,u);const pts=[];
    for(let i=0;i<n;i++){const t=i/n*Math.PI*2;const o=add(mul(u,Math.cos(t)),mul(v,Math.sin(t)));pts.push(pr(add(a,mul(o,ra))),pr(add(b,mul(o,rb))));}return pts;};
  const circ=(c,r,n)=>{const out=[];for(let i=0;i<n;i++){const t=i/n*Math.PI*2;out.push([c[0]+Math.cos(t)*r,c[1]+Math.sin(t)*r]);}return out;};
  for(const p of scene.prims){
    if(p.k==='cap'){const a=pr(p.a),b=pr(p.b);items.push({p,poly:hull(circ(a,p.ra,18).concat(circ(b,p.rb,18))),depth:(a[2]+b[2])/2,ax:[a,b],r:Math.max(p.ra,p.rb),y3:Math.min(p.a[1],p.b[1])});}
    else if(p.k==='ring'){const a=pr(p.a),b=pr(p.b);items.push({p,poly:hull(ring(p.a,p.b,p.ra,p.rb,20)),depth:(a[2]+b[2])/2+(p.bias||0)*Math.max(p.ra,p.rb),ax:[a,b],r:Math.max(p.ra,p.rb),y3:Math.min(p.a[1],p.b[1])});}
    else if(p.k==='ball'){const c=pr(p.c);items.push({p,poly:circ(c,p.r,28),depth:c[2]+(p.bias||0)+(p.glass?5:0),ball:c,r:p.r,y3:p.c[1]-p.r});}
    else if(p.k==='box'){const[mn,mx]=[p.min,p.max];const C=(i)=>[i&1?mx[0]:mn[0],i&2?mx[1]:mn[1],i&4?mx[2]:mn[2]];
      const faces=[[0,1,3,2,[0,0,-1]],[4,5,7,6,[0,0,1]],[0,1,5,4,[0,-1,0]],[2,3,7,6,[0,1,0]],[0,2,6,4,[-1,0,0]],[1,3,7,5,[1,0,0]]];
      const fs=[];for(const f of faces){const nz=mv(V,f[4]);if(nz[2]<=0.001)continue;fs.push({pts:f.slice(0,4).map(i=>pr(C(i))),shade:f[4][1]>0?0:(f[4][0]!==0?0.18:0.1)});}
      const c=pr([(mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2]);items.push({p,faces:fs,poly:fs.flatMap(f=>f.pts),depth:c[2]-0.05,y3:0});}}
  // fit
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const it of items){if(scene.frameUpper&&it.y3<scene.upperY)continue;for(const q of it.poly){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}}
  if(scene.frameUpper){y1=Math.max(y1,-scene.upperY+0.02);}
  const m=opt.margin==null?0.09:opt.margin;const bw=Math.max(x1-x0,0.3),bh=Math.max(y1-y0,0.3);
  let k,ox,oy;if(opt.fitTo){const f=opt.fitTo;k=Math.min(w*(f[2]-f[0])/bw,h*(f[3]-f[1])/bh)*(opt.zoom||1);ox=w*(f[0]+f[2])/2-k*(x0+x1)/2+(opt.dx||0)*w;oy=h*(f[1]+f[3])/2-k*(y0+y1)/2+(opt.dy||0)*h;}else{k=Math.min(w*(1-2*m)/bw,h*(1-2*m-(opt.top||0))/bh)*(opt.zoom||1);ox=w/2-k*(x0+x1)/2+(opt.dx||0)*w;oy=h*(0.5+(opt.top||0)/2)-k*(y0+y1)/2+(opt.dy||0)*h;}
  const S2=q=>[ox+q[0]*k,oy+q[1]*k];
  if(opt.underlay)opt.underlay(ctx,{k,ox,oy,w,h,V,tk});
  // ground shadow
  if(view.pitch>=0){let a0=Infinity,a1=-Infinity,b0=Infinity,b1=-Infinity;
    for(const p of scene.prims){const pts=p.k==='box'?[p.min,p.max]:p.a?[p.a,p.b]:[p.c];for(const q of pts){if(q[1]>0.3)continue;a0=Math.min(a0,q[0]);a1=Math.max(a1,q[0]);b0=Math.min(b0,q[2]);b1=Math.max(b1,q[2]);}}
    if(a0<Infinity){const cx=(a0+a1)/2,cz=(b0+b1)/2,rxr=(a1-a0)/2+0.14,rzr=(b1-b0)/2+0.12;const pts=[];for(let i=0;i<32;i++){const t=i/32*Math.PI*2;pts.push(S2(pr([cx+Math.cos(t)*rxr,0,cz+Math.sin(t)*rzr])));}
      ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fillStyle=tk.shadow;ctx.fill();}}
  items.sort((a,b)=>(a.depth+(a.p.layer||0)*0.004)-(b.depth+(b.p.layer||0)*0.004));
  ctx.lineJoin='round';
  for(const it of items){const p=it.p;
    if(p.k==='box'){for(const f of it.faces){const pts=f.pts.map(S2);ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();
      ctx.fillStyle=mixC(rgbToHex(tk.prop),[0,0,0],f.shade);ctx.fill();ctx.strokeStyle=tk.line;ctx.lineWidth=1;ctx.stroke();}continue;}
    const pts=it.poly.map(S2);ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();
    let hi,mid,lo,line;
    if(p.body){hi=tk.hi;mid=tk.mid;lo=tk.lo;line=tk.line;}else{const c=p.k==='ball'?p.col:p.c;hi=mixC(c,[255,255,255],0.28);mid=c;lo=mixC(c,[0,0,0],0.32);line=mixC(c,[0,0,0],0.62);}
    let grad;
    if(it.ball){const c=S2(it.ball);const r=it.r*k;grad=ctx.createRadialGradient(c[0]-r*0.35,c[1]-r*0.4,r*0.1,c[0],c[1],r*1.05);}
    else{const a=S2(it.ax[0]),b=S2(it.ax[1]);let dx=b[0]-a[0],dy=b[1]-a[1];const l=Math.hypot(dx,dy);let nx,ny;if(l<1){nx=-0.6;ny=-0.8;}else{nx=-dy/l;ny=dx/l;if(nx*-0.6+ny*-0.8<0){nx=-nx;ny=-ny;}}
      const cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2,r=it.r*k;grad=ctx.createLinearGradient(cx+nx*r,cy+ny*r,cx-nx*r,cy-ny*r);}
    grad.addColorStop(0,hi);grad.addColorStop(0.45,mid);grad.addColorStop(1,lo);
    ctx.globalAlpha=p.glass?0.32:(p.ghost?0.28:1);
    ctx.strokeStyle=line;ctx.lineWidth=p.ghost?1:1.6;ctx.stroke();ctx.fillStyle=grad;ctx.fill();ctx.globalAlpha=1;}
  return{k,ox,oy};}
function rgbToHex(c){if(c.startsWith('#'))return c;const m=c.match(/\d+/g);if(!m)return'#999999';return'#'+m.slice(0,3).map(v=>(+v).toString(16).padStart(2,'0')).join('');}


export const RIG={fk,buildScene,drawScene,mirrorRot,expand,S,POSES,BODIES,OUTFITS,OUTFIT_CATS,JOINT_LABEL,JOINT_ORDER};
