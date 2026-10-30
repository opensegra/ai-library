import { RIG as R } from "@/lib/rig/engine";
import { ANGLES as ANG } from "@/lib/catalogue/angles";

const camDefault=jp=>{const a=ANG.find(x=>x.jp===jp)||ANG[0];return{yaw:a.yaw,pitch:a.pitch,zoom:1,dx:0,dy:0};};
const presetByName=n=>R.POSES.find(p=>p.name===n);
function startPreset(p){const c=p.jcls;if(/膝立ち|四つん這い/.test(c))return'Kneel upright';if(/しゃがみ/.test(c))return'Deep squat';if(/寝そべり|側位|正常位/.test(c))return'On back';if(/座|後背位|騎乗位/.test(c))return'Lean back on hands';return'Rest pose';}
function startFigures(p,name){const base=presetByName(name||startPreset(p)).figures[0].rot;const cl=o=>JSON.parse(JSON.stringify(o));
  if(p.line==='2人絡み'){const a=cl(base),b=cl(base);if(!base.root){a.root=[0,90,0];b.root=[0,-90,0];}return[{at:[-0.32,0],rot:a},{at:[0.32,0],rot:b}];}
  return[{at:[0,0],rot:cl(base)}];}

let AF={};
const v3={sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];},mid:(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]};
const m3={mul:(a,b)=>{const r=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++)r[i*3+j]=a[i*3]*b[j]+a[i*3+1]*b[3+j]+a[i*3+2]*b[6+j];return r;},
  T:a=>[a[0],a[3],a[6],a[1],a[4],a[7],a[2],a[5],a[8]],v:(m,x)=>[m[0]*x[0]+m[1]*x[1]+m[2]*x[2],m[3]*x[0]+m[4]*x[1]+m[5]*x[2],m[6]*x[0]+m[7]*x[1]+m[8]*x[2]],
  cols:(x,y,z)=>[x[0],y[0],z[0],x[1],y[1],z[1],x[2],y[2],z[2]],I:[1,0,0,0,1,0,0,0,1]};
function swing(a,b){a=v3.norm(a);b=v3.norm(b);const v=v3.cross(a,b),c=v3.dot(a,b);if(c<-0.9999)return[1,0,0,0,-1,0,0,0,-1];
  const K=[0,-v[2],v[1],v[2],0,-v[0],-v[1],v[0],0];const K2=m3.mul(K,K);const f=1/(1+c);return m3.I.map((x,i)=>x+K[i]+K2[i]*f);}
const D2=180/Math.PI;
function toEuler(M){const c=Math.asin(Math.max(-1,Math.min(1,M[3])));const a=Math.atan2(-M[5],M[4]);const b=Math.atan2(-M[6],M[0]);return[Math.round(a*D2),Math.round(b*D2),Math.round(c*D2)];}
const lmPt=(w,i)=>[w[i][0],-w[i][1],-w[i][2]];
function frameOf(a,s){const e1=v3.norm(a);const e2=v3.norm(v3.sub(s,v3.mul(e1,v3.dot(s,e1))));return m3.cols(e1,e2,v3.cross(e1,e2));}
function fromEuler([x,y,z]){x/=D2;y/=D2;z/=D2;const cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
  return m3.mul(m3.mul([cy,0,sy,0,1,0,-sy,0,cy],[cz,-sz,0,sz,cz,0,0,0,1]),[1,0,0,0,cx,-sx,0,sx,cx]);}
