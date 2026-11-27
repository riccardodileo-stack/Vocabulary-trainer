/* Goricheco · panda smeraldo. Coordinate di disegno in unità vettoriali.
 * Il modello espone un albero SVG persistente. I giunti modificano solo geometrie e trasformazioni.
 */
const GREEN = 'url(#fur)';
const MINT = 'url(#mint)';
const DARK = 'url(#dark)';
const clip = name => 'clip-path="url(#' + name + ')"';
const path = (d, fill, extra = '') => '<path d="' + d + '" fill="' + fill + '" ' + extra + '/>';
const joint = (name, contents) => '<g data-joint="' + name + '">' + contents + '</g>';
const livePath = (name, fill) => '<path data-joint="' + name + '" fill="' + fill + '"/>';
const oval = (x,y,rx,ry,fill) => '<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'"/>';
const mask = (name,d) => '<clipPath id="'+name+'">'+path(d,'white')+'</clipPath>';
const gradient = (id, light, dark) => '<linearGradient id="'+id+'" x2="0.8" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="'+light+'"/><stop offset="1" stop-color="'+dark+'"/></linearGradient>';

const head = 'M104 893 C113 838 142 758 155 705 C176 591 268 527 392 498 C478 477 520 479 570 504 C646 541 711 605 779 673 C809 702 815 720 803 753 C771 836 685 915 587 961 C502 1000 363 1017 257 993 C198 982 145 957 114 932 C104 924 100 911 104 893 Z';
const torso = 'M339 887 C409 835 515 810 630 818 C745 822 837 835 878 878 C922 923 930 985 902 1030 C872 1077 815 1089 773 1065 C710 1125 640 1150 542 1148 C477 1147 431 1125 404 1107 C352 1106 297 1073 295 1024 C295 964 310 922 339 887 Z';
const tailOutline = 'M783 949 C765 887 766 765 776 679 C782 589 835 534 883 457 C936 375 926 328 884 302 C842 276 805 284 797 321 C792 373 765 404 712 400 C645 397 597 341 606 260 C615 156 691 75 798 47 C916 16 1029 57 1102 128 C1180 202 1212 300 1195 398 C1184 484 1142 550 1080 602 C1002 669 965 711 945 778 C922 863 921 920 874 959 C847 978 812 977 783 949 Z';
const bands = [
 'M819 294 C836 182 925 76 1066 104 C1122 107 1180 177 1210 266 C1083 214 1003 239 911 342 Z',
 'M883 456 C963 389 1083 377 1185 463 L1144 586 L1080 606 C1036 531 919 497 821 542 Z',
 'M761 679 C812 635 899 628 983 678 L949 774 C897 733 833 738 770 776 Z',
];
const hindNear = 'M775 953 C819 911 874 935 906 998 C925 1049 947 1129 947 1176 C947 1213 922 1226 860 1225 C809 1225 779 1208 803 1163 C776 1110 736 1050 748 1001 C751 981 761 965 775 953 Z';
const hindFar = 'M631 976 C676 955 739 974 739 1040 L735 1138 C735 1183 711 1200 671 1200 C628 1201 600 1188 609 1156 L610 1119 C593 1073 593 1012 631 976 Z';
const foreNear = 'M515 1144 C526 1101 548 1082 582 1058 C619 1031 658 1027 674 1055 C684 1075 670 1114 661 1136 C653 1166 649 1199 626 1220 C605 1242 546 1246 509 1238 C474 1231 474 1196 494 1177 C500 1170 507 1168 510 1162 Z';

