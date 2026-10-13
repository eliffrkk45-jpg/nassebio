const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const storeKey = "nasse-biology-progress-v1";
let progress = {xp:0, completed:[]};
try { progress = {...progress, ...JSON.parse(localStorage.getItem(storeKey) || "{}")}; } catch {}
const save = () => { localStorage.setItem(storeKey, JSON.stringify(progress)); updateStats(); };
function updateStats(){
  $("#xpStat").textContent = progress.xp;
  $("#doneStat").textContent = `${progress.completed.length}/5`;
  $("#levelBadge").textContent = `LVL ${String(Math.floor(progress.xp/100)+1).padStart(2,"0")}`;
}
updateStats();

const modal = $("#gameModal"), content = $("#gameContent");
let activeGame = "", awardOnce = false;
const receptorPairs = [
  ["Bir kokunun moleküllerini algılama","Kemoreseptör"],
  ["Deride basınç ve titreşimi algılama","Mekanoreseptör"],
  ["Sıcak bir yüzeye temas etme","Termoreseptör"],
  ["Dokuya zarar verebilecek uyaranı algılama","Ağrı reseptörü"],
  ["Işığı algılama","Fotoreseptör"]
];
const quizQuestions = [
  {q:"Merkezi sinir sisteminde miyelin kılıfı oluşturan glia hücresi hangisidir?",a:["Schwann hücresi","Oligodendrosit","Mikroglia","Ara nöron"],c:1,why:"Oligodendrositler merkezi sinir sisteminde, Schwann hücreleri çevresel sinir sisteminde miyelin oluşturur."},
  {q:"Duyu nöronunun temel görevi nedir?",a:["Merkezi sinir sisteminden kasa komut taşımak","Bilgiyi merkezi sinir sistemine taşımak","Nörotransmitter üretimini durdurmak","Miyelin kılıfı parçalamak"],c:1,why:"Duyu nöronları reseptörlerden gelen bilgiyi merkezi sinir sistemine taşır."},
  {q:"Tipik bir nöron aksiyon potansiyelinin depolarizasyon evresinde hangi iyonun hücre içine girişi önemlidir?",a:["Na⁺","K⁺","Ca²⁺ her durumda tek başına","Cl⁻"],c:0,why:"Voltaj kapılı sodyum kanallarının açılması Na⁺ girişine ve hızlı depolarizasyona katkı sağlar."},
  {q:"Kimyasal sinapsta sinyali hücreler arasında taşıyan maddelere ne denir?",a:["Antikor","Nörotransmitter","Glikojen","Miyelin"],c:1,why:"Nörotransmitterler sinaptik aralığı geçerek hedef hücrenin reseptörlerine bağlanabilir."},
  {q:"Çevresel sinir sisteminde miyelin oluşturmaya yardımcı olan hücre hangisidir?",a:["Mikroglia","Oligodendrosit","Schwann hücresi","Fotoreseptör"],c:2,why:"Schwann hücreleri çevresel sinir sistemindeki aksonların miyelinlenmesinde görev alır."}
];
const wordRiddles = [
  {q:"Işığı algılayan reseptörün adı nedir?",a:["fotoreseptör","foto reseptör"]},
  {q:"Nöronlar arasında kimyasal sinyal taşıyabilen maddelerin genel adı nedir?",a:["nörotransmitter","nörotransmitterler"]},
  {q:"Merkezi sinir sisteminde bağışıklık gözetiminde görevli glia hücresi hangisidir?",a:["mikroglia"]}
];
const titles = {match:["RESEPTÖR AVI","Eşleştirme görevi"],quiz:["SİNİR SİSTEMİ SPRINTİ","Hızlı tur"],write:["BİLGİYİ ÇÖZ","Kelime kodu"],neuron:["NÖRON ATÖLYESİ","Tasarım modu"],signal:["İMPULS SİMÜLATÖRÜ","Sinyal laboratuvarı"]};
function openGame(type){
  activeGame=type; awardOnce=false; modal.hidden=false; document.body.style.overflow="hidden";
  $("#gameEyebrow").textContent=titles[type][1].toUpperCase();
  $("#gameTitle").textContent=titles[type][0];
  if(type==="match") renderMatch(); if(type==="quiz") renderQuiz(); if(type==="write") renderWrite(); if(type==="neuron") renderNeuron(); if(type==="signal") renderSignal();
}
function closeGame(){modal.hidden=true;document.body.style.overflow="";activeGame="";}
$("#closeModal").addEventListener("click",closeGame);
modal.addEventListener("click",e=>{if(e.target===modal)closeGame()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)closeGame()});
$$("[data-game]").forEach(el=>el.addEventListener("click",()=>openGame(el.dataset.game)));
function award(game, points, message="Görev tamamlandı!"){
  if(awardOnce) return; awardOnce=true;
  if(!progress.completed.includes(game)) progress.completed.push(game);
  progress.xp += points; save(); toast(`${message} +${points} XP`);
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function finishBlock(points, text){return `<div class="result-panel"><strong>+${points} XP</strong><p>${text}</p><button class="game-btn" id="finishClose">Haritaya dön ↗</button></div>`}
function hookFinish(){const b=$("#finishClose");if(b)b.addEventListener("click",closeGame)}
function renderMatch(){
 content.innerHTML=`<p class="game-intro">Her tanımı doğru reseptörle eşleştir. Hepsini bitirince puanını göreceksin.</p><div class="game-progress"><span style="width:0%" id="gameProgress"></span></div><div class="match-list" id="matchList"></div><div class="feedback" id="feedback"></div><div class="game-actions"><button class="game-btn" id="checkMatch">Cevapları kontrol et</button></div>`;
 const list=$("#matchList"); const shuffled=[...receptorPairs].sort(()=>Math.random()-.5);
 const options=["Kemoreseptör","Mekanoreseptör","Termoreseptör","Ağrı reseptörü","Fotoreseptör"];
 shuffled.forEach((p,i)=>{list.insertAdjacentHTML("beforeend",`<div class="match-row"><p>${i+1}. ${p[0]}</p><select aria-label="Reseptör seçimi" data-answer="${p[1]}"><option value="">Reseptör seç...</option>${options.map(o=>`<option>${o}</option>`).join("")}</select></div>`)});
 $("#checkMatch").onclick=()=>{
  const sels=$$("select",list);let correct=0;sels.forEach(s=>{if(s.value===s.dataset.answer){correct++;s.style.borderColor="#4df2c2"}else{s.style.borderColor="#ff7c92"}});
  $("#gameProgress").style.width=`${correct/5*100}%`;
  $("#feedback").textContent=`${correct}/5 doğru. ${correct===5?"Harika! Tüm reseptörleri buldun.":"Yanlış olan seçimleri değiştirip tekrar deneyebilirsin."}`;
  $("#feedback").className=correct===5?"feedback":"feedback error";
  if(correct===5){award("match",30,"Reseptör avı tamamlandı!");$("#checkMatch").disabled=true;$("#checkMatch").insertAdjacentHTML("afterend",finishBlock(30,"Reseptörleri doğru uyaranlarla eşleştirdin."));hookFinish()}
 };
}
function renderQuiz(){
 let idx=0, score=0, locked=false;
 function draw(){
  if(idx>=quizQuestions.length){content.innerHTML=`<p class="game-intro">Sprint tamamlandı.</p>${finishBlock(score*10,`${quizQuestions.length} sorudan ${score} tanesini doğru cevapladın. ${score>=4?"Sinir sistemi hızın harika!":"Bir tur daha deneyerek puanını artırabilirsin."}`)}`;award("quiz",score*10,"Sprint tamamlandı!");hookFinish();return}
  locked=false;const item=quizQuestions[idx];
  content.innerHTML=`<p class="game-intro">Soru ${idx+1} / ${quizQuestions.length} · Doğru cevap başına 10 XP</p><div class="game-progress"><span style="width:${idx/quizQuestions.length*100}%"></span></div><div class="game-question">${item.q}</div><div class="choice-grid">${item.a.map((a,i)=>`<button class="game-btn" data-choice="${i}">${a}</button>`).join("")}</div><div class="feedback" id="feedback"></div><div class="game-actions"><button class="game-btn" id="nextQuestion" disabled>${idx===quizQuestions.length-1?"Sonucu gör":"Sonraki soru →"}</button></div>`;
  $$("[data-choice]").forEach(b=>b.onclick=()=>{if(locked)return;locked=true;const correct=Number(b.dataset.choice)===item.c;if(correct)score++;$$("[data-choice]").forEach(btn=>{btn.disabled=true;if(Number(btn.dataset.choice)===item.c)btn.classList.add("correct")});if(!correct)b.classList.add("wrong");$("#feedback").textContent=(correct?"Doğru! ":"Bir dahaki sefere. ")+item.why;$("#feedback").className=correct?"feedback":"feedback error";$("#nextQuestion").disabled=false});
  $("#nextQuestion").onclick=()=>{idx++;draw()};
 }
 draw();
}
function renderWrite(){
 let idx=0,score=0;
 function draw(){
  if(idx>=wordRiddles.length){content.innerHTML=`<p class="game-intro">Kelime kodu çözüldü.</p>${finishBlock(score*15,`${wordRiddles.length} bilmeceden ${score} tanesini doğru çözdün.`)}`;award("write",score*15,"Kelime kodu tamamlandı!");hookFinish();return}
  const r=wordRiddles[idx];
  content.innerHTML=`<p class="game-intro">Bilmece ${idx+1} / ${wordRiddles.length}</p><div class="game-progress"><span style="width:${idx/wordRiddles.length*100}%"></span></div><div class="game-question">${r.q}</div><form id="answerForm"><input class="answer-input" id="wordAnswer" autocomplete="off" placeholder="Cevabını buraya yaz..." aria-label="Cevabın"><div class="game-actions"><button class="game-btn" type="submit">Cevabı kontrol et</button></div></form><div class="feedback" id="feedback"></div>`;
  $("#answerForm").onsubmit=e=>{e.preventDefault();const ans=$("#wordAnswer").value.trim().toLocaleLowerCase("tr").replace(/[ıİ]/g,"i").replace(/[^a-zçğıöşü]/g,"");const correct=r.a.some(a=>a.toLocaleLowerCase("tr").replace(/[ıİ]/g,"i").replace(/[^a-zçğıöşü]/g,"")===ans);if(correct){score++;$("#feedback").textContent="Doğru cevap!";$("#feedback").className="feedback"}else{$("#feedback").textContent=`Tekrar dene. İpucu: ${r.q.includes("Işığı")?"Görme ile ilgili, “foto” ile başlıyor.":r.q.includes("kimyasal")?"Sinapslarda haberci görev yapar.":"Adı “mikro” ile başlıyor."}`;$("#feedback").className="feedback error";return}
  const f=$("#answerForm");f.innerHTML=`<div class="game-actions"><button class="game-btn" type="button" id="nextWord">Sonraki bilmece →</button></div>`;$("#nextWord").onclick=()=>{idx++;draw()};};
 }
 draw();
}
function renderNeuron(){
 content.innerHTML=`<p class="game-intro">Nöron tasarımını özelleştir. Seçimlerin, kurduğun nöronun özelliklerini açıklayacak.</p><div class="designer"><div class="designer-visual"><div class="cell-body"></div><i class="dendrite d1"></i><i class="dendrite d2"></i><i class="dendrite d3"></i><i class="axon-line"></i><i class="myelin m1"></i><i class="myelin m2"></i><i class="myelin m3"></i><i class="terminal"></i></div><div class="design-controls"><label>Nöron türü<select class="design-select" id="neuronType"><option>Duyu nöronu</option><option>Ara nöron</option><option>Motor nöron</option></select></label><label>Miyelin durumu<select class="design-select" id="myelinType"><option value="yes">Miyelinli</option><option value="no">Miyelinsiz</option></select></label><label>Destek hücresi<select class="design-select" id="gliaType"><option>Schwann hücresi</option><option>Oligodendrosit</option><option>Mikroglia</option></select></label><button class="game-btn" id="buildNeuron">Nöronumu oluştur ✦</button></div></div><div class="feedback" id="feedback"></div>`;
 $("#myelinType").onchange=()=>{$$(".myelin",$(".designer-visual")).forEach(m=>m.style.opacity=$("#myelinType").value==="yes"?"1":"0")};
 $("#buildNeuron").onclick=()=>{const type=$("#neuronType").value,my=$("#myelinType").value,glia=$("#gliaType").value;let explain=`${type}, sinir sisteminde belirli bir iletim görevi üstlenir. `;explain+=my==="yes"?"Miyelin kılıf, uygun aksonlarda iletimi hızlandırır. ":"Miyelinsiz aksonlarda miyelin kılıf bulunmaz. ";explain+=glia==="Schwann hücresi"?"Schwann hücreleri çevresel sinir sisteminde miyelin oluşturabilir.":glia==="Oligodendrosit"?"Oligodendrositler merkezi sinir sisteminde miyelin oluşturur.":"Mikroglia, merkezi sinir sisteminde bağışıklık gözetiminde görev alır.";$("#feedback").textContent=explain;award("neuron",25,"Nöron tasarımın kaydedildi!")};
}
function renderSignal(){
 const stages=[{name:"Polarizasyon",icon:"◉",desc:"Dinlenim durumunda zarın iki tarafı arasında potansiyel farkı vardır. Nöron uyarılmaya hazır durumdadır."},{name:"Depolarizasyon",icon:"↗",desc:"Eşik değere ulaşıldığında tipik aksiyon potansiyelinde voltaj kapılı Na⁺ kanalları açılır ve Na⁺ hücre içine girer."},{name:"Repolarizasyon",icon:"↘",desc:"Na⁺ kanallarının inaktivasyonu ve K⁺ çıkışı zar potansiyelinin dinlenim değerine dönmesine katkı sağlar."}];
 content.innerHTML=`<p class="game-intro">Aşamaları sırayla seç. Her kart zar potansiyelinin bir evresini açıklar.</p><div class="signal-stages">${stages.map((s,i)=>`<button class="signal-stage" data-stage="${i}"><span>${s.icon}</span>${s.name}</button>`).join("")}</div><div class="game-progress"><span id="signalProgress" style="width:0%"></span></div><div class="game-question" id="stageName">Bir aşama seç.</div><p class="game-intro" id="stageDesc">Kartlardan birine dokunarak açıklamayı gör.</p><div class="feedback" id="signalFeedback"></div><div class="game-actions"><button class="game-btn" id="signalCheck">Sırayı kontrol et</button></div>`;
 let selected=[];
 $$("[data-stage]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.stage);if(!selected.includes(n)){selected.push(n);b.classList.add("active");$("#signalProgress").style.width=`${selected.length/3*100}%`}$("#stageName").textContent=stages[n].name;$("#stageDesc").textContent=stages[n].desc;$("#signalFeedback").textContent=`Seçilen aşama sayısı: ${selected.length}/3`});
 $("#signalCheck").onclick=()=>{if(selected.length!==3){$("#signalFeedback").textContent="Önce üç aşamanın tamamını seç.";$("#signalFeedback").className="feedback error";return}const correct=selected.every((n,i)=>n===i);if(correct){$("#signalFeedback").textContent="Sıralama doğru! Polarizasyon → Depolarizasyon → Repolarizasyon";$("#signalFeedback").className="feedback";award("signal",30,"Sinyal laboratuvarı tamamlandı!");$("#signalCheck").disabled=true;$("#signalCheck").insertAdjacentHTML("afterend",finishBlock(30,"Zar potansiyelinin temel aşamalarını doğru sıraladın."));hookFinish()}else{$("#signalFeedback").textContent="Sıralama doğru değil. Kartları sırayla seçmek için sıfırla ve tekrar dene.";$("#signalFeedback").className="feedback error";const reset=document.createElement("button");reset.className="game-btn";reset.textContent="Sıfırla";reset.onclick=renderSignal;$("#signalCheck").after(reset)}};
}
