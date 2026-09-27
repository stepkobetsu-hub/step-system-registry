(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const ui = Object.fromEntries(["setup","home","call","device-name","device-id","device-token","save-setup","setup-error","connect","home-message","remote-video","local-video","status","peer-name","notice","incoming","incoming-text","ack","mic","camera","alert","hangup"].map(id => [id, $(id)]));
  const state = { ws:null, peer:null, local:null, remote:null, config:null, session:null, reconnectTimer:null, reconnectAttempts:0, peerTimer:null, pingTimer:null, wakeLock:null, manualStop:false, pendingCall:null, pendingCandidates:[], media:{audio:true,video:true} };

  function show(name){ [ui.setup,ui.home,ui.call].forEach(el=>el.classList.add("hidden")); ui[name].classList.remove("hidden"); }
  function config(){ try{return JSON.parse(localStorage.getItem("step-video-device")||"null");}catch{return null;} }
  function saveConfig(value){ localStorage.setItem("step-video-device",JSON.stringify(value)); }
  function provisionFromHash(){ const params=new URLSearchParams(location.hash.slice(1)); if(params.get("device")&&params.get("token")){saveConfig({deviceId:params.get("device"),token:params.get("token")}); history.replaceState(null,"",location.pathname+location.search); return true;} return false; }
  function setStatus(text,kind=""){ ui.status.textContent=text; ui.call.classList.remove("connected","offline"); if(kind)ui.call.classList.add(kind); }
  function notify(text,ms=4000){ui.notice.textContent=text;ui.notice.classList.remove("hidden");clearTimeout(notify.timer);notify.timer=setTimeout(()=>ui.notice.classList.add("hidden"),ms);}

  async function createSession(){
    const saved=config(); if(!saved)throw new Error("端末の初期設定が必要です");
    const response=await fetch("/api/session",{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${saved.token}`},body:JSON.stringify({deviceId:saved.deviceId})});
    const body=await response.json(); if(!response.ok)throw new Error(body.error||"端末を確認できません"); state.session=body; ui["device-name"].textContent=body.device.name; return body;
  }
  async function openMedia(){
    if(state.local)return;
    state.local=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:{width:{ideal:640,max:854},height:{ideal:360,max:480},frameRate:{ideal:15,max:20},facingMode:"user"}});
    ui["local-video"].srcObject=state.local; applyMediaState();
  }
  function applyMediaState(){ if(!state.local)return; state.local.getAudioTracks().forEach(track=>track.enabled=state.media.audio);state.local.getVideoTracks().forEach(track=>track.enabled=state.media.video);ui.mic.setAttribute("aria-pressed",String(state.media.audio));ui.camera.setAttribute("aria-pressed",String(state.media.video));ui.mic.lastChild.textContent=`マイク ${state.media.audio?"ON":"OFF"}`;ui.camera.lastChild.textContent=`カメラ ${state.media.video?"ON":"OFF"}`; }
  function send(value){if(state.ws?.readyState===WebSocket.OPEN)state.ws.send(JSON.stringify(value));}
  function closePeer(){clearTimeout(state.peerTimer);state.pendingCandidates=[];if(state.peer){state.peer.onicecandidate=null;state.peer.ontrack=null;state.peer.onconnectionstatechange=null;state.peer.close();state.peer=null;}state.remote=null;ui["remote-video"].srcObject=null;}
  function buildPeer(peerId){
    closePeer(); const peer=new RTCPeerConnection({iceServers:state.session.iceServers,iceCandidatePoolSize:2,bundlePolicy:"max-bundle"}); state.peer=peer;
    state.local.getTracks().forEach(track=>peer.addTrack(track,state.local));
    peer.onicecandidate=event=>{if(event.candidate)send({type:"signal",to:peerId,candidate:event.candidate});};
    peer.ontrack=event=>{state.remote=event.streams[0];ui["remote-video"].srcObject=state.remote;};
    peer.onconnectionstatechange=()=>{const value=peer.connectionState;if(value==="connected"){setStatus("接続済み","connected");state.reconnectAttempts=0;}else if(value==="disconnected"){setStatus("再接続中");state.peerTimer=setTimeout(()=>restartPeer(peerId),3500);}else if(value==="failed"){restartPeer(peerId);}else if(value==="closed"){setStatus("相手不在","offline");}};
    return peer;
  }
  async function callPeer(peerId){const peer=buildPeer(peerId);const offer=await peer.createOffer();await peer.setLocalDescription(offer);send({type:"signal",to:peerId,description:peer.localDescription});}
  async function restartPeer(peerId){if(state.manualStop)return;setStatus("再接続中");try{await callPeer(peerId);}catch{scheduleReconnect();}}
  async function onSignal(message){
    try{
      let peer=state.peer;
      if(message.description){
        if(message.description.type==="offer"){peer=buildPeer(message.from);await peer.setRemoteDescription(message.description);for(const candidate of state.pendingCandidates.splice(0))await peer.addIceCandidate(candidate);const answer=await peer.createAnswer();await peer.setLocalDescription(answer);send({type:"signal",to:message.from,description:peer.localDescription});}
        else if(message.description.type==="answer"&&peer){await peer.setRemoteDescription(message.description);for(const candidate of state.pendingCandidates.splice(0))await peer.addIceCandidate(candidate);}
      } else if(message.candidate&&peer){if(peer.remoteDescription)await peer.addIceCandidate(message.candidate);else state.pendingCandidates.push(message.candidate);}
    }catch(error){console.error("signal",error);setStatus("再接続中");setTimeout(()=>restartPeer(message.from),1200);}
  }
  function onPresence(peers){
    const peer=peers[0]; if(!peer){ui["peer-name"].textContent="相手教室";setStatus("相手不在","offline");closePeer();return;}
    ui["peer-name"].textContent=peer.name;
    if(!state.peer&&state.session.device.id.localeCompare(peer.id)<0)callPeer(peer.id).catch(()=>scheduleReconnect());
  }
  function connectSocket(){
    if(state.manualStop)return;const scheme=location.protocol==="https:"?"wss:":"ws:";const ws=new WebSocket(`${scheme}//${location.host}/api/ws?ticket=${encodeURIComponent(state.session.ticket)}`);state.ws=ws;
    ws.onopen=()=>{state.reconnectAttempts=0;setStatus("相手を待っています");clearInterval(state.pingTimer);state.pingTimer=setInterval(()=>send({type:"ping"}),25000);};
    ws.onmessage=event=>{let message;try{message=JSON.parse(event.data);}catch{return;}if(message.type==="welcome"||message.type==="presence")onPresence(message.peers||[]);else if(message.type==="signal")onSignal(message);else if(message.type==="call")incomingCall(message);else if(message.type==="ack")notify(`${message.by.name}が確認しました`,6500);else if(message.type==="cooldown")notify("10秒待ってから呼び出してください");};
    ws.onclose=()=>{clearInterval(state.pingTimer);closePeer();if(!state.manualStop){setStatus(navigator.onLine?"再接続中":"ネットワーク待機中","offline");scheduleReconnect();}};
    ws.onerror=()=>ws.close();
  }
  function scheduleReconnect(){if(state.manualStop||state.reconnectTimer)return;const delay=Math.min(15000,1000*2**Math.min(state.reconnectAttempts++,4))+crypto.getRandomValues(new Uint16Array(1))[0]%800;state.reconnectTimer=setTimeout(async()=>{state.reconnectTimer=null;try{if(!state.session||state.session.expiresAt-Date.now()<60000)await createSession();connectSocket();}catch{scheduleReconnect();}},delay);}
  async function start(){
    state.manualStop=false;show("call");setStatus("カメラを準備中");try{await createSession();await openMedia();await requestWakeLock();connectSocket();}catch(error){state.manualStop=true;show("home");ui["home-message"].textContent=error.name==="NotAllowedError"?"カメラとマイクを許可してください":error.message;}
  }
  function stop(){state.manualStop=true;clearTimeout(state.reconnectTimer);clearInterval(state.pingTimer);state.ws?.close();closePeer();state.local?.getTracks().forEach(track=>track.stop());state.local=null;state.wakeLock?.release();state.wakeLock=null;show("home");}
  async function requestWakeLock(){try{if("wakeLock" in navigator)state.wakeLock=await navigator.wakeLock.request("screen");}catch{} }
  function playChime(){const AudioContext=window.AudioContext||window.webkitAudioContext;const context=new AudioContext();[0,.7,1.4,2.1,2.8].forEach(start=>[659.25,783.99].forEach((frequency,index)=>{const osc=context.createOscillator(),gain=context.createGain();osc.frequency.value=frequency;osc.type="sine";gain.gain.setValueAtTime(0.0001,context.currentTime+start+index*.14);gain.gain.exponentialRampToValueAtTime(.12,context.currentTime+start+index*.14+.04);gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+start+index*.14+.45);osc.connect(gain).connect(context.destination);osc.start(context.currentTime+start+index*.14);osc.stop(context.currentTime+start+index*.14+.5);}));setTimeout(()=>context.close(),4000);}
  function incomingCall(message){state.pendingCall=message.callId;ui["incoming-text"].textContent=`${message.from.name}から呼び出しです`;ui.incoming.classList.remove("hidden");playChime();setTimeout(()=>{if(state.pendingCall===message.callId){state.pendingCall=null;ui.incoming.classList.add("hidden");}},8000);}
  function bind(){
    ui["save-setup"].onclick=async()=>{const value={deviceId:ui["device-id"].value.trim(),token:ui["device-token"].value.trim()};saveConfig(value);try{await createSession();show("home");ui["home-message"].textContent="1回押すだけで相手教室につながります";}catch(error){localStorage.removeItem("step-video-device");ui["setup-error"].textContent=error.message;}};
    ui.connect.onclick=start;ui.hangup.onclick=stop;
    ui.mic.onclick=()=>{state.media.audio=!state.media.audio;applyMediaState();};ui.camera.onclick=()=>{state.media.video=!state.media.video;applyMediaState();};
    ui.alert.onclick=()=>{if(ui.alert.disabled)return;ui.alert.disabled=true;send({type:"call",callId:crypto.randomUUID()});notify("相手を呼び出しました");setTimeout(()=>ui.alert.disabled=false,10000);};
    ui.ack.onclick=()=>{if(state.pendingCall)send({type:"ack",callId:state.pendingCall});state.pendingCall=null;ui.incoming.classList.add("hidden");};
    window.addEventListener("online",()=>{if(!state.manualStop)scheduleReconnect();});window.addEventListener("offline",()=>setStatus("ネットワーク待機中","offline"));document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&!state.manualStop){requestWakeLock();if(!state.ws||state.ws.readyState>1)scheduleReconnect();}});
  }
  async function init(){provisionFromHash();bind();if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js");if(location.search.includes("setup=1")){show("setup");return;}try{await createSession();show("home");}catch{show("setup");}}
  init();
})();