const tokens = d => d.match(/[A-Z]|-?\d+(?:\.\d+)?/g).map(v => /^[A-Z]$/.test(v) ? v : Number(v));
const outlined = tokens(tailOutline);
const stripes = bands.map(tokens);
// La zampa del saluto usa due contorni con gli stessi segmenti cubici.
const matchRaised = tokens('M330 959 C354 951 389 972 393 1000 C389 1041 332 1064 286 1052 C212 1043 137 968 67 919 C12 893 -35 858 -37 820 C-40 784 -22 763 -5 770 C7 774 6 783 13 777 C43 738 84 772 79 831 C146 877 245 924 330 959 Z');
// Il tracciato a riposo ha otto segmenti; l’estremo del gesto si chiude con lo stesso ordine.
const waveRest = tokens('M333 959 C363 939 409 959 440 1011 C457 1042 459 1070 440 1108 C421 1143 404 1182 377 1208 C350 1233 286 1238 247 1221 C218 1209 220 1178 244 1158 C252 1152 262 1150 269 1148 C276 1122 291 1076 300 1046 C312 1009 323 977 333 959 Z');
const rnd = v => Math.round(v*100)/100;
const bound = (v,l,h) => Math.max(l,Math.min(h,v));
const mix = (a,b,k) => a+(b-a)*k;
const fmt = (...a) => a.map(rnd).join(' ');
const turn = (a,x,y) => 'rotate('+fmt(a,x,y)+')';
const move = (x,y) => 'translate('+fmt(x,y)+')';
const scale = (x,y) => 'scale('+fmt(x,y)+')';
function deform(points, f) {
 const out = [];
 for (let i=0;i<points.length;) {
   if (typeof points[i] === 'string') { out.push(points[i++]); continue; }
   out.push(fmt(...f(points[i],points[i+1]))); i+=2;
 }
 return out.join(' ');
}
function eye(side) {
 const far = side === 'left';
 const id = 'iris-'+side, rx = far ? 70 : 67, ry = far ? 82 : 79;
 const aperture = joint('open-'+side, oval(0,0,rx,ry,'#fffefd') +
   '<g '+clip(id)+'>'+joint('look-'+side,oval(0,0,41,55,DARK)+oval(-16,-29,16,19,'#fffefd'))+'</g>');
 return joint('eye-'+side, aperture + joint('lid-'+side,path('M-49 5 Q0 -28 49 5','none','stroke="#063e36" stroke-width="12" stroke-linecap="round"')));
}
const anatomy = '<defs>' + gradient('fur','#05895b','#007e54') + gradient('mint','#c9f5de','#bcefd3') +
 gradient('dark','#03443c','#003b34') + gradient('belly','#cbf6de','#b8ebd0') +
 mask('body-mask',torso)+mask('head-mask',head)+
 '<clipPath id="tail-cut">'+livePath('tail-mask','white')+'</clipPath>'+
 '<clipPath id="mouth-cut">'+livePath('mouth-mask','white')+'</clipPath>'+
 '<clipPath id="iris-left">'+oval(0,0,70,82,'white')+'</clipPath>'+
 '<clipPath id="iris-right">'+oval(0,0,67,79,'white')+'</clipPath></defs>'+
 joint('tail',livePath('tail-shape',GREEN)+'<g '+clip('tail-cut')+'>'+bands.map((_,i)=>livePath('band'+i,MINT)).join('')+'</g>')+
 joint('backFar',path(hindFar,DARK))+joint('backNear',path(hindNear,DARK))+
 joint('frontFar',livePath('waving-leg',DARK)+joint('pads',
  '<g transform="translate(-80 -20) rotate(-25 100 850)">'+oval(96,854,23,17,'#589b87')+oval(70,830,7,9,'#8bcab2')+oval(90,818,7,10,'#8bcab2')+oval(109,821,7,9,'#8bcab2')+'</g>'))+
 joint('body', path(torso,GREEN)+'<g '+clip('body-mask')+'>'+path('M393 939 C366 1049 412 1135 515 1150 C529 1098 559 1029 573 921 Z','url(#belly)')+'</g>')+
 joint('frontNear',path(foreNear,DARK))+
 joint('head',
  joint('ear-left',path('M152 775 C108 724 71 636 74 565 C76 514 98 491 145 498 C215 505 281 535 334 568 L205 750 Z',DARK))+
  joint('ear-right',path('M438 525 C461 450 530 359 572 352 C591 347 603 358 616 372 C663 420 691 504 689 603 L555 560 Z',DARK))+
  path(head,GREEN)+'<g '+clip('head-mask')+'>'+joint('cheeks',
   path('M125 963 C134 890 178 832 236 804 C239 851 264 881 298 901 C281 939 277 967 284 1016 Z',MINT)+
   path('M675 690 C733 682 780 708 804 747 L840 738 L789 872 L692 893 C697 852 680 824 654 798 C678 764 684 727 675 690 Z',MINT))+'</g>'+
  joint('face',
    joint('brow-left',path('M220 688 C221 657 248 620 276 619 C296 617 313 632 319 642 Q322 647 317 648 C280 658 250 680 229 701 Q219 708 220 688 Z',MINT))+
    joint('brow-right',path('M494 584 C489 556 511 530 539 532 C568 532 586 550 598 570 Q601 577 593 575 C554 566 522 575 501 590 Q494 594 494 584 Z',MINT))+
    eye('left')+eye('right')+
    joint('muzzle',path('M393 827 C402 774 456 740 505 747 C558 751 595 792 590 850 C585 903 542 948 488 947 C426 946 380 895 393 827 Z',MINT)+
    path('M443 790 C451 778 482 767 505 768 C523 768 530 778 523 795 C515 816 501 827 479 824 C454 821 431 808 443 790 Z',DARK)+
    livePath('mouth',DARK)+'<g '+clip('mouth-cut')+'>'+joint('tongue',oval(496,899,44,34,'#ff5876'))+'</g>'))
 );

