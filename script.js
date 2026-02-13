// ===== CONFIG FIREBASE - datele tale =====
const firebaseConfig = {
  apiKey: "AIzaSyCLJDyC8iLxQjsK6VrrMOtzj5ukfmuARC8",
  authDomain: "spanzuratoarea-online.firebaseapp.com",
  databaseURL:
    "https://spanzuratoarea-online-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "spanzuratoarea-online",
  storageBucket: "spanzuratoarea-online.firebasestorage.app",
  messagingSenderId: "698255636308",
  appId: "1:698255636308:web:225201554f9fadd634bac1",
  measurementId: "G-MNBDW17ZL3",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const DEFAULT_NOTIFICATION_MS = 3500;

// ===== STATE =====
const HIDDEN_CHAR = "_";

let myId = null;
let myName = "";
let myRole = null; // host/guest (rol de party)
let partyCode = null;
let currentRoom = null;

let lengths = [];
let revealed = [];
let wrongGuesses = 0;
let maxWrong = 7;
let gameOver = false;

let activeRoomRef = null;
let activeRoomListener = null;

let searchActive = false;
let searchOwnedRoomCode = null;
let globalRoomsRef = null;
let globalRoomsListener = null;
let searchTimerInterval = null;
let searchStartedAt = 0;
let lastHandledResultRound = 0;
let lastBannerKey = "";
let lastSeenRoundNumber = 0;
let centerBannerTimeout = null;
let screenNotificationTimeout = null;
let fireworksTimeout = null;
let fireworksRaf = null;
let leaderboardRef = null;
let leaderboardListener = null;
let socialLinksRef = null;
let socialLinksListener = null;

// ===== DOM =====
const partyScreen = document.getElementById("party-screen");
const gameScreen = document.getElementById("game-screen");

const playerNameInput = document.getElementById("player-name-input");
const createPartyBtn = document.getElementById("create-party-btn");
const joinPartyBtn = document.getElementById("join-party-btn");
const onlineSearchBtn = document.getElementById("online-search-btn");
const cancelSearchBtn = document.getElementById("cancel-search-btn");

const createPartyPanel = document.getElementById("create-party-panel");
const joinPartyPanel = document.getElementById("join-party-panel");
const onlineSearchPanel = document.getElementById("online-search-panel");
const onlineSearchStatus = document.getElementById("online-search-status");
const onlinePlayersLive = document.getElementById("online-players-live");
const scoreboardEl = document.getElementById("scoreboard");
const leaderboardList = document.getElementById("leaderboard-list");

const partyCodeDisplay = document.getElementById("party-code-display");
const copyCodeBtn = document.getElementById("copy-code-btn");
const partyPlayersList = document.getElementById("party-players-list");
const slotPlayer1 = document.getElementById("slot-player-1");
const slotPlayer2 = document.getElementById("slot-player-2");
const lobbyRoundInfo = document.getElementById("lobby-round-info");

const joinCodeInput = document.getElementById("join-code-input");
const joinCodeConfirmBtn = document.getElementById("join-code-confirm-btn");

const partyStatus = document.getElementById("party-status");

const secretWordInput = document.getElementById("secret-word-input");
const startGameBtn = document.getElementById("start-game-btn");

const gamePartyCodeEl = document.getElementById("game-party-code");
const gamePlayersList = document.getElementById("game-players-list");
const wrongCountSpan = document.getElementById("wrong-count");
const maxWrongSpan = document.getElementById("max-wrong");
const wordDisplay = document.getElementById("word-display");
const turnInfo = document.getElementById("turn-info");

const letterInput = document.getElementById("letter-input");
const guessBtn = document.getElementById("guess-btn");
const keyboard = document.getElementById("keyboard");
const gameMessage = document.getElementById("game-message");
const centerBanner = document.getElementById("center-banner");
const screenNotification = document.getElementById("screen-notification");
const screenNotificationText = document.getElementById("screen-notification-text");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendChatBtn = document.getElementById("send-chat-btn");
const fireworksCanvas = document.getElementById("fireworks-canvas");
const socialFacebook = document.getElementById("social-facebook");
const socialInstagram = document.getElementById("social-instagram");
const socialTikTok = document.getElementById("social-tiktok");
const socialYouTube = document.getElementById("social-youtube");
const socialDiscord = document.getElementById("social-discord");

// ===== Utilitare =====
function showScreen(screen) {
  [partyScreen, gameScreen].forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

function randomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function randomPartyCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function normalizeLetter(ch) {
  const map = {
    ă: "a",
    â: "a",
    î: "i",
    ș: "s",
    ş: "s",
    ț: "t",
    ţ: "t",
  };
  ch = (ch || "").toLowerCase();
  return map[ch] || ch;
}

function getPlayerNameById(playersObj, id) {
  if (!playersObj || !id) return "-";
  return playersObj[id]?.name || "-";
}

function getOrderedPlayers(playersObj) {
  const players = Object.values(playersObj || {});
  return players.sort((a, b) => {
    if (a.role === "host" && b.role !== "host") return -1;
    if (a.role !== "host" && b.role === "host") return 1;
    return a.name.localeCompare(b.name, "ro");
  });
}

function setGameMessage(text, type = "") {
  gameMessage.textContent = text || "";
  gameMessage.classList.remove("win", "lose");
  if (type) gameMessage.classList.add(type);
}

function formatElapsed(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function showCenterBanner(text, duration = DEFAULT_NOTIFICATION_MS) {
  if (!text) {
    if (centerBannerTimeout) {
      clearTimeout(centerBannerTimeout);
      centerBannerTimeout = null;
    }
    centerBanner.classList.add("hidden");
    centerBanner.classList.remove("animate-pop");
    centerBanner.textContent = "";
    lastBannerKey = "";
    return;
  }

  if (lastBannerKey === text) return;
  lastBannerKey = text;
  centerBanner.textContent = text;
  centerBanner.classList.remove("hidden");
  centerBanner.classList.remove("animate-pop");
  void centerBanner.offsetWidth;
  centerBanner.classList.add("animate-pop");

  if (centerBannerTimeout) {
    clearTimeout(centerBannerTimeout);
  }
  centerBannerTimeout = window.setTimeout(() => {
    centerBanner.classList.add("hidden");
    centerBanner.classList.remove("animate-pop");
  }, duration);
}

function showScreenNotification(text, type = "", duration = DEFAULT_NOTIFICATION_MS) {
  if (!text) return;

  if (screenNotificationTimeout) {
    clearTimeout(screenNotificationTimeout);
    screenNotificationTimeout = null;
  }

  screenNotificationText.textContent = text;
  screenNotification.classList.remove("hidden", "win", "lose");
  screenNotification.classList.remove("animate-pop");
  void screenNotification.offsetWidth;
  screenNotification.classList.add("animate-pop");
  if (type) screenNotification.classList.add(type);

  screenNotificationTimeout = window.setTimeout(() => {
    screenNotification.classList.add("hidden");
    screenNotification.classList.remove("win", "lose", "animate-pop");
    screenNotificationText.textContent = "";
  }, duration);
}

function startFireworks() {
  const canvas = fireworksCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (fireworksTimeout) {
    clearTimeout(fireworksTimeout);
    fireworksTimeout = null;
  }
  if (fireworksRaf) {
    cancelAnimationFrame(fireworksRaf);
    fireworksRaf = null;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.classList.remove("hidden");

  const particles = [];
  for (let burst = 0; burst < 5; burst++) {
    const cx = Math.random() * canvas.width;
    const cy = canvas.height * (0.2 + Math.random() * 0.45);
    for (let i = 0; i < 36; i++) {
      const angle = (Math.PI * 2 * i) / 36;
      const speed = 1.8 + Math.random() * 3.3;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        size: 2 + Math.random() * 2.5,
        color: `hsl(${Math.floor(Math.random() * 360)}, 95%, 65%)`,
      });
    }
  }

  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.alpha -= 0.013;
      if (p.alpha <= 0) continue;

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (particles.some((p) => p.alpha > 0)) {
      fireworksRaf = requestAnimationFrame(tick);
    }
  };

  tick();

  fireworksTimeout = setTimeout(() => {
    if (fireworksRaf) {
      cancelAnimationFrame(fireworksRaf);
      fireworksRaf = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.add("hidden");
  }, DEFAULT_NOTIFICATION_MS);
}

function renderChat(room) {
  if (!chatMessages) return;
  const raw = room.chatMessages || {};
  const items = Object.values(raw)
    .sort((a, b) => (a?.createdAt || 0) - (b?.createdAt || 0))
    .slice(-60);

  chatMessages.innerHTML = "";
  for (const msg of items) {
    const line = document.createElement("div");
    line.className = "chat-line";

    const sender = document.createElement("span");
    sender.className = "sender";
    sender.textContent = (msg?.senderName || "Anon") + ": ";

    const text = document.createElement("span");
    text.textContent = msg?.text || "";

    line.appendChild(sender);
    line.appendChild(text);
    chatMessages.appendChild(line);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage() {
  const text = (chatInput?.value || "").trim();
  if (!text || !partyCode || !myId) return;

  const messageRef = db.ref(`rooms/${partyCode}/chatMessages`).push();
  await messageRef.set({
    senderId: myId,
    senderName: myName || "Anon",
    text,
    createdAt: firebase.database.ServerValue.TIMESTAMP,
  });

  chatInput.value = "";
  chatInput.focus();
}

function renderLeaderboard(entriesObj) {
  if (!leaderboardList) return;
  const entries = Object.values(entriesObj || {})
    .sort((a, b) => (b?.score || 0) - (a?.score || 0))
    .slice(0, 10);

  leaderboardList.innerHTML = "";
  if (!entries.length) {
    const li = document.createElement("li");
    li.textContent = "Fără scoruri încă.";
    leaderboardList.appendChild(li);
    return;
  }

  entries.forEach((item, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${item.name || "Anon"} — ${item.score || 0}`;
    leaderboardList.appendChild(li);
  });
}

function subscribeLeaderboard() {
  if (leaderboardRef && leaderboardListener) {
    leaderboardRef.off("value", leaderboardListener);
  }

  leaderboardRef = db.ref("leaderboard");
  leaderboardListener = (snap) => {
    renderLeaderboard(snap.val() || {});
  };
  leaderboardRef.on("value", leaderboardListener);
}

async function incrementLeaderboard(winnerId, winnerName) {
  if (!winnerId) return;
  const ref = db.ref(`leaderboard/${winnerId}`);
  await ref.transaction((item) => {
    return {
      id: winnerId,
      name: winnerName || item?.name || "Anon",
      score: (item?.score || 0) + 1,
    };
  });
}

function applySocialAnchor(anchor, url) {
  if (!anchor) return;
  const value = (url || "").trim();
  if (/^https?:\/\//i.test(value)) {
    anchor.href = value;
    anchor.classList.remove("disabled");
    anchor.title = value;
  } else {
    anchor.href = "#";
    anchor.classList.add("disabled");
    anchor.title = "Adaugă link în Firebase";
  }
}

function subscribeSocialLinks() {
  if (socialLinksRef && socialLinksListener) {
    socialLinksRef.off("value", socialLinksListener);
  }

  socialLinksRef = db.ref("socialLinks");
  socialLinksListener = (snap) => {
    const links = snap.val() || {};
    applySocialAnchor(socialFacebook, links.facebook || "");
    applySocialAnchor(socialInstagram, links.instagram || "");
    applySocialAnchor(socialTikTok, links.tiktok || "");
    applySocialAnchor(socialYouTube, links.youtube || "");
    applySocialAnchor(socialDiscord, links.discord || "");
  };

  socialLinksRef.on("value", socialLinksListener);
}

function renderScoreboard(room) {
  if (!scoreboardEl) return;

  const ordered = getOrderedPlayers(room.players || {});
  const scores = room.scores || {};

  if (!ordered.length) {
    scoreboardEl.textContent = "Scor: -";
    return;
  }

  if (ordered.length === 1) {
    const p = ordered[0];
    scoreboardEl.textContent = `Scor: ${p.name} ${scores[p.id] || 0}`;
    return;
  }

  const p1 = ordered[0];
  const p2 = ordered[1];
  scoreboardEl.textContent = `Scor: ${p1.name} ${scores[p1.id] || 0} - ${scores[p2.id] || 0} ${p2.name}`;
}

function startSearchTimer() {
  if (searchTimerInterval) {
    clearInterval(searchTimerInterval);
    searchTimerInterval = null;
  }

  searchStartedAt = Date.now();
  const tick = () => {
    const elapsed = Math.floor((Date.now() - searchStartedAt) / 1000);
    onlineSearchStatus.textContent = `Căutăm jucător... ${formatElapsed(elapsed)}`;
  };

  tick();
  searchTimerInterval = setInterval(tick, 1000);
}

function stopSearchTimer() {
  if (searchTimerInterval) {
    clearInterval(searchTimerInterval);
    searchTimerInterval = null;
  }
}

function buildKeyboard() {
  keyboard.innerHTML = "";
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const ch of letters) {
    const btn = document.createElement("button");
    btn.className = "key-btn";
    btn.textContent = ch;
    btn.dataset.letter = ch;
    btn.addEventListener("click", () => sendGuess(ch));
    keyboard.appendChild(btn);
  }
}

function disableKeyboard() {
  keyboard.querySelectorAll("button").forEach((b) => (b.disabled = true));
}

function renderPlayersList(listEl, playersObj) {
  listEl.innerHTML = "";
  const ordered = getOrderedPlayers(playersObj);
  ordered.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p.name + (p.role === "host" ? " (Host)" : "");
    listEl.appendChild(li);
  });
}

function renderPartySlots(playersObj) {
  const ordered = getOrderedPlayers(playersObj);
  slotPlayer1.textContent = ordered[0]
    ? `Persoana 1: ${ordered[0].name}`
    : "Persoana 1: -";
  slotPlayer2.textContent = ordered[1]
    ? `Persoana 2: ${ordered[1].name}`
    : "Persoana 2: waiting...";
}

function renderWord() {
  wordDisplay.innerHTML = "";
  lengths.forEach((type, idx) => {
    const slot = document.createElement("div");
    if (type === "space") {
      slot.className = "letter-slot space";
      slot.textContent = "";
    } else if (type === "dash") {
      slot.className = "letter-slot dash";
      slot.textContent = "-";
    } else {
      slot.className = "letter-slot";
      const ch = revealed[idx];
      if (ch && ch !== HIDDEN_CHAR && ch !== " " && ch !== "-") {
        slot.textContent = ch.toUpperCase();
      }
    }
    wordDisplay.appendChild(slot);
  });
}

function updateHangmanParts(wrongCount) {
  const parts = document.querySelectorAll(".hang-part[data-step]");
  parts.forEach((part) => {
    const step = Number(part.dataset.step || "0");
    part.classList.toggle("visible", step <= wrongCount);
  });
}

function syncKeyboard(room) {
  if (!keyboard.children.length) buildKeyboard();

  const guessed = new Set(Array.from(room.guessedLetters || ""));
  const canGuess = room.state === "playing" && room.roundGuesserId === myId;

  keyboard.querySelectorAll("button").forEach((btn) => {
    btn.classList.remove("correct", "wrong");
    const letter = btn.dataset.letter;
    const isGuessed = guessed.has(letter);

    btn.disabled = !canGuess || isGuessed;

    if (isGuessed) {
      const exists = Array.from(room.secretWordNormalized || "").includes(
        normalizeLetter(letter)
      );
      btn.classList.add(exists ? "correct" : "wrong");
    }
  });

  guessBtn.disabled = !canGuess;
  letterInput.disabled = !canGuess;
}

function detachActiveRoomListener() {
  if (activeRoomRef && activeRoomListener) {
    activeRoomRef.off("value", activeRoomListener);
  }
  activeRoomRef = null;
  activeRoomListener = null;
}

function setSearchUiActive(active) {
  onlineSearchBtn.disabled = active;
  createPartyBtn.disabled = active;
  joinPartyBtn.disabled = active;
  onlineSearchPanel.classList.toggle("hidden", !active);
}

function resetSearchState() {
  searchActive = false;
  searchOwnedRoomCode = null;
  stopSearchTimer();
  setSearchUiActive(false);
}

async function cleanupSearchArtifacts(removeRoomIfOwned) {
  if (removeRoomIfOwned && searchOwnedRoomCode) {
    const ownedRoomRef = db.ref("rooms/" + searchOwnedRoomCode);
    const snap = await ownedRoomRef.get();
    const room = snap.val();
    const playersCount = Object.keys(room?.players || {}).length;
    if (playersCount <= 1) {
      await ownedRoomRef.remove();
    }
  }
}

async function stopOnlineSearch({ removeOwnedRoom = true } = {}) {
  if (!searchActive) return;

  try {
    await cleanupSearchArtifacts(removeOwnedRoom);
  } catch {
    // ignorăm erori de cleanup temporare
  }

  resetSearchState();
}

async function createSearchRoomAsHost() {
  myRole = "host";
  let code = randomPartyCode();
  let roomRef = db.ref("rooms/" + code);
  let existing = await roomRef.get();

  while (existing.exists()) {
    code = randomPartyCode();
    roomRef = db.ref("rooms/" + code);
    existing = await roomRef.get();
  }

  await roomRef.set({
    hostId: myId,
    state: "lobby",
    roundNumber: 1,
    roundSetterId: myId,
    roundGuesserId: null,
    maxWrong: 7,
    wrongGuesses: 0,
    guessedLetters: "",
    lengths: [],
    revealed: [],
    originalWord: "",
    secretWordNormalized: "",
    endMessage: "",
    resultWinnerId: "",
    resultLoserId: "",
    resultRoundNumber: 0,
    isPublicSearch: true,
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    scores: {
      [myId]: 0,
    },
    chatMessages: {},
    players: {
      [myId]: {
        id: myId,
        name: myName,
        role: "host",
      },
    },
  });

  searchOwnedRoomCode = code;

  createPartyPanel.classList.remove("hidden");
  joinPartyPanel.classList.add("hidden");
  partyStatus.textContent = "Căutăm un jucător online...";
  onlineSearchStatus.textContent = "Căutăm jucător... 00:00";

  subscribeToRoom(code);
}

async function tryJoinWaitingRoom() {
  const roomsSnap = await db.ref("rooms").get();
  if (!roomsSnap.exists()) return false;

  const rooms = roomsSnap.val() || {};
  const candidates = Object.entries(rooms)
    .map(([code, room]) => ({ code, room }))
    .filter(({ room }) => {
      if (!room || room.isPublicSearch !== true) return false;
      if (room.state !== "lobby") return false;
      const players = room.players || {};
      const playersCount = Object.keys(players).length;
      if (playersCount !== 1) return false;
      if (players[myId]) return false;
      return true;
    })
    .sort((a, b) => (a.room.createdAt || 0) - (b.room.createdAt || 0));

  for (const candidate of candidates) {
    const roomRef = db.ref("rooms/" + candidate.code);
    const tx = await roomRef.transaction((room) => {
      if (!room) return room;
      if (room.isPublicSearch !== true || room.state !== "lobby") return room;

      const players = room.players || {};
      const playersCount = Object.keys(players).length;
      if (playersCount !== 1 || players[myId]) return room;

      const roundSetterId = room.roundSetterId || room.hostId;

      room.players = {
        ...players,
        [myId]: {
          id: myId,
          name: myName,
          role: "guest",
        },
      };
      room.scores = {
        ...(room.scores || {}),
        [myId]: room?.scores?.[myId] || 0,
      };
      room.roundGuesserId = myId;
      room.roundSetterId = roundSetterId;
      room.isPublicSearch = false;

      return room;
    });

    if (!tx.committed) continue;

    myRole = "guest";
    createPartyPanel.classList.remove("hidden");
    joinPartyPanel.classList.add("hidden");
    partyStatus.textContent = "Conectat la un jucător online.";
    onlineSearchStatus.textContent = "Jucător găsit. Se deschide lobby...";
    showScreenNotification("Jucător găsit!", "win");

    await stopOnlineSearch({ removeOwnedRoom: false });
    subscribeToRoom(candidate.code);
    return true;
  }

  return false;
}

async function startOnlineSearch() {
  myName = playerNameInput.value.trim() || "Anon";
  myId = myId || randomId();

  setSearchUiActive(true);
  onlineSearchStatus.textContent = "Căutăm jucător... 00:00";
  partyStatus.textContent = "Matchmaking în curs...";
  createPartyPanel.classList.add("hidden");
  joinPartyPanel.classList.add("hidden");

  searchActive = true;
  startSearchTimer();

  try {
    const joined = await tryJoinWaitingRoom();
    if (!searchActive) return;
    if (joined) return;

    await createSearchRoomAsHost();
  } catch {
    await stopOnlineSearch();
    partyStatus.textContent = "A apărut o eroare la matchmaking. Încearcă din nou.";
  }
}

function subscribeOnlinePlayersLive() {
  if (globalRoomsRef && globalRoomsListener) {
    globalRoomsRef.off("value", globalRoomsListener);
  }

  globalRoomsRef = db.ref("rooms");
  globalRoomsListener = (snap) => {
    const rooms = snap.val() || {};
    const uniquePlayers = new Set();

    Object.values(rooms).forEach((room) => {
      const players = room?.players || {};
      Object.keys(players).forEach((id) => uniquePlayers.add(id));
    });

    onlinePlayersLive.textContent = `Online acum: ${uniquePlayers.size} jucători`;
  };

  globalRoomsRef.on("value", globalRoomsListener);
}

function subscribeToRoom(code) {
  detachActiveRoomListener();
  lastHandledResultRound = 0;
  lastBannerKey = "";
  lastSeenRoundNumber = 0;

  const roomRef = db.ref("rooms/" + code);
  const listener = (snap) => {
    const room = snap.val();
    if (!room) return;
    currentRoom = room;

    partyCode = code;
    gamePartyCodeEl.textContent = code;
    partyCodeDisplay.textContent = code;

    renderPlayersList(partyPlayersList, room.players);
    renderPlayersList(gamePlayersList, room.players);
    renderPartySlots(room.players);
    renderScoreboard(room);

    const playersCount = Object.keys(room.players || {}).length;
    const setterName = getPlayerNameById(room.players, room.roundSetterId);
    const guesserName = getPlayerNameById(room.players, room.roundGuesserId);

    const currentRoundNumber = Number(room.roundNumber || 1);
    if (playersCount === 2 && currentRoundNumber !== lastSeenRoundNumber) {
      lastSeenRoundNumber = currentRoundNumber;
      showScreenNotification(`Runda ${currentRoundNumber}`);
    }

    if (searchActive && playersCount >= 2) {
      stopOnlineSearch({ removeOwnedRoom: false });
      onlineSearchStatus.textContent = "Jucător găsit. Se deschide lobby...";
      showScreenNotification("Jucător găsit!", "win");
    }

    renderChat(room);

    lobbyRoundInfo.textContent =
      playersCount < 2
        ? "Așteptăm jucătorul 2..."
        : `Runda ${room.roundNumber || 1}: ${setterName} alege cuvântul, ${guesserName} ghicește.`;

    turnInfo.textContent = `Runda ${room.roundNumber || 1}: ${setterName} pune cuvântul, ${guesserName} ghicește.`;

    const canStartRound =
      playersCount === 2 &&
      room.roundSetterId === myId &&
      (room.state === "lobby" || room.state === "between_rounds");

    startGameBtn.classList.toggle("hidden", !canStartRound);
    secretWordInput.disabled = !canStartRound;

    lengths = room.lengths || [];
    revealed = room.revealed || [];
    wrongGuesses = room.wrongGuesses || 0;
    maxWrong = room.maxWrong || 7;
    gameOver = room.state !== "playing";

    wrongCountSpan.textContent = String(wrongGuesses);
    maxWrongSpan.textContent = String(maxWrong);
    renderWord();
    updateHangmanParts(wrongGuesses);
    syncKeyboard(room);

    if (room.state === "playing") {
      showScreen(gameScreen);
      showCenterBanner(
        room.roundGuesserId === myId
          ? "E rândul tău să ghicești litere."
          : "Așteaptă: ghicitorul joacă acum."
      );

      if (room.roundGuesserId === myId) {
        setGameMessage("E rândul tău: ghicește o literă!");
      } else {
        setGameMessage("Aștepți ghicitorul să aleagă litere.");
      }
    } else {
      showScreen(partyScreen);

      if (playersCount < 2) {
        showCenterBanner("Așteptăm să intre al doilea jucător.");
      } else if (room.roundSetterId === myId) {
        showCenterBanner("Scrie cuvântul dorit și apasă OK (Start Game).");
      } else {
        showCenterBanner(`Așteaptă: ${setterName} scrie cuvântul pentru rundă.`);
      }

      if (room.state === "between_rounds") {
        partyStatus.textContent = room.endMessage || "Runda s-a încheiat.";
      } else if (playersCount < 2) {
        partyStatus.textContent = "Party creat. Aștept să intre prietenul.";
      } else if (room.roundSetterId === myId) {
        partyStatus.textContent = "Scrie cuvântul și apasă Start Game.";
      } else {
        partyStatus.textContent = "Aștepți ca celălalt jucător să pornească runda.";
      }

      setGameMessage(room.endMessage || "");
      if (room.endMessage) {
        if (room.endMessage.startsWith("Bravo")) {
          gameMessage.classList.add("win");
        } else {
          gameMessage.classList.add("lose");
        }
      }

      const resultRound = Number(room.resultRoundNumber || 0);
      if (
        room.state === "between_rounds" &&
        resultRound > 0 &&
        resultRound !== lastHandledResultRound
      ) {
        lastHandledResultRound = resultRound;
        const wordReveal = room.originalWord ? ` Cuvântul a fost: "${room.originalWord}".` : "";
        if (room.resultWinnerId === myId) {
          showScreenNotification(`Ai câștigat! Felicitări!${wordReveal}`, "win");
          startFireworks();
        } else if (room.resultLoserId === myId) {
          showScreenNotification(`Ai pierdut.${wordReveal}`, "lose");
        } else {
          showScreenNotification(`Runda s-a încheiat.${wordReveal}`);
        }
      }
    }
  };

  roomRef.on("value", listener);
  activeRoomRef = roomRef;
  activeRoomListener = listener;
}

// ===== CREATE PARTY (Host) =====
createPartyBtn.addEventListener("click", async () => {
  await stopOnlineSearch();

  myName = playerNameInput.value.trim() || "Anon";
  myId = myId || randomId();
  myRole = "host";

  partyCode = randomPartyCode();
  const roomRef = db.ref("rooms/" + partyCode);

  await roomRef.set({
    hostId: myId,
    state: "lobby",
    roundNumber: 1,
    roundSetterId: myId,
    roundGuesserId: null,
    maxWrong: 7,
    wrongGuesses: 0,
    guessedLetters: "",
    lengths: [],
    revealed: [],
    originalWord: "",
    secretWordNormalized: "",
    endMessage: "",
    resultWinnerId: "",
    resultLoserId: "",
    resultRoundNumber: 0,
    isPublicSearch: false,
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    scores: {
      [myId]: 0,
    },
    chatMessages: {},
    players: {
      [myId]: {
        id: myId,
        name: myName,
        role: "host",
      },
    },
  });

  createPartyPanel.classList.remove("hidden");
  joinPartyPanel.classList.add("hidden");
  partyCodeDisplay.textContent = partyCode;

  subscribeToRoom(partyCode);
});

// ===== JOIN PARTY (Guest) =====
joinPartyBtn.addEventListener("click", async () => {
  await stopOnlineSearch();

  myName = playerNameInput.value.trim() || "Anon";
  myId = myId || randomId();
  myRole = "guest";

  createPartyPanel.classList.add("hidden");
  joinPartyPanel.classList.remove("hidden");
  partyStatus.textContent = "Introdu codul de party și apasă Connect.";
});

joinCodeConfirmBtn.addEventListener("click", async () => {
  await stopOnlineSearch();

  const code = joinCodeInput.value.trim().toUpperCase();
  if (!code) {
    partyStatus.textContent = "Introdu un cod de party.";
    return;
  }

  const roomRef = db.ref("rooms/" + code);
  const snap = await roomRef.get();

  if (!snap.exists()) {
    partyStatus.textContent = "Party-ul nu există.";
    return;
  }

  const room = snap.val();
  const players = room.players || {};
  const playersCount = Object.keys(players).length;

  if (playersCount >= 2 && !players[myId]) {
    partyStatus.textContent = "Party-ul este full (2 jucători).";
    return;
  }

  partyCode = code;

  await roomRef.child("players/" + myId).set({
    id: myId,
    name: myName,
    role: "guest",
  });

  await roomRef.child("scores/" + myId).set(room.scores?.[myId] || 0);

  await roomRef.update({ isPublicSearch: false });

  if (!room.roundGuesserId || room.roundGuesserId === room.roundSetterId) {
    await roomRef.update({ roundGuesserId: myId });
  }

  joinPartyPanel.classList.add("hidden");
  createPartyPanel.classList.remove("hidden");
  partyStatus.textContent = "Conectat la party.";

  subscribeToRoom(code);
});

onlineSearchBtn.addEventListener("click", async () => {
  if (searchActive) return;
  await startOnlineSearch();
});

cancelSearchBtn.addEventListener("click", async () => {
  await stopOnlineSearch();
  onlineSearchPanel.classList.add("hidden");
  partyStatus.textContent = "Căutarea a fost oprită.";
  onlineSearchStatus.textContent = "Căutăm un jucător disponibil...";
  showCenterBanner("");
});

// ===== START ROUND (setter curent) =====
startGameBtn.addEventListener("click", async () => {
  if (!partyCode || !currentRoom) return;

  const roomRef = db.ref("rooms/" + partyCode);
  const playersCount = Object.keys(currentRoom.players || {}).length;

  if (playersCount < 2) {
    partyStatus.textContent = "Ai nevoie de 2 jucători pentru start.";
    return;
  }

  if (currentRoom.roundSetterId !== myId) {
    partyStatus.textContent = "Doar jucătorul care pune cuvântul poate porni runda.";
    return;
  }

  const word = secretWordInput.value.trim();
  if (!word) {
    partyStatus.textContent = "Introdu un cuvânt / expresie.";
    return;
  }

  const letters = Array.from(word);
  const lengthsRound = letters.map((ch) => {
    if (ch === " ") return "space";
    if (ch === "-") return "dash";
    return "letter";
  });

  const revealedRound = letters.map((ch) => {
    if (ch === " ") return " ";
    if (ch === "-") return "-";
    return HIDDEN_CHAR;
  });

  const secretWordNormalized = letters.map(normalizeLetter).join("");

  await roomRef.update({
    state: "playing",
    maxWrong: 7,
    wrongGuesses: 0,
    lengths: lengthsRound,
    revealed: revealedRound,
    guessedLetters: "",
    originalWord: word,
    secretWordNormalized,
    endMessage: "",
    resultWinnerId: "",
    resultLoserId: "",
    resultRoundNumber: 0,
    isPublicSearch: false,
  });

  secretWordInput.value = "";
});

// ===== GUEST: ghicit literă =====
async function sendGuess(ch) {
  if (!partyCode || !currentRoom || gameOver) return;

  ch = (ch || "").toUpperCase();
  if (!/^[A-ZĂÂÎȘŞȚŢ]$/.test(ch)) return;

  const roomRef = db.ref("rooms/" + partyCode);

  const tx = await roomRef.transaction((room) => {
    if (!room || room.state !== "playing") return room;
    if (room.roundGuesserId !== myId) return room;

    const letter = ch;
    const norm = normalizeLetter(letter);
    const normalizedSecret = room.secretWordNormalized || "";

    let guessed = room.guessedLetters || "";
    if (guessed.includes(letter)) {
      return room;
    }
    guessed += letter;

    const secretArr = Array.from(normalizedSecret);
    const revealedArr = Array.isArray(room.revealed) ? [...room.revealed] : [];
    const origArr = Array.from(room.originalWord || "");
    const lengthsArr = Array.isArray(room.lengths) ? room.lengths : [];

    let found = false;

    secretArr.forEach((c, idx) => {
      if (lengthsArr[idx] !== "letter") return;
      if (c === norm && revealedArr[idx] === HIDDEN_CHAR) {
        revealedArr[idx] = origArr[idx];
        found = true;
      }
    });

    let wrong = room.wrongGuesses || 0;
    if (!found) wrong += 1;

    const isWin = revealedArr.every((v, idx) => {
      if (lengthsArr[idx] === "space" || lengthsArr[idx] === "dash") return true;
      return v !== HIDDEN_CHAR;
    });

    const isLose = wrong >= (room.maxWrong || 7);

    let state = room.state;
    let endMessage = "";
    let roundSetterId = room.roundSetterId;
    let roundGuesserId = room.roundGuesserId;
    let roundNumber = room.roundNumber || 1;
    let resultWinnerId = room.resultWinnerId || "";
    let resultLoserId = room.resultLoserId || "";
    let resultRoundNumber = room.resultRoundNumber || 0;
    const scores = {
      ...(room.scores || {}),
    };

    if (isWin) {
      state = "between_rounds";
      endMessage = `Ai câștigat! Felicitări! Cuvântul a fost: "${room.originalWord}".`;
      resultWinnerId = room.roundGuesserId || "";
      resultLoserId = room.roundSetterId || "";
      resultRoundNumber = room.roundNumber || 1;
      if (resultWinnerId) {
        scores[resultWinnerId] = (scores[resultWinnerId] || 0) + 1;
      }
    } else if (isLose) {
      state = "between_rounds";
      endMessage = `Ai pierdut. Cuvântul a fost: "${room.originalWord}".`;
      resultWinnerId = room.roundSetterId || "";
      resultLoserId = room.roundGuesserId || "";
      resultRoundNumber = room.roundNumber || 1;
      if (resultWinnerId) {
        scores[resultWinnerId] = (scores[resultWinnerId] || 0) + 1;
      }
    }

    if (state === "between_rounds" && room.roundSetterId && room.roundGuesserId) {
      roundSetterId = room.roundGuesserId;
      roundGuesserId = room.roundSetterId;
      roundNumber = (room.roundNumber || 1) + 1;
    }

    return {
      ...room,
      guessedLetters: guessed,
      revealed: revealedArr,
      wrongGuesses: wrong,
      state,
      endMessage,
      resultWinnerId,
      resultLoserId,
      resultRoundNumber,
      scores,
      roundSetterId,
      roundGuesserId,
      roundNumber,
    };
  });

  if (tx?.committed) {
    const updatedRoom = tx.snapshot.val();
    if (
      updatedRoom?.state === "between_rounds" &&
      updatedRoom?.resultWinnerId &&
      updatedRoom?.resultRoundNumber
    ) {
      const winnerId = updatedRoom.resultWinnerId;
      const winnerName = getPlayerNameById(updatedRoom.players, winnerId);
      await incrementLeaderboard(winnerId, winnerName);
    }
  }
}

// guess prin input
guessBtn.addEventListener("click", () => {
  const ch = letterInput.value.trim();
  if (!ch) return;
  sendGuess(ch[0]);
  letterInput.value = "";
  letterInput.focus();
});

letterInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    guessBtn.click();
  }
});

// copiere cod party
copyCodeBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(partyCodeDisplay.textContent || "");
    partyStatus.textContent = "Cod copiat!";
  } catch {
    partyStatus.textContent = "Nu am putut copia codul.";
  }
});

sendChatBtn.addEventListener("click", async () => {
  await sendChatMessage();
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendChatMessage();
  }
});

buildKeyboard();
showScreen(partyScreen);
subscribeOnlinePlayersLive();
subscribeLeaderboard();
subscribeSocialLinks();