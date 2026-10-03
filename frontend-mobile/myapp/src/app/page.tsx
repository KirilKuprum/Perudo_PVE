import React, { useState, useEffect, createContext, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.0.100:5166/api",
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const colors = {
  background: "#0a0e0a",
  window: "#0d130d",
  titlebar: "#102013",
  border: "#1f5c2f",
  text: "#33ff66",
  textSoft: "#7fdca0",
  textBright: "#66ffaa",
  yellow: "#ffd166",
  red: "#ff5555",
  redSoft: "#ff5f56",
  buttonBackground: "#133a1e",
  inputBackground: "#06100a",
};

const MONOSPACE_FONT = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

type Route = "leaderboard" | "rules" | "login" | "register" | "play" | "profile";

const PROTECTED_ROUTES: Route[] = ["play", "profile"];

const AuthenticationContext = createContext<any>(null);
const useAuthentication = () => useContext(AuthenticationContext);

const NavigationContext = createContext<{ goTo: (route: Route) => void }>({
  goTo: () => {},
});
const useNavigation = () => useContext(NavigationContext);

function AuthenticationProvider({
  children,
  onReady,
}: {
  children: React.ReactNode;
  onReady: () => void;
}) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch {}
      onReady();
    })();
  }, []);

  const saveSession = async (data: any) => {
    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    await saveSession(data);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    await saveSession(data);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthenticationContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthenticationContext.Provider>
  );
}

const renderWindow = (title: string, children: React.ReactNode) => (
  <View style={styles.window}>
    <View style={styles.titlebar}>
      <View style={[styles.dot, { backgroundColor: "#ff5f56" }]} />
      <View style={[styles.dot, { backgroundColor: "#ffbd2e" }]} />
      <View style={[styles.dot, { backgroundColor: "#27c93f" }]} />
      <Text
        style={[
          styles.text,
          { color: colors.textSoft, fontSize: 12, marginLeft: 10 },
        ]}
      >
        {title}
      </Text>
    </View>
    <View style={styles.body}>{children}</View>
  </View>
);

