// The page's sky and its soap bubbles, drawn as one picture so a bubble can really bend what lies behind it.
// Without WebGL the plain .sky__field gradient stays and nothing else is lost.
(function(){
var cv=document.querySelector('.sky__gl');
var gl=cv.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
if(!gl)return;
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

var vert='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
var frag=[
'precision highp float;',
'uniform vec2 uRes;uniform float uT,uS;uniform vec4 uB[4];uniform float uE[4];',
// Dark water-like ribbons: the structure is what makes the bending visible.
'vec3 sky(vec2 p){',
' float t=uT*.06;',
' vec2 q=vec2(p.x,p.y+uS)*2.2;',
' q+=.35*vec2(sin(q.y*1.3+t),cos(q.x*1.1-t*1.3));',
' float a=sin(q.x*1.4+sin(q.y*1.7+t)*1.5+t*.7);',
' float b=sin(q.y*1.9-sin(q.x*1.2-t)*1.8-t*.5);',
' float f=.5+.5*sin((a+b)*2.4);',
' float g=.5+.5*sin((a-b)*1.7+1.);',
' vec3 c=mix(vec3(.004,.009,.03),vec3(.009,.02,.075),.5+.5*b);',
' c+=vec3(.05,.17,.62)*pow(f,5.)*.27;',
' c+=vec3(.015,.36,.52)*pow(g,7.)*.2;',
' c+=vec3(.16,.1,.58)*pow(f*g,3.)*.16;',
' return c;',
'}',
'vec3 film(float x){return .5+.5*cos(6.2832*(x+vec3(0.,.33,.67)));}',
'void main(){',
' vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
' vec3 c=sky(p);',
' float px=1./uRes.y;',
' for(int i=0;i<4;i++){',
'  vec4 b=uB[i];vec2 d=p-b.xy;',
'  if(length(d)>b.z*1.34)continue;',
'  float s=b.w,t=uT,e=uE[i];',
   // Squash and stretch along a slowly turning axis, the area staying the same.
'  vec2 ax=vec2(cos(s*2.+t*.2),sin(s*2.+t*.2));vec2 pe=vec2(-ax.y,ax.x);',
'  float k=1.+(.05+e*.16)*sin(t*.6+s+e*6.);',
'  vec2 dd=ax*dot(d,ax)*k+pe*dot(d,pe)/k;',
'  float an=atan(dd.y,dd.x);',
'  float r=b.z*(1.+(.032+e*.05)*sin(an*2.+t*.8+s)+(.026+e*.04)*sin(an*3.-t*1.1+s*1.7)+.015*sin(an*5.+t*1.6+s*2.9)+.008*sin(an*7.-t*2.+s));',
'  float n=length(dd)/r;',
'  float aa=smoothstep(1.,1.-1.8*px/r,n);',
'  if(aa<=0.)continue;',
'  float z=sqrt(max(0.,1.-n*n));',
'  vec3 N=vec3(dd/r,z);',
   // A soft, slightly uneven skin: the highlights slide around on it like on jelly.
'  N.xy+=.05*vec2(sin(dd.y/r*6.+t*1.2+s),sin(dd.x/r*5.-t+s));N=normalize(N);',
'  float bend=.2+.68*n*n*n;',
'  vec2 o=N.xy*r*bend;',
'  vec3 g=vec3(sky(p-o*1.07).r,sky(p-o).g,sky(p-o*.93).b)*1.5;',
'  float fr=pow(1.-z,2.6);',
'  g+=film(n*n*1.6+an/6.2832+s+t*.02)*fr*.4;',
'  g+=vec3(.75,.9,1.)*smoothstep(.94,.998,n)*.3;',
'  g*=1.-.3*fr*smoothstep(0.,.9,dot(N.xy,vec2(.64,-.76)));',
'  vec3 L=normalize(vec3(-.5,.62,.6));',
'  float sp=pow(max(dot(N,L),0.),110.)+.1*pow(max(dot(N,L),0.),16.);',
'  float sp2=pow(max(dot(N,normalize(vec3(.55,-.6,.58))),0.),170.)*.6;',
'  g+=vec3(1.)*(sp+sp2);',
'  c=mix(c,g,aa);',
' }',
' gl_FragColor=vec4(c,1.);',
'}'].join('\n');

function shader(type,src){
  var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
  return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null;
}
var vs=shader(gl.VERTEX_SHADER,vert),fs=shader(gl.FRAGMENT_SHADER,frag);
if(!vs||!fs)return;
var prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);
if(!gl.getProgramParameter(prog,gl.LINK_STATUS))return;
gl.useProgram(prog);
gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
var loc=gl.getAttribLocation(prog,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
var uRes=gl.getUniformLocation(prog,'uRes'),uT=gl.getUniformLocation(prog,'uT'),uS=gl.getUniformLocation(prog,'uS'),uB=gl.getUniformLocation(prog,'uB'),uE=gl.getUniformLocation(prog,'uE');

// x and y from the top left of the window, r against its shorter side, f how fast it rises with the scroll.
var bubbles=[
  {x:.84,y:.2,r:.29,f:.05,s:1.3,e:0},
  {x:.05,y:.66,r:.24,f:.08,s:4.1,e:0},
  {x:.46,y:.92,r:.15,f:.13,s:2.6,e:0},
  {x:.93,y:.84,r:.13,f:.17,s:5.7,e:0}
];
var data=new Float32Array(16),energy=new Float32Array(4);
var scale=1,W=0,H=0,mx=-9,my=-9,lastY=scrollY,lastT=0,slow=0,count=0;

function size(){
  W=innerWidth;H=innerHeight;
  var dpr=Math.min(devicePixelRatio||1,1.5),cap=Math.min(1,1700/(W*dpr));
  cv.width=Math.round(W*dpr*cap*scale);cv.height=Math.round(H*dpr*cap*scale);
  gl.viewport(0,0,cv.width,cv.height);gl.uniform2f(uRes,cv.width,cv.height);
  if(reduce)draw(0);
}
function draw(t){
  var aspect=W/H,screens=scrollY/H,unit=Math.min(1,aspect/.9),moved=Math.abs(scrollY-lastY)/H;lastY=scrollY;
  bubbles.forEach(function(b,i){
    var y=b.y-screens*b.f;y=((y+.3)%1.6+1.6)%1.6-.3;           // leaves at the top, comes back from below
    var x=b.x;
    if(!reduce){x+=.014*Math.sin(t*.13+b.s);y+=.018*Math.sin(t*.11+b.s*2)}
    var sx=(x-.5)*aspect,sy=.5-y,dx=sx-mx,dy=sy-my,near=Math.sqrt(dx*dx+dy*dy)<b.r*unit*1.05;
    // Scrolling or a passing pointer shakes a bubble, and it settles by itself.
    b.e=Math.min(1,b.e*.965+moved*.5+(near?.012:0));
    data[i*4]=sx;data[i*4+1]=sy;data[i*4+2]=b.r*unit;data[i*4+3]=b.s;energy[i]=b.e;
  });
  gl.uniform1f(uT,t);gl.uniform1f(uS,screens*.22);gl.uniform4fv(uB,data);gl.uniform1fv(uE,energy);
  gl.drawArrays(gl.TRIANGLES,0,3);
}
function loop(now){
  var t=now/1000,dt=now-lastT;lastT=now;
  // A slow machine gets a softer picture rather than a stuttering page.
  if(dt<200){slow+=dt;count++}
  if(count===45){if(slow/count>26&&scale>.5){scale*=.8;size()}slow=0;count=0}
  draw(t);requestAnimationFrame(loop);
}
addEventListener('resize',size);
addEventListener('pointermove',function(e){mx=(e.clientX/W-.5)*W/H;my=.5-e.clientY/H},{passive:true});
size();
if(reduce){draw(0);addEventListener('scroll',function(){draw(0)},{passive:true})}
else requestAnimationFrame(loop);
requestAnimationFrame(function(){cv.classList.add('is-on')});
})();
