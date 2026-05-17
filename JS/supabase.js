// =================================================
// SUPABASE CLIENT
// =================================================

const SUPABASE_URL =
  "https://hdujnzxfehczhwmklpak.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdWpuenhmZWhjemh3bWtscGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzY1NzcsImV4cCI6MjA5NDQ1MjU3N30.LDNuPK5cdFrAyZCNVfUUGHPq5D6n1YvrwbSzBvvDBvI";

// =================================================
// CLIENT
// =================================================

const supabaseClient =
  window.supabase.createClient(

    SUPABASE_URL,

    SUPABASE_ANON_KEY

  );

// =================================================
// GLOBAL ACCESS
// =================================================

window.supabase =
  supabaseClient;

// =================================================
// AUTH
// =================================================

// LOGIN

async function login(
  email,
  password
) {

  try {

    const {
      data,
      error
    } =
      await window.supabase
        .auth
        .signInWithPassword({

          email,
          password

        });

    if (error) {
      throw error;
    }

    return {

      success: true,

      data

    };

  }

  catch (err) {

    console.error(
      "Login error:",
      err.message
    );

    return {

      success: false,

      error:
        err.message

    };

  }

}

// LOGOUT

async function logout() {

  const {
    error
  } =
    await window.supabase
      .auth
      .signOut();

  if (error) {

    console.error(
      "Logout error:",
      error.message
    );

  }

}

// =================================================
// SESSION
// =================================================

async function getCurrentUser() {

  const {
    data,
    error
  } =
    await window.supabase
      .auth
      .getUser();

  if (error) {

    console.error(
      error.message
    );

    return null;

  }

  return data.user;

}

async function getSession() {

  const {
    data,
    error
  } =
    await window.supabase
      .auth
      .getSession();

  if (error) {

    console.error(
      error.message
    );

    return null;

  }

  return data.session;

}

// =================================================
// PROFILE
// =================================================

async function getProfile(
  userId
) {

  try {

    const {
      data,
      error
    } =
      await window.supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          userId
        )
        .single();

    if (error) {
      throw error;
    }

    return data;

  }

  catch (err) {

    console.error(
      err.message
    );

    return null;

  }

}

async function updateProfile(
  userId,
  updates
) {

  try {

    const {
      error
    } =
      await window.supabase
        .from("profiles")
        .update(updates)
        .eq(
          "id",
          userId
        );

    if (error) {
      throw error;
    }

    return true;

  }

  catch (err) {

    console.error(
      err.message
    );

    return false;

  }

}

// =================================================
// ROOM HELPERS
// =================================================

function generateRoomCode() {

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";

  for (
    let i = 0;
    i < 6;
    i++
  ) {

    code +=
      chars.charAt(

        Math.floor(
          Math.random() *
          chars.length
        )

      );

  }

  return code;

}

async function createRoom(
  hostId
) {

  try {

    const roomCode =
      generateRoomCode();

    const {
      data,
      error
    } =
      await window.supabase
        .from("rooms")
        .insert([

          {

            room_code:
              roomCode,

            host_id:
              hostId,

            status:
              "waiting"

          }

        ])
        .select()
        .single();

    if (error) {
      throw error;
    }

    return {

      success: true,

      room: data

    };

  }

  catch (err) {

    console.error(
      err.message
    );

    return {

      success: false,

      error:
        err.message

    };

  }

}

async function joinRoom(
  roomCode,
  playerId
) {

  try {

    const {
      data: room,
      error: roomError
    } =
      await window.supabase
        .from("rooms")
        .select("*")
        .eq(
          "room_code",
          roomCode
        )
        .single();

    if (roomError) {
      throw roomError;
    }

    const {
      error: joinError
    } =
      await window.supabase
        .from("room_players")
        .insert([

          {

            room_id:
              room.id,

            player_id:
              playerId,

            ready:
              false

          }

        ]);

    if (joinError) {
      throw joinError;
    }

    return {

      success: true,

      room

    };

  }

  catch (err) {

    console.error(
      err.message
    );

    return {

      success: false,

      error:
        err.message

    };

  }

}

// =================================================
// REALTIME
// =================================================

function subscribeToRoom(
  roomId,
  callback
) {

  return window.supabase
    .channel(
      `room-${roomId}`
    )
    .on(
      "postgres_changes",
      {

        event: "*",

        schema: "public",

        table:
          "room_players",

        filter:
          `room_id=eq.${roomId}`

      },
      callback
    )
    .subscribe();

}

function subscribeToGameState(
  roomId,
  callback
) {

  return window.supabase
    .channel(
      `game-${roomId}`
    )
    .on(
      "postgres_changes",
      {

        event: "*",

        schema: "public",

        table:
          "game_state",

        filter:
          `room_id=eq.${roomId}`

      },
      callback
    )
    .subscribe();

}

// =================================================
// GLOBAL HELPERS
// =================================================

window.supabaseHelpers = {

  login,
  logout,

  getCurrentUser,
  getSession,

  getProfile,
  updateProfile,

  createRoom,
  joinRoom,

  subscribeToRoom,
  subscribeToGameState

};

console.log(
  "Supabase initialized"
);