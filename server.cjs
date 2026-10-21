const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=__dirname,PUBLIC=path.join(ROOT,'public'),DATA=path.join(ROOT,'data');
fs.mkdirSync(DATA,{recursive:true});
const catalog=JSON.parse(fs.readFileSync(path.join(PUBLIC,'catalog.json'),'utf8'));
const chatLibrary=JSON.parse(fs.readFileSync(path.join(PUBLIC,'chat-library.json'),'utf8'));
const defaults={version:2,giftRunning:false,activePreset:null,portrait:true,ui:true,title:'马大瓜瓜',likes:'6.8万',viewers:'2333',volume:0.35,muted:false,quantity:1,retain:false,chat:{enabled:true,interval:3.5,jitter:40,lines:5,names:['小胖胖','大大大大蒙','可爱小土豆','蓝山小恶魔','橘子汽水','晚风','今天也开心','星河','小熊软糖','追光的人'],messages:['主播好厉害呀','哈哈哈哈哈哈','来了来了','晚上好呀','这个好可爱','今天状态不错','支持一下','太有意思了','刚刚那个好好看','路过来看看']},pool:{enabled:false,ids:[],interval:4,jitter:35},gifts:{}};
for(const g of catalog)defaults.gifts[g.id]={effect:g.effect,size:g.kind==='special'?400:110,x:g.effect==='combo'?72:50,y:g.effect==='combo'?48:g.effect==='drop'?0:50,duration:g.kind==='special'?4:7,interval:5,jitter:35,auto:false,count:1,bounce:0.42,gravity:0.7,speed:1,retain:false};
let state=structuredClone(defaults);
try{const s=JSON.parse(fs.readFileSync(path.join(DATA,'settings.json'),'utf8'));state={...state,...s,chat:{...defaults.chat,...s.chat},pool:{...defaults.pool,...s.pool},gifts:Object.fromEntries(catalog.map(g=>[g.id,{...defaults.gifts[g.id],...s.gifts?.[g.id]}]))};}catch{}
// Restart paused without losing the per-gift or pool selection.
state.giftRunning=false;
state.version=2;
state.chat.themes ??= ['general','custom'];
state.chat.themeMessages ??= {};
const builtinPresets=require('./presets.cjs')(defaults);
let userPresets=[];
try{userPresets=JSON.parse(fs.readFileSync(path.join(DATA,'presets.json'),'utf8'));if(!Array.isArray(userPresets))userPresets=[];}catch{}
function writePresets(){const f=path.join(DATA,'presets.tmp');fs.writeFileSync(f,JSON.stringify(userPresets,null,2));fs.renameSync(f,path.join(DATA,'presets.json'));}
function presetList(){return [...builtinPresets,...userPresets].map(({config,...item})=>item);}
function captureGifts(){return structuredClone({gifts:state.gifts,pool:state.pool,quantity:state.quantity,retain:state.retain});}
function publishState(){save();emit('state',state);emit('status',status());}

