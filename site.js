// The page reads complete without this file. It adds the films: a pointer works each widget the way the app
// works, one caption under it says what is happening, and everything rests on the finished state in the HTML.
(function(){
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var wide=matchMedia('(min-width: 821px)');
var STOP={},MOVE='cubic-bezier(.76,0,.24,1)';
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function pad(n){return (n<10?'0':'')+n}
function stamp(d){return pad(d.getMonth()+1)+'.'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())}
function mmss(s){return pad(Math.floor(s/60))+':'+pad(s%60)}
// Written the way the widget writes it (RemainingTime.cs).
function left(ms){
  ms=Math.max(0,ms);var days=Math.floor(ms/864e5),hours=Math.floor(ms%864e5/36e5);
  if(days===0&&hours===0)return '<1 hour 남음';
  return (days?days+(days===1?' day':' days')+' · ':'')+hours+(hours===1?' hour':' hours')+' 남음';
}

// One film: script() plays over and over until stop(), which leaves the finished picture behind.
function film(host,cap,reset,rest,script){
  var me=0,cur=document.createElementNS('http://www.w3.org/2000/svg','svg'),idle=cap.textContent;
  cur.setAttribute('class','p__cur');cur.setAttribute('viewBox','0 0 24 24');cur.innerHTML='<path d="M5 3l14 9-6.2 1.3L9.6 20z"/>';
  host.appendChild(cur);
  function alive(id){if(id!==me)throw STOP}
  var c={
    // Positions inside the widget, which may be scaled to fit its stage.
    box:function(el){
      var r=el.getBoundingClientRect(),b=host.getBoundingClientRect(),k=b.width/host.offsetWidth;
      return {x:(r.left-b.left)/k,y:(r.top-b.top)/k,w:r.width/k,h:r.height/k};
    },
    wait:function(ms){var id=me;return new Promise(function(r){setTimeout(r,ms)}).then(function(){alive(id)})},
    say:function(text){
      if(cap.textContent===text)return;cap.textContent=text;
      if(cap.animate)cap.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});
    },
    place:function(x,y){cur.style.transition='opacity 180ms ease';cur.style.transform='translate('+x+'px,'+y+'px)';cur.classList.add('is-on')},
    point:function(x,y,ms){
      cur.style.transition='transform '+ms+'ms '+MOVE+',opacity 180ms ease';cur.style.transform='translate('+x+'px,'+y+'px)';cur.classList.add('is-on');
      return c.wait(ms);
    },
    go:function(el,ms){var b=c.box(el);return c.point(b.x+b.w/2,b.y+b.h/2,ms||640)},
    press:function(on){cur.classList.toggle('is-down',on)},
    hide:function(){cur.classList.remove('is-on')},
    tap:async function(el,ms){
      await c.go(el,ms);c.press(true);el.classList.add('is-down');await c.wait(150);
      c.press(false);el.classList.remove('is-down');await c.wait(120);
    },
    type:async function(el,text){for(var i=1;i<=text.length;i++){el.textContent=text.slice(0,i);await c.wait(95)}},
    tween:function(ms,fn){
      var id=me;
      return new Promise(function(done,fail){
        var t0=performance.now();
        (function step(now){
          if(id!==me)return fail(STOP);
          var k=Math.min(1,(now-t0)/ms);fn(k);
          if(k<1)requestAnimationFrame(step);else done();
        })(t0);
      });
    }
  };
  return {
    start:function(){
      if(reduce)return;
      var id=++me;
      (async function(){
        try{for(;;){reset(c);await script(c);alive(id);c.hide();await c.wait(2400)}}
        catch(e){if(e!==STOP)throw e}
      })();
    },
    stop:function(){me++;cur.classList.remove('is-on','is-down');rest();cap.textContent=idle}
  };
}

