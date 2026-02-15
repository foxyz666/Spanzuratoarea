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
const ROOM_TTL_MS = 2 * 60 * 1000;
const ROOM_CLEANUP_INTERVAL_MS = 20 * 1000;
const SEARCH_RETRY_INTERVAL_MS = 1800;
const ADMIN_SECRET_HASH =
  "b6fb730c7661050aaeda0b0e41f7af6a3ac90c02b43ecbabf338b036762791bf";

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
let searchRetryInterval = null;
let searchRetryInFlight = false;
let searchStartedAt = 0;
let lastHandledResultRound = 0;
let lastBannerKey = "";
let lastSeenRoundNumber = 0;
let centerBannerTimeout = null;
let screenNotificationTimeout = null;
let fireworksTimeout = null;
let fireworksRaf = null;
let currentLang = "ro";
let currentDeviceMode = "auto";
let roomCleanupInterval = null;
let lastRoomTtlRefreshAt = 0;
let currentUser = null;
let isAdminUser = false;
let chatWindowOpen = false;
let unreadChatCount = 0;
let lastChatRenderedCount = 0;
let chatInitialized = false;

// ===== DOM =====
const partyScreen = document.getElementById("party-screen");
const gameScreen = document.getElementById("game-screen");
const authOpenBtn = document.getElementById("auth-open-btn");
const authModal = document.getElementById("auth-modal");
const authCloseBtn = document.getElementById("auth-close-btn");
const authAdminCheckbox = document.getElementById("auth-admin-checkbox");
const adminSecretWrap = document.getElementById("admin-secret-wrap");
const authAdminCheckLabel = document.getElementById("auth-admin-check-label");
const chatToggleBtn = document.getElementById("chat-toggle-btn");
const chatUnreadBadge = document.getElementById("chat-unread-badge");
const chatWindow = document.getElementById("chat-window");
const chatMinimizeBtn = document.getElementById("chat-minimize-btn");

const authUsernameInput = document.getElementById("auth-username-input");
const authPasswordInput = document.getElementById("auth-password-input");
const adminSecretInput = document.getElementById("admin-secret-input");
const authRegisterBtn = document.getElementById("auth-register-btn");
const authLoginBtn = document.getElementById("auth-login-btn");
const authAnonBtn = document.getElementById("auth-anon-btn");
const authLogoutBtn = document.getElementById("auth-logout-btn");
const authStatus = document.getElementById("auth-status");
const nameInputWrap = document.querySelector(".name-input");

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
const adminTools = document.getElementById("admin-tools");
const adminPeekWordBtn = document.getElementById("admin-peek-word-btn");
const adminRemoveWrongBtn = document.getElementById("admin-remove-wrong-btn");
const langRoBtn = document.getElementById("lang-ro");
const langRuBtn = document.getElementById("lang-ru");
const deviceModal = document.getElementById("device-modal");
const deviceAutoBtn = document.getElementById("device-auto-btn");
const devicePhoneBtn = document.getElementById("device-phone-btn");
const devicePcBtn = document.getElementById("device-pc-btn");