const LIMITS={wr:[[-80,80],[-80,80],[-40,40]],an:[[-45,45],[-30,30],[-30,30]],neck:[[-50,60],[-70,70],[-40,40]],head:[[-60,50],[-70,70],[-30,30]]};
function limitEuler(e,lim){if(!lim)return e;return e.map((v,i)=>Math.round(Math.max(lim[i][0],Math.min(lim[i][1],v))));}
function torsoFrame(w){const X=v3.norm(v3.sub(lmPt(w,23),lmPt(w,24)));const Yr=v3.norm(v3.sub(v3.mid(lmPt(w,11),lmPt(w,12)),v3.mid(lmPt(w,23),lmPt(w,24))));const Z=v3.norm(v3.cross(X,Yr));const Y=v3.cross(Z,X);return m3.cols(X,Y,Z);}
function shoulderFrame(w,Yup){const X=v3.norm(v3.sub(lmPt(w,11),lmPt(w,12)));const Z=v3.norm(v3.cross(X,Yup));const Y=v3.cross(Z,X);return m3.cols(X,Y,Z);}
function rigFromLandmarks(w){const P=i=>lmPt(w,i);const rot={};const conf=i=>w[i][3]==null?1:w[i][3];
  const Wr=torsoFrame(w);rot.root=toEuler(Wr);
  const up=v3.norm(v3.sub(v3.mid(P(11),P(12)),v3.mid(P(23),P(24))));
  const Ws=shoulderFrame(w,up);const Rs=m3.mul(m3.T(Wr),Ws);rot.spine=toEuler(Rs);const Wc=m3.mul(Wr,Rs);
  const earC=v3.mid(P(7),P(8));const shC=v3.mid(P(11),P(12));
  const Rn=swing([0,1,0],m3.v(m3.T(Wc),v3.sub(earC,shC)));rot.neck=toEuler(Rn);const Wn=m3.mul(Wc,Rn);
  const f=m3.v(m3.T(Wn),v3.sub(P(0),earC));rot.head=[Math.round(-Math.atan2(f[1],Math.hypot(f[0],f[2]))*D2)-15,Math.round(Math.atan2(f[0],f[2])*D2),0];
  if(conf(7)>0.3&&conf(8)>0.3){const Wh=m3.mul(Wn,fromEuler(rot.head)),e=m3.v(m3.T(Wh),v3.sub(P(7),P(8)));rot.head[2]=Math.round(Math.atan2(e[1],Math.hypot(e[0],e[2]))*D2);}
  const dn=[0,-1,0],foot=[0,-0.05,0.14];
  const limb=(top,mid,end,hinge,bendSign,nodes,parentW,tipFn,maxTwist,endKnown=true)=>{
    const W=parentW,upper=m3.v(m3.T(W),v3.sub(P(mid),P(top)));let lower=m3.v(m3.T(W),v3.sub(P(end),P(mid)));
    if(!endKnown)lower=upper.slice();
    const u=v3.norm(upper),l=v3.norm(lower),off=v3.sub(l,v3.mul(u,v3.dot(l,u))),sw=swing(dn,u),offL=m3.v(m3.T(sw),v3.mul(off,bendSign));
    const twist=Math.hypot(...off)>0.12?Math.max(-maxTwist,Math.min(maxTwist,Math.atan2(offL[0],offL[2])*D2)):0;
    let R1=m3.mul(sw,fromEuler([0,twist,0]));
    rot[nodes[0]]=limitEuler(toEuler(R1),LIMITS[nodes[0].slice(0,-1)]);R1=fromEuler(rot[nodes[0]]);
    const W1=m3.mul(W,R1),ll=m3.v(m3.T(W1),lower),bend=Math.max(0,Math.min(hinge,Math.atan2(bendSign*ll[2],-ll[1])*D2));
    rot[nodes[1]]=[Math.round(-bendSign*bend),0,0];const W2=m3.mul(W1,fromEuler(rot[nodes[1]]));
    tipFn(W2);};
  const hand=(wr,tip,pinky,index,node,pi,ii)=>W=>{if(Math.min(conf(pi),conf(ii))<0.3||conf(wr)<0.3)return;const d=m3.v(m3.T(W),v3.sub(tip,P(wr))),side=m3.v(m3.T(W),v3.sub(index,pinky));
    rot[node]=limitEuler(toEuler(m3.mul(frameOf(d,side),m3.T(frameOf(dn,[0,0,1])))),LIMITS.wr);};
  const ankle=(heel,toe,node)=>W=>{let d=v3.sub(P(toe),P(heel));const shin=m3.v(W,[0,-1,0]);
    if(shin[1]<-Math.cos(30/D2)&&Math.hypot(d[0],d[2])>1e-4)d=[d[0],0,d[2]];
    rot[node]=limitEuler(toEuler(swing([0,0,1],m3.v(m3.T(W),d))),LIMITS.an);};
  const wristKnown=(wr,pi,ii)=>conf(wr)>=0.3||Math.max(conf(pi),conf(ii))>=0.3;
  limb(11,13,15,155,1,['shL','elL'],Wc,hand(15,v3.mid(P(17),P(19)),P(17),P(19),'wrL',17,19),90,wristKnown(15,17,19));
  limb(12,14,16,155,1,['shR','elR'],Wc,hand(16,v3.mid(P(18),P(20)),P(18),P(20),'wrR',18,20),90,wristKnown(16,18,20));
  limb(23,25,27,155,-1,['hipL','knL'],Wr,ankle(29,31,'anL'),60);
  limb(24,26,28,155,-1,['hipR','knR'],Wr,ankle(30,32,'anR'),60);
  rot.neck=limitEuler(rot.neck,LIMITS.neck);rot.head=limitEuler(rot.head,LIMITS.head);
  for(const k in rot)if(rot[k].every(v=>Math.abs(v)<2))delete rot[k];return rot;}
