import { Chess } from "chess.js";
const BIG = 1_000_000;
function bs(c){let p=0,pr=0;for(const row of c.board())for(const cell of row)if(cell&&cell.color==="b"){if(cell.type==="p")p++;else if(cell.type!=="k")pr++;}return{p,pr};}
function search(c,d){const{p,pr}=bs(c);if(pr>0)return -BIG;if(p===0)return BIG;if(d===0||c.isStalemate()||c.isInsufficientMaterial()||c.isDraw())return 0;const w=c.turn()==="w";let b=w?-1/0:1/0;for(const m of c.moves()){c.move(m);let v=search(c,d-1);c.undo();if(v>0)v--;else if(v<0)v++;if(w){if(v>b)b=v;if(b>=BIG-1)break;}else{if(v<b)b=v;if(b<=-BIG+1)break;}}return b===1/0||b===-1/0?0:b;}
function dist(fen,maxN){let c;try{c=new Chess(fen);}catch{return null;}for(let n=1;n<=maxN;n++)if(search(c,n*2-1)>0)return n;return null;}
function bestA(c,h){let bm=null,bsc=-1/0;for(const m of c.moves({verbose:true})){c.move(m);let v=search(c,h-1);c.undo();if(v>0)v--;else if(v<0)v++;if(v>bsc){bsc=v;bm=m;}}return bm;}
function bestD(c,h){const ms=c.moves({verbose:true});if(!ms.length)return null;let bm=ms[0],bsc=1/0;for(const m of ms){c.move(m);let v=search(c,h-1);c.undo();if(v>0)v--;else if(v<0)v++;if(v<bsc){bsc=v;bm=m;if(bsc<=-BIG+1)break;}}return bm;}
function line(fen,n){const c=new Chess(fen);let u=0,o=[];for(let i=0;i<n;i++){const a=bestA(c,n*2-1);if(!a)break;o.push(a.san);c.move(a);u++;if(bs(c).p===0)break;const d=bestD(c,Math.max(2,(n-u)*2));if(d){o.push(d.san);c.move(d);}}return o.join(" ");}
for(const fen of JSON.parse(process.argv[2])){const d=dist(fen,3);console.log(`dist=${d}  ${fen}  ::  ${d?line(fen,d):"-"}`);}