const I18N = {
  ro: {
    appTitle: "Spânzurătoarea Online",
    partyTitle: "Party Online",
    nameLabel: "Numele tău:",
    createParty: "Create Party",
    joinParty: "Join Party",
    searchOnline: "Search Online",
    matchTitle: "Matchmaking Online",
    cancelSearch: "Cancel Search",
    lobbyTitle: "Lobby Party",
    lobbyCodeText: "Party creat! Codul tău este:",
    copy: "Copy",
    whoParty: "Cine este în party:",
    secretLabel: "Cuvântul / expresia (ascunsă pentru ceilalți):",
    startGame: "Start Game",
    joinHelp: "Introdu codul primit de la prieten:",
    connect: "Connect",
    gameTitle: "Joc",
    partyCode: "Party code:",
    playersInParty: "Jucători în party:",
    guessLabel: "Ghicitorul: ghicește o literă",
    guessBtn: "Ghicește",
    chatTitle: "Chat Party",
    send: "Trimite",
    credits: "Aplicația a fost fondată și creată de Foxyz și Hellen. <3",
    deviceTitle: "Alege dispozitivul",
    deviceSubtitle: "Poți folosi Auto, Telefon sau PC.",
    deviceAuto: "Auto",
    devicePhone: "Telefon",
    devicePc: "PC",
    authTitle: "Cont",
    authOpenTitle: "Cont",
    authCloseTitle: "Închide",
    authUsernamePlaceholder: "Username",
    authPasswordPlaceholder: "Parolă",
    authAdminCheckLabel: "Am cod de admin",
    authAdminSecretLabel: "Scrie codul de admin:",
    authAdminSecretPlaceholder: "Cod secret",
    authAdminCodeInvalid: "Codul de admin este invalid.",
    authRegister: "Înregistrare",
    authLogin: "Login",
    authAnon: "Anonim",
    authLogout: "Logout",
    authNeedUserPass: "Completează username și parolă.",
    authRegisterSuccess: "Cont creat cu succes.",
    authRegisterAdmin: "Cont creat cu rol admin.",
    authUserExists: "Username-ul există deja.",
    authLoginSuccess: "Autentificare reușită.",
    authLoginFail: "Date invalide.",
    authAnonReady: "Mod anonim activ.",
    authLogoutSuccess: "Te-ai delogat.",
    adminRoleDefault: "Administrator",
    adminRoleReveal: "{name}: {role}",
    adminToolsTitle: "Unelte Admin",
    adminPeekWordBtn: "👁 Vezi cuvântul",
    adminRemoveWrongBtn: "🩹 Șterge o greșeală",
    adminWordReveal: "Cuvânt ascuns: {word}",
    adminNoEnemyWord: "Nu există încă un cuvânt activ al adversarului.",
    adminRemovedWrong: "Ai șters o greșeală.",
    adminNoWrongToRemove: "Nu există greșeli de șters.",
    authHello: "Conectat ca: {name}{admin}",
    authAdminBadge: " (ADMIN)",
    chatToggleTitle: "Chat",
    chatMinimizeTitle: "Minimizează",
    onlineNow: "Online acum: {count} jucători",
    searching: "Căutăm jucător... {time}",
    searchingStart: "Căutăm un jucător disponibil...",
    searchingPlayer: "Căutăm un jucător online...",
    foundPlayer: "Jucător găsit!",
    partyCreatedWait: "Party creat. Aștept să intre prietenul.",
    needTwoPlayers: "Ai nevoie de 2 jucători pentru start.",
    onlySetterCanStart: "Doar jucătorul care pune cuvântul poate porni runda.",
    enterWord: "Introdu un cuvânt / expresie.",
    connectedParty: "Conectat la party.",
    connectedOnline: "Conectat la un jucător online.",
    enterPartyCode: "Introdu codul de party și apasă Connect.",
    enterCodeOnly: "Introdu un cod de party.",
    partyNotExists: "Party-ul nu există.",
    partyFull: "Party-ul este full (2 jucători).",
    waitSecondPlayer: "Așteptăm jucătorul 2...",
    waitingSecondCenter: "Așteptăm să intre al doilea jucător.",
    typeWordCenter: "Scrie cuvântul dorit și apasă OK (Start Game).",
    waitSetterCenter: "Așteaptă: {name} scrie cuvântul pentru rundă.",
    yourGuessTurn: "E rândul tău: ghicește o literă!",
    waitGuesserTurn: "Aștepți ghicitorul să aleagă litere.",
    guessTurnCenter: "E rândul tău să ghicești litere.",
    waitGuessCenter: "Așteaptă: ghicitorul joacă acum.",
    roundEnded: "Runda s-a încheiat.",
    round: "Runda {num}",
    copiedCode: "Cod copiat!",
    copyFail: "Nu am putut copia codul.",
    searchStopped: "Căutarea a fost oprită.",
    matchmakingRunning: "Matchmaking în curs...",
    matchmakingError: "A apărut o eroare la matchmaking. Încearcă din nou.",
    youWonWithWord: "Ai câștigat! Felicitări! Cuvântul a fost: \"{word}\".",
    youLostWithWord: "Ai pierdut. Cuvântul a fost: \"{word}\".",
    endWordInfo: " Cuvântul a fost: \"{word}\".",
    scoreSingle: "Scor: {p1} {s1}",
    scoreDuel: "Scor: {p1} {s1} - {s2} {p2}",
    slot1Empty: "Persoana 1: -",
    slot2Wait: "Persoana 2: waiting...",
    slot1: "Persoana 1: {name}",
    slot2: "Persoana 2: {name}",
    hostTag: "Host",
    lobbyRoundLine: "Runda {round}: {setter} alege cuvântul, {guesser} ghicește.",
    turnInfoLine: "Runda {round}: {setter} pune cuvântul, {guesser} ghicește.",
    namePlaceholder: "ex: Alex",
    codePlaceholder: "ex: ABCD12",
    chatPlaceholder: "Scrie un mesaj...",
  },
  ru: {
    appTitle: "Виселица Онлайн",
    partyTitle: "Онлайн Лобби",
    nameLabel: "Ваше имя:",
    createParty: "Создать лобби",
    joinParty: "Войти в лобби",
    searchOnline: "Поиск онлайн",
    matchTitle: "Онлайн подбор",
    cancelSearch: "Отменить поиск",
    lobbyTitle: "Лобби",
    lobbyCodeText: "Лобби создано! Ваш код:",
    copy: "Копировать",
    whoParty: "Кто в лобби:",
    secretLabel: "Слово / фраза (скрыто для других):",
    startGame: "Начать раунд",
    joinHelp: "Введите код от друга:",
    connect: "Подключиться",
    gameTitle: "Игра",
    partyCode: "Код лобби:",
    playersInParty: "Игроки в лобби:",
    guessLabel: "Угадывающий: введи букву",
    guessBtn: "Угадать",
    chatTitle: "Чат лобби",
    send: "Отправить",
    credits: "Приложение основано и создано Foxyz и Hellen. <3",
    deviceTitle: "Выберите устройство",
    deviceSubtitle: "Можно выбрать Авто, Телефон или ПК.",
    deviceAuto: "Авто",
    devicePhone: "Телефон",
    devicePc: "ПК",
    authTitle: "Аккаунт",
    authOpenTitle: "Аккаунт",
    authCloseTitle: "Закрыть",
    authUsernamePlaceholder: "Имя пользователя",
    authPasswordPlaceholder: "Пароль",
    authAdminCheckLabel: "У меня есть код админа",
    authAdminSecretLabel: "Введите код админа:",
    authAdminSecretPlaceholder: "Секретный код",
    authAdminCodeInvalid: "Неверный код админа.",
    authRegister: "Регистрация",
    authLogin: "Войти",
    authAnon: "Анонимно",
    authLogout: "Выйти",
    authNeedUserPass: "Введите имя пользователя и пароль.",
    authRegisterSuccess: "Аккаунт успешно создан.",
    authRegisterAdmin: "Аккаунт создан с ролью админа.",
    authUserExists: "Имя пользователя уже занято.",
    authLoginSuccess: "Успешный вход.",
    authLoginFail: "Неверные данные.",
    authAnonReady: "Анонимный режим активирован.",
    authLogoutSuccess: "Вы вышли из аккаунта.",
    adminRoleDefault: "Администратор",
    adminRoleReveal: "{name}: {role}",
    adminToolsTitle: "Инструменты Админа",
    adminPeekWordBtn: "👁 Показать слово",
    adminRemoveWrongBtn: "🩹 Убрать ошибку",
    adminWordReveal: "Скрытое слово: {word}",
    adminNoEnemyWord: "Пока нет активного слова соперника.",
    adminRemovedWrong: "Одна ошибка удалена.",
    adminNoWrongToRemove: "Нет ошибок для удаления.",
    authHello: "Вход выполнен: {name}{admin}",
    authAdminBadge: " (ADMIN)",
    chatToggleTitle: "Чат",
    chatMinimizeTitle: "Свернуть",
    onlineNow: "Сейчас онлайн: {count}",
    searching: "Ищем игрока... {time}",
    searchingStart: "Ищем доступного игрока...",
    searchingPlayer: "Поиск онлайн игрока...",
    foundPlayer: "Игрок найден!",
    partyCreatedWait: "Лобби создано. Ждём второго игрока.",
    needTwoPlayers: "Нужно 2 игрока для старта.",
    onlySetterCanStart: "Только задающий слово может начать раунд.",
    enterWord: "Введите слово / фразу.",
    connectedParty: "Подключено к лобби.",
    connectedOnline: "Подключено к онлайн игроку.",
    enterPartyCode: "Введите код лобби и нажмите Подключиться.",
    enterCodeOnly: "Введите код лобби.",
    partyNotExists: "Лобби не существует.",
    partyFull: "Лобби заполнено (2 игрока).",
    waitSecondPlayer: "Ждём второго игрока...",
    waitingSecondCenter: "Ожидаем подключение второго игрока.",
    typeWordCenter: "Напишите слово и нажмите ОК (Start Game).",
    waitSetterCenter: "Подождите: {name} пишет слово для раунда.",
    yourGuessTurn: "Ваш ход: угадывайте букву!",
    waitGuesserTurn: "Ожидайте ход угадывающего.",
    guessTurnCenter: "Ваш ход угадывать буквы.",
    waitGuessCenter: "Подождите: сейчас ход угадывающего.",
    roundEnded: "Раунд завершён.",
    round: "Раунд {num}",
    copiedCode: "Код скопирован!",
    copyFail: "Не удалось скопировать код.",
    searchStopped: "Поиск остановлен.",
    matchmakingRunning: "Идёт подбор игрока...",
    matchmakingError: "Ошибка подбора. Попробуйте ещё раз.",
    youWonWithWord: "Вы выиграли! Поздравляем! Слово было: \"{word}\".",
    youLostWithWord: "Вы проиграли. Слово было: \"{word}\".",
    endWordInfo: " Слово было: \"{word}\".",
    scoreSingle: "Счёт: {p1} {s1}",
    scoreDuel: "Счёт: {p1} {s1} - {s2} {p2}",
    slot1Empty: "Игрок 1: -",
    slot2Wait: "Игрок 2: ожидание...",
    slot1: "Игрок 1: {name}",
    slot2: "Игрок 2: {name}",
    hostTag: "Хост",
    lobbyRoundLine: "Раунд {round}: {setter} задаёт слово, {guesser} угадывает.",
    turnInfoLine: "Раунд {round}: {setter} пишет слово, {guesser} угадывает.",
    namePlaceholder: "напр: Alex",
    codePlaceholder: "напр: ABCD12",
    chatPlaceholder: "Напишите сообщение...",
  },
};

