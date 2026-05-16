// =========================
// ELEMENTS
// =========================

const profileAvatar =
  document.getElementById(
    "profile-avatar"
  );

const profileUsername =
  document.getElementById(
    "profile-username"
  );

const profileEmail =
  document.getElementById(
    "profile-email"
  );

const usernameForm =
  document.getElementById(
    "username-form"
  );

const usernameInput =
  document.getElementById(
    "username-input"
  );

const logoutBtn =
  document.getElementById(
    "logout-btn"
  );

const backBtn =
  document.getElementById(
    "back-btn"
  );

const settingsMessage =
  document.getElementById(
    "settings-message"
  );

// =========================
// STATE
// =========================

let currentUser = null;

let currentProfile = null;

// =========================
// MESSAGE
// =========================

function showMessage(
  text,
  success = false
) {

  settingsMessage.innerText =
    text;

  settingsMessage.style.color =
    success
      ? "#4ade80"
      : "#f87171";

}

// =========================
// LOAD USER
// =========================

async function loadUser() {

  const {
    data: { user },
    error
  } =
    await supabase.auth
      .getUser();

  if (
    error ||
    !user
  ) {

    window.location.href =
      "login.html";

    return false;

  }

  currentUser =
    user;

  return true;

}

// =========================
// LOAD PROFILE
// =========================

async function loadProfile() {

  const {
    data: profile,
    error
  } =
    await supabase
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .single();

  if (
    error ||
    !profile
  ) {

    showMessage(
      "Could not load profile."
    );

    return false;

  }

  currentProfile =
    profile;

  renderProfile();

  return true;

}

// =========================
// RENDER PROFILE
// =========================

function renderProfile() {

  profileUsername.innerText =
    currentProfile.username;

  profileEmail.innerText =
    currentUser.email;

  profileAvatar.innerText =
    currentProfile.avatar ||

    currentProfile.username
      .charAt(0)
      .toUpperCase();

  usernameInput.value =
    currentProfile.username;

}

// =========================
// CHANGE USERNAME
// =========================

usernameForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const newUsername =
      usernameInput.value
        .trim();

    if (
      !newUsername
    ) {

      showMessage(
        "Enter a username."
      );

      return;

    }

    // CHECK DUPLICATE

    const {
      data: existingUser
    } =
      await supabase
        .from("profiles")
        .select("id")
        .eq(
          "username",
          newUsername
        )
        .neq(
          "id",
          currentUser.id
        )
        .maybeSingle();

    if (
      existingUser
    ) {

      showMessage(
        "Username already taken."
      );

      return;

    }

    // UPDATE PROFILE

    const {
      error
    } =
      await supabase
        .from("profiles")
        .update({

          username:
            newUsername,

          avatar:
            newUsername
              .charAt(0)
              .toUpperCase()

        })
        .eq(
          "id",
          currentUser.id
        );

    if (error) {

      showMessage(
        error.message
      );

      return;

    }

    // RELOAD PROFILE

    await loadProfile();

    showMessage(
      "Username updated.",
      true
    );

  }
);

// =========================
// LOGOUT
// =========================

logoutBtn.addEventListener(
  "click",
  async () => {

    await supabase.auth
      .signOut();

    window.location.href =
      "index.html";

  }
);

// =========================
// BACK
// =========================

backBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "index.html";

  }
);

// =========================
// START
// =========================

async function start() {

  const loadedUser =
    await loadUser();

  if (!loadedUser)
    return;

  await loadProfile();

}

start();