function Navigation({ route }: { route: Route }) {
  const { user, logout } = useAuthentication();
  const { goTo } = useNavigation();

  const renderLink = (label: string, target: Route) => (
    <TouchableOpacity
      key={target}
      onPress={() => goTo(target)}
      style={[
        styles.navigationLink,
        route === target && { backgroundColor: colors.buttonBackground },
      ]}
    >
      <Text style={[styles.text, { fontSize: 13 }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.navigation}>
      <Text
        style={[
          styles.text,
          { color: colors.textBright, fontWeight: "700", width: "100%" },
        ]}
      >
        perudai@root:~$
      </Text>
      {renderLink("leaderboard", "leaderboard")}
      {renderLink("rules", "rules")}
      {user ? (
        <>
          {renderLink("play", "play")}
          {renderLink("profile", "profile")}
          <Text style={[styles.text, { color: colors.yellow }]}>[{user.name}]</Text>
          <TouchableOpacity
            style={[styles.navigationLink, { borderColor: "#a83232" }]}
            onPress={async () => {
              await logout();
              goTo("login");
            }}
          >
            <Text style={[styles.text, { color: "#ff6666", fontSize: 13 }]}>
              logout
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {renderLink("login", "login")}
          {renderLink("register", "register")}
        </>
      )}
    </View>
  );
}

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuthentication();
  const { goTo } = useNavigation();

  const submit = async () => {
    setErrorMessage("");
    if (!name || !email || password.length < 6) {
      setErrorMessage("заповніть усі поля (пароль мінімум 6 символів)");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      goTo("play");
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Помилка реєстрації");
    } finally {
      setLoading(false);
    }
  };

  return renderWindow(
    "register_new_user.sh",
    <>
      <Text style={[styles.text, styles.line]}>$ ./register --new-account</Text>

      <Text style={styles.label}>login &gt;</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        autoCapitalize="none"
      />

      <Text style={styles.label}>email &gt;</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>password &gt;</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {!!errorMessage && (
        <View style={styles.errorBox}>
          <Text style={[styles.text, { color: colors.red }]}>
            ! error: {errorMessage}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, { marginVertical: 12 }, loading && styles.disabled]}
        onPress={submit}
        disabled={loading}
      >
        <Text style={styles.text}>
          {loading ? "processing..." : "[ enter ] execute registration"}
        </Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <Text style={styles.text}>already have access? </Text>
        <TouchableOpacity onPress={() => goTo("login")}>
          <Text style={[styles.text, styles.link]}>./login.sh</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthentication();
  const { goTo } = useNavigation();

  const submit = async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      await login(email, password);
      goTo("play");
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Помилка входу");
    } finally {
      setLoading(false);
    }
  };

  return renderWindow(
    "login.sh",
    <>
      <Text style={[styles.text, styles.line]}>$ ./login --authenticate</Text>

      <Text style={styles.label}>email &gt;</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>password &gt;</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {!!errorMessage && (
        <View style={styles.errorBox}>
          <Text style={[styles.text, { color: colors.red }]}>
            ! error: {errorMessage}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, { marginVertical: 12 }, loading && styles.disabled]}
        onPress={submit}
        disabled={loading}
      >
        <Text style={styles.text}>
          {loading ? "processing..." : "[ enter ] authenticate"}
        </Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <Text style={styles.text}>no account? </Text>
        <TouchableOpacity onPress={() => goTo("register")}>
          <Text style={[styles.text, styles.link]}>./register.sh</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function LeaderboardPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    api
      .get("/leaderboard?take=20")
      .then((response: any) => setRows(response.data))
      .catch(() => setErrorMessage("не вдалося завантажити рейтинг"))
      .finally(() => setLoading(false));
  }, []);

  const columnWidths = [0.6, 2.2, 1, 1.2, 1, 1];
  const columnHeaders = ["#", "name", "mmr", "games", "wins", "losses"];

  return renderWindow(
    "leaderboard --top-20",
    <>
      <Text style={[styles.text, styles.line]}>$ cat /rating/top_players.log</Text>

      {loading && <ActivityIndicator color={colors.text} />}

      {!!errorMessage && (
        <View style={styles.errorBox}>
          <Text style={[styles.text, { color: colors.red }]}>! {errorMessage}</Text>
        </View>
      )}

      {!loading && !errorMessage && (
        <View style={styles.table}>
          <View style={[styles.tableRow, { backgroundColor: colors.titlebar }]}>
            {columnHeaders.map((header, index) => (
              <Text
                key={index}
                style={[styles.tableHeaderCell, { flex: columnWidths[index] }]}
              >
                {header}
              </Text>
            ))}
          </View>

          {rows.map((row) => (
            <View key={row.rank} style={styles.tableRow}>
              {[
                row.rank,
                row.name,
                row.mmr,
                row.gamesPlayed,
                row.wins,
                row.losses,
              ].map((cell, index) => (
                <Text
                  key={index}
                  style={[styles.tableCell, { flex: columnWidths[index] }]}
                >
                  {String(cell)}
                </Text>
              ))}
            </View>
          ))}

          {rows.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>-- empty --</Text>
            </View>
          )}
        </View>
      )}
    </>
  );
}

function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    api
      .get("/profile")
      .then((response: any) => setProfile(response.data))
      .catch(() => setErrorMessage("не вдалося завантажити профіль"));
  }, []);

  if (errorMessage) {
    return renderWindow(
      "profile.log",
      <View style={styles.errorBox}>
        <Text style={[styles.text, { color: colors.red }]}>! {errorMessage}</Text>
      </View>
    );
  }

  if (!profile) {
    return renderWindow("profile.log", <Text style={styles.text}>loading...</Text>);
  }

  const columnWidths = [2.2, 1.4, 1, 1];
  const columnHeaders = ["date", "difficulty", "result", "mmr Δ"];

  return renderWindow(
    `profile: ${profile.name}`,
    <>
      <Text style={[styles.text, styles.line]}>$ whoami --stats</Text>
      <Text style={[styles.text, styles.line]}>login: {profile.name}</Text>
      <Text style={[styles.text, styles.line]}>email: {profile.email}</Text>
      <Text
        style={[
          styles.text,
          styles.line,
          { color: colors.yellow, fontWeight: "700" },
        ]}
      >
        mmr rating: {profile.mmr}
      </Text>
      <Text style={[styles.text, styles.line]}>
        games played: {profile.gamesPlayed}
      </Text>
      <Text style={[styles.text, styles.line]}>
        wins / losses: {profile.wins} / {profile.losses}
      </Text>
      <Text style={[styles.text, styles.line]}>win rate: {profile.winRate}%</Text>
      <Text style={[styles.text, styles.line]}>
        current streak: {profile.currentWinStreak}
      </Text>

      <Text style={[styles.text, styles.line, { marginTop: 10 }]}>
        $ tail -n 10 /history/games.log
      </Text>

      <View style={styles.table}>
        <View style={[styles.tableRow, { backgroundColor: colors.titlebar }]}>
          {columnHeaders.map((header, index) => (
            <Text
              key={index}
              style={[styles.tableHeaderCell, { flex: columnWidths[index] }]}
            >
              {header}
            </Text>
          ))}
        </View>

        {profile.recentGames.map((game: any, index: number) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: columnWidths[0] }]}>
              {new Date(game.playedAt).toLocaleString()}
            </Text>
            <Text style={[styles.tableCell, { flex: columnWidths[1] }]}>
              {game.difficulty}
            </Text>
            <Text
              style={[
                styles.tableCell,
                {
                  flex: columnWidths[2],
                  color: game.isUserWinner ? colors.text : colors.redSoft,
                },
              ]}
            >
              {game.isUserWinner ? "WIN" : "LOSE"}
            </Text>
            <Text
              style={[
                styles.tableCell,
                {
                  flex: columnWidths[3],
                  color: game.mmrChange >= 0 ? colors.text : colors.redSoft,
                },
              ]}
            >
              {game.mmrChange >= 0 ? "+" : ""}
              {game.mmrChange}
            </Text>
          </View>
        ))}

        {profile.recentGames.length === 0 && (
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>-- no games yet --</Text>
          </View>
        )}
      </View>
    </>
  );
}

const RULE_SECTIONS = [
  {
    title: "Скидання",
    text: `Усі гравці кидають кістки, підглядаючи свою комбінацію, але не показуючи результат іншим учасникам. Першим робить хід гравець, який переміг у жеребкуванні. Він називає кількість та номінал кісток, які, на його думку, є на ігровому столі — у всіх гравців разом узятих. Усі «одиниці», що випали, вважаються джокерами і під час підрахунку можуть бути визнані кісткою будь-якого номіналу. Другий гравець може або погодитися зі ставкою попереднього гравця, зробивши власну ставку, або сказати «не вірю» і «перевіряємо».

Наприклад, каже «П'ять шісток». Тим самим гравець робить ставку на те, що на столі є як мінімум п'ять шісток.`,
  },
  {
    title: "Якщо гравець погоджується",
    text: `Якщо гравець погоджується зі ставкою попереднього гравця, він повинен зробити власну ставку. При цьому мають бути дотримані певні умови:

Кількість кісток у ставці можна лише підвищувати.

Виняток — гравець має право зменшити кількість кісток у ставці вдвічі (при непарному числі округлення у більшу сторону), якщо він називає номінал «одиниці».

Наприклад, після ставки «п'ять п'ятірок» або після ставки «шість шісток» можна сказати «три одиниці».

Якщо кількість кісток у ставці залишається такою ж, номінал має бути збільшений.

Наприклад, можна сказати «три шістки» після ставки «три п'ятірки», однак не можна сказати «п'ять п'ятірок» після ставки «п'ять шісток».

Якщо кількість кісток у ставці збільшується, то номінал кісток може бути названий будь-який.

Якщо номінал попередньої ставки був «одиниці», гравець має право змінити ставку лише збільшивши кількість кісток в «одиницях» або зробивши хід в іншому номіналі, але з кількістю кісток на одну більше, ніж подвоєне число ставки в одиницях попереднього гравця.

Наприклад, після ставки «дві одиниці» необхідно сказати «п'ять двійок» або «три одиниці».`,
  },
  {
    title: "Якщо гравець не вірить",
    text: `Усі кістки на столі відкриваються і здійснюється підрахунок.

Якщо кісток названого перевірюваним гравцем номіналу на столі виявляється менше тієї кількості, яка фігурувала у ставці, гравець, який робив цю ставку, вважається програлим і викладає одну зі своїх кісток на центр стола.

Наприклад, один із гравців зробив ставку «5 трійок». Гравець, що йде за ним, сказав «не вірю». Усі гравці підняли стаканчики й перерахували кістки з номіналом «трійка» та з номіналом «одиниця» (вони є джокерами), і виявилося, що на столі 4 «трійки». У цьому випадку програлим вважається гравець, який блефував.

Якщо кісток названого номіналу більше або дорівнює кількості кісток у ставці, програлим вважається гравець, який сказав «не вірю». Він повинен віддати одну зі своїх кісток на центр стола.

Наприклад, один із гравців зробив ставку «10 двійок». Гравець, що йде за ним, сказав «не вірю». Усі гравці підняли стаканчики й перерахували кістки з номіналом «двійка» та з номіналом «одиниця» (вони є джокерами), і виявилося, що на столі 10+ «двійок». У цьому випадку програлим вважається гравець, який «не повірив».

Після того, як хтось із гравців втратив кістку, гравці знову кидають кістки, і першим ходить гравець, який програв.`,
  },
];