const autoOk=(e)=>e&&e.found>=e.want&&e.figures&&e.score>0.25&&!e.rejected;
const KP=[[11,'shL'],[12,'shR'],[13,'elL'],[14,'elR'],[15,'wrL'],[16,'wrR'],[23,'hipL'],[24,'hipR'],[25,'knL'],[26,'knR'],[27,'anL'],[28,'anR']];
function rigError(rot,p,cams,A=scoreSource(p)){const body=R.BODIES[0].b,Pk=R.fk(rot,body).P;let total=0,weight=0;
  for(const a of ANG){const e=A[a.jp],c=cams[a.jp];if(!autoOk(e)||e.figures.length!==1||!c||(c.used===false))continue;const im=e.figures[0].image;
    let best=Infinity;for(const yaw of c.yaw?[c.yaw,-c.yaw]:[0])for(const map of a.jp==='正面'?[KP]:[KP,KP.map(([i,k])=>[SWAP[i],k])]){const Rv=viewRot(yaw,c.pitch);const wt=e.figures[0].world;const pts=map.map(([i,k])=>{const q=m3.v(Rv,Pk[k]);return{a:[q[0],q[1]],u:[im[i][0]*900,-im[i][1]*1200],w:Math.max(0.05,wt[i][3])};});
      const ab=[0,0],ub=[0,0];pts.forEach(t=>{ab[0]+=t.a[0]/pts.length;ab[1]+=t.a[1]/pts.length;ub[0]+=t.u[0]/pts.length;ub[1]+=t.u[1]/pts.length;});
      let num=0,den=0;pts.forEach(t=>{const da=[t.a[0]-ab[0],t.a[1]-ab[1]],du=[t.u[0]-ub[0],t.u[1]-ub[1]];num+=da[0]*du[0]+da[1]*du[1];den+=da[0]*da[0]+da[1]*da[1];});
      const sc=num/(den||1);if(sc<=0)continue;let err=0,ws=0;pts.forEach(t=>{err+=t.w*((sc*(t.a[0]-ab[0])+ub[0]-t.u[0])**2+(sc*(t.a[1]-ab[1])+ub[1]-t.u[1])**2);ws+=t.w;});best=Math.min(best,Math.sqrt(err/ws)/sc);}
    if(best<Infinity){const w=(a.jp==='正面'?1.5:1)*Math.max(0.05,e.score||0.5)**2;total+=w*best;weight+=w;}}
  return weight?total/weight:Infinity;}
function viewCandidates(p,worlds){const A=AF[p.code]||{},out=[];
  for(const jp of['上から','下から','斜め','横']){const e=A[jp];if(!autoOk(e)||e.figures.length!==1)continue;const f=e.figures[0],nom=VIEW_ANGLE[jp];
    for(const yaw of nom.yaw?[nom.yaw,-nom.yaw]:[0]){const Rt=m3.T(viewRot(yaw,nom.pitch));
      const world=f.world.map((q,j)=>{const x=m3.v(Rt,lmPt(f.world,j));return[x[0],-x[1],-x[2],q[3]];});out.push(worlds?world:rigFromLandmarks(world));}}
  return out;}