function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
}

function getCookie(name) {
  const prefix = `${name}=`;
  const parts = document.cookie.split(";");
  for (const partRaw of parts) {
    const part = partRaw.trim();
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return "";
}

function t(key, params = {}) {
  const pack = I18N[currentLang] || I18N.ro;
  let text = pack[key] ?? I18N.ro[key] ?? key;
  Object.entries(params).forEach(([paramKey, value]) => {
    text = text.replaceAll(`{${paramKey}}`, String(value));
  });
  return text;
}

function normalizeUsername(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
}

async function sha256Hex(value) {
  const encoded = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(usernameKey, password) {
  return sha256Hex(`spz::${usernameKey}::${password}`);
}

function setAuthStatus(text) {
  if (authStatus) {
    authStatus.textContent = text || "";
  }
}

function openAuthModal() {
  authModal?.classList.remove("hidden");
}

function closeAuthModal() {
  authModal?.classList.add("hidden");
}

function syncAdminSecretVisibility() {
  if (!adminSecretWrap || !authAdminCheckbox) return;
  const checked = authAdminCheckbox.checked;
  adminSecretWrap.classList.toggle("hidden", !checked);
  if (!checked && adminSecretInput) {
    adminSecretInput.value = "";
  }
}

function updateChatUnreadBadge() {
  if (!chatUnreadBadge) return;
  if (unreadChatCount <= 0) {
    chatUnreadBadge.classList.add("hidden");
    chatUnreadBadge.textContent = "+0";
    return;
  }
  chatUnreadBadge.classList.remove("hidden");
  chatUnreadBadge.textContent = `+${unreadChatCount}`;
}

function setChatWindowOpen(open) {
  chatWindowOpen = Boolean(open);
  chatWindow?.classList.toggle("hidden", !chatWindowOpen);
  if (chatWindowOpen) {
    unreadChatCount = 0;
    updateChatUnreadBadge();
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
}

function updateAdminToolsVisibility() {
  if (!adminTools) return;
  adminTools.classList.toggle("hidden", !isAdminUser);
}

function applyUserToPlayerName() {
  if (!playerNameInput) return;
  if (currentUser?.displayName) {
    playerNameInput.value = currentUser.displayName;
    myName = currentUser.displayName;
  }
}

function updateNameInputVisibility() {
  if (!nameInputWrap) return;
  const loggedAccount = Boolean(currentUser && !currentUser.isAnonymous);
  nameInputWrap.classList.toggle("hidden", loggedAccount);
}

function updateAuthLauncherUi() {
  const loggedAccount = Boolean(currentUser && !currentUser.isAnonymous);

  if (authRegisterBtn) authRegisterBtn.classList.toggle("hidden", loggedAccount);
  if (authLoginBtn) authLoginBtn.classList.toggle("hidden", loggedAccount);
  if (authAnonBtn) authAnonBtn.classList.toggle("hidden", loggedAccount);
  if (authLogoutBtn) authLogoutBtn.classList.toggle("hidden", !loggedAccount);

  if (!authOpenBtn) return;

  authOpenBtn.classList.remove("auth-user-name", "user-glow", "admin-glow");
  if (loggedAccount) {
    authOpenBtn.textContent = currentUser.displayName || "User";
    authOpenBtn.classList.add("auth-user-name");
    authOpenBtn.classList.add(currentUser.isAdmin ? "admin-glow" : "user-glow");
    authOpenBtn.title = `${t("authOpenTitle")}: ${currentUser.displayName || "User"}`;
  } else {
    authOpenBtn.textContent = "👤";
    authOpenBtn.title = t("authOpenTitle");
  }
}

function setCurrentUser(user) {
  currentUser = user;
  isAdminUser = Boolean(user?.isAdmin);
  applyUserToPlayerName();
  updateNameInputVisibility();
  updateAdminToolsVisibility();
  updateAuthLauncherUi();

  if (user) {
    localStorage.setItem("spz_user", JSON.stringify(user));
    const adminPart = user.isAdmin ? t("authAdminBadge") : "";
    setAuthStatus(t("authHello", { name: user.displayName, admin: adminPart }));
  } else {
    localStorage.removeItem("spz_user");
  }
}

function getActivePlayerName() {
  if (currentUser?.displayName) return currentUser.displayName;
  return playerNameInput.value.trim() || "Anon";
}

async function registerAccount() {
  const rawUsername = authUsernameInput?.value || "";
  const password = authPasswordInput?.value || "";
  const usernameKey = normalizeUsername(rawUsername);
  if (!usernameKey || !password) {
    setAuthStatus(t("authNeedUserPass"));
    return;
  }

  const userRef = db.ref(`users/${usernameKey}`);
  const existing = await userRef.get();
  if (existing.exists()) {
    setAuthStatus(t("authUserExists"));
    return;
  }

  const passwordHash = await hashPassword(usernameKey, password);
  const wantsAdmin = Boolean(authAdminCheckbox?.checked);
  const secretRaw = (adminSecretInput?.value || "").trim().toLowerCase();
  let isAdmin = false;
  if (wantsAdmin) {
    const secretHash = secretRaw ? await sha256Hex(secretRaw) : "";
    if (secretHash !== ADMIN_SECRET_HASH) {
      setAuthStatus(t("authAdminCodeInvalid"));
      return;
    }
    isAdmin = true;
  }

  const userData = {
    usernameKey,
    displayName: rawUsername.trim() || usernameKey,
    passwordHash,
    isAdmin,
    createdAt: firebase.database.ServerValue.TIMESTAMP,
  };

  await userRef.set(userData);

  setCurrentUser({
    usernameKey,
    displayName: userData.displayName,
    isAdmin,
    adminTitle: isAdmin ? userData.adminTitle || "Administrator" : "",
    isAnonymous: false,
  });

  if (authPasswordInput) authPasswordInput.value = "";
  if (adminSecretInput) adminSecretInput.value = "";
  setAuthStatus(isAdmin ? t("authRegisterAdmin") : t("authRegisterSuccess"));
  closeAuthModal();
}

async function loginAccount() {
  const rawUsername = authUsernameInput?.value || "";
  const password = authPasswordInput?.value || "";
  const usernameKey = normalizeUsername(rawUsername);
  if (!usernameKey || !password) {
    setAuthStatus(t("authNeedUserPass"));
    return;
  }

  const userRef = db.ref(`users/${usernameKey}`);
  const snap = await userRef.get();
  const user = snap.val();
  if (!user) {
    setAuthStatus(t("authLoginFail"));
    return;
  }

  const incomingHash = await hashPassword(usernameKey, password);
  if (incomingHash !== user.passwordHash) {
    setAuthStatus(t("authLoginFail"));
    return;
  }

  setCurrentUser({
    usernameKey,
    displayName: user.displayName || rawUsername.trim() || usernameKey,
    isAdmin: Boolean(user.isAdmin),
    adminTitle: user.adminTitle || user.adminLabel || (user.isAdmin ? "Administrator" : ""),
    isAnonymous: false,
  });

  if (authPasswordInput) authPasswordInput.value = "";
  setAuthStatus(t("authLoginSuccess"));
  closeAuthModal();
}

function continueAnonymous() {
  const baseName = (playerNameInput.value || "").trim() || "Anon";
  setCurrentUser({
    usernameKey: "anon_" + randomId().slice(0, 8),
    displayName: baseName,
    isAdmin: false,
    isAnonymous: true,
  });
  setAuthStatus(t("authAnonReady"));
  closeAuthModal();
}

function logoutAccount() {
  setCurrentUser(null);
  if (authPasswordInput) authPasswordInput.value = "";
  if (adminSecretInput) adminSecretInput.value = "";
  if (authAdminCheckbox) {
    authAdminCheckbox.checked = false;
    syncAdminSecretVisibility();
  }
  setAuthStatus(t("authLogoutSuccess"));
  closeAuthModal();
}

function computeRoomExpiry() {
  return Date.now() + ROOM_TTL_MS;
}

function isRoomExpired(room) {
  if (!room) return true;
  const expiresAt = Number(room.expiresAt || 0);
  if (!expiresAt) return false;
  return Date.now() > expiresAt;
}

async function cleanupExpiredRooms() {
  const roomsRef = db.ref("rooms");
  const snap = await roomsRef.get();
  if (!snap.exists()) return;

  const rooms = snap.val() || {};
  const deletes = [];
  Object.entries(rooms).forEach(([code, room]) => {
    if (isRoomExpired(room)) {
      deletes.push(roomsRef.child(code).remove());
    }
  });

  if (deletes.length) {
    await Promise.allSettled(deletes);
  }
}

function startRoomCleanupLoop() {
  if (roomCleanupInterval) {
    clearInterval(roomCleanupInterval);
  }

  cleanupExpiredRooms().catch(() => {});
  roomCleanupInterval = setInterval(() => {
    cleanupExpiredRooms().catch(() => {});
  }, ROOM_CLEANUP_INTERVAL_MS);
}

async function refreshCurrentRoomTtl(force = false) {
  if (!partyCode || !myId) return;

  const now = Date.now();
  if (!force && now - lastRoomTtlRefreshAt < 90 * 1000) return;

  try {
    const roomRef = db.ref("rooms/" + partyCode);
    const snap = await roomRef.get();
    const room = snap.val();
    if (!room) return;
    if (!room.players || !room.players[myId]) return;

    await roomRef.update({ expiresAt: computeRoomExpiry() });
    lastRoomTtlRefreshAt = now;
  } catch {
    // ignore TTL refresh failures
  }
}

function detectAutoDeviceMode() {
  const ua = navigator.userAgent || "";
  const mobileUa = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua);
  return mobileUa || window.innerWidth <= 760 ? "phone" : "pc";
}

function applyDeviceMode(mode) {
  currentDeviceMode = mode;
  const effective = mode === "auto" ? detectAutoDeviceMode() : mode;

  document.body.classList.remove("device-mobile", "device-desktop");
  if (effective === "phone") {
    document.body.classList.add("device-mobile");
  } else {
    document.body.classList.add("device-desktop");
  }
}

function setLanguage(lang) {
  currentLang = lang === "ru" ? "ru" : "ro";
  localStorage.setItem("spz_lang", currentLang);
  setCookie("spz_lang", currentLang);

  langRoBtn?.classList.toggle("active", currentLang === "ro");
  langRuBtn?.classList.toggle("active", currentLang === "ru");

  document.getElementById("app-title").textContent = t("appTitle");
  document.getElementById("party-title").textContent = t("partyTitle");
  document.getElementById("name-label").textContent = t("nameLabel");
  createPartyBtn.textContent = t("createParty");
  joinPartyBtn.textContent = t("joinParty");
  onlineSearchBtn.textContent = t("searchOnline");
  document.getElementById("match-title").textContent = t("matchTitle");
  cancelSearchBtn.textContent = t("cancelSearch");
  document.getElementById("lobby-title").textContent = t("lobbyTitle");
  document.getElementById("lobby-code-text").textContent = t("lobbyCodeText");
  copyCodeBtn.textContent = t("copy");
  document.getElementById("who-party-text").textContent = t("whoParty");
  document.getElementById("secret-label").textContent = t("secretLabel");
  startGameBtn.textContent = t("startGame");
  document.getElementById("join-help").textContent = t("joinHelp");
  joinCodeConfirmBtn.textContent = t("connect");
  document.getElementById("game-title").textContent = t("gameTitle");
  document.getElementById("party-code-text").textContent = t("partyCode");
  document.getElementById("players-in-party").textContent = t("playersInParty");
  document.getElementById("guess-label").textContent = t("guessLabel");
  guessBtn.textContent = t("guessBtn");
  document.getElementById("chat-title").textContent = t("chatTitle");
  sendChatBtn.textContent = t("send");
  document.getElementById("credits-text").textContent = t("credits");
  authOpenBtn.title = t("authOpenTitle");
  authCloseBtn.title = t("authCloseTitle");
  document.getElementById("auth-title").textContent = t("authTitle");
  authAdminCheckLabel.textContent = t("authAdminCheckLabel");
  document.getElementById("admin-secret-label").textContent = t("authAdminSecretLabel");
  authRegisterBtn.textContent = t("authRegister");
  authLoginBtn.textContent = t("authLogin");
  authAnonBtn.textContent = t("authAnon");
  authLogoutBtn.textContent = t("authLogout");
  chatToggleBtn.title = t("chatToggleTitle");
  chatMinimizeBtn.title = t("chatMinimizeTitle");
  document.getElementById("admin-tools-title").textContent = t("adminToolsTitle");
  adminPeekWordBtn.textContent = t("adminPeekWordBtn");
  adminRemoveWrongBtn.textContent = t("adminRemoveWrongBtn");
  document.getElementById("device-title").textContent = t("deviceTitle");
  document.getElementById("device-subtitle").textContent = t("deviceSubtitle");
  deviceAutoBtn.textContent = t("deviceAuto");
  devicePhoneBtn.textContent = t("devicePhone");
  devicePcBtn.textContent = t("devicePc");
  authUsernameInput.placeholder = t("authUsernamePlaceholder");
  authPasswordInput.placeholder = t("authPasswordPlaceholder");
  adminSecretInput.placeholder = t("authAdminSecretPlaceholder");
  playerNameInput.placeholder = t("namePlaceholder");
  joinCodeInput.placeholder = t("codePlaceholder");
  chatInput.placeholder = t("chatPlaceholder");

  if (!searchActive) {
    onlineSearchStatus.textContent = t("searchingStart");
  }
  if (!partyCode) {
    onlinePlayersLive.textContent = t("onlineNow", { count: 0 });
  }

  if (currentUser) {
    const adminPart = currentUser.isAdmin ? t("authAdminBadge") : "";
    setAuthStatus(t("authHello", { name: currentUser.displayName, admin: adminPart }));
  }

  updateAuthLauncherUi();
}

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

  if (!chatInitialized) {
    chatInitialized = true;
    lastChatRenderedCount = items.length;
  } else {
    const newItems = items.slice(lastChatRenderedCount);
    if (!chatWindowOpen && newItems.length) {
      const incomingCount = newItems.filter((msg) => msg?.senderId !== myId).length;
      unreadChatCount += incomingCount;
    }
    lastChatRenderedCount = items.length;
  }

  if (chatWindowOpen) {
    unreadChatCount = 0;
  }
  updateChatUnreadBadge();

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

  await refreshCurrentRoomTtl(true);
}

function adminPeekEnemyWord() {
  if (!isAdminUser || !currentRoom) return;
  const enemyIsSetter = currentRoom.roundSetterId && currentRoom.roundSetterId !== myId;
  const word = enemyIsSetter ? currentRoom.originalWord || "" : "";
  if (!word) {
    showScreenNotification(t("adminNoEnemyWord"));
    return;
  }
  showScreenNotification(t("adminWordReveal", { word }));
}

async function adminRemoveWrongGuess() {
  if (!isAdminUser || !partyCode) return;

  const roomRef = db.ref("rooms/" + partyCode);
  const tx = await roomRef.transaction((room) => {
    if (!room || room.state !== "playing") return room;
    if ((room.wrongGuesses || 0) <= 0) return room;
    return {
      ...room,
      wrongGuesses: Math.max(0, (room.wrongGuesses || 0) - 1),
      expiresAt: computeRoomExpiry(),
    };
  });

  if (tx.committed && (tx.snapshot?.val()?.wrongGuesses ?? 0) !== (currentRoom?.wrongGuesses ?? 0)) {
    showScreenNotification(t("adminRemovedWrong"), "win");
  } else {
    showScreenNotification(t("adminNoWrongToRemove"));
  }
}

function renderScoreboard(room) {
  if (!scoreboardEl) return;

  const ordered = getOrderedPlayers(room.players || {});
  const scores = room.scores || {};
  const formatScoreName = (player) => {
    if (!player) return "-";
    return player.isAdmin ? `${player.name}${t("authAdminBadge")}` : player.name;
  };

  if (!ordered.length) {
    scoreboardEl.textContent = t("scoreSingle", { p1: "-", s1: 0 });
    return;
  }

  if (ordered.length === 1) {
    const p = ordered[0];
    scoreboardEl.textContent = t("scoreSingle", {
      p1: formatScoreName(p),
      s1: scores[p.id] || 0,
    });
    return;
  }

  const p1 = ordered[0];
  const p2 = ordered[1];
  scoreboardEl.textContent = t("scoreDuel", {
    p1: formatScoreName(p1),
    s1: scores[p1.id] || 0,
    s2: scores[p2.id] || 0,
    p2: formatScoreName(p2),
  });
}

function startSearchTimer() {
  if (searchTimerInterval) {
    clearInterval(searchTimerInterval);
    searchTimerInterval = null;
  }

  searchStartedAt = Date.now();
  const tick = () => {
    const elapsed = Math.floor((Date.now() - searchStartedAt) / 1000);
    onlineSearchStatus.textContent = t("searching", { time: formatElapsed(elapsed) });
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

function stopSearchRetryLoop() {
  if (searchRetryInterval) {
    clearInterval(searchRetryInterval);
    searchRetryInterval = null;
  }
  searchRetryInFlight = false;
}

function startSearchRetryLoop() {
  stopSearchRetryLoop();

  searchRetryInterval = setInterval(async () => {
    if (!searchActive || searchRetryInFlight) return;
    if (myRole !== "host" || !searchOwnedRoomCode || !myId) return;

    searchRetryInFlight = true;
    try {
      const ownRoomSnap = await db.ref("rooms/" + searchOwnedRoomCode).get();
      const ownRoom = ownRoomSnap.val();
      if (!searchActive || !ownRoom) return;

      const ownPlayers = ownRoom.players || {};
      const ownPlayersCount = Object.keys(ownPlayers).length;
      const iAmStillInOwnRoom = Boolean(ownPlayers[myId]);
      const canSwitchRoom =
        iAmStillInOwnRoom &&
        ownPlayersCount === 1 &&
        ownRoom.state === "lobby" &&
        ownRoom.isPublicSearch === true &&
        !isRoomExpired(ownRoom);

      if (!canSwitchRoom) return;

      await tryJoinWaitingRoom({ excludeCode: searchOwnedRoomCode });
    } catch {
      // ignore transient matchmaking loop failures
    } finally {
      searchRetryInFlight = false;
    }
  }, SEARCH_RETRY_INTERVAL_MS);
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
    const displayName = p.name + (p.role === "host" ? ` (${t("hostTag")})` : "");

    if (p?.isAdmin) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "admin-player-name-btn";
      btn.textContent = displayName;
      btn.title = p.adminTitle || p.adminLabel || t("adminRoleDefault");
      btn.addEventListener("click", () => {
        const roleText = p.adminTitle || p.adminLabel || t("adminRoleDefault");
        showScreenNotification(t("adminRoleReveal", { name: p.name || "User", role: roleText }));
      });
      li.appendChild(btn);
    } else {
      li.textContent = displayName;
    }

    listEl.appendChild(li);
  });
}