function smooth(a,b,t) { const k=bound((t-a)/(b-a),0,1); return k*k*(3-2*k); }
function pulse(t,a,b,c,d) {return smooth(a,b,t)*(1-smooth(c,d,t));}
export const GREET_AT = 0.84;
export const INTRO_END = 2.72;
export const VIEWBOX = '-98 -28 1390 1310';

// Time in seconds. yaw is a signed local head turn from the illustrated three-quarter view.
export function poseAt(time, options={}) {
 const {mode='idle',section={},reducedMotion=false,waveTime=null,blinkTime=null,expressionMix}=options;
 const t=reducedMotion?0:time;
 const w=reducedMotion?null:(mode==='intro'?t:waveTime);
 const lift=w===null?0:pulse(w,.22,.83,1.98,2.57);
 const wag=w===null?0:Math.sin((w-.83)*Math.PI*3.2)*pulse(w,.78,.94,1.85,2.05);
 const breath=Math.sin(t*1.95);
 const cycle=t%9.3;
 const blink=reducedMotion?0:Math.max(pulse(cycle,3.19,3.29,3.32,3.46),pulse(cycle,7.49,7.59,7.62,7.76),
    blinkTime===null?0:pulse(blinkTime,0,.095,.13,.25));
 const name=section.expression||'smile';
 const moods=expressionMix || Object.fromEntries(['curious','sleepy','focused','surprised','joy'].map(n=>[n,Number(n===name)]));
 const {curious=0,sleepy=0,focused=0,surprised=0,joy=0}=moods;
 const micro=reducedMotion?0:1;
 const yaw=bound((section.yaw??0) + micro*(.035*Math.sin(t*1.18)+.038*Math.sin(t*.58)), -1,1);
 const tilt=(section.tilt??0)+breath*.62 + lift*(3.4+.5*wag);
 const attrs={};
 const at=(id,values)=>{attrs[id]=values;};
 const tr=(id,transform)=>at(id,{transform});
 const tail=bound(section.tail??.52,0,1);
 function tailPoint(x,y) {
   const weight=bound((954-y)/916,0,1);
   const curl=weight*weight + .72*bound((840-x)/234,0,1)*weight;
   return [x+curl*(tail*(32*Math.sin(1.58*t)+15*Math.sin(.83*t))+lift*(17+6*wag)),
     y+weight*(tail*9*Math.sin(1.58*t)+lift*5) - curl*breath*4];
 }
 at('tail-shape',{d:deform(outlined,tailPoint)});
 at('tail-mask',{d:attrs['tail-shape'].d});
 stripes.forEach((p,i)=>at('band'+i,{d:deform(p,tailPoint)}));
 tr('body',move(497,1147)+' '+scale(1+breath*.003,1+breath*.009)+' '+move(-497,-1147));
 tr('head', move(6*yaw-4*lift,-breath*3-4*lift)+' '+turn(tilt,454,963)+' '+move(454,0)+' '+scale(1-.067*Math.abs(yaw),1)+' '+move(-454,0));
 tr('cheeks',move(17*yaw,0));
 tr('face',move(51*yaw,-2*lift));
 tr('ear-left',turn(-3.5*yaw-2*lift,188,715));
 tr('ear-right',turn(5*yaw+2.8*curious*Math.sin(t*1.3),610,542));
 const gaze=section.gaze??[0,0];
 const gazeX=bound(gaze[0],-1,1)*16 + micro*(1-lift)*(2.5*Math.sin(t*.91)+2*Math.sin(t*.54));
 const gazeY=bound(gaze[1],-1,1)*14 - lift*2;
 ['left','right'].forEach((side,i)=>{
    const sign=i===0?-1:1, x=i===0?327:579, y=i===0?776:692;
    const eyeScale=1+sign*yaw*.16;
    tr('eye-'+side,move(x+sign*Math.abs(yaw)*-7,y-sign*curious*5)+' '+turn(-16,0,0)+' '+scale(eyeScale,1));
    tr('look-'+side,move(gazeX+yaw*5,gazeY));
    const openness=bound((1-.62*sleepy-.14*focused-.28*joy+.05*surprised)*(1-blink),0,1.1);
    at('open-'+side,{transform:scale(1,Math.max(.02,openness)),opacity:rnd(smooth(.06,.24,openness))});
    at('lid-'+side,{opacity:rnd(1-smooth(.06,.24,openness))});
    tr('brow-'+side,move(0,sign*10*curious+8*focused+7*sleepy-13*surprised-4*lift)+' '+turn(sign*(5*curious-5*focused),x,y-90));
 });
 const opening=bound(1-.57*curious-.8*focused-.72*sleepy+.12*lift+.12*joy,0,1.22);
 const mouth='M'+fmt(436+19*surprised,841-11*surprised)+' C'+fmt(463,848-17*surprised,516,843-24*surprised,542-24*surprised,815+8*surprised)+' C'+fmt(548-22*surprised,842+35*opening,527-16*surprised,858+56*opening,499-5*surprised,857+58*opening)+' C'+fmt(472,859+55*opening,445+10*surprised,850+34*opening,436+19*surprised,841-11*surprised)+' Z';
 at('mouth',{d:mouth});at('mouth-mask',{d:mouth});
 tr('tongue',move(0,21*(1-opening)+25*surprised));
 tr('muzzle',move(9*yaw,0));
 const pivots={frontFar:[350,1000],frontNear:[605,1063],backNear:[827,997],backFar:[686,1028]};
 for(const [id,[x,y]] of Object.entries(pivots)){
    const [dx,dy,pitch,raised]=section.feet?.[id]??[0,0,0,0];
    tr(id,move(dx,dy-32*raised)+' '+turn(pitch,x,y));
 }
 const coords=waveRest.map((n,i)=>typeof n==='string'?n:mix(n,matchRaised[i],lift));
 function wrist(x,y) {
   const weight=bound((320-x)/180,0,1)*lift;
   const angle=wag*.12*weight;
   const dx=x-216,dy=y-978;
   return [216+dx*Math.cos(angle)-dy*Math.sin(angle),978+dx*Math.sin(angle)+dy*Math.cos(angle)];
 }
 at('waving-leg',{d:deform(coords,wrist)});
 const [px,py]=wrist(19,825);
 at('pads',{transform:move(px,py)+' '+turn(wag*6.88,0,0)+' '+scale(lift,lift)+' '+move(-19,-825),opacity:rnd(smooth(.88,1,lift))});
 return attrs;
}

export function svgFrame(attrs, prefix='panda') {
 const body=anatomy.replace(/data-joint="([^"]+)"/g,(m,id)=>m+' '+Object.entries(attrs[id]||{}).map(([k,v])=>k+'="'+v+'"').join(' '));
 // IDs are unique even when several mascots share one web document.
 return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+VIEWBOX+'" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'+body+'</svg>')
    .replace(/id="([^"]+)"/g,'id="'+prefix+'-$1"').replace(/url\(#([^)]*)\)/g,'url(#'+prefix+'-$1)');
}