function measureProportions(w){const P=i=>lmPt(w,i),c=i=>w[i][3]==null?1:w[i][3],len=(a,b)=>Math.hypot(...v3.sub(P(a),P(b)));
  const torso=Math.hypot(...v3.sub(v3.mid(P(11),P(12)),v3.mid(P(23),P(24))));if(!(torso>1e-4))return null;
  const pair=(a,b,x,y)=>{const out=[];if(Math.min(c(a),c(b))>0.4)out.push(len(a,b));if(Math.min(c(x),c(y))>0.4)out.push(len(x,y));return out.length?+(Math.max(...out)/torso).toFixed(3):null;};
  return{thigh:pair(23,25,24,26),shin:pair(25,27,26,28),upperArm:pair(11,13,12,14),forearm:pair(13,15,14,16),
    shoulders:Math.min(c(11),c(12))>0.4?+(len(11,12)/torso).toFixed(3):null,hips:Math.min(c(23),c(24))>0.4?+(len(23,24)/torso).toFixed(3):null};}
function bestSingle(p){const e=(AF[p.code]||{})['正面'],cands=[];const add=(world)=>cands.push({rot:rigFromLandmarks(world),world});
  if(autoOk(e)&&e.figures.length===1)add(e.figures[0].world);
  const tri=triangulate(p);if(tri)add(tri.world);
  const dw=dwEntries(p.code);if(dw){const mpFront=autoOk(e)&&e.figures.length===1?e.figures[0]:null;
    for(const seed of mpFront?[mpFront,null]:[null]){const t=triangulate(p,onlyOne,dw,seed);if(t)add(t.world);
      for(const jp of['上から','下から','横','斜め']){if(!autoOk(dw[jp]))continue;const one=triangulate(p,onlyOne,dw,seed,[jp]);if(one)add(one.world);}}}
  viewCandidates(p,true).forEach(add);if(!cands.length)return null;
  let best=null;for(const c of cands){const err=rigError(c.rot,p,Object.fromEntries(ANG.map(a=>[a.jp,VIEW_ANGLE[a.jp]||{yaw:0,pitch:0}])));if(!best||err<best.err)best={rot:c.rot,world:c.world,err};}
  best.props=measureProportions(best.world);return best;}
function withPresetLegs(p,figs){if(!figs||p.line!=='上半身1人')return figs;const legs=startFigures(p)[0].rot;
  return figs.map(f=>{const rot=Object.assign({},f.rot);for(const k of['hipL','hipR','knL','knR','anL','anR']){if(legs[k])rot[k]=legs[k].slice();else delete rot[k];}return{at:f.at,rot};});}
const hipOf=f=>[(f.image[23][0]+f.image[24][0])/2,(f.image[23][1]+f.image[24][1])/2];
const byX=e=>e.figures.slice().sort((a,b)=>hipOf(a)[0]-hipOf(b)[0]);
function metresPerPixel(f){const im=f.image,sh=[(im[11][0]+im[12][0])/2,(im[11][1]+im[12][1])/2],hp=hipOf(f);const px=Math.hypot((sh[0]-hp[0])*900,(sh[1]-hp[1])*1200);
  const w=v3.sub(v3.mid(lmPt(f.world,11),lmPt(f.world,12)),v3.mid(lmPt(f.world,23),lmPt(f.world,24)));return Math.hypot(...w)/(px||1);}
function duoFigures(p){const dw=dwEntries(p.code),A=dw&&dw['正面']&&dw['正面'].found===2?dw:AF[p.code]||{},fr=A['正面'];if(!autoOk(fr)||fr.figures.length!==2)return null;const people=byX(fr);
  const figs=people.map((f,rank)=>{const pick=(jp,e)=>(jp==='正面'||jp==='上から'||jp==='下から')&&e.figures.length===2?byX(e)[rank]:null;
    const tri=triangulate(p,pick,A);return{at:[0,0,0],rot:rigFromLandmarks(tri?tri.world:f.world)};});
  const mpp=(metresPerPixel(people[0])+metresPerPixel(people[1]))/2,h=people.map(hipOf);
  const mx=(h[0][0]+h[1][0])/2,my=(h[0][1]+h[1][1])/2;
  const up=h.map(q=>-(q[1]-my)*1200*mpp);
  figs.forEach((g,i)=>{g.at[0]=+((h[i][0]-mx)*900*mpp).toFixed(3);g.at[2]=+up[i].toFixed(3);});
  const ab=A['上から'];
  if(autoOk(ab)&&ab.figures.length===2){const top=byX(ab),span=fs=>fs.reduce((t,f)=>t+Math.abs(f.image[11][0]-f.image[12][0])+Math.abs(f.image[23][0]-f.image[24][0]),0);
    const mppAbove=mpp*span(people)/(span(top)||1),pitch=VIEW_ANGLE['上から'].pitch/D2,ha=top.map(hipOf),may=(ha[0][1]+ha[1][1])/2;
    figs.forEach((g,i)=>{const yAbove=-(ha[i][1]-may)*1200*mppAbove;const z=(Math.cos(pitch)*up[i]-yAbove)/Math.sin(pitch);g.at[1]=+Math.max(-0.6,Math.min(0.6,z)).toFixed(3);});}
  return figs;}