function renderPartySlots(playersObj) {
  const ordered = getOrderedPlayers(playersObj);
  slotPlayer1.textContent = ordered[0]
    ? t("slot1", { name: ordered[0].name })
    : t("slot1Empty");
  slotPlayer2.textContent = ordered[1]
    ? t("slot2", { name: ordered[1].name })
    : t("slot2Wait");
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
  stopSearchRetryLoop();
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
    expiresAt: computeRoomExpiry(),
    scores: {
      [myId]: 0,
    },
    chatMessages: {},
    players: {
      [myId]: {
        id: myId,
        name: myName,
        role: "host",
        isAdmin: Boolean(currentUser?.isAdmin),
        adminTitle: currentUser?.adminTitle || currentUser?.adminLabel || "",
      },
    },
  });

  searchOwnedRoomCode = code;

  createPartyPanel.classList.remove("hidden");
  joinPartyPanel.classList.add("hidden");
  partyStatus.textContent = t("searchingPlayer");
  onlineSearchStatus.textContent = t("searching", { time: "00:00" });

  subscribeToRoom(code);
}

async function tryJoinWaitingRoom({ excludeCode = "" } = {}) {
  const roomsSnap = await db.ref("rooms").get();
  if (!roomsSnap.exists()) return false;

  const rooms = roomsSnap.val() || {};
  const candidates = Object.entries(rooms)
    .map(([code, room]) => ({ code, room }))
    .filter(({ code, room }) => {
      if (excludeCode && code === excludeCode) return false;
      if (!room || room.isPublicSearch !== true) return false;
      if (isRoomExpired(room)) return false;
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
      if (!room) return;
      if (room.isPublicSearch !== true || room.state !== "lobby") return;

      const players = room.players || {};
      const playersCount = Object.keys(players).length;
      if (playersCount !== 1 || players[myId]) return;

      const roundSetterId = room.roundSetterId || room.hostId;

      room.players = {
        ...players,
        [myId]: {
          id: myId,
          name: myName,
          role: "guest",
          isAdmin: Boolean(currentUser?.isAdmin),
          adminTitle: currentUser?.adminTitle || currentUser?.adminLabel || "",
        },
      };
      room.scores = {
        ...(room.scores || {}),
        [myId]: room?.scores?.[myId] || 0,
      };
      room.roundGuesserId = myId;
      room.roundSetterId = roundSetterId;
      room.isPublicSearch = false;
      room.expiresAt = computeRoomExpiry();

      return room;
    });

    const joinedRoom = tx.snapshot?.val();
    if (!tx.committed || !joinedRoom?.players?.[myId]) continue;

    myRole = "guest";
    partyCode = candidate.code;
    createPartyPanel.classList.remove("hidden");
    joinPartyPanel.classList.add("hidden");
    partyStatus.textContent = t("connectedOnline");
    onlineSearchStatus.textContent = t("foundPlayer");
    showScreenNotification(t("foundPlayer"), "win");

    await stopOnlineSearch({ removeOwnedRoom: true });
    subscribeToRoom(candidate.code);
    return true;
  }

  return false;
}

