// Built-in presets touch gift configuration only. The live chat and scene are not part of a preset.
module.exports=function(defaults){
 const definitions=[
  ['quiet','安静点缀','mood','少量爱心和玫瑰，留出画面空间',{rose:[18,40,1],heart:[23,35,1]},[],10],
  ['daily','日常互动','mood','小礼物自然交替，节奏轻松',{flower:[9,40,1],gift:[17,45,1],clap:[22,35,1]},['rose','heart'],15],
  ['combo','热闹连击','mood','右侧提示为主，快速累加连击',{flower:[2.5,45,2],gift:[4,40,1],heart:[3,45,2]},[],5],
  ['rain','礼物雨','mood','星星、糖果和钻石从顶部落下',{},['star','candy','diamond','money','cherry','orange'],1.8],
  ['impact','冲屏整活','mood','拳套和棒球冲向镜头，少量流星穿场',{boxing:[13,45,1],baseball:[19,40,1],meteor:[25,45,1]},[],10],
  ['talk','聊天陪伴','scene','轻量的玫瑰、花朵和咖啡点缀',{flower:[14,45,1],coffee:[26,40,1]},['rose','heart','butterfly'],19],
  ['shop','带货氛围','scene','右侧连击，减少对商品画面的遮挡',{gift:[11,35,1],flower:[7,40,2],clap:[19,45,1]},[],12],
  ['game','游戏助威','scene','掌声与星星，偶尔出现火箭',{clap:[9,40,1],star:[15,40,2],rocket:[70,30,1]},['diamond','money'],19],
  ['sing','唱歌应援','scene','爱心和玫瑰缓慢飘过',{rose:[11,45,1],heart:[15,40,1],love:[80,30,1]},['balloon','butterfly'],23],
  ['party','庆祝时刻','scene','礼炮、彩纸与礼盒营造庆祝气氛',{party:[24,35,1],confetti:[32,40,1],gift:[6,40,2]},['star','balloon','diamond'],4]
 ];
 return definitions.map(([id,name,group,description,enabled,pool,interval])=>{
  const config={gifts:structuredClone(defaults.gifts),pool:{enabled:pool.length>0,ids:pool,interval,jitter:40},quantity:1,retain:false};
  for(const [gift,[seconds,jitter,count]] of Object.entries(enabled))Object.assign(config.gifts[gift],{auto:true,interval:seconds,jitter,count});
  if(id==='combo')for(const gift of ['flower','gift','heart'])Object.assign(config.gifts[gift],{effect:'combo',x:76,y:48,duration:6});
  if(id==='rain')for(const gift of pool)Object.assign(config.gifts[gift],{effect:'drop',y:0,size:95,count:3,duration:5,gravity:1});
  if(id==='shop')for(const gift of Object.keys(enabled))Object.assign(config.gifts[gift],{effect:'combo',x:80,y:48,size:95});
  if(id==='quiet'||id==='talk'||id==='sing')for(const gift of Object.keys(enabled))config.gifts[gift].size*=.85;
  return{id:'builtin-'+id,name,group,description,config,builtin:true};
 });
};