function autoFigures(p){const e=(AF[p.code]||{})['正面'],de=(dwEntries(p.code)||{})['正面'];if((autoOk(e)&&e.figures.length===2)||(de&&de.want===2)){const duo=duoFigures(p);if(duo)return duo;}
  if(autoOk(e)&&e.figures.length>2)return figuresFromEntry(e);
  const best=bestSingle(p);if(!best)return null;const figs=withPresetLegs(p,[{at:[0,0],rot:best.rot}]);figs.err=best.err;figs.props=p.line==='上半身1人'?null:best.props;return figs;}
function figuresFromEntry(e){
  const figs=e.figures.map(f=>({at:[0,0],rot:rigFromLandmarks(f.world)}));
  if(figs.length>1){const hip=f=>[(f.image[23][0]+f.image[24][0])/2,(f.image[23][1]+f.image[24][1])/2];const W=900,H=1200;
    const scale=e.figures.map(f=>{const sh=[(f.image[11][0]+f.image[12][0])/2,(f.image[11][1]+f.image[12][1])/2],hp=hip(f);const px=Math.hypot((sh[0]-hp[0])*W,(sh[1]-hp[1])*H);
      const ww=v3.sub(v3.mid(lmPt(f.world,11),lmPt(f.world,12)),v3.mid(lmPt(f.world,23),lmPt(f.world,24)));return Math.hypot(...ww)/(px||1);});
    const mpp=(scale[0]+scale[1])/2;const hx=e.figures.map(f=>hip(f)[0]);const mean=(hx[0]+hx[1])/2;figs.forEach((g,i)=>g.at=[+((hx[i]-mean)*W*mpp).toFixed(3),0]);}
  return figs;}

const FIT_VERSION=12;
const LR=[[1,4],[2,5],[3,6],[7,8],[9,10],[11,12],[13,14],[15,16],[17,18],[19,20],[21,22],[23,24],[25,26],[27,28],[29,30],[31,32]];
const SWAP=(()=>{const m=[...Array(33).keys()];for(const[a,b]of LR){m[a]=b;m[b]=a;}return m;})();
function viewRot(yaw,pitch){const y=yaw/D2,p=pitch/D2,cy=Math.cos(y),sy=Math.sin(y),cp=Math.cos(p),sp=Math.sin(p);
  return m3.mul([1,0,0,0,cp,-sp,0,sp,cp],[cy,0,-sy,0,1,0,sy,0,cy]);}
function fitView(view,X,R,perm){let sw=0,ab=[0,0],ub=[0,0];const a=[],u=[],w=[];
  for(let j=0;j<33;j++){const o=view.obs[perm[j]];const q=m3.v(R,X[j]);a.push([q[0],q[1]]);u.push(o.u);w.push(o.w*X.w[j]);}
  for(let j=0;j<33;j++){sw+=w[j];ab[0]+=w[j]*a[j][0];ab[1]+=w[j]*a[j][1];ub[0]+=w[j]*u[j][0];ub[1]+=w[j]*u[j][1];}
  ab=[ab[0]/sw,ab[1]/sw];ub=[ub[0]/sw,ub[1]/sw];let num=0,den=0;
  for(let j=0;j<33;j++){const da=[a[j][0]-ab[0],a[j][1]-ab[1]],du=[u[j][0]-ub[0],u[j][1]-ub[1]];num+=w[j]*(da[0]*du[0]+da[1]*du[1]);den+=w[j]*(da[0]*da[0]+da[1]*da[1]);}
  const sc=num/(den||1),t=[ub[0]-sc*ab[0],ub[1]-sc*ab[1]];let err=0;
  for(let j=0;j<33;j++){const ex=sc*a[j][0]+t[0]-u[j][0],ey=sc*a[j][1]+t[1]-u[j][1];err+=w[j]*(ex*ex+ey*ey);}
  return{s:sc,t,R,perm,err:Math.sqrt(err/sw)/(Math.abs(sc)*1||1)};}