async function startOnlineSearch() {
  myName = getActivePlayerName();
  myId = myId || randomId();

  setSearchUiActive(true);
  onlineSearchStatus.textContent = t("searching", { time: "00:00" });
  partyStatus.textContent = t("matchmakingRunning");
  createPartyPanel.classList.add("hidden");
  joinPartyPanel.classList.add("hidden");

  searchActive = true;
  startSearchTimer();

  try {
    await cleanupExpiredRooms();

    const joined = await tryJoinWaitingRoom();
    if (!searchActive) return;
    if (joined) return;

    await createSearchRoomAsHost();
    if (searchActive) {
      startSearchRetryLoop();
    }
  } catch {
    await stopOnlineSearch();
    partyStatus.textContent = t("matchmakingError");
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
      if (isRoomExpired(room)) return;
      const players = room?.players || {};
      Object.keys(players).forEach((id) => uniquePlayers.add(id));
    });

    onlinePlayersLive.textContent = t("onlineNow", { count: uniquePlayers.size });
  };

  globalRoomsRef.on("value", globalRoomsListener);
}

function subscribeToRoom(code) {
  detachActiveRoomListener();
  lastHandledResultRound = 0;
  lastBannerKey = "";
  lastSeenRoundNumber = 0;
  unreadChatCount = 0;
  lastChatRenderedCount = 0;
  chatInitialized = false;
  updateChatUnreadBadge();

  const roomRef = db.ref("rooms/" + code);
  const listener = (snap) => {
    const room = snap.val();
    if (!room) return;
    if (isRoomExpired(room)) {
      partyStatus.textContent = t("partyNotExists");
      return;
    }
    currentRoom = room;
    updateAdminToolsVisibility();

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
      showScreenNotification(t("round", { num: currentRoundNumber }));
    }

    if (searchActive && playersCount >= 2) {
      stopOnlineSearch({ removeOwnedRoom: false });
      onlineSearchStatus.textContent = t("foundPlayer");
      showScreenNotification(t("foundPlayer"), "win");
    }

    renderChat(room);

    lobbyRoundInfo.textContent =
      playersCount < 2
        ? t("waitSecondPlayer")
        : t("lobbyRoundLine", {
            round: room.roundNumber || 1,
            setter: setterName,
            guesser: guesserName,
          });

    turnInfo.textContent = t("turnInfoLine", {
      round: room.roundNumber || 1,
      setter: setterName,
      guesser: guesserName,
    });

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
          ? t("guessTurnCenter")
          : t("waitGuessCenter")
      );

      if (room.roundGuesserId === myId) {
        setGameMessage(t("yourGuessTurn"));
      } else {
        setGameMessage(t("waitGuesserTurn"));
      }
    } else {
      showScreen(partyScreen);

      if (playersCount < 2) {
        showCenterBanner(t("waitingSecondCenter"));
      } else if (room.roundSetterId === myId) {
        showCenterBanner(t("typeWordCenter"));
      } else {
        showCenterBanner(t("waitSetterCenter", { name: setterName }));
      }

      if (room.state === "between_rounds") {
        partyStatus.textContent = room.endMessage || t("roundEnded");
      } else if (playersCount < 2) {
        partyStatus.textContent = t("partyCreatedWait");
      } else if (room.roundSetterId === myId) {
        partyStatus.textContent = t("typeWordCenter");
      } else {
        partyStatus.textContent = t("waitSetterCenter", { name: setterName });
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
        const wordReveal = room.originalWord
          ? t("endWordInfo", { word: room.originalWord })
          : "";
        if (room.resultWinnerId === myId) {
          showScreenNotification(t("youWonWithWord", { word: room.originalWord }), "win");
          startFireworks();
        } else if (room.resultLoserId === myId) {
          showScreenNotification(t("youLostWithWord", { word: room.originalWord }), "lose");
        } else {
          showScreenNotification(`${t("roundEnded")}${wordReveal}`);
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

  myName = getActivePlayerName();
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
    expiresAt: computeRoomExpiry(),
    scores: {
      [myId]: 0,
    },
    chatMessages: {},
    players: {
      [myId]: {
        id: myId,
        name: myName,
        role: "host",
        isAdmin: Boolean(currentUser?.isAdmin),
        adminTitle: currentUser?.adminTitle || currentUser?.adminLabel || "",
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

  myName = getActivePlayerName();
  myId = myId || randomId();
  myRole = "guest";

  createPartyPanel.classList.add("hidden");
  joinPartyPanel.classList.remove("hidden");
  partyStatus.textContent = t("enterPartyCode");
});

joinCodeConfirmBtn.addEventListener("click", async () => {
  await stopOnlineSearch();

  const code = joinCodeInput.value.trim().toUpperCase();
  if (!code) {
    partyStatus.textContent = t("enterCodeOnly");
    return;
  }

  const roomRef = db.ref("rooms/" + code);
  const snap = await roomRef.get();

  if (!snap.exists()) {
    partyStatus.textContent = t("partyNotExists");
    return;
  }

  const room = snap.val();
  if (isRoomExpired(room)) {
    try {
      await roomRef.remove();
    } catch {
      // ignore
    }
    partyStatus.textContent = t("partyNotExists");
    return;
  }
  const players = room.players || {};
  const playersCount = Object.keys(players).length;

  if (playersCount >= 2 && !players[myId]) {
    partyStatus.textContent = t("partyFull");
    return;
  }

  partyCode = code;

  await roomRef.child("players/" + myId).set({
    id: myId,
    name: myName,
    role: "guest",
    isAdmin: Boolean(currentUser?.isAdmin),
    adminTitle: currentUser?.adminTitle || currentUser?.adminLabel || "",
  });

  await roomRef.child("scores/" + myId).set(room.scores?.[myId] || 0);

  await roomRef.update({
    isPublicSearch: false,
    expiresAt: computeRoomExpiry(),
  });

  if (!room.roundGuesserId || room.roundGuesserId === room.roundSetterId) {
    await roomRef.update({ roundGuesserId: myId });
  }

  joinPartyPanel.classList.add("hidden");
  createPartyPanel.classList.remove("hidden");
  partyStatus.textContent = t("connectedParty");

  subscribeToRoom(code);
});

onlineSearchBtn.addEventListener("click", async () => {
  if (searchActive) return;
  await startOnlineSearch();
});

cancelSearchBtn.addEventListener("click", async () => {
  await stopOnlineSearch();
  onlineSearchPanel.classList.add("hidden");
  partyStatus.textContent = t("searchStopped");
  onlineSearchStatus.textContent = t("searchingStart");
  showCenterBanner("");
});

// ===== START ROUND (setter curent) =====
startGameBtn.addEventListener("click", async () => {
  if (!partyCode || !currentRoom) return;

  const roomRef = db.ref("rooms/" + partyCode);
  const playersCount = Object.keys(currentRoom.players || {}).length;

  if (playersCount < 2) {
    partyStatus.textContent = t("needTwoPlayers");
    return;
  }

  if (currentRoom.roundSetterId !== myId) {
    partyStatus.textContent = t("onlySetterCanStart");
    return;
  }

  const word = secretWordInput.value.trim();
  if (!word) {
    partyStatus.textContent = t("enterWord");
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
    expiresAt: computeRoomExpiry(),
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
      endMessage = t("youWonWithWord", { word: room.originalWord });
      resultWinnerId = room.roundGuesserId || "";
      resultLoserId = room.roundSetterId || "";
      resultRoundNumber = room.roundNumber || 1;
      if (resultWinnerId) {
        scores[resultWinnerId] = (scores[resultWinnerId] || 0) + 1;
      }
    } else if (isLose) {
      state = "between_rounds";
      endMessage = t("youLostWithWord", { word: room.originalWord });
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
      expiresAt: computeRoomExpiry(),
    };
  });

  void tx;
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
    partyStatus.textContent = t("copiedCode");
  } catch {
    partyStatus.textContent = t("copyFail");
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

langRoBtn?.addEventListener("click", () => setLanguage("ro"));
langRuBtn?.addEventListener("click", () => setLanguage("ru"));

authOpenBtn?.addEventListener("click", () => {
  openAuthModal();
});

authCloseBtn?.addEventListener("click", () => {
  closeAuthModal();
});

authModal?.addEventListener("click", (e) => {
  if (e.target === authModal) {
    closeAuthModal();
  }
});

authAdminCheckbox?.addEventListener("change", () => {
  syncAdminSecretVisibility();
});

authRegisterBtn?.addEventListener("click", async () => {
  try {
    await registerAccount();
  } catch {
    setAuthStatus(t("matchmakingError"));
  }
});

authLoginBtn?.addEventListener("click", async () => {
  try {
    await loginAccount();
  } catch {
    setAuthStatus(t("matchmakingError"));
  }
});

authAnonBtn?.addEventListener("click", () => {
  continueAnonymous();
});

authLogoutBtn?.addEventListener("click", () => {
  logoutAccount();
});

adminPeekWordBtn?.addEventListener("click", () => {
  adminPeekEnemyWord();
});

adminRemoveWrongBtn?.addEventListener("click", async () => {
  await adminRemoveWrongGuess();
});

chatToggleBtn?.addEventListener("click", () => {
  setChatWindowOpen(!chatWindowOpen);
});

chatMinimizeBtn?.addEventListener("click", () => {
  setChatWindowOpen(false);
});

function persistDeviceMode(mode) {
  localStorage.setItem("spz_device_mode", mode);
  setCookie("spz_device_mode", mode);
}

function chooseDeviceMode(mode) {
  applyDeviceMode(mode);
  persistDeviceMode(mode);
  deviceModal?.classList.add("hidden");
}

deviceAutoBtn?.addEventListener("click", () => chooseDeviceMode("auto"));
devicePhoneBtn?.addEventListener("click", () => chooseDeviceMode("phone"));
devicePcBtn?.addEventListener("click", () => chooseDeviceMode("pc"));

window.addEventListener("resize", () => {
  if (currentDeviceMode === "auto") {
    applyDeviceMode("auto");
  }
});

function initPreferences() {
  const savedLang = localStorage.getItem("spz_lang") || getCookie("spz_lang") || "ro";
  setLanguage(savedLang);

  try {
    const rawSavedUser = localStorage.getItem("spz_user");
    if (rawSavedUser) {
      const parsedUser = JSON.parse(rawSavedUser);
      if (parsedUser?.displayName) {
        setCurrentUser({
          usernameKey: parsedUser.usernameKey || "",
          displayName: parsedUser.displayName,
          isAdmin: Boolean(parsedUser.isAdmin),
          adminTitle:
            parsedUser.adminTitle ||
            parsedUser.adminLabel ||
            (parsedUser.isAdmin ? "Administrator" : ""),
          isAnonymous: Boolean(parsedUser.isAnonymous),
        });
      }
    }
  } catch {
    localStorage.removeItem("spz_user");
  }

  const savedMode =
    localStorage.getItem("spz_device_mode") || getCookie("spz_device_mode") || "";
  if (savedMode === "auto" || savedMode === "phone" || savedMode === "pc") {
    applyDeviceMode(savedMode);
    deviceModal?.classList.add("hidden");
  } else {
    applyDeviceMode("auto");
    deviceModal?.classList.remove("hidden");
  }
}

buildKeyboard();
showScreen(partyScreen);
initPreferences();
syncAdminSecretVisibility();
updateChatUnreadBadge();
setChatWindowOpen(false);
startRoomCleanupLoop();
subscribeOnlinePlayersLive();