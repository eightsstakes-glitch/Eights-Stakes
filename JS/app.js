// =========================
// ELEMENTS
// =========================

const botsBtn =
  document.getElementById(
    "bots-btn"
  );

const multiplayerBtn =
  document.getElementById(
    "multiplayer-btn"
  );

const accountBtn =
  document.getElementById(
    "account-btn"
  );

const rulebookBtn =
  document.getElementById(
    "rulebook-btn"
  );

const settingsBtn =
  document.getElementById(
    "settings-btn"
  );

const accountName =
  document.getElementById(
    "account-name"
  );

const accountAvatar =
  document.getElementById(
    "account-avatar"
  );

const menuSubtitle =
  document.getElementById(
    "menu-subtitle"
  );

// =========================
// CHECK SESSION
// =========================

async function checkSession() {

  try {

    const {
      data,
      error
    } =
      await supabase.auth
        .getSession();

    if (
      error ||
      !data.session
    ) {

      setLoggedOutUI();

      return;

    }

    const user =
      data.session.user;

    await loadProfile(
      user.id
    );

  }

  catch {

    setLoggedOutUI();

  }

}

// =========================
// LOAD PROFILE
// =========================

async function loadProfile(
  userId
) {

  try {

    const {
      data,
      error
    } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          userId
        )
        .single();

    if (
      error ||
      !data
    ) {

      setLoggedOutUI();

      return;

    }

    setLoggedInUI(
      data
    );

  }

  catch {

    setLoggedOutUI();

  }

}

// =========================
// LOGGED IN UI
// =========================

function setLoggedInUI(
  profile
) {

  if (accountName) {

    accountName.innerText =
      profile.username;

  }

  if (accountAvatar) {

    accountAvatar.innerText =
      profile.avatar ||

      profile.username
        .charAt(0)
        .toUpperCase();

  }

  if (accountBtn) {

    accountBtn.innerText =
      "LOGOUT";

  }

  if (menuSubtitle) {

    menuSubtitle.innerText =
      "Ready for multiplayer.";

  }

}

// =========================
// LOGGED OUT UI
// =========================

function setLoggedOutUI() {

  if (accountName) {

    accountName.innerText =
      "GUEST";

  }

  if (accountAvatar) {

    accountAvatar.innerText =
      "G";

  }

  if (accountBtn) {

    accountBtn.innerText =
      "LOGIN";

  }

  if (menuSubtitle) {

    menuSubtitle.innerText =
      "Choose your game mode.";

  }

}

// =========================
// PLAY VS BOTS
// =========================

if (botsBtn) {

  botsBtn.addEventListener(
    "click",
    () => {

      localStorage.setItem(
        "gameMode",
        "bots"
      );

      window.location.href =
        "bot-lobby.html";

    }
  );

}

// =========================
// MULTIPLAYER
// =========================

if (multiplayerBtn) {

  multiplayerBtn.addEventListener(
    "click",
    async () => {

      try {

        const {
          data
        } =
          await supabase.auth
            .getSession();

        if (
          !data.session
        ) {

          window.location.href =
            "login.html";

          return;

        }

        localStorage.setItem(
          "gameMode",
          "multiplayer"
        );

        window.location.href =
          "multiplayer-lobby.html";

      }

      catch {

        window.location.href =
          "login.html";

      }

    }
  );

}

// =========================
// RULEBOOK
// =========================

if (rulebookBtn) {

  rulebookBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "rulebook.html";

    }
  );

}

// =========================
// SETTINGS
// =========================

if (settingsBtn) {

  settingsBtn.addEventListener(
    "click",
    async () => {

      try {

        const {
          data
        } =
          await supabase.auth
            .getSession();

        if (
          !data.session
        ) {

          window.location.href =
            "login.html";

          return;

        }

        window.location.href =
          "settings.html";

      }

      catch {

        window.location.href =
          "login.html";

      }

    }
  );

}

// =========================
// ACCOUNT BUTTON
// =========================

if (accountBtn) {

  accountBtn.addEventListener(
    "click",
    async () => {

      try {

        const {
          data
        } =
          await supabase.auth
            .getSession();

        // NOT LOGGED IN

        if (
          !data.session
        ) {

          window.location.href =
            "login.html";

          return;

        }

        // LOGOUT

        await supabase.auth
          .signOut();

        window.location.reload();

      }

      catch {

        window.location.href =
          "login.html";

      }

    }
  );

}

// =========================
// START
// =========================

checkSession();