function solveJoints(fits,prior,lam){const X=[];
  for(let j=0;j<33;j++){const N=[lam,0,0,0,lam,0,0,0,lam],b=[lam*prior[j][0],lam*prior[j][1],lam*prior[j][2]];
    for(const f of fits){const o=f.v.obs[f.perm[j]];const wgt=f.v.weight*o.w;const r0=[f.R[0],f.R[1],f.R[2]],r1=[f.R[3],f.R[4],f.R[5]];const g=[(o.u[0]-f.t[0])/f.s,(o.u[1]-f.t[1])/f.s];
      for(let r=0;r<3;r++){for(let c=0;c<3;c++)N[r*3+c]+=wgt*(r0[r]*r0[c]+r1[r]*r1[c]);b[r]+=wgt*(r0[r]*g[0]+r1[r]*g[1]);}}
    X.push(solve3(N,b)||prior[j].slice());}
  X.w=prior.w;return X;}
const BONES=[[11,13,0.285],[13,15,0.25],[12,14,0.285],[14,16,0.25],[23,25,0.42],[25,27,0.4],[24,26,0.42],[26,28,0.4],[11,12,0.36],[23,24,0.2],[11,23,0.5],[12,24,0.5]];
function boneError(X){const L=BONES.map(([a,b])=>Math.hypot(X[a][0]-X[b][0],X[a][1]-X[b][1],X[a][2]-X[b][2]));let num=0,den=0;BONES.forEach(([,,t],i)=>{num+=L[i]*t;den+=L[i]*L[i];});
  const k=num/(den||1);let e=0;BONES.forEach(([,,t],i)=>{const r=(L[i]*k-t)/t;e+=r*r;});return Math.sqrt(e/BONES.length);}
let BONE_WEIGHT=0.15;
const VIEW_ANGLE={'上から':{yaw:0,pitch:40},'下から':{yaw:0,pitch:-25},'横':{yaw:90,pitch:0},'斜め':{yaw:35,pitch:8}};
function pairFit(front,v,prior,yaw,pitch,perm){const R=viewRot(yaw,pitch);let X=prior,F,V;
  for(let k=0;k<4;k++){F=Object.assign(fitView(front,X,viewRot(0,0),[...Array(33).keys()]),{v:front});V=Object.assign(fitView(v,X,R,perm),{v,yaw,pitch});if(!(V.s>0))return null;X=solveJoints([F,V],prior,0.002);}
  F=fitView(front,X,viewRot(0,0),[...Array(33).keys()]);V=Object.assign(fitView(v,X,R,perm),{v,yaw,pitch});return V.s>0?{V,err:F.err+V.err+BONE_WEIGHT*boneError(X),reproj:F.err+V.err}:null;}
const onlyOne=(jp,e)=>e.figures.length===1?e.figures[0]:null;
let DWRAW={};const DWA={};
function liftFlat(image,kp){const mid=(a,b)=>[(image[a][0]+image[b][0])*450,(image[a][1]+image[b][1])*600],sh=mid(11,12),hp=mid(23,24),m=0.5/(Math.hypot(sh[0]-hp[0],sh[1]-hp[1])||1);
  return image.map((q,j)=>[+((q[0]*900-hp[0])*m).toFixed(4),+((q[1]*1200-hp[1])*m).toFixed(4),0,kp[j][2]]);}
function dwEntries(code){if(code in DWA)return DWA[code];const src=DWRAW[code];if(!src)return DWA[code]=null;const out={};
  for(const jp in src){const v=src[jp],people=v.people.filter(q=>q.conf>0.3);
    out[jp]={found:people.length,want:v.want,score:people.length?Math.min(...people.map(q=>q.conf)):0,figures:people.map(q=>{const image=q.kp.map(k=>[k[0],k[1]]);return{image,world:liftFlat(image,q.kp)};})};}
  return DWA[code]=out;}
const SCORE_CACHE={};
function scoreSource(p){if(SCORE_CACHE[p.code])return SCORE_CACHE[p.code];const dw=dwEntries(p.code)||{},mp=AF[p.code]||{},out={};
  for(const a of ANG){const d=dw[a.jp],m=mp[a.jp];out[a.jp]=autoOk(d)?d:autoOk(m)?m:d||m;}return SCORE_CACHE[p.code]=out;}
function triangulate(p,pick=onlyOne,A=AF[p.code]||{},priorFig=null,only=null){const fr=A['正面'];if(!autoOk(fr))return null;const frontFig=pick('正面',fr);if(!frontFig)return null;
  const views=[];let front=null;
  for(const a of ANG){const e=A[a.jp];if(!autoOk(e))continue;const f=pick(a.jp,e);if(!f)continue;
    const v={jp:a.jp,yaw:a.yaw,pitch:a.pitch,front:a.jp==='正面',weight:(a.jp==='正面'?2:1)*e.score,obs:f.image.map((q,j)=>({u:[q[0]*900,-q[1]*1200],w:Math.max(0.05,f.world[j][3])}))};
    if(v.front)front=v;else if(!only||only.includes(v.jp))views.push(v);}
  const seed=priorFig||frontFig;const prior=seed.world.map((q,j)=>lmPt(seed.world,j));prior.w=frontFig.world.map(q=>Math.max(0.05,q[3]));
  const ident=[...Array(33).keys()],chosen=[],cams={正面:{yaw:0,pitch:0,used:true}};
  const frontOnly=fitView(front,prior,viewRot(0,0),ident).err;
  const refine=(start,list)=>{let X=start;for(let k=0;k<5;k++){const F=Object.assign(fitView(front,X,viewRot(0,0),ident),{v:front});X=solveJoints([F].concat(list.map(c=>Object.assign(fitView(c.v,X,c.R,c.perm),{v:c.v}))),prior,0.002);}return X;};
  const turned=v=>!!(VIEW_ANGLE[v.jp]||{}).yaw;views.sort((a,b)=>turned(a)-turned(b));let depth=null;
  for(const v of views){let best=null;
    const nominal=VIEW_ANGLE[v.jp]||{yaw:v.yaw,pitch:v.pitch};let yaws=nominal.yaw?[nominal.yaw,-nominal.yaw]:[-10,-5,0,5,10];
    if(turned(v)&&!depth&&chosen.length)depth=refine(prior,chosen);
    if(turned(v)&&depth){let pickSign=null;for(const y0 of yaws)for(let dp=-10;dp<=10;dp+=5)for(const perm of[ident,SWAP]){const r=fitView(v,depth,viewRot(y0,nominal.pitch+dp),perm);if(r.s>0&&(!pickSign||r.err<pickSign.err))pickSign={err:r.err,y0};}if(pickSign)yaws=[pickSign.y0];}
    for(const y0 of yaws)for(let dy=-5;dy<=5;dy+=5)for(let dp=-10;dp<=10;dp+=5)for(const perm of[ident,SWAP]){
      const yaw=y0+(nominal.yaw?dy:0),pitch=nominal.pitch+dp;const r=pairFit(front,v,prior,yaw,pitch,perm);if(r&&(!best||r.err<best.err))best=r;}
    if(!best)continue;const ok=only?true:best.V.err<0.05&&best.reproj<frontOnly+0.06;cams[v.jp]={yaw:best.V.yaw,pitch:best.V.pitch,err:+best.V.err.toFixed(4),used:ok};if(ok)chosen.push(best.V);}
  if(!chosen.length)return null;
  let X=prior;for(let k=0;k<5;k++){const F=Object.assign(fitView(front,X,viewRot(0,0),ident),{v:front});const fits=[F].concat(chosen.map(c=>Object.assign(fitView(c.v,X,c.R,c.perm),{v:c.v,yaw:c.yaw,pitch:c.pitch})));X=solveJoints(fits,prior,0.002);}
  const world=X.map((x,j)=>[x[0],-x[1],-x[2],prior.w[j]]);
  const F=fitView(front,X,viewRot(0,0),ident);let total=F.err;for(const c of chosen)total+=fitView(c.v,X,c.R,c.perm).err;
  return{world,cams,views:chosen.length+1,err:total/(chosen.length+1)};}
