document.addEventListener("DOMContentLoaded", async () => {

  /* =========================
     ROOM
  ========================= */

  const ROOM_CODE =
    localStorage.getItem(
      "roomCode"
    );

  if (!ROOM_CODE) {

    window.location.href =
      "multiplayer-lobby.html";

    return;

  }

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
     ELEMENTS
  ========================= */

  const playerHand =
    document.getElementById(
      "player-hand"
    );

  const topPlayers =
    document.getElementById(
      "top-players"
    );

  const leftPlayer =
    document.getElementById(
      "left-player"
    );

  const rightPlayer =
    document.getElementById(
      "right-player"
    );

  const discardPile =
    document.getElementById(
      "discard-pile"
    );

  const drawPile =
    document.getElementById(
      "draw-pile"
    );

  const drawCount =
    document.getElementById(
      "draw-count"
    );

  const turnIndicator =
    document.getElementById(
      "turn-indicator"
    );

  const currentSuitText =
    document.getElementById(
      "current-suit"
    );

  const stackIndicator =
    document.getElementById(
      "stack-indicator"
    );

  const roomIdText =
    document.getElementById(
      "room-id"
    );

  const loadingOverlay =
    document.getElementById(
      "loading-overlay"
    );

  const suitPicker =
    document.getElementById(
      "suit-picker"
    );

  const suitButtons =
    document.querySelectorAll(
      ".suit-btn"
    );

  roomIdText.innerText =
    ROOM_CODE;

  /* =========================
     STATE
  ========================= */

  let room = null;

  let gameState = null;

  let players = [];

  let myCards = [];

  let allCards = [];

  let pendingWildCard = null;

  /* =========================
     LOAD ROOM
  ========================= */

  async function loadRoom() {

    const {
      data
    } = await supabase
      .from("rooms")
      .select("*")
      .eq(
        "room_code",
        ROOM_CODE
      )
      .single();

    room = data;

  }

  /* =========================
     LOAD PLAYERS
  ========================= */

  async function loadPlayers() {

    const {
      data
    } = await supabase
      .from("room_players")
      .select(`
        *,
        profiles (
          username,
          avatar,
          chips
        )
      `)
      .eq(
        "room_id",
        room.id
      );

    players = data || [];

  }

  /* =========================
     LOAD GAME STATE
  ========================= */

  async function loadGameState() {

    const {
      data
    } = await supabase
      .from("game_state")
      .select("*")
      .eq(
        "room_id",
        room.id
      )
      .single();

    gameState = data;

  }

  /* =========================
     LOAD ALL CARDS
  ========================= */

  async function loadAllCards() {

    const {
      data
    } = await supabase
      .from("player_cards")
      .select("*")
      .eq(
        "room_id",
        room.id
      );

    allCards = data || [];

    const mine =
      allCards.find(
        card =>
          card.player_id ===
          currentUser.id
      );

    myCards =
      mine?.cards || [];

  }

  /* =========================
     VALID MOVE
  ========================= */

  function canPlayCard(card) {

  /* STACK RESPONSE */

  if (
    gameState.draw_stack > 0
  ) {

    return (

      card.type === "draw2" ||

      card.type === "joker"

    );

  }

  /* JOKER */

  if (
    card.type === "joker"
  ) {

    return true;

  }

  /* WILD */

  if (
    card.type === "wild"
  ) {

    return true;

  }

  /* SAME SUIT */

  if (
    card.suit ===
    gameState.current_suit
  ) {

    return true;

  }

  /* SAME VALUE */

  if (
    card.value ===
    gameState.current_card
    ?.value
  ) {

    return true;

  }

  return false;

}

  /* =========================
     NEXT PLAYER
  ========================= */

  function getNextPlayer(
    skips = 1
  ) {

    const currentIndex =
      players.findIndex(
        player =>
          player.player_id ===
          gameState.current_turn
      );

    let nextIndex =
      currentIndex;

    for (
      let i = 0;
      i < skips;
      i++
    ) {

      nextIndex +=
        gameState.direction || 1;

      if (
        nextIndex >=
        players.length
      ) {

        nextIndex = 0;

      }

      if (
        nextIndex < 0
      ) {

        nextIndex =
          players.length - 1;

      }

    }

    return players[nextIndex];

  }

 /* =========================
   PLAY CARD
========================= */

async function playCard(
  index,
  chosenSuit = null
) {

  /* GAME OVER */

  if (
    gameState.winner_id
  ) {

    return;

  }

  if (
    gameState.current_turn !==
    currentUser.id
  ) {

    return;

  }

  const card =
    myCards[index];

  if (!card)
    return;

  if (
    !canPlayCard(card)
  ) {

    return;

  }

  /* WILD PICKER */

  if (
    card.type === "wild" &&
    !chosenSuit
  ) {

    pendingWildCard = index;

    suitPicker.style.display =
      "flex";

    return;

  }

  /* REMOVE CARD */

  myCards.splice(
    index,
    1
  );

  /* SAVE CARDS */

  await supabase
    .from("player_cards")
    .update({

      cards: myCards

    })
    .eq(
      "room_id",
      room.id
    )
    .eq(
      "player_id",
      currentUser.id
    );

  /* EFFECTS */

  let direction =
    gameState.direction || 1;

  let drawStack =
    gameState.draw_stack || 0;

  let skips = 1;

 /* REVERSE */

if (
  card.type === "reverse"
) {

  direction *= -1;

  /* 1V1 = SAME PLAYER */

  if (
    players.length === 2
  ) {

    skips = 2;

  }

}

  /* SKIP */

  if (
    card.type === "skip"
  ) {

    skips = 2;

  }

  if (
    card.type === "draw2"
  ) {

    drawStack += 2;

  }

  if (
    card.type === "joker"
  ) {

    drawStack += 4;

  }

  if (
    card.type === "burn"
  ) {

    skips = 0;

  }

  const nextPlayer =
    getNextPlayer(skips);

  /* WIN */

  let winnerId = null;

  if (
    myCards.length <= 0
  ) {

    winnerId =
      currentUser.id;

  }

  /* UPDATE GAME */

  await supabase
    .from("game_state")
    .update({

      current_card: card,

      current_suit:
        chosenSuit ||
        card.suit,

      current_turn:
        nextPlayer.player_id,

      direction,

      draw_stack:
        drawStack,

      winner_id:
        winnerId

    })
    .eq(
      "room_id",
      room.id
    );

}

   /* =========================
   DRAW CARD
========================= */

drawPile.addEventListener(
  "click",
  async () => {

    /* GAME OVER */

    if (
      gameState.winner_id
    ) {

      return;

    }

    if (
      gameState.current_turn !==
      currentUser.id
    ) {

      return;

    }

    /* STACK RESPONSE */

    if (
      gameState.draw_stack > 0
    ) {

      const canRespond =
        myCards.some(card =>

          card.type === "draw2" ||

          card.type === "joker"

        );

      /* MUST RESPOND */

      if (
        canRespond
      ) {

        return;

      }

    }

    let pile =
      gameState.draw_pile || [];

    /* RESHUFFLE */

if (
  pile.length <= 0
) {

  const discard =
    [
      ...(gameState.discard_pile || [])
    ];

  /* KEEP TOP CARD */

  discard.pop();

  /* SHUFFLE */

  pile =
    shuffleDeck(
      discard
    );

}

    /* DRAW */

    for (
      let i = 0;
      i < amount;
      i++
    ) {

      const drawn =
        pile.pop();

      if (drawn) {

        myCards.push(
          drawn
        );

      }

    }

    await supabase
      .from("player_cards")
      .update({

        cards: myCards

      })
      .eq(
        "room_id",
        room.id
      )
      .eq(
        "player_id",
        currentUser.id
      );

    /* CHECK PLAYABLE */

    const lastDrawn =
      myCards[
        myCards.length - 1
      ];

    const canStillPlay =
      canPlayCard(
        lastDrawn
      );

    /* ONLY END TURN
       IF NO PLAY */

    if (!canStillPlay) {

      const nextPlayer =
        getNextPlayer();

      await supabase
        .from("game_state")
        .update({

          draw_pile: pile,

          draw_stack: 0,

          current_turn:
            nextPlayer.player_id

        })
        .eq(
          "room_id",
          room.id
        );

    }

    /* KEEP TURN */

    else {

      await supabase
        .from("game_state")
        .update({

          draw_pile: pile,

          draw_stack: 0

        })
        .eq(
          "room_id",
          room.id
        );

    }

  }
);

  /* =========================
     SUIT PICKER
  ========================= */

  suitButtons.forEach(btn => {

    btn.addEventListener(
      "click",
      async () => {

        suitPicker.style.display =
          "none";

        await playCard(
          pendingWildCard,
          btn.dataset.suit
        );

      }
    );

  });

  /* =========================
     RENDER HAND
  ========================= */

  function renderHand() {

    playerHand.innerHTML = "";

    myCards.forEach(
      (card, index) => {

        const wrapper =
          document.createElement(
            "div"
          );

        wrapper.innerHTML =
          createCardHTML(card);

        const cardElement =
          wrapper.firstElementChild;

        if (
          !canPlayCard(card)
        ) {

          cardElement.style.opacity =
            "0.4";

        }

        cardElement.addEventListener(
          "click",
          () => {

            playCard(index);

          }
        );

        playerHand.appendChild(
          cardElement
        );

      }
    );

  }

  /* =========================
     RENDER DISCARD
  ========================= */

  function renderDiscard() {

    if (
      !gameState.current_card
    )
      return;

    discardPile.innerHTML =
      createCardHTML(
        gameState.current_card
      );

  }

  /* =========================
     RENDER UI
  ========================= */

  function renderUI() {

    drawCount.innerText =
      gameState.draw_pile
      ?.length || 0;

    currentSuitText.innerText =
      gameState.current_suit;

    if (
      gameState.draw_stack > 0
    ) {

      stackIndicator.innerText =
        `STACK +${gameState.draw_stack}`;

    }

    else {

      stackIndicator.innerText =
        "NO STACK";

    }

    const current =
      players.find(
        player =>
          player.player_id ===
          gameState.current_turn
      );

    turnIndicator.innerText =
      `${
        current?.profiles
        ?.username || "PLAYER"
      } TURN`;

  }

  /* =========================
     RENDER PLAYERS
  ========================= */

  function renderPlayers() {

    topPlayers.innerHTML = "";

    leftPlayer.innerHTML = "";

    rightPlayer.innerHTML = "";

    const others =
      players.filter(
        player =>
          player.player_id !==
          currentUser.id
      );

    others.forEach(
      (
        player,
        index
      ) => {

        const cardData =
          allCards.find(
            c =>
              c.player_id ===
              player.player_id
          );

        const cardCount =
          cardData?.cards
          ?.length || 0;

        const slot =
          document.createElement(
            "div"
          );

        slot.className =
          "player-slot";

        slot.innerHTML = `

          <div class="player-tag">

            ${
              player.profiles
              ?.username ||
              "PLAYER"
            }

            •

            ${cardCount} CARDS

          </div>

          <div class="bot-hand">

            ${Array(
              Math.min(
                cardCount,
                7
              )
            )
            .fill("")
            .map(() =>
              createBackCardHTML()
            )
            .join("")}

          </div>

        `;

        if (index === 0)
          topPlayers.appendChild(slot);

        if (index === 1)
          leftPlayer.appendChild(slot);

        if (index === 2)
          rightPlayer.appendChild(slot);

      }
    );

  }

  /* =========================
     WINNER
  ========================= */

  function renderWinner() {

    if (
      !gameState.winner_id
    )
      return;

    document.getElementById(
      "win-screen"
    ).style.display = "flex";

  }

  /* =========================
     RENDER EVERYTHING
  ========================= */

  function renderEverything() {

    renderHand();

    renderDiscard();

    renderUI();

    renderPlayers();

    renderWinner();

  }

  /* =========================
   LEAVE GAME
========================= */

const leaveBtn =
  document.getElementById(
    "leave-btn"
  );

leaveBtn.addEventListener(
  "click",
  async () => {

    try {

      /* REMOVE PLAYER */

      await supabase
        .from("room_players")
        .delete()
        .eq(
          "room_id",
          room.id
        )
        .eq(
          "player_id",
          currentUser.id
        );

      /* REMOVE CARDS */

      await supabase
        .from("player_cards")
        .delete()
        .eq(
          "room_id",
          room.id
        )
        .eq(
          "player_id",
          currentUser.id
        );

      /* HOST CLEANUP */

      if (
        room.host_id ===
        currentUser.id
      ) {

        await supabase
          .from("game_state")
          .delete()
          .eq(
            "room_id",
            room.id
          );

        await supabase
          .from("rooms")
          .delete()
          .eq(
            "id",
            room.id
          );

      }

      /* CLEAR STORAGE */

      localStorage.removeItem(
        "roomCode"
      );

      /* REDIRECT */

      window.location.href =
        "multiplayer-lobby.html";

    }

    catch (err) {

      console.error(err);

      alert(
        err.message
      );

    }

  }
);

  /* =========================
     REALTIME
  ========================= */

  supabase
    .channel(
      `room-${ROOM_CODE}`
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "game_state"
      },
      async () => {

        await loadGameState();

        await loadAllCards();

        await loadPlayers();

        renderEverything();

      }
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "player_cards"
      },
      async () => {

        await loadGameState();

        await loadAllCards();

        await loadPlayers();

        renderEverything();

      }
    )

    .subscribe();

  /* =========================
     START
  ========================= */

  await loadRoom();

  await loadPlayers();

  await loadGameState();

  await loadAllCards();

  renderEverything();

  loadingOverlay.style.display =
    "none";

});