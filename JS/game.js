document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     GAME MODE
  ========================= */

  const GAME_MODE =
    localStorage.getItem(
      "gameMode"
    ) || "bots";

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

  const turnSubtext =
    document.getElementById(
      "turn-subtext"
    );

  const currentSuitText =
    document.getElementById(
      "current-suit"
    );

  const stackIndicator =
    document.getElementById(
      "stack-indicator"
    );

  const playerCardCount =
    document.getElementById(
      "player-card-count"
    );

  const suitPicker =
    document.getElementById(
      "suit-picker"
    );

  const suitButtons =
    document.querySelectorAll(
      ".suit-btn"
    );

  const winScreen =
    document.getElementById(
      "win-screen"
    );

  const winTitle =
    document.getElementById(
      "win-title"
    );

  const lastCardWarning =
    document.getElementById(
      "last-card-warning"
    );

  const leaveBtn =
    document.getElementById(
      "leave-btn"
    );

  const playAgainBtn =
    document.getElementById(
      "play-again-btn"
    );

  const returnMenuBtn =
    document.getElementById(
      "return-menu-btn"
    );

  const loadingOverlay =
    document.getElementById(
      "loading-overlay"
    );

  const roomIdText =
    document.getElementById(
      "room-id"
    );

  /* =========================
     ROOM UI
  ========================= */

  if (
    GAME_MODE === "bots"
  ) {

    roomIdText.innerText =
      "LOCAL";

  }

  else {

    roomIdText.innerText =
      localStorage.getItem(
        "roomCode"
      ) || "ONLINE";

  }

  /* =========================
     AUDIO
  ========================= */

  const sounds = {

    play:
      new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"
      ),

    draw:
      new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2045/2045-preview.mp3"
      ),

    win:
      new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3"
      ),

    stack:
      new Audio(
        "https://assets.mixkit.co/active_storage/sfx/220/220-preview.mp3"
      )

  };

  /* =========================
     GAME STATE
  ========================= */

  const gameState = {

    players: [],

    currentTurn: 0,

    direction: 1,

    drawStack: 0,

    currentCard: null,

    currentSuit: null,

    winner: null,

    deck: [],

    discardPile: [],

    gameStarted: false

  };

  /* =========================
     PLAYER COUNT
  ========================= */

  const botCount =
    Number(
      localStorage.getItem(
        "botCount"
      )
    ) || 1;

  const totalPlayers =
    botCount + 1;

  /* =========================
     CREATE PLAYERS
  ========================= */

  function createPlayers() {

    gameState.players = [];

    gameState.players.push({

      id: 1,

      name: "YOU",

      bot: false,

      cards: []

    });

    for (
      let i = 1;
      i <= botCount;
      i++
    ) {

      gameState.players.push({

        id: i + 1,

        name: `BOT ${i}`,

        bot: true,

        cards: []

      });

    }

  }

  /* =========================
     START GAME
  ========================= */

  function startGame() {

    createPlayers();

    gameState.deck =
      shuffleDeck(
        createDeck()
      );

    gameState.discardPile = [];

    gameState.currentTurn = 0;

    gameState.direction = 1;

    gameState.drawStack = 0;

    gameState.winner = null;

    /* DEAL */

    gameState.players.forEach(
      player => {

        player.cards = [];

        for (
          let i = 0;
          i < 7;
          i++
        ) {

          player.cards.push(
            gameState.deck.pop()
          );

        }

        sortCards(
          player.cards
        );

      }
    );

    /* FIRST CARD */

    let firstCard =
      gameState.deck.pop();

    while (
      firstCard.type === "joker" ||
      firstCard.type === "wild"
    ) {

      gameState.deck.unshift(
        firstCard
      );

      shuffleDeck(
        gameState.deck
      );

      firstCard =
        gameState.deck.pop();

    }

    gameState.currentCard =
      firstCard;

    gameState.currentSuit =
      firstCard.suit;

    gameState.discardPile.push(
      firstCard
    );

    gameState.gameStarted =
      true;

    renderEverything();

    updateTurnUI();

    loadingOverlay.style.display =
      "none";

  }

  /* =========================
     VALID MOVE
  ========================= */

  function canPlayCard(card) {

  /* STACK RESPONSE */

  if (
    gameState.drawStack > 0
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

    return (

      card.suit ===
      gameState.currentSuit ||

      gameState.currentCard
      .type === "wild"

    );

  }

  /* SAME SUIT */

  if (
    card.suit ===
    gameState.currentSuit
  ) {

    return true;

  }

  /* SAME VALUE */

  if (
    card.value ===
    gameState.currentCard.value
  ) {

    return true;

  }

  return false;

}

  /* =========================
     RENDER EVERYTHING
  ========================= */

  function renderEverything() {

    renderPlayerHand();

    renderOtherPlayers();

    renderDiscardPile();

    renderCounts();

    renderStack();

    renderSuit();

  }

  /* =========================
     PLAYER HAND
  ========================= */

  function renderPlayerHand() {

    playerHand.innerHTML = "";

    const player =
      gameState.players[0];

    player.cards.forEach(
      (card, index) => {

        const wrapper =
          document.createElement(
            "div"
          );

        wrapper.innerHTML =
          createCardHTML(card);

        const cardElement =
          wrapper.firstElementChild;

        const valid =
          canPlayCard(card);

        if (!valid) {

          cardElement.style.opacity =
            "0.35";

          cardElement.style.filter =
            "grayscale(0.8)";

        }

        else {

          cardElement.style.boxShadow =
            "0 0 20px rgba(139,92,246,0.25)";

        }

        cardElement.addEventListener(
          "click",
          () => {

            if (
              gameState.currentTurn !== 0
            )
              return;

            if (!valid)
              return;

            playCard(
              player,
              index
            );

          }
        );

        playerHand.appendChild(
          cardElement
        );

      }
    );

  }

  /* =========================
     OTHER PLAYERS
  ========================= */

  function renderOtherPlayers() {

    topPlayers.innerHTML = "";

    leftPlayer.innerHTML = "";

    rightPlayer.innerHTML = "";

    const bots =
      gameState.players.slice(1);

    bots.forEach(
      (player, index) => {

        const slot =
          document.createElement(
            "div"
          );

        slot.className =
          "player-slot";

        const isTurn =
          gameState.currentTurn ===
          index + 1;

        slot.innerHTML = `

          <div
            class="player-tag"
            style="
              ${
                isTurn
                ? `
                border-color:#8b5cf6;
                box-shadow:
                0 0 20px rgba(139,92,246,0.35);
                `
                : ""
              }
            "
          >

            ${player.name}

            •

            ${player.cards.length}
            CARDS

          </div>

          <div class="bot-hand">

            ${Array(
              Math.min(
                player.cards.length,
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

        if (
          totalPlayers === 2
        ) {

          topPlayers.appendChild(
            slot
          );

        }

        else if (
          totalPlayers === 3
        ) {

          if (index === 0)
            topPlayers.appendChild(slot);

          if (index === 1)
            rightPlayer.appendChild(slot);

        }

        else if (
          totalPlayers === 4
        ) {

          if (index === 0)
            leftPlayer.appendChild(slot);

          if (index === 1)
            topPlayers.appendChild(slot);

          if (index === 2)
            rightPlayer.appendChild(slot);

        }

        else if (
          totalPlayers === 5
        ) {

          if (index === 0)
            leftPlayer.appendChild(slot);

          if (index === 1)
            topPlayers.appendChild(slot);

          if (index === 2)
            topPlayers.appendChild(slot);

          if (index === 3)
            rightPlayer.appendChild(slot);

        }

        else if (
          totalPlayers === 6
        ) {

          if (index === 0)
            leftPlayer.appendChild(slot);

          if (index === 1)
            topPlayers.appendChild(slot);

          if (index === 2)
            topPlayers.appendChild(slot);

          if (index === 3)
            topPlayers.appendChild(slot);

          if (index === 4)
            rightPlayer.appendChild(slot);

        }

      }
    );

  }

  /* =========================
     DISCARD
  ========================= */

  function renderDiscardPile() {

    discardPile.innerHTML =
      createCardHTML(
        gameState.currentCard
      );

  }

  /* =========================
     COUNTS
  ========================= */

  function renderCounts() {

    drawCount.innerText =
      gameState.deck.length;

    playerCardCount.innerText =
      `${gameState.players[0]
      .cards.length} CARDS`;

    if (
      gameState.players[0]
      .cards.length === 1
    ) {

      lastCardWarning.style.display =
        "flex";

    }

    else {

      lastCardWarning.style.display =
        "none";

    }

  }

  /* =========================
     STACK
  ========================= */

  function renderStack() {

    if (
      gameState.drawStack > 0
    ) {

      stackIndicator.innerText =
        `STACK +${gameState.drawStack}`;

      stackIndicator.style.color =
        "#f87171";

    }

    else {

      stackIndicator.innerText =
        "NO STACK";

      stackIndicator.style.color =
        "";

    }

  }

  /* =========================
     SUIT
  ========================= */

  function renderSuit() {

    currentSuitText.innerText =
      gameState.currentSuit;

  }

  /* =========================
     PLAY CARD
  ========================= */

  function playCard(
    player,
    cardIndex
  ) {

    const card =
      player.cards[cardIndex];

    if (
      !canPlayCard(card)
    ) {

      return;

    }

    sounds.play.currentTime = 0;
    sounds.play.play();

    /* REMOVE */

    player.cards.splice(
      cardIndex,
      1
    );

    /* UPDATE */

    gameState.currentCard =
      card;

    if (
      card.type !== "joker"
    ) {

      gameState.currentSuit =
        card.suit;

    }

    gameState.discardPile.push(
      card
    );

    /* DRAW 2 */

    if (
      card.type === "draw2"
    ) {

      gameState.drawStack += 2;

      sounds.stack.currentTime = 0;
      sounds.stack.play();

    }

    /* JOKER */

    if (
      card.type === "joker"
    ) {

      gameState.drawStack += 4;

      sounds.stack.currentTime = 0;
      sounds.stack.play();

    }

    /* WILD */

    if (
      card.type === "wild"
    ) {

      if (!player.bot) {

        renderEverything();

        openSuitPicker();

        return;

      }

      else {

        const bestSuit =
          getBestSuit(player);

        gameState.currentSuit =
          bestSuit;

      }

    }

    /* SKIP FLAGS */

let skipNext =
  false;

/* REVERSE */

if (
  card.type === "reverse"
) {

  /* 1V1 = SKIP */

  if (
    gameState.players.length === 2
  ) {

    skipNext = true;

  }

  else {

    gameState.direction *= -1;

  }

}

/* SKIP */

if (
  card.type === "skip"
) {

  skipNext = true;

}

    /* WIN */

    if (
      player.cards.length <= 0
    ) {

      endGame(
        player.name
      );

      return;

    }

    /* BURN */

    if (
      card.type === "burn"
    ) {

      renderEverything();

      updateTurnUI();

      if (
        player.bot
      ) {

        setTimeout(() => {

          botTurn(player);

        }, 900);

      }

      return;

    }

    reshuffleIfNeeded();

    /* SKIP LOGIC */

    if (skipNext) {

      nextTurn();

    }

    nextTurn();

  }

  /* =========================
     NEXT TURN
  ========================= */

  function nextTurn() {

    gameState.currentTurn +=
      gameState.direction;

    if (
      gameState.currentTurn >=
      gameState.players.length
    ) {

      gameState.currentTurn = 0;

    }

    if (
      gameState.currentTurn < 0
    ) {

      gameState.currentTurn =
        gameState.players.length - 1;

    }

    renderEverything();

    updateTurnUI();

    const currentPlayer =
      gameState.players[
        gameState.currentTurn
      ];

    if (
      currentPlayer.bot
    ) {

      setTimeout(() => {

        botTurn(
          currentPlayer
        );

      }, 1100);

    }

  }

  /* =========================
     BOT TURN
  ========================= */

  function botTurn(bot) {

    const playable =
      bot.cards.filter(card =>
        canPlayCard(card)
      );

    if (
      playable.length > 0
    ) {

      let chosen =
        playable.find(
          c =>
            c.type === "joker"
        ) ||

        playable.find(
          c =>
            c.type === "draw2"
        ) ||

        playable.find(
          c =>
            c.type === "skip"
        ) ||

        playable[0];

      const index =
        bot.cards.findIndex(
          c =>
            c.id === chosen.id
        );

      playCard(
        bot,
        index
      );

      return;

    }

    if (
      gameState.drawStack > 0
    ) {

      for (
        let i = 0;
        i < gameState.drawStack;
        i++
      ) {

        drawCard(bot);

      }

      gameState.drawStack = 0;

    }

    else {

      drawCard(bot);

    }

    nextTurn();

  }

  /* =========================
     BEST SUIT
  ========================= */

  function getBestSuit(player) {

    const count = {

      "♠": 0,
      "♥": 0,
      "♦": 0,
      "♣": 0

    };

    player.cards.forEach(card => {

      if (
        count[card.suit] !==
        undefined
      ) {

        count[card.suit]++;

      }

    });

    return Object.keys(count)
      .reduce((a, b) =>
        count[a] > count[b]
        ? a
        : b
      );

  }

  /* =========================
     DRAW CARD
  ========================= */

  function drawCard(player) {

    reshuffleIfNeeded();

    if (
      gameState.deck.length <= 0
    )
      return;

    sounds.draw.currentTime = 0;
    sounds.draw.play();

    player.cards.push(
      gameState.deck.pop()
    );

    sortCards(
      player.cards
    );

  }

  /* =========================
     DRAW CLICK
  ========================= */

  drawPile.addEventListener(
  "click",
  () => {

    if (
      gameState.currentTurn !== 0
    )
      return;

    const player =
      gameState.players[0];

    /* STACK RESPONSE */

    if (
      gameState.drawStack > 0
    ) {

      const canRespond =
        player.cards.some(card =>

          card.type === "draw2" ||

          card.type === "joker"

        );

      /* MUST RESPOND */

      if (
        canRespond
      ) {

        return;

      }

      /* TAKE STACK */

      for (
        let i = 0;
        i < gameState.drawStack;
        i++
      ) {

        drawCard(player);

      }

      gameState.drawStack = 0;

      nextTurn();

      return;

    }

    /* NORMAL DRAW */

    drawCard(player);

    nextTurn();

  }
);

  /* =========================
     RESHUFFLE
  ========================= */

  function reshuffleIfNeeded() {

    if (
      gameState.deck.length > 0
    )
      return;

    const topCard =
      gameState.discardPile.pop();

    const reshuffleCards = [
      ...gameState.discardPile
    ];

    gameState.deck =
      shuffleDeck(
        reshuffleCards
      );

    gameState.discardPile = [
      topCard
    ];

  }

  /* =========================
     SUIT PICKER
  ========================= */

  function openSuitPicker() {

    suitPicker.style.display =
      "flex";

  }

  suitButtons.forEach(btn => {

    btn.addEventListener(
      "click",
      () => {

        if (
          gameState.currentTurn !== 0
        )
          return;

        gameState.currentSuit =
          btn.dataset.suit;

        suitPicker.style.display =
          "none";

        nextTurn();

      }
    );

  });

  /* =========================
     TURN UI
  ========================= */

  function updateTurnUI() {

    const player =
      gameState.players[
        gameState.currentTurn
      ];

    turnIndicator.innerText =
      `${player.name} TURN`;

    if (
      gameState.drawStack > 0
    ) {

      turnSubtext.innerText =
        `RESPOND TO +${gameState.drawStack}`;

    }

    else {

      turnSubtext.innerText =
        "PLAY A MATCHING CARD";

    }

  }

  /* =========================
     END GAME
  ========================= */

  function endGame(name) {

    gameState.winner = name;

    sounds.win.currentTime = 0;
    sounds.win.play();

    winScreen.style.display =
      "flex";

    winTitle.innerText =
      `${name} WINS`;

  }

  /* =========================
     BUTTONS
  ========================= */

  leaveBtn.addEventListener(
    "click",
    () => {

      if (
        GAME_MODE ===
        "multiplayer"
      ) {

        window.location.href =
          "room.html";

      }

      else {

        window.location.href =
          "index.html";

      }

    }
  );

  playAgainBtn.addEventListener(
    "click",
    () => {

      winScreen.style.display =
        "none";

      startGame();

    }
  );

  returnMenuBtn.addEventListener(
    "click",
    () => {

      window.location.href =
        "index.html";

    }
  );

  /* =========================
     START
  ========================= */

  startGame();

});