function solve3(m,b){const d=m[0]*(m[4]*m[8]-m[5]*m[7])-m[1]*(m[3]*m[8]-m[5]*m[6])+m[2]*(m[3]*m[7]-m[4]*m[6]);if(Math.abs(d)<1e-12)return null;
  const inv=[m[4]*m[8]-m[5]*m[7],m[2]*m[7]-m[1]*m[8],m[1]*m[5]-m[2]*m[4],m[5]*m[6]-m[3]*m[8],m[0]*m[8]-m[2]*m[6],m[2]*m[3]-m[0]*m[5],m[3]*m[7]-m[4]*m[6],m[1]*m[6]-m[0]*m[7],m[0]*m[4]-m[1]*m[3]];
  return[0,1,2].map(r=>(inv[r*3]*b[0]+inv[r*3+1]*b[1]+inv[r*3+2]*b[2])/d);}
function imgBox(e,upper){let x0=1,y0=1,x1=0,y1=0;let s=0;
  for(const f of e.figures){const im=f.image;const sh=[(im[11][0]+im[12][0])/2,(im[11][1]+im[12][1])/2],hp=[(im[23][0]+im[24][0])/2,(im[23][1]+im[24][1])/2];s=Math.max(s,Math.hypot((sh[0]-hp[0])*0.75,sh[1]-hp[1]));
    im.forEach((q,i)=>{if(upper&&q[1]>hp[1]+0.02)return;const x=Math.max(0,Math.min(1,q[0])),y=Math.max(0,Math.min(1,q[1]));x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);});
    if(upper)y1=Math.max(y1,Math.min(1,hp[1]));}
  const px=0.12*s/0.75,py=0.1*s;return[Math.max(0,x0-px),Math.max(0,y0-0.45*s),Math.min(1,x1+px),Math.min(1,upper?y1+py*0.3:y1+py*0.3)];}
function autoCams(p){const A=AF[p.code]||{};const fr=A['正面'];const cams={};
  for(const a of ANG){const e=A[a.jp];const c=camDefault(a.jp);if(autoOk(e)){c.fit=imgBox(e,p.line==='上半身1人');
      if((a.jp==='横'||a.jp==='斜め')&&autoOk(fr)){const im=e.figures[0].image;const look=im[0][0]-(im[7][0]+im[8][0])/2;
        if(Math.abs(look)>0.004){const Z=m3.v(torsoFrame(fr.figures[0].world),[0,0,1]);const y0=Math.atan2(Z[0],Z[2]);const n=Math.abs(a.yaw)/D2;
          const faces=cy=>Math.sign(Math.sin(y0-cy));const want=Math.sign(look);c.yaw=faces(n)===want?Math.round(n*D2):faces(-n)===want?-Math.round(n*D2):c.yaw;}}}
    cams[a.jp]=c;}return cams;}
function autoFit(p){const figs=autoFigures(p);if(!figs)return null;const approx=figs.length>1||!(figs.err<0.16);const cams=autoCams(p);const tri=triangulate(p);
  if(tri)for(const jp in tri.cams)if(cams[jp]){cams[jp].yaw=tri.cams[jp].yaw;cams[jp].pitch=tri.cams[jp].pitch;}
  if(!autoOk((AF[p.code]||{})['正面']))for(const jp of['斜め','横']){const e=(AF[p.code]||{})[jp];if(!autoOk(e)||!cams[jp])continue;const im=e.figures[0].image;cams[jp].yaw=(im[0][0]-(im[7][0]+im[8][0])/2<0?1:-1)*VIEW_ANGLE[jp].yaw;}
  return{figures:figs,fitted:false,start:startPreset(p),cams,source:'auto',version:FIT_VERSION,approx,props:figs.props||null};}

export function setFitData(autofit, dwfit) {
  AF = autofit || {};
  DWRAW = dwfit || {};
  for (const key of Object.keys(DWA)) delete DWA[key];
  for (const key of Object.keys(SCORE_CACHE)) delete SCORE_CACHE[key];
}

export { autoFit, startFigures, startPreset, rigFromLandmarks, figuresFromEntry, FIT_VERSION, presetByName };
