document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     ELEMENTS
  ========================= */

  const botButtons =
    document.querySelectorAll(
      ".bot-option"
    );

  const backBtn =
    document.getElementById(
      "back-btn"
    );

  /* =========================
     SELECT BOT COUNT
  ========================= */

  botButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const botCount =
          Number(
            button.dataset.bots
          );

        /* SAVE */

        localStorage.setItem(
          "botCount",
          botCount
        );

        /* MODE */

        localStorage.setItem(
          "gameMode",
          "bots"
        );

        /* START */

        window.location.href =
          "game.html";

      }
    );

  });

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