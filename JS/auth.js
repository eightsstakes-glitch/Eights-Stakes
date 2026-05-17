document.addEventListener(
  "DOMContentLoaded",
  async () => {

    // =========================
    // FIX BROKEN SESSION LOOP
    // =========================

    const {
      data: { session }
    } =
      await supabase.auth
        .getSession();

    if (session) {

      const {
        data: profile
      } =
        await supabase
          .from("profiles")
          .select("*")
          .eq(
            "id",
            session.user.id
          )
          .maybeSingle();

      // ONLY REDIRECT
      // IF PROFILE EXISTS

      if (profile) {

        window.location.href =
          "multiplayer-lobby.html";

        return;

      }

      // BROKEN SESSION

      await supabase.auth
        .signOut();

    }

    // =========================
    // ELEMENTS
    // =========================

    const loginTab =
      document.getElementById(
        "login-tab"
      );

    const signupTab =
      document.getElementById(
        "signup-tab"
      );

    const loginForm =
      document.getElementById(
        "login-form"
      );

    const signupForm =
      document.getElementById(
        "signup-form"
      );

    const authMessage =
      document.getElementById(
        "auth-message"
      );

    const backBtn =
      document.getElementById(
        "back-btn"
      );

    // LOGIN

    const loginEmail =
      document.getElementById(
        "login-email"
      );

    const loginPassword =
      document.getElementById(
        "login-password"
      );

    // SIGNUP

    const signupUsername =
      document.getElementById(
        "signup-username"
      );

    const signupEmail =
      document.getElementById(
        "signup-email"
      );

    const signupPassword =
      document.getElementById(
        "signup-password"
      );

    // =========================
    // MESSAGE
    // =========================

    function showMessage(
      text,
      success = false
    ) {

      authMessage.innerText =
        text;

      authMessage.style.color =
        success
          ? "#4ade80"
          : "#f87171";

    }

    function clearMessage() {

      authMessage.innerText =
        "";

    }

    // =========================
    // TAB SWITCHING
    // =========================

    loginTab.addEventListener(
      "click",
      () => {

        loginTab.classList.add(
          "active"
        );

        signupTab.classList.remove(
          "active"
        );

        loginForm.classList.remove(
          "hidden"
        );

        signupForm.classList.add(
          "hidden"
        );

        clearMessage();

      }
    );

    signupTab.addEventListener(
      "click",
      () => {

        signupTab.classList.add(
          "active"
        );

        loginTab.classList.remove(
          "active"
        );

        signupForm.classList.remove(
          "hidden"
        );

        loginForm.classList.add(
          "hidden"
        );

        clearMessage();

      }
    );

    // =========================
    // LOGIN
    // =========================

    loginForm.addEventListener(
      "submit",
      async (e) => {

        e.preventDefault();

        clearMessage();

        const email =
          loginEmail.value.trim();

        const password =
          loginPassword.value.trim();

        if (
          !email ||
          !password
        ) {

          showMessage(
            "Fill in all fields."
          );

          return;

        }

        const {
          error
        } =
          await supabase.auth
            .signInWithPassword({

              email,
              password

            });

        if (error) {

          showMessage(
            error.message
          );

          return;

        }

        showMessage(
          "Login successful!",
          true
        );

        setTimeout(() => {

          window.location.href =
            "multiplayer-lobby.html";

        }, 1000);

      }
    );

    // =========================
    // SIGNUP
    // =========================

    signupForm.addEventListener(
      "submit",
      async (e) => {

        e.preventDefault();

        clearMessage();

        const username =
          signupUsername.value.trim();

        const email =
          signupEmail.value.trim();

        const password =
          signupPassword.value.trim();

        if (
          !username ||
          !email ||
          !password
        ) {

          showMessage(
            "Fill in all fields."
          );

          return;

        }

        // =========================
        // CHECK USERNAME
        // =========================

        const {
          data: existingUser
        } =
          await supabase
            .from("profiles")
            .select("username")
            .eq(
              "username",
              username
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

        // =========================
        // CREATE AUTH USER
        // =========================

        const {
          data,
          error
        } =
          await supabase.auth
            .signUp({

              email,
              password

            });

        if (error) {

          showMessage(
            error.message
          );

          return;

        }

        const user =
          data.user;

        if (!user) {

          showMessage(
            "Failed to create account."
          );

          return;

        }

        // =========================
        // WAIT FOR SESSION
        // =========================

        await new Promise(

          resolve =>

            setTimeout(
              resolve,
              1500
            )

        );

        // =========================
        // CREATE PROFILE
        // =========================

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
                  username
                    .charAt(0)
                    .toUpperCase(),

                chips:
                  1000

              }

            ]);

        if (
          profileError
        ) {

          console.error(
            "PROFILE ERROR:",
            profileError
          );

          showMessage(
            profileError.message
          );

          return;

        }

        // =========================
        // AUTO LOGIN
        // =========================

        const {
          error: loginError
        } =
          await supabase.auth
            .signInWithPassword({

              email,
              password

            });

        if (loginError) {

          showMessage(
            loginError.message
          );

          return;

        }

        showMessage(
          "Account created!",
          true
        );

        setTimeout(() => {

          window.location.href =
            "multiplayer-lobby.html";

        }, 1000);

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

  }
);