// ---- To-do: LMS sync, reading an assignment, ticking one off, adding one's own ----
var todo=(function(){
  var host=$('#todo'),rows=$$('#todoList .t'),count=$('#todoCount'),sync=$('#todoSync'),pull=$('#todoPull'),detail=$('#todoDetail');
  var go=$('#detailGo'),close=$('#detailClose'),plus=$('#todoPlus'),add=$('#todoAdd'),addName=$('#todoAddName'),addOk=$('#todoAddOk');
  var lms=rows.filter(function(r){return r.dataset.kind==='lms'}),fresh=rows.filter(function(r){return r.dataset.kind==='new'})[0];
  var start=Date.now();
  rows.forEach(function(r){r.due=start+Number(r.dataset.h)*36e5});
  function paint(){
    var now=Date.now();
    rows.forEach(function(r){$('.t__left',r).textContent=left(r.due-now);$('.t__due',r).textContent=stamp(new Date(r.due))});
    $('#detailDue').textContent='마감 '+stamp(new Date(rows[0].due));
    $('#todoAddDue').textContent='마감 '+stamp(new Date(fresh.due));
  }
  function tally(){count.textContent='할 일 '+rows.filter(function(r){return !r.classList.contains('is-off')}).length+'개'}
  function clear(){
    detail.hidden=true;add.hidden=true;addName.textContent='';pull.textContent='LMS 연동';
    rows.forEach(function(r){r.classList.remove('is-done')});
  }
  function rest(){clear();rows.forEach(function(r){r.classList.toggle('is-off',r===fresh)});tally();sync.textContent=stamp(new Date(start-18e5))}
  function reset(){clear();rows.forEach(function(r){r.classList.toggle('is-off',r.dataset.kind!=='own')});tally();sync.textContent=stamp(new Date(start-864e5))}
  paint();setInterval(paint,60000);rest();
  return film(host,$('#todoCap'),reset,rest,async function(c){
    var b=c.box(host);
    c.place(b.w*.8,b.h*.7);
    c.say('할 일 두 개뿐인 위젯이에요. LMS 연동을 눌러 볼게요.');
    await c.wait(900);
    await c.tap(pull);
    pull.textContent='가져오는 중…';
    await c.wait(800);
    pull.textContent='LMS 연동';sync.textContent=stamp(new Date());
    c.say('이번 주 과제, 강의 영상, 퀴즈가 마감 순서대로 들어와요.');
    for(var i=0;i<lms.length;i++){lms[i].classList.remove('is-off');tally();await c.wait(190)}
    await c.wait(1500);
    c.say('과제를 누르면 설명과 첨부 파일, 제출 상태가 바로 보여요.');
    await c.tap($('.t__b',lms[0]));
    detail.hidden=false;
    await c.wait(1900);
    c.say('LMS 원문 / 제출을 누르면 크롬에서 이 과제의 제출 화면이 열려요.');
    await c.tap(go);
    await c.wait(1300);
    await c.tap(close,420);
    detail.hidden=true;
    await c.wait(250);
    c.say('제출을 끝냈으니 맨 위 할 일의 동그라미를 눌러요.');
    await c.tap($('.t__c',lms[0]),520);
    lms[0].classList.add('is-done');
    await c.wait(1100);
    c.say('체크한 할 일은 잠시 뒤 목록에서 사라져요.');
    await c.wait(500);
    lms[0].classList.add('is-off');lms[0].classList.remove('is-done');tally();
    await c.wait(1100);
    c.say('개인 일정은 ＋ 버튼으로 직접 추가해요.');
    await c.tap(plus);
    add.hidden=false;
    await c.wait(380);
    await c.type(addName,'치과 예약');
    await c.wait(320);
    await c.tap(addOk,440);
    add.hidden=true;
    fresh.classList.remove('is-off');tally();
    c.say('LMS 과제와 내 일정이 한 목록에 마감 순서로 모였어요.');
    await c.wait(1200);
  });
})();

// ---- Planner: pull out a block, name it, pull a task in from 일정 추천 ----
var planner=(function(){
  var host=$('.w--plan'),grid=$('#planGrid'),made=$('#planMade'),madeName=$('b',made),madeTime=$('span',made);
  var card=$('#planCard'),note=$('#planCardNote'),drop=$('#planDrop');
  var ed=$('#planEd'),edName=$('#planEdName'),edTime=$('#planEdTime'),edOk=$('#planEdOk');
  var today=new Date(),ghost=null,from=160,to=250;
  $('#planDay').textContent=(today.getMonth()+1)+'월 '+today.getDate()+'일 ('+'일월화수목금토'[today.getDay()]+')';
  function clock(m){m+=480;return pad(Math.floor(m/60))+':'+pad(m%60)}
  function hour(){return grid.offsetHeight/8}
  function rest(){
    made.style.display='';made.style.setProperty('--l','1.5');made.classList.remove('is-drag');madeName.textContent='도서관 공부';madeTime.textContent='10:40 – 12:10';
    drop.style.display='';note.textContent='시간표에 있어요';card.classList.remove('is-ready');card.style.opacity='';ed.hidden=true;
    if(ghost){ghost.remove();ghost=null}
  }
  function reset(){
    rest();made.style.display='none';madeName.textContent='';drop.style.display='none';note.textContent='1 day · 4 hours 남음';card.classList.add('is-ready');
  }
  function opening(top,name,time){ed.style.top=top+'px';edName.textContent=name;edTime.textContent=time;ed.hidden=false}
  return film(host,$('[data-pane="plan"] [data-cap]'),reset,rest,async function(c){
    function yOf(m){return c.box(grid).y+m/60*hour()}
    var g=c.box(grid),x=g.x+g.w*.56;
    c.place(g.x+g.w*.82,yOf(330));
    c.say('비어 있는 시간을 눌러요.');
    await c.wait(450);
    await c.point(x,yOf(from),760);
    c.press(true);await c.wait(160);
    made.style.display='';made.classList.add('is-drag');
    c.say('누른 채 아래로 끌면 10분 단위로 일정이 늘어나요.');
    // The block follows the pointer in whole 10-minute steps; the pointer itself moves freely.
    await c.tween(1250,function(k){
      var e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,m=from+(to-from)*e,snap=Math.max(from+10,Math.round(m/10)*10);
      made.style.setProperty('--l',((snap-from)/60).toFixed(3));madeTime.textContent=clock(from)+' – '+clock(snap);
      c.place(x,yOf(m));
    });
    c.press(false);made.classList.remove('is-drag');
    await c.wait(240);
    c.say('손을 떼면 창이 열려요. 이름을 적고 확인을 눌러요.');
    opening(yOf(to)+10,'',clock(from)+' – '+clock(to));
    await c.wait(320);
    await c.type(edName,'도서관 공부');
    await c.wait(240);
    await c.tap(edOk,420);
    ed.hidden=true;madeName.textContent='도서관 공부';
    await c.wait(520);
    c.say('일정 추천에는 5일 안에 마감되는 할 일이 모여 있어요.');
    var k=c.box(card);
    await c.point(k.x+k.w*.5,k.y+k.h*.55,820);
    await c.wait(500);
    c.press(true);await c.wait(150);
    c.say('시간표로 끌어다 놓으면 그 시간에 할 일이 잡혀요.');
    ghost=card.cloneNode(true);ghost.removeAttribute('id');ghost.classList.add('p__ghost');
    ghost.style.cssText='left:'+k.x+'px;top:'+k.y+'px;width:'+k.w+'px;transition:transform 1000ms '+MOVE;
    host.appendChild(ghost);card.style.opacity='.35';void ghost.offsetWidth;
    var tx=g.x+g.w*.5,ty=yOf(345);
    ghost.style.transform='translate('+(tx-k.x-k.w*.5)+'px,'+(ty-k.y-k.h*.55)+'px)';
    await c.point(tx,ty,1000);
    c.press(false);ghost.remove();ghost=null;drop.style.display='';card.style.opacity='';card.classList.remove('is-ready');note.textContent='시간표에 있어요';
    if(drop.animate)drop.animate([{opacity:0,transform:'scale(.98)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});
    await c.wait(300);
    opening(yOf(360),'알고리즘 과제 2 제출','13:30 – 15:00');
    await c.wait(520);
    await c.tap(edOk,420);
    ed.hidden=true;
    c.say('오늘 할 일이 시간표 위에 다 놓였어요.');
    await c.wait(900);
  });
})();

// ---- Timer: home, 5:1 focus at speed, the rest that follows, then the plain timers ----
var timer=(function(){
  var host=$('#clock'),screens=$$('.scr',host),ring=$('#ring'),arc=$('#ringOn'),time=$('#ringTime'),cap=$('#ringCap'),steps=$('#ringSteps'),start=$('#ringStart');
  var doorFocus=$('#doorFocus'),doorTimers=$('#doorTimers'),note=$('#doorFocusNote'),tmA=$('#tmA'),tmB=$('#tmB'),tmPlay=$('#tmPlay'),glyph=$('#tmGlyph');
  function show(name){
    var at=screens.findIndex(function(s){return s.dataset.scr===name});
    screens.forEach(function(s,i){s.classList.toggle('is-on',i===at);s.classList.toggle('is-left',i<at)});
  }
  function paint(s,all){time.textContent=mmss(s);arc.style.strokeDashoffset=(100*(1-s/all)).toFixed(2)}
  function rest(){
    show('home');ring.classList.remove('is-burn','is-rest');host.classList.remove('is-shake');paint(1500,1500);
    cap.textContent='시작 전';start.textContent='시작';steps.style.display='';note.textContent='25분 집중 : 5분 휴식';note.classList.remove('is-rest');
    tmA.textContent='03:00';tmB.textContent='42:10';glyph.setAttribute('href','#i-play');
  }
  function spark(k){
    if(!ring.animate)return;
    var i=document.createElement('i'),a=(1-k)*Math.PI*2-Math.PI/2+(Math.random()-.5)*.5,r0=108,r1=128+Math.random()*44;
    i.className='spark';ring.appendChild(i);
    i.animate([
      {transform:'translate('+Math.cos(a)*r0+'px,'+Math.sin(a)*r0+'px) scale(1)',opacity:1},
      {transform:'translate('+Math.cos(a)*r1+'px,'+Math.sin(a)*r1+'px) scale(.2)',opacity:0}
    ],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'}).onfinish=function(){i.remove()};
  }
  rest();
  return film(host,$('[data-pane="focus"] [data-cap]'),rest,rest,async function(c){
    var b=c.box(host);
    c.place(b.w*.78,b.h*.9);
    c.say('타이머 위젯의 홈이에요. 먼저 5:1 집중으로 들어가요.');
    await c.wait(1000);
    await c.tap(doorFocus);
    show('focus');
    await c.wait(360);
    c.say('25분 집중, 5분 휴식을 4세트 반복해요. 시작을 눌러요.');
    await c.wait(1100);
    await c.tap(start);
    c.hide();
    start.textContent='일시정지';steps.style.display='none';cap.textContent='집중 · 1 / 4세트';
    ring.classList.add('is-burn');host.classList.add('is-shake');
    c.say('집중 시작! 25분을 빨리 감아 볼게요.');
    var said=0,last=0;
    await c.tween(3900,function(k){
      var e=k*k*(3-2*k),now=performance.now();
      paint(Math.round(1500*(1-e)),1500);
      if(k>.34&&said<1){said=1;c.say('딴생각 없이 끝까지 몰입하는 25분.')}
      if(k>.72&&said<2){said=2;c.say('거의 다 왔어요, 조금만 더!')}
      if(now-last>55){last=now;spark(1-e);spark(1-e)}
    });
    ring.classList.remove('is-burn');host.classList.remove('is-shake');
    if(ring.animate)ring.animate([{transform:'scale(1)'},{transform:'scale(1.09)'},{transform:'scale(1)'}],{duration:520,easing:'cubic-bezier(.22,1,.36,1)'});
    ring.classList.add('is-rest');paint(300,300);cap.textContent='휴식 · 1 / 4세트';
    c.say('집중이 끝나면 벨이 울리고 5분 휴식이 시작돼요.');
    for(var s=299;s>=297;s--){await c.wait(1000);paint(s,300)}
    var home=$('[data-home]',screens[1]);
    c.say('홈으로 돌아가도 타이머는 계속 흘러요.');
    await c.tap(home);
    show('home');note.textContent='휴식 · 04:56 남음';note.classList.add('is-rest');
    await c.wait(1300);
    c.say('일반 타이머도 볼게요.');
    await c.tap(doorTimers);
    show('timers');
    await c.wait(380);
    c.say('라면, 세탁기처럼 타이머를 이름 붙여 여러 개 맞출 수 있어요.');
    var a=180,d=2530;
    for(var i=0;i<2;i++){await c.wait(1000);tmA.textContent=mmss(--a)}
    await c.tap(tmPlay);
    glyph.setAttribute('href','#i-pause');
    c.say('각각 따로 돌아가요. 위젯을 닫아도 끝나는 시각은 그대로예요.');
    for(var j=0;j<3;j++){await c.wait(1000);tmA.textContent=mmss(--a);tmB.textContent=mmss(--d)}
  });
})();

// ---- Alarms: the planner's alarm pops in, a switch goes on, one rings and is turned off ----
var alarm=(function(){
  var host=$('#alarm'),plan=$('#alPlan'),sw=$('#alSwitch'),pop=$('#alRing'),off=$('#alOff');
  function rest(){plan.style.display='';sw.classList.add('is-on');pop.hidden=true;pop.classList.remove('is-ring');host.classList.remove('is-shake')}
  function reset(){rest();plan.style.display='none';sw.classList.remove('is-on')}
  rest();
  return film(host,$('[data-pane="alarm"] [data-cap]'),reset,rest,async function(c){
    var b=c.box(host);
    c.say('플래너의 도서관 공부에 걸어 둔 알람이에요.');
    await c.wait(800);
    plan.style.display='';
    var h=plan.offsetHeight;
    if(plan.animate)plan.animate([
      {height:'0px',minHeight:'0px',opacity:0,transform:'scale(.6)'},
      {height:h+'px',minHeight:h+'px',opacity:1,transform:'scale(1.07)',offset:.62},
      {height:h+'px',minHeight:h+'px',opacity:1,transform:'scale(.985)',offset:.82},
      {height:h+'px',minHeight:h+'px',transform:'none'}
    ],{duration:560,easing:'cubic-bezier(.22,1,.36,1)'});
    c.say('뿅! 플래너 알람이 이 목록에 저절로 들어와요.');
    await c.wait(1900);
    c.place(b.w*.74,b.h*.86);
    c.say('꺼 둔 매일 오전 9시 알람도 스위치 하나로 켜요.');
    await c.wait(500);
    await c.tap(sw);
    sw.classList.add('is-on');
    await c.wait(1300);
    c.hide();
    c.say('오전 7시 30분, 1교시 수업 알람이 울려요!');
    pop.hidden=false;pop.classList.add('is-ring');host.classList.add('is-shake');
    if(pop.animate)pop.animate([{opacity:0,transform:'scale(.82)'},{opacity:1,transform:'scale(1.04)',offset:.7},{transform:'none'}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'});
    await c.wait(2000);
    c.say('끄기를 누르면 조용해지고, 5분 뒤 다시를 고를 수도 있어요.');
    await c.tap(off,720);
    pop.classList.remove('is-ring');host.classList.remove('is-shake');pop.hidden=true;
    c.say('벨소리는 타이머와 알람을 따로 고를 수 있어요.');
    await c.wait(1100);
  });
})();

// The whole page grows with the window (the rem in site.css); the widgets, set in pixels like the app, follow it.
function ui(){return parseFloat(getComputedStyle(document.documentElement).fontSize)/16}
function scaleUi(){document.documentElement.style.setProperty('--ui',ui().toFixed(3))}
scaleUi();addEventListener('resize',scaleUi);

// The fixed half keeps the widget at a size the window can hold; its film runs while it can be seen.
(function(){
  var stage=$('.stage'),fit=$('.stage__fit'),widget=$('#todo'),cap=$('#todoCap');
  function size(){
    fit.style.setProperty('--fit',1);
    var room=innerHeight-cap.offsetHeight-40;
    fit.style.setProperty('--fit',wide.matches?Math.min(ui(),room/widget.offsetHeight,stage.clientWidth*.86/widget.offsetWidth).toFixed(3):1);
  }
  size();addEventListener('resize',size);
  if(!('IntersectionObserver' in window))return;
  new IntersectionObserver(function(e){if(e[0].isIntersecting)todo.start();else todo.stop()},{threshold:.25}).observe(stage);
})();

// ---- Widgets: the scroll alone walks through them, and each film starts when its turn comes ----
(function(){
  var items=$$('.show__item'),panes=$$('.pane'),count=$('#showCount'),stage=$('.show__stage'),section=$('.show');
  var films={plan:planner,focus:timer,alarm:alarm},showing='';
  var pinned=matchMedia('(min-width: 1001px)');
  function fit(){
    panes.forEach(function(p){
      var el=$('.pane__in',p);
      p.style.setProperty('--fit',1);
      p.style.setProperty('--fit',pinned.matches?Math.min(1.08*ui(),stage.clientWidth/el.offsetWidth,(innerHeight-40)/el.offsetHeight).toFixed(3):1);
    });
  }
  function show(id){
    if(id===showing)return;
    if(showing)films[showing].stop();
    showing=id;
    var at=items.findIndex(function(el){return el.dataset.pane===id});
    items.forEach(function(el,k){el.classList.toggle('is-on',k===at)});
    panes.forEach(function(el,k){el.classList.toggle('is-on',k===at);el.classList.toggle('is-past',k<at)});
    count.textContent=items.length+'개 중 '+(at+1)+'번째';
    setTimeout(function(){if(showing===id)films[id].start()},pinned.matches?340:0);
  }
  fit();addEventListener('resize',fit);addEventListener('load',fit);
  if(!('IntersectionObserver' in window))return;
  // Pinned, the text decides; stacked on a narrow screen, each widget reports for itself.
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting&&e.target.classList.contains('show__item')===pinned.matches)show(e.target.dataset.pane);
    });
  },{rootMargin:'-46% 0px -46% 0px'});
  items.concat(panes).forEach(function(el){io.observe(el)});
  new IntersectionObserver(function(e){
    if(!e[0].isIntersecting&&showing){films[showing].stop();showing=''}
  }).observe(section);
})();

// ---- Install steps: the frame follows the sentence in the middle of the screen ----
(function(){
  var items=$$('.how__item'),frames=$$('.fr'),count=$('#howCount');
  function show(i){
    items.forEach(function(el,k){el.classList.toggle('is-on',k===i)});
    frames.forEach(function(el,k){el.classList.toggle('is-on',k===i)});
    count.textContent=items.length+'단계 중 '+(i+1)+'단계';
  }
  show(0);
  if(!('IntersectionObserver' in window))return;
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting)show(items.indexOf(e.target))});
  },{rootMargin:'-45% 0px -45% 0px'});
  items.forEach(function(el){io.observe(el)});
})();

// ---- Entrances: once, in reading order ----
(function(){
  var els=$$('[data-reveal]');
  els.forEach(function(el){
    var kin=$$(':scope > [data-reveal]',el.parentNode);
    el.style.setProperty('--o',Math.min(kin.indexOf(el),3));
  });
  if(!('IntersectionObserver' in window)){els.forEach(function(el){el.classList.add('is-in')});return}
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting)return;
      io.unobserve(e.target);(e.target.opens||e.target).classList.add('is-in');
    });
  },{rootMargin:'0px 0px -10% 0px'});
  // A closed clip-path also hides the panel from the observer, so a panel is watched through its parent.
  els.forEach(function(el){
    if(el.dataset.reveal==='open'){el.parentNode.opens=el;io.observe(el.parentNode)}else io.observe(el);
  });
})();
})();