const peers=new Map(),due=new Map();let seq=0,lastChat=Date.now()+3000,saveTimer;
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{const f=path.join(DATA,'settings.tmp');fs.writeFileSync(f,JSON.stringify(state,null,2));fs.renameSync(f,path.join(DATA,'settings.json'));},200);}
function emit(type,data){const event={id:++seq,type,data};const line=`data: ${JSON.stringify(event)}\n\n`;for(const [res,p]of peers){if(res.writableLength>1024*1024){res.destroy();peers.delete(res);continue;}res.write(line);}return event;}
function status(){return {overlay:[...peers.values()].filter(p=>p.role==='overlay').length,preview:[...peers.values()].filter(p=>p.role==='preview').length,automatic:Object.values(state.gifts).filter(g=>g.auto).length,pool:state.pool.enabled,running:state.giftRunning};}
function numeric(v,min,max,fallback){return Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;}
function clean(s){s.version=2;s.giftRunning=!!s.giftRunning;s.portrait=!!s.portrait;s.ui=!!s.ui;s.retain=!!s.retain;s.muted=!!s.muted;s.volume=numeric(s.volume,0,1,.35);s.quantity=Math.round(numeric(s.quantity,1,50,1));for(const k of ['title','likes','viewers'])s[k]=String(s[k]||defaults[k]).slice(0,40);for(const g of catalog){const c=s.gifts[g.id]||defaults.gifts[g.id];for(const [key,min,max]of [['size',40,850],['x',0,100],['y',0,100],['duration',1,60],['interval',.4,600],['jitter',0,90],['count',1,50],['bounce',0,.85],['gravity',.1,2],['speed',.2,3]])c[key]=numeric(c[key],min,max,defaults.gifts[g.id][key]);c.auto=!!c.auto;c.retain=!!c.retain;if(!['combo','drop','float','rise','impact','shoot','burst','bloom'].includes(c.effect))c.effect=defaults.gifts[g.id].effect;s.gifts[g.id]=c;}s.chat={...defaults.chat,...s.chat};s.chat.interval=numeric(s.chat.interval,.8,300,3.5);s.chat.jitter=numeric(s.chat.jitter,0,90,40);s.chat.lines=Math.round(numeric(s.chat.lines,2,10,5));s.chat.names=(Array.isArray(s.chat.names)?s.chat.names:defaults.chat.names).map(String).map(x=>x.trim().slice(0,24)).filter(Boolean).slice(0,300);s.chat.messages=(Array.isArray(s.chat.messages)?s.chat.messages:defaults.chat.messages).map(String).map(x=>x.trim().slice(0,150)).filter(Boolean).slice(0,10000);s.chat.themes=(Array.isArray(s.chat.themes)?s.chat.themes:['general','custom']).filter(id=>id==='custom'||chatLibrary.themes.some(t=>t.id===id));s.chat.themeMessages=Object.fromEntries(Object.entries(s.chat.themeMessages||{}).filter(([id,v])=>chatLibrary.themes.some(t=>t.id===id)&&Array.isArray(v)).map(([id,v])=>[id,v.map(String).map(x=>x.trim().slice(0,150)).filter(Boolean).slice(0,10000)]));s.pool={...defaults.pool,...s.pool};s.pool.ids=(Array.isArray(s.pool.ids)?s.pool.ids:[]).filter(id=>catalog.some(g=>g.id===id));s.pool.interval=numeric(s.pool.interval,.4,600,4);s.pool.jitter=numeric(s.pool.jitter,0,90,35);s.pool.enabled=!!s.pool.enabled&&s.pool.ids.length>0;return s;}
function wait(c){return c.interval*1000*(1+(Math.random()*2-1)*c.jitter/100);}
function gift(id,count,source='manual'){const item=catalog.find(g=>g.id===id);if(!item)throw Error('礼物不存在');return emit('gift',{gift:item,settings:state.gifts[id],count:Math.round(numeric(count,1,50,1)),seed:crypto.randomBytes(4).readUInt32LE(),retain:state.retain,source});}
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(!/^127\.0\.0\.1(?::\d+)?$/.test(req.headers.host||'')){res.writeHead(403);return res.end('Use 127.0.0.1');}
 if(req.method==='GET'&&url.pathname==='/events'){
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(': connected\n\n');
  const role=url.searchParams.get('role')||'controller';peers.set(res,{role});res.write(`data: ${JSON.stringify({type:'state',data:state})}\n\n`);emit('status',status());req.on('close',()=>{peers.delete(res);emit('status',status());});return;
 }
 if(req.method==='GET'&&url.pathname==='/api/state'){res.writeHead(200,{'Content-Type':MIME['.json']});return res.end(JSON.stringify({state,catalog,status:status(),presets:presetList()}));}
 if(req.method==='POST'&&url.pathname==='/api/action'){
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`){res.writeHead(403);return res.end();}
  let raw='';try{for await(const b of req){raw+=b;if(raw.length>6000000)throw Error('请求过大');}const a=JSON.parse(raw);let result={ok:true};
  if(a.type==='settings'){const old=state;state=clean({...state,...a.state,gifts:{...state.gifts,...a.state?.gifts}});for(const g of catalog)if(old.gifts[g.id].interval!==state.gifts[g.id].interval||old.gifts[g.id].jitter!==state.gifts[g.id].jitter||old.gifts[g.id].auto!==state.gifts[g.id].auto)due.delete(g.id);if(JSON.stringify(old.pool)!==JSON.stringify(state.pool))due.delete('pool');publishState();}
  else if(a.type==='gift'){result.event=gift(a.id,a.count||state.quantity);}
  else if(a.type==='clear'){emit('clear',{});}
  else if(a.type==='clear-chat'){emit('clear-chat',{});}
  else if(a.type==='stop'){state.giftRunning=false;due.clear();emit('pause-auto',{});publishState();}
  else if(a.type==='start'){if(!Object.values(state.gifts).some(g=>g.auto)&&!state.pool.enabled)throw Error('请先选择礼物预设，或开启某个礼物 / 随机礼物池');state.giftRunning=true;due.clear();publishState();}
  else if(a.type==='apply-preset'){
   if(a.id==='empty'){state.giftRunning=false;state.activePreset='empty';for(const c of Object.values(state.gifts))c.auto=false;state.pool.enabled=false;}
   else{const preset=[...builtinPresets,...userPresets].find(p=>p.id===a.id);if(!preset)throw Error('预设不存在');const config=preset.config;state=clean({...state,gifts:structuredClone(config.gifts),pool:structuredClone(config.pool),quantity:config.quantity,retain:config.retain,activePreset:preset.id});state.giftRunning=Object.values(state.gifts).some(g=>g.auto)||state.pool.enabled;}
   due.clear();emit('clear',{});publishState();
  }
  else if(a.type==='save-preset'){const name=String(a.name||'').trim().slice(0,24);if(!name)throw Error('请输入预设名称');if(userPresets.length>=100)throw Error('最多保存100个自定义预设');const preset={id:'user-'+crypto.randomUUID(),name,group:'custom',description:'你的礼物配置',builtin:false,config:captureGifts()};userPresets.push(preset);writePresets();emit('presets',presetList());result.preset=preset.id;}
  else if(a.type==='delete-preset'){const index=userPresets.findIndex(p=>p.id===a.id);if(index<0)throw Error('只能删除自定义预设');userPresets.splice(index,1);writePresets();if(state.activePreset===a.id)state.activePreset=null;publishState();emit('presets',presetList());}

  else if(a.type==='chat'){emitChat();}
  else if(a.type==='reset'){state=structuredClone(defaults);due.clear();save();emit('state',state);emit('clear',{});}
  else if(a.type==='shutdown'){save();setTimeout(()=>{for(const res of peers.keys())res.end();server.close();process.exit(0);},350);}
  else throw Error('未知操作');res.writeHead(200,{'Content-Type':MIME['.json']});res.end(JSON.stringify(result));
  }catch(e){res.writeHead(400,{'Content-Type':MIME['.json']});res.end(JSON.stringify({error:e.message}));}return;
 }
 if(req.method!=='GET'){res.writeHead(405);return res.end();}
 const name=url.pathname==='/'?'/index.html':url.pathname;let file;
 try{file=path.resolve(PUBLIC,'.'+decodeURIComponent(name));}catch{res.writeHead(400);return res.end();}
 if(!file.startsWith(PUBLIC+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,b)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(b);});
});
const recentMessages=[];
function emitChat(){const c=state.chat;const messages=[...new Set((c.themes||['custom']).flatMap(id=>id==='custom'?c.messages:(c.themeMessages?.[id]??chatLibrary.themes.find(t=>t.id===id)?.messages??[])))];if(!c.names.length||!messages.length)return;const fresh=messages.filter(m=>!recentMessages.includes(m)),choices=fresh.length?fresh:messages;const text=choices[Math.floor(Math.random()*choices.length)];recentMessages.push(text);if(recentMessages.length>25)recentMessages.shift();emit('chat',{name:c.names[Math.floor(Math.random()*c.names.length)],text,color:['#7de1ef','#f7b6d8','#cbbdff','#ffd887'][Math.floor(Math.random()*4)]});}
setInterval(()=>{const t=Date.now();for(const g of catalog){const c=state.gifts[g.id];if(!state.giftRunning||!c.auto){due.delete(g.id);continue;}if(!due.has(g.id))due.set(g.id,t+wait(c));if(t>=due.get(g.id)){gift(g.id,c.count,'auto');due.set(g.id,t+wait(c));}}const p=state.pool;if(state.giftRunning&&p.enabled&&p.ids.length){if(!due.has('pool'))due.set('pool',t+wait(p));if(t>=due.get('pool')){const id=p.ids[Math.floor(Math.random()*p.ids.length)];gift(id,state.gifts[id].count,'pool');due.set('pool',t+wait(p));}}if(t>=lastChat){if(state.chat.enabled)emitChat();lastChat=t+wait(state.chat);}},80).unref();
setInterval(()=>{for(const res of peers.keys())res.write(': heartbeat\n\n');},10000).unref();
const PORT=Number(process.env.PORT||17865);
server.on('error',e=>{if(e.code==='EADDRINUSE'&&process.argv.includes('--open'))open();else{console.error(e);process.exitCode=1;}});
function open(){require('child_process').spawn('cmd.exe',['/c','start','',`http://127.0.0.1:${PORT}/`],{windowsHide:true,stdio:'ignore'}).unref();}
server.listen(PORT,'127.0.0.1',()=>{console.log(`Gift Studio http://127.0.0.1:${PORT}/`);if(process.argv.includes('--open'))open();});
