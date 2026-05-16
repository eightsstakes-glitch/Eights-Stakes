document.addEventListener("DOMContentLoaded", async () => {

  /* =========================
     ELEMENTS
  ========================= */

  const createRoomBtn =
    document.getElementById(
      "create-room-btn"
    );

  const joinRoomBtn =
    document.getElementById(
      "join-room-btn"
    );

  const roomCodeInput =
    document.getElementById(
      "room-code"
    );

  const maxPlayersSelect =
    document.getElementById(
      "max-players"
    );

  const previewPlayers =
    document.getElementById(
      "preview-players"
    );

  const backBtn =
    document.getElementById(
      "back-btn"
    );

  /* =========================
     CURRENT USER + PROFILE
  ========================= */

  let currentUser = null;

  let currentProfile = null;

  async function loadCurrentUser() {

    const {
      data: { user },
      error
    } =
      await supabase.auth.getUser();

    if (
      error ||
      !user
    ) {

      window.location.href =
        "login.html";

      return false;

    }

    currentUser = user;

    const {
      data: profile,
      error: profileError
    } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          user.id
        )
        .single();

    if (
      profileError ||
      !profile
    ) {

      console.error(
        profileError
      );

      alert(
        "Could not load profile."
      );

      return false;

    }

    currentProfile =
      profile;

    return true;

  }

  const loaded =
    await loadCurrentUser();

  if (!loaded)
    return;

  /* =========================
     GENERATE ROOM CODE
  ========================= */

  function generateRoomCode() {

    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";

    let code = "";

    for (
      let i = 0;
      i < 6;
      i++
    ) {

      code +=
        chars[
          Math.floor(
            Math.random() *
            chars.length
          )
        ];

    }

    return code;

  }

  /* =========================
     CREATE ROOM
  ========================= */

  createRoomBtn.addEventListener(
    "click",
    async () => {

      try {

        createRoomBtn.disabled =
          true;

        createRoomBtn.innerText =
          "CREATING...";

        // ROOM CODE

        const roomCode =
          generateRoomCode();

        // MAX PLAYERS

        const maxPlayers =
          Number(
            maxPlayersSelect.value
          );

        // CREATE ROOM

        const {
          data: room,
          error: roomError
        } =
          await supabase
            .from("rooms")
            .insert([

              {
                room_code:
                  roomCode,

                host_id:
                  currentUser.id,

                status:
                  "waiting",

                max_players:
                  maxPlayers
              }

            ])
            .select()
            .single();

        if (roomError) {

          console.error(
            roomError
          );

          alert(
            "FAILED TO CREATE ROOM"
          );

          resetCreateButton();

          return;

        }

        // JOIN HOST

        const {
          error: joinError
        } =
          await supabase
            .from(
              "room_players"
            )
            .insert([

              {
                room_id:
                  room.id,

                player_id:
                  currentUser.id,

                ready:
                  false
              }

            ]);

        if (joinError) {

          console.error(
            joinError
          );

          alert(
            "FAILED TO JOIN ROOM"
          );

          resetCreateButton();

          return;

        }

        // SAVE ROOM

        localStorage.setItem(
          "roomCode",
          roomCode
        );

        localStorage.setItem(
          "roomId",
          room.id
        );

        localStorage.setItem(
          "isHost",
          "true"
        );

        // REDIRECT

        window.location.href =
          `room.html?code=${roomCode}`;

      }

      catch (err) {

        console.error(err);

        alert(
          "SOMETHING WENT WRONG"
        );

        resetCreateButton();

      }

    }
  );

  /* =========================
     JOIN ROOM
  ========================= */

  joinRoomBtn.addEventListener(
    "click",
    async () => {

      try {

        const code =
          roomCodeInput.value
            .trim()
            .toUpperCase();

        if (!code)
          return;

        joinRoomBtn.disabled =
          true;

        joinRoomBtn.innerText =
          "JOINING...";

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
              code
            )
            .single();

        if (
          roomError ||
          !room
        ) {

          alert(
            "ROOM NOT FOUND"
          );

          resetJoinButton();

          return;

        }

        // GET PLAYERS

        const {
          data: players,
          error: playersError
        } =
          await supabase
            .from(
              "room_players"
            )
            .select("*")
            .eq(
              "room_id",
              room.id
            );

        if (playersError) {

          console.error(
            playersError
          );

          resetJoinButton();

          return;

        }

        // ROOM FULL

        if (
          players.length >=
          room.max_players
        ) {

          alert(
            "ROOM IS FULL"
          );

          resetJoinButton();

          return;

        }

        // ALREADY JOINED

        const alreadyJoined =
          players.find(
            player =>
              player.player_id ===
              currentUser.id
          );

        // JOIN ROOM

        if (
          !alreadyJoined
        ) {

          const {
            error: joinError
          } =
            await supabase
              .from(
                "room_players"
              )
              .insert([

                {
                  room_id:
                    room.id,

                  player_id:
                    currentUser.id,

                  ready:
                    false
                }

              ]);

          if (joinError) {

            console.error(
              joinError
            );

            alert(
              "FAILED TO JOIN ROOM"
            );

            resetJoinButton();

            return;

          }

        }

        // SAVE ROOM

        localStorage.setItem(
          "roomCode",
          room.room_code
        );

        localStorage.setItem(
          "roomId",
          room.id
        );

        localStorage.setItem(
          "isHost",
          room.host_id ===
          currentUser.id
            ? "true"
            : "false"
        );

        // REDIRECT

        window.location.href =
          `room.html?code=${room.room_code}`;

      }

      catch (err) {

        console.error(err);

        alert(
          "SOMETHING WENT WRONG"
        );

        resetJoinButton();

      }

    }
  );

  /* =========================
     PREVIEW
  ========================= */

  maxPlayersSelect.addEventListener(
    "change",
    () => {

      previewPlayers.innerText =
        `0 / ${maxPlayersSelect.value}`;

    }
  );

  /* =========================
     BUTTON RESET
  ========================= */

  function resetCreateButton() {

    createRoomBtn.disabled =
      false;

    createRoomBtn.innerText =
      "CREATE ROOM";

  }

  function resetJoinButton() {

    joinRoomBtn.disabled =
      false;

    joinRoomBtn.innerText =
      "JOIN ROOM";

  }

  /* =========================
     BACK
  ========================= */

  backBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "index.html";

    }
  );

});