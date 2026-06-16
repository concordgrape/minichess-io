import { Chess } from "chess.js";
import { readFileSync } from "fs";
const MATE=1e6;
function search(c,d,a){if(c.isCheckmate())return c.turn()===a?-MATE:MATE;if(d===0||c.isStalemate()||c.isInsufficientMaterial()||c.isDraw())return 0;const max=c.turn()===a;let b=max?-1/0:1/0;for(const m of c.moves()){c.move(m);let v=search(c,d-1,a);c.undo();if(v>0)v--;else if(v<0)v++;if(max){if(v>b)b=v;if(b>=MATE-1)break}else{if(v<b)b=v;if(b<=0)break}}return b===1/0||b===-1/0?0:b}
function bestAttack(c,h){const a=c.turn();let bm=null,bs=-1/0;for(const m of c.moves({verbose:true})){c.move(m);let v=search(c,h-1,a);c.undo();if(v>0)v--;else if(v<0)v++;if(v>bs){bs=v;bm=m}}return bm}
function bestDef(c,h){const d=c.turn(),a=d==="w"?"b":"w";const ms=c.moves({verbose:true});if(!ms.length)return null;let bm=ms[0],bs=1/0;for(const m of ms){c.move(m);let v=search(c,h-1,a);c.undo();if(v>0)v--;else if(v<0)v++;if(v<bs){bs=v;bm=m;if(bs<=0)break}}return bm}
const puzzles=JSON.parse(readFileSync("public/endgame-puzzles.json","utf-8"));const n=2;
for(const p of puzzles){
  const c=new Chess(p.fen);let used=0,line=[];
  for(let i=0;i<n;i++){const am=bestAttack(c,n*2-1);line.push(am.san);c.move(am);used++;if(c.isCheckmate())break;const dm=bestDef(c,Math.max(2,(n-used)*2));if(dm){line.push(dm.san);c.move(dm)}if(c.isStalemate())break;}
  console.log(`${c.isCheckmate()&&used<=n?"OK  ":"FAIL"} ${p.id.padEnd(14)} ${line.join("  ")}`);
}