function RulePage() {
  return renderWindow(
    "rules.md",
    <>
      <Text
        style={[
          styles.text,
          { color: colors.yellow, fontSize: 20, fontWeight: "700", marginBottom: 8 },
        ]}
      >
        Правила Перудо
      </Text>

      {RULE_SECTIONS.map((section) => (
        <View key={section.title}>
          <Text
            style={[
              styles.text,
              {
                color: colors.textBright,
                fontSize: 16,
                fontWeight: "700",
                marginTop: 14,
                marginBottom: 6,
              },
            ]}
          >
            {section.title}
          </Text>
          <Text style={[styles.text, { fontSize: 13, lineHeight: 20 }]}>
            {section.text}
          </Text>
        </View>
      ))}
    </>
  );
}

function GamePage() {
  const [state, setState] = useState<any>(null);
  const [artificialIntelligenceMessage, setArtificialIntelligenceMessage] =
    useState("");
  const [roundResult, setRoundResult] = useState<any>(null);
  const [quantity, setQuantity] = useState("1");
  const [face, setFace] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingCurrentGame, setCheckingCurrentGame] = useState(true);
  const { goTo } = useNavigation();

  useEffect(() => {
    api
      .get("/game/current")
      .then((response: any) => setState(response.data))
      .catch(() => setState(null))
      .finally(() => setCheckingCurrentGame(false));
  }, []);

  const startGame = async (difficulty: string) => {
    setErrorMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/game/start", { difficulty });
      setState(data);
      setArtificialIntelligenceMessage("");
      setRoundResult(null);
    } catch {
      setErrorMessage("не вдалося почати гру");
    } finally {
      setLoading(false);
    }
  };

  const applyResponse = (data: any) => {
    setState(data.state);
    setArtificialIntelligenceMessage(data.aiMessage || "");
    setRoundResult(data.roundResult || null);
  };

  const handleBid = async () => {
    setErrorMessage("");
    setLoading(true);
    setRoundResult(null);
    setArtificialIntelligenceMessage("");
    try {
      const { data } = await api.post("/game/bid", {
        quantity: Number(quantity),
        face: Number(face),
      });
      applyResponse(data);
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          "нелегальна ставка або сервера Геміні перевантажані"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDudo = async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/game/dudo");
      applyResponse(data);
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || "помилка виклику Донт траст"
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingCurrentGame) {
    return renderWindow(
      "perudo.exe",
      <Text style={styles.text}>checking active session...</Text>
    );
  }

  if (!state || state.isGameEnded) {
    const difficultyOptions = [
      { label: "[1] EASY", value: "Easy" },
      { label: "[2] MEDIUM", value: "Medium" },
      { label: "[3] HARD", value: "Hard" },
    ];

    return (
      <View>
        {state?.isGameEnded && (
          <View style={{ marginBottom: 16 }}>
            {renderWindow(
              "game_over.log",
              <>
                <Text
                  style={[
                    styles.text,
                    styles.line,
                    { color: state.playerWon ? colors.text : colors.redSoft },
                  ]}
                >
                  {state.playerWon ? ">>> YOU WIN <<<" : ">>> YOU LOSE <<<"}
                </Text>
                {roundResult && (
                  <Text style={[styles.text, styles.line]}>
                    final reveal — you: [{roundResult.playerDice.join(",")}] | ai: [
                    {roundResult.aiDice.join(",")}]
                  </Text>
                )}
                <TouchableOpacity onPress={() => goTo("profile")}>
                  <Text style={[styles.text, styles.link]}>
                    see updated rating in profile →
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {!!errorMessage && (
          <View style={styles.errorBox}>
            <Text style={[styles.text, { color: colors.red }]}>! {errorMessage}</Text>
          </View>
        )}

        {renderWindow(
          "new_game.sh --select-difficulty",
          <>
            <Text style={[styles.text, styles.line]}>$ ./perudo --new-game</Text>
            <Text style={[styles.text, styles.line]}>select AI difficulty level:</Text>

            <View style={styles.row}>
              {difficultyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.button, loading && styles.disabled]}
                  disabled={loading}
                  onPress={() => startGame(option.value)}
                >
                  <Text style={styles.text}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {loading && <Text style={styles.text}>rolling dice...</Text>}
          </>
        )}
      </View>
    );
  }

  const bidDisabled = loading || !quantity;
  const dudoDisabled = loading || state.currentBidQuantity === 0;

  return renderWindow(
    `perudo.exe --difficulty=${state.difficulty}`,
    <>
      <Text style={[styles.text, styles.line]}>
        round: {state.round} | your dice: {state.playerDice.length} | ai dice:{" "}
        {state.aiDiceCount}
      </Text>

      <View style={styles.diceRow}>
        <Text style={[styles.text, { color: colors.textSoft, width: 44 }]}>YOU:</Text>
        {state.playerDice.map((dieValue: number, index: number) => (
          <View key={index} style={styles.die}>
            <Text style={[styles.text, { fontWeight: "700" }]}>[{dieValue}]</Text>
          </View>
        ))}
      </View>

      <View style={styles.diceRow}>
        <Text style={[styles.text, { color: colors.textSoft, width: 44 }]}>AI:</Text>
        {Array.from({ length: state.aiDiceCount }).map((_, index) => (
          <View key={index} style={styles.die}>
            <Text style={[styles.text, { fontWeight: "700" }]}>[?]</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.text, styles.line]}>
        current bid:{" "}
        {state.currentBidQuantity > 0
          ? `${state.currentBidQuantity} x ${state.currentBidNominal} (${
              state.lastBidByPlayer ? "you" : "ai"
            })`
          : "none yet"}
      </Text>

      {!!artificialIntelligenceMessage && (
        <View style={styles.artificialIntelligenceMessageBox}>
          <Text style={[styles.text, { color: colors.yellow }]}>
            AI: "{artificialIntelligenceMessage}"
          </Text>
        </View>
      )}

      {roundResult && (
        <View style={styles.roundResult}>
          <Text style={[styles.text, styles.line]}>--- round resolved ---</Text>
          <Text style={[styles.text, styles.line]}>
            bid was {roundResult.bidQuantity} x {roundResult.bidFace}, actual count:{" "}
            {roundResult.actualCount}
          </Text>
          <Text style={[styles.text, styles.line]}>
            reveal — you: [{roundResult.playerDice.join(",")}] | ai: [
            {roundResult.aiDice.join(",")}]
          </Text>
          <Text
            style={[
              styles.text,
              styles.line,
              { color: roundResult.playerLostDie ? colors.redSoft : colors.text },
            ]}
          >
            {roundResult.playerLostDie ? "you lost a die" : "ai lost a die"}
          </Text>
        </View>
      )}

      {!!errorMessage && (
        <View style={styles.errorBox}>
          <Text style={[styles.text, { color: colors.red }]}>! {errorMessage}</Text>
        </View>
      )}

      {state.isPlayerTurn ? (
        <>
          <Text style={[styles.text, styles.line]}>
            bid history:{" "}
            {state.bidHistory.length ? state.bidHistory.join(" → ") : "empty"}
          </Text>

          <View style={styles.row}>
            <Text style={[styles.text, { color: colors.textSoft }]}>quantity</Text>
            <TextInput
              style={[styles.input, { width: 70 }]}
              value={quantity}
              onChangeText={(value) => setQuantity(value.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
            />
          </View>

          <Text style={[styles.text, { color: colors.textSoft, marginTop: 8 }]}>
            face
          </Text>
          <View style={styles.row}>
            {[1, 2, 3, 4, 5, 6].map((faceValue) => (
              <TouchableOpacity
                key={faceValue}
                onPress={() => setFace(faceValue)}
                style={[
                  styles.faceButton,
                  face === faceValue && {
                    backgroundColor: colors.buttonBackground,
                    borderColor: colors.text,
                  },
                ]}
              >
                <Text
                  style={[styles.text, face === faceValue && { fontWeight: "700" }]}
                >
                  {faceValue}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.button, bidDisabled && styles.disabled]}
              disabled={bidDisabled}
              onPress={handleBid}
            >
              <Text style={styles.text}>[ bid ]</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                { borderColor: colors.red },
                dudoDisabled && styles.disabled,
              ]}
              disabled={dudoDisabled}
              onPress={handleDudo}
            >
              <Text style={[styles.text, { color: colors.red }]}>[ DUDO! ]</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <ActivityIndicator color={colors.text} style={{ marginTop: 8 }} />
          )}
        </>
      ) : (
        <Text style={styles.text}>waiting for ai...</Text>
      )}
    </>
  );
}

function Screen({ route }: { route: Route }) {
  const { user } = useAuthentication();
  const effectiveRoute: Route =
    PROTECTED_ROUTES.includes(route) && !user ? "login" : route;

  if (effectiveRoute === "register") return <RegisterPage />;
  if (effectiveRoute === "login") return <LoginPage />;
  if (effectiveRoute === "rules") return <RulePage />;
  if (effectiveRoute === "play") return <GamePage />;
  if (effectiveRoute === "profile") return <ProfilePage />;
  return <LeaderboardPage />;
}

export default function Page() {
  const [route, setRoute] = useState<Route>("leaderboard");
  const [ready, setReady] = useState(false);

  return (
    <AuthenticationProvider onReady={() => setReady(true)}>
      <NavigationContext.Provider value={{ goTo: setRoute }}>
        <SafeAreaView style={styles.screen}>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          {!ready ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text} />
            </View>
          ) : (
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
              >
                <Navigation route={route} />
                <Screen key={route} route={route} />
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </NavigationContext.Provider>
    </AuthenticationProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 48 },

  text: {
    fontFamily: MONOSPACE_FONT,
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  line: { marginBottom: 6 },
  label: {
    fontFamily: MONOSPACE_FONT,
    color: colors.textSoft,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  link: { color: colors.textBright, textDecorationLine: "underline" },
  disabled: { opacity: 0.4 },

  navigation: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 14,
    marginBottom: 20,
  },
  navigationLink: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  window: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.window,
  },
  titlebar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.titlebar,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  body: { padding: 16 },

  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: MONOSPACE_FONT,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  button: {
    backgroundColor: colors.buttonBackground,
    borderWidth: 1,
    borderColor: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: "center",
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginVertical: 10,
  },

  errorBox: {
    borderLeftWidth: 2,
    borderLeftColor: colors.red,
    paddingLeft: 8,
    marginVertical: 8,
  },

  table: {
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    fontFamily: MONOSPACE_FONT,
    color: colors.textSoft,
    fontSize: 12,
    padding: 6,
  },
  tableCell: {
    fontFamily: MONOSPACE_FONT,
    color: colors.text,
    fontSize: 12,
    padding: 6,
  },

  diceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 8,
  },
  die: {
    borderWidth: 1,
    borderColor: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.inputBackground,
  },
  faceButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },

  artificialIntelligenceMessageBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.yellow,
    padding: 8,
    marginVertical: 10,
  },
  roundResult: {
    borderWidth: 1,
    borderColor: colors.textBright,
    backgroundColor: "#0f1e12",
    padding: 10,
    marginVertical: 12,
  },
});