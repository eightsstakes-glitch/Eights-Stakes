/* =========================
   SUITS
========================= */

const SUITS = [
  "♠",
  "♥",
  "♦",
  "♣"
];

/* =========================
   VALUES
========================= */

const VALUES = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A"
];

/* =========================
   CREATE DECK
========================= */

function createDeck() {

  const deck = [];

  /* NORMAL CARDS */

  SUITS.forEach(suit => {

    VALUES.forEach(value => {

      deck.push({

        id:
          crypto.randomUUID(),

        suit,
        value,

        type:
          getCardType(
            value,
            suit
          )

      });

    });

  });

  /* JOKERS */

  deck.push({

    id:
      crypto.randomUUID(),

    suit: "★",

    value: "JOKER",

    type: "joker"

  });

  deck.push({

    id:
      crypto.randomUUID(),

    suit: "★",

    value: "JOKER",

    type: "joker"

  });

  return deck;

}

/* =========================
   CARD TYPES
========================= */

function getCardType(
  value,
  suit
) {

  /* DRAW 2 */

  if (value === "2") {

    return "draw2";

  }

  /* WILD */

  if (value === "8") {

    return "wild";

  }

  /* BURN */

  if (value === "10") {

    return "burn";

  }

  /* REVERSE */

  if (value === "A") {

    return "reverse";

  }

  /* SKIP */

  if (
    value === "Q" &&
    suit === "♠"
  ) {

    return "skip";

  }

  return "normal";

}

/* =========================
   SHUFFLE
========================= */

function shuffleDeck(deck) {

  for (
    let i = deck.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [deck[i], deck[j]] =
      [deck[j], deck[i]];

  }

  return deck;

}

/* =========================
   CARD HTML
========================= */

function createCardHTML(card) {

  /* JOKER */

  if (
    card.value === "JOKER"
  ) {

    return `

      <div
        class="card joker"
        data-id="${card.id}"
      >

        <div class="card-shine"></div>

        <div class="card-top">
          ★
        </div>

        <div class="card-center joker-center">
          JOKER
        </div>

        <div class="card-bottom">
          ★
        </div>

      </div>

    `;

  }

  /* SUIT CLASS */

  let suitClass = "";

  if (
    card.suit === "♥"
  ) {

    suitClass = "hearts";

  }

  if (
    card.suit === "♦"
  ) {

    suitClass = "diamonds";

  }

  if (
    card.suit === "♠"
  ) {

    suitClass = "spades";

  }

  if (
    card.suit === "♣"
  ) {

    suitClass = "clubs";

  }

  /* SPECIAL BADGE */

  let specialBadge = "";

  if (
    card.type !== "normal"
  ) {

    specialBadge = `

      <div class="special-badge">
        ${card.type.toUpperCase()}
      </div>

    `;

  }

  return `

    <div
      class="card ${suitClass}"
      data-id="${card.id}"
    >

      <div class="card-shine"></div>

      ${specialBadge}

      <div class="card-top">

        ${card.value}${card.suit}

      </div>

      <div class="card-center">

        ${card.suit}

      </div>

      <div class="card-bottom">

        ${card.value}${card.suit}

      </div>

    </div>

  `;

}

/* =========================
   BACK CARD
========================= */

function createBackCardHTML() {

  return `

    <div class="back-card">

      <div class="back-pattern"></div>

    </div>

  `;

}

/* =========================
   CARD VALIDATION
========================= */

function isValidMove(
  card,
  gameState
) {

  const currentCard =
    gameState.currentCard;

  /* STACK MODE */

  if (
    gameState.drawStack > 0
  ) {

    return (

      card.type === "draw2" ||

      card.type === "joker"

    );

  }

  /* AFTER JOKER */

  if (
    gameState.allowAnyCard
  ) {

    return true;

  }

  /* WILDS */

  if (
    card.type === "wild" ||

    card.type === "joker"
  ) {

    return true;

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
    currentCard.value
  ) {

    return true;

  }

  return false;

}

/* =========================
   DRAW VALUE
========================= */

function getDrawValue(card) {

  if (
    card.type === "draw2"
  ) {

    return 2;

  }

  if (
    card.type === "joker"
  ) {

    return 4;

  }

  return 0;

}

/* =========================
   CARD SORT
========================= */

function sortCards(cards) {

  const order = [

    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
    "JOKER"

  ];

  cards.sort((a, b) => {

    return (

      order.indexOf(a.value) -

      order.indexOf(b.value)

    );

  });

}

/* =========================
   FIND PLAYABLE
========================= */

function getPlayableCards(
  cards,
  gameState
) {

  return cards.filter(card => {

    return isValidMove(
      card,
      gameState
    );

  });

}