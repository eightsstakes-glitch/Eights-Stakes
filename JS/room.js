document.addEventListener("DOMContentLoaded", async () => {

  /* =========================
     ELEMENTS
  ========================= */

  const roomCodeText =
    document.getElementById(
      "room-code"
    );

  const playerCount =
    document.getElementById(
      "player-count"
    );

  const playerList =
    document.getElementById(
      "player-list"
    );

  const readyBtn =
    document.getElementById(
      "ready-btn"
    );

  const startBtn =
    document.getElementById(
      "start-btn"
    );

  const leaveBtn =
    document.getElementById(
      "leave-btn"
    );

  /* =========================
     STATE
  ========================= */

  let currentUser = null;

  let currentProfile = null;

  let currentRoom = null;

  let currentPlayer = null;

  let players = [];

  let roomSubscription = null;

  /* =========================
     LOAD CURRENT USER
  ========================= */

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
     ROOM CODE
  ========================= */

  const params =
    new URLSearchParams(
      window.location.search
    );

  const roomCode =
    params.get("code");

  if (!roomCode) {

    window.location.href =
      "multiplayer-lobby.html";

    return;

  }

  roomCodeText.innerText =
    roomCode;

  /* =========================
     LOAD ROOM
  ========================= */

  await loadRoom();

  /* =========================
     REALTIME
  ========================= */

  subscribeToRoom();

  /* =========================
     LOAD ROOM
  ========================= */

  async function loadRoom() {

    const {
      data: room
    } =
      await supabase
        .from("rooms")
        .select("*")
        .eq(
          "room_code",
          roomCode
        )
        .single();

    if (!room) {

      alert(
        "ROOM NOT FOUND"
      );

      window.location.href =
        "multiplayer-lobby.html";

      return;

    }

    currentRoom = room;

    const {
      data: roomPlayers
    } =
      await supabase
        .from("room_players")
        .select(`
          *,
          profiles (
            id,
            username,
            avatar,
            chips
          )
        `)
        .eq(
          "room_id",
          room.id
        );

    players =
      roomPlayers || [];

    currentPlayer =
      players.find(
        player =>
          player.player_id ===
          currentUser.id
      );

    renderPlayers();

  }

  /* =========================
     RENDER PLAYERS
  ========================= */

  function renderPlayers() {

    playerList.innerHTML = "";

    playerCount.innerText =
      `${players.length} / ${currentRoom.max_players}`;

    players.forEach(player => {

      const profile =
        player.profiles;

      const isHost =
        currentRoom.host_id ===
        player.player_id;

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "player-card";

      card.innerHTML = `

        <div class="player-left">

          <div class="player-avatar">

            ${
              profile?.avatar ||

              profile?.username
                ?.charAt(0)
                ?.toUpperCase() ||

              "P"
            }

          </div>

          <div class="player-info">

            <div class="player-name">

              ${
                profile?.username ||
                "PLAYER"
              }

            </div>

            <div class="player-role">

              ${
                isHost
                ? "HOST"
                : "PLAYER"
              }

            </div>

          </div>

        </div>

        <div
          class="
            ready-badge
            ${
              player.ready
              ? "ready-on"
              : "ready-off"
            }
          "
        >

          ${
            player.ready
            ? "READY"
            : "NOT READY"
          }

        </div>

      `;

      playerList.appendChild(
        card
      );

    });

    const isHost =
      currentRoom.host_id ===
      currentUser.id;

    startBtn.style.display =
      isHost
        ? "block"
        : "none";

    if (currentPlayer) {

      readyBtn.innerText =
        currentPlayer.ready
          ? "UNREADY"
          : "READY";

    }

  }

  /* =========================
     READY
  ========================= */

  readyBtn.addEventListener(
    "click",
    async () => {

      if (!currentPlayer)
        return;

      await supabase
        .from("room_players")
        .update({

          ready:
            !currentPlayer.ready

        })
        .eq(
          "id",
          currentPlayer.id
        );

    }
  );

  /* =========================
     START GAME
  ========================= */

  startBtn.addEventListener(
    "click",
    async () => {

      const isHost =
        currentRoom.host_id ===
        currentUser.id;

      if (!isHost)
        return;

      /* READY CHECK */

      const everyoneReady =
        players.every(
          player =>

            player.ready ||

            player.player_id ===
            currentRoom.host_id
        );

      if (!everyoneReady) {

        alert(
          "ALL PLAYERS MUST READY"
        );

        return;

      }

      /* CLEAN OLD */

      await supabase
        .from("game_state")
        .delete()
        .eq(
          "room_id",
          currentRoom.id
        );

      await supabase
        .from("player_cards")
        .delete()
        .eq(
          "room_id",
          currentRoom.id
        );

      /* CREATE DECK */

      const deck =
        shuffleDeck(
          createDeck()
        );

      /* DEAL CARDS */

      for (const player of players) {

        const cards = [];

        for (
          let i = 0;
          i < 7;
          i++
        ) {

          cards.push(
            deck.pop()
          );

        }

        await supabase
          .from("player_cards")
          .insert([

            {
              room_id:
                currentRoom.id,

              player_id:
                player.player_id,

              cards
            }

          ]);

      }

      /* FIRST CARD */

      let firstCard =
        deck.pop();

      while (

        firstCard.type ===
        "joker" ||

        firstCard.type ===
        "wild"

      ) {

        deck.unshift(
          firstCard
        );

        shuffleDeck(deck);

        firstCard =
          deck.pop();

      }

      /* CREATE GAME */

      await supabase
        .from("game_state")
        .insert([

          {
            room_id:
              currentRoom.id,

            current_turn:
              players[0].player_id,

            direction:
              1,

            current_suit:
              firstCard.suit,

            current_card:
              firstCard,

            draw_stack:
              0,

            discard_pile: [
              firstCard
            ],

            draw_pile:
              deck,

            winner_id:
              null,

            started:
              true
          }

        ]);

      /* UPDATE ROOM */

      await supabase
        .from("rooms")
        .update({

          status:
            "playing"

        })
        .eq(
          "id",
          currentRoom.id
        );

    }
  );

  /* =========================
     LEAVE ROOM
  ========================= */

  leaveBtn.addEventListener(
    "click",
    async () => {

      if (!currentPlayer)
        return;

      await supabase
        .from("room_players")
        .delete()
        .eq(
          "id",
          currentPlayer.id
        );

      window.location.href =
        "multiplayer-lobby.html";

    }
  );

  /* =========================
     REALTIME
  ========================= */

  function subscribeToRoom() {

    roomSubscription =
      supabase

        .channel(
          `room-${currentRoom.id}`
        )

        /* PLAYERS */

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "room_players",
            filter:
              `room_id=eq.${currentRoom.id}`
          },
          async () => {

            await loadRoom();

          }
        )

        /* ROOM */

        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table:
              "rooms",
            filter:
              `id=eq.${currentRoom.id}`
          },
          async payload => {

            if (
              payload.new.status ===
              "playing"
            ) {

              window.location.href =
                `multiplayer-game.html?code=${roomCode}`;

            }

          }
        )

        .subscribe();

  }

  /* =========================
     CLEANUP
  ========================= */

  window.addEventListener(
    "beforeunload",
    () => {

      if (
        roomSubscription
      ) {

        supabase.removeChannel(
          roomSubscription
        );

      }

    }
  );

});