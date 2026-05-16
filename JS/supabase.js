// =================================================
// SUPABASE CLIENT
// =================================================

const SUPABASE_URL =
  "https://hdujnzxfehczhwmklpak.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdWpuenhmZWhjemh3bWtscGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzY1NzcsImV4cCI6MjA5NDQ1MjU3N30.LDNuPK5cdFrAyZCNVfUUGHPq5D6n1YvrwbSzBvvDBvI";

const supabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

// =================================================
// AUTH
// =================================================

// SIGN UP

async function signUp(
  email,
  password,
  username
) {

  try {

    const {
      data,
      error
    } =
      await supabase.auth.signUp({
        email,
        password
      });

    if (error) {
      throw error;
    }

    const user =
      data.user;

    // CREATE PROFILE

    if (user) {

      const {
        error: profileError
      } =
        await supabase
          .from("profiles")
          .insert([
            {
              id:
                user.id,

              username:
                username,

              avatar:
                "Y",

              chips:
                1000
            }
          ]);

      if (profileError) {
        console.error(
          "Profile creation error:",
          profileError
        );
      }

    }

    return {
      success: true,
      data
    };

  } catch (err) {

    console.error(
      "Signup error:",
      err.message
    );

    return {
      success: false,
      error: err.message
    };

  }

}

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
      await supabase.auth
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

  } catch (err) {

    console.error(
      "Login error:",
      err.message
    );

    return {
      success: false,
      error: err.message
    };

  }

}

// LOGOUT

async function logout() {

  const {
    error
  } =
    await supabase.auth
      .signOut();

  if (error) {

    console.error(
      "Logout error:",
      error.message
    );

  }

}

// GET CURRENT USER

async function getCurrentUser() {

  const {
    data,
    error
  } =
    await supabase.auth
      .getUser();

  if (error) {

    console.error(
      "Get user error:",
      error.message
    );

    return null;

  }

  return data.user;

}

// GET SESSION

async function getSession() {

  const {
    data,
    error
  } =
    await supabase.auth
      .getSession();

  if (error) {

    console.error(
      "Session error:",
      error.message
    );

    return null;

  }

  return data.session;

}

// =================================================
// PROFILE HELPERS
// =================================================

// GET PROFILE

async function getProfile(
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

    if (error) {
      throw error;
    }

    return data;

  } catch (err) {

    console.error(
      "Get profile error:",
      err.message
    );

    return null;

  }

}

// UPDATE PROFILE

async function updateProfile(
  userId,
  updates
) {

  try {

    const {
      error
    } =
      await supabase
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

  } catch (err) {

    console.error(
      "Update profile error:",
      err.message
    );

    return false;

  }

}

// =================================================
// ROOM HELPERS
// =================================================

// GENERATE ROOM CODE

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

// CREATE ROOM

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
      await supabase
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

  } catch (err) {

    console.error(
      "Create room error:",
      err.message
    );

    return {
      success: false,
      error: err.message
    };

  }

}

// JOIN ROOM

async function joinRoom(
  roomCode,
  playerId
) {

  try {

    // FIND ROOM

    const {
      data: room,
      error: roomError
    } =
      await supabase
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

    // JOIN ROOM

    const {
      error: joinError
    } =
      await supabase
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

  } catch (err) {

    console.error(
      "Join room error:",
      err.message
    );

    return {
      success: false,
      error: err.message
    };

  }

}

// =================================================
// REALTIME PLACEHOLDERS
// =================================================

// ROOM SUBSCRIPTION

function subscribeToRoom(
  roomId,
  callback
) {

  return supabase
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

// GAME STATE SUBSCRIPTION

function subscribeToGameState(
  roomId,
  callback
) {

  return supabase
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
// GLOBAL ACCESS
// =================================================

window.supabaseClient =
  supabase;

window.supabaseHelpers = {

  signUp,
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