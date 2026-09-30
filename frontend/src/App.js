import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import api from "./api";
import "./App.css";

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const saveSession = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    saveSession(data);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    saveSession(data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}


function TerminalWindow({ title, children }) {
  return (
    <div className="term-window">
      <div className="term-titlebar">
        <span className="term-dot red"></span>
        <span className="term-dot yellow"></span>
        <span className="term-dot green"></span>
        <span className="term-title">{title}</span>
      </div>
      <div className="term-body">{children}</div>
    </div>
  );
}

function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="term-nav">
      <span className="prompt">perudai@root:~$</span>
      <Link to="/leaderboard">leaderboard</Link>
      <Link to="/rule">rules</Link>
      {user ? (
        <>
          <Link to="/play">play</Link>
          <Link to="/profile">profile</Link>
          <span className="nav-user">[{user.name}]</span>
          <button className="link-btn" onClick={handleLogout}>logout</button>
        </>
      ) : (
        <>
          <Link to="/login">login</Link>
          <Link to="/register">register</Link>
        </>
      )}
    </nav>
  );
}

function Line({ children }) {
  return <div className="term-line">{children}</div>;
}


function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/play");
    } catch (err) {
      setError(err.response?.data?.message || "Помилка реєстрації");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TerminalWindow title="register_new_user.sh">
      <Line>$ ./register --new-account</Line>
      <form onSubmit={handleSubmit} className="term-form">
        <label>login &gt;</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />

        <label>email &gt;</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>password &gt;</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

        {error && <div className="term-error">! error: {error}</div>}

        <button type="submit" className="term-btn" disabled={loading}>
          {loading ? "processing..." : "[ enter ] execute registration"}
        </button>
      </form>
      <Line>already have access? <Link to="/login">./login.sh</Link></Line>
    </TerminalWindow>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/play");
    } catch (err) {
      setError(err.response?.data?.message || "Помилка входу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TerminalWindow title="login.sh">
      <Line>$ ./login --authenticate</Line>
      <form onSubmit={handleSubmit} className="term-form">
        <label>email &gt;</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>password &gt;</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <div className="term-error">! error: {error}</div>}

        <button type="submit" className="term-btn" disabled={loading}>
          {loading ? "processing..." : "[ enter ] authenticate"}
        </button>
      </form>
      <Line>no account? <Link to="/register">./register.sh</Link></Line>
    </TerminalWindow>
  );
}


function LeaderboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/leaderboard?take=20")
      .then((res) => setRows(res.data))
      .catch(() => setError("не вдалося завантажити рейтинг"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <TerminalWindow title="leaderboard --top-20">
      <Line>$ cat /rating/top_players.log</Line>
      {loading && <Line>loading...</Line>}
      {error && <div className="term-error">! {error}</div>}
      {!loading && !error && (
        <table className="term-table">
          <thead>
            <tr><th>#</th><th>name</th><th>mmr</th><th>games</th><th>w</th><th>l</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank}>
                <td>{r.rank}</td>
                <td>{r.name}</td>
                <td>{r.mmr}</td>
                <td>{r.gamesPlayed}</td>
                <td>{r.wins}</td>
                <td>{r.losses}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6}>-- empty --</td></tr>
            )}
          </tbody>
        </table>
      )}
    </TerminalWindow>
  );
}


function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get("/profile")
      .then((res) => setProfile(res.data))
      .catch(() => setError("не вдалося завантажити профіль"));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <TerminalWindow title="profile.log"><div className="term-error">! {error}</div></TerminalWindow>;
  if (!profile) return <TerminalWindow title="profile.log"><Line>loading...</Line></TerminalWindow>;

  return (
    <TerminalWindow title={`profile: ${profile.name}`}>
      <Line>$ whoami --stats</Line>
      <Line>login: {profile.name}</Line>
      <Line>email: {profile.email}</Line>
      <Line className="highlight">mmr rating: {profile.mmr}</Line>
      <Line>games played: {profile.gamesPlayed}</Line>
      <Line>wins / losses: {profile.wins} / {profile.losses}</Line>
      <Line>win rate: {profile.winRate}%</Line>
      <Line>current streak: {profile.currentWinStreak}</Line>

      <Line>$ tail -n 10 /history/games.log</Line>
      <table className="term-table">
        <thead>
          <tr><th>date</th><th>difficulty</th><th>result</th><th>mmr Δ</th></tr>
        </thead>
        <tbody>
          {profile.recentGames.map((g, i) => (
            <tr key={i}>
              <td>{new Date(g.playedAt).toLocaleString()}</td>
              <td>{g.difficulty}</td>
              <td className={g.isUserWinner ? "win" : "lose"}>
                {g.isUserWinner ? "WIN" : "LOSE"}
              </td>
              <td className={g.mmrChange >= 0 ? "win" : "lose"}>
                {g.mmrChange >= 0 ? "+" : ""}{g.mmrChange}
              </td>
            </tr>
          ))}
          {profile.recentGames.length === 0 && (
            <tr><td colSpan={4}>-- no games yet --</td></tr>
          )}
        </tbody>
      </table>
    </TerminalWindow>
  );
}


function DifficultySelect({ onStart, loading }) {
  return (
    <TerminalWindow title="new_game.sh --select-difficulty">
      <Line>$ ./perudo --new-game</Line>
      <Line>select AI difficulty level:</Line>
      <div className="difficulty-grid">
        <button className="term-btn" disabled={loading} onClick={() => onStart("Easy")}>
          [1] EASY
        </button>
        <button className="term-btn" disabled={loading} onClick={() => onStart("Medium")}>
          [2] MEDIUM
        </button>
        <button className="term-btn" disabled={loading} onClick={() => onStart("Hard")}>
          [3] HARD
        </button>
      </div>
      {loading && <Line>rolling dice...</Line>}
    </TerminalWindow>
  );
}

function Dice({ value }) {
  return <span className="die">[{value}]</span>;
}

function RulePage(){
  return(
    <>
      <h1>Правила Перудо</h1>
      <h3>Скидання</h3>
      <p>Усі гравці кидають кістки, підглядаючи свою комбінацію, але не показуючи результат іншим учасникам. Першим робить хід гравець, який переміг у жеребкуванні. Він називає кількість та номінал кісток, які, на його думку, є на ігровому столі — у всіх гравців разом узятих. Усі «одиниці», що випали, вважаються джокерами і під час підрахунку можуть бути визнані кісткою будь-якого номіналу. Другий гравець може або погодитися зі ставкою попереднього гравця, зробивши власну ставку, або сказати «не вірю» і «перевіряємо».

Наприклад, каже «П'ять шісток». Тим самим гравець робить ставку на те, що на столі є як мінімум п'ять шісток.</p>
      <h3>Якщо гравець погоджується</h3>
      <p>Якщо гравець погоджується зі ставкою попереднього гравця, він повинен зробити власну ставку. При цьому мають бути дотримані певні умови:

Кількість кісток у ставці можна лише підвищувати.

Виняток — гравець має право зменшити кількість кісток у ставці вдвічі (при непарному числі округлення у більшу сторону), якщо він називає номінал «одиниці».

Наприклад, після ставки «п'ять п'ятірок» або після ставки «шість шісток» можна сказати «три одиниці».

Якщо кількість кісток у ставці залишається такою ж, номінал має бути збільшений.

Наприклад, можна сказати «три шістки» після ставки «три п'ятірки», однак не можна сказати «п'ять п'ятірок» після ставки «п'ять шісток».

Якщо кількість кісток у ставці збільшується, то номінал кісток може бути названий будь-який.

Якщо номінал попередньої ставки був «одиниці», гравець має право змінити ставку лише збільшивши кількість кісток в «одиницях» або зробивши хід в іншому номіналі, але з кількістю кісток на одну більше, ніж подвоєне число ставки в одиницях попереднього гравця.

Наприклад, після ставки «дві одиниці» необхідно сказати «п'ять двійок» або «три одиниці».</p>
    <h3>Якщо гравець не вірить</h3>
    <p>Усі кістки на столі відкриваються і здійснюється підрахунок.

Якщо кісток названого перевірюваним гравцем номіналу на столі виявляється менше тієї кількості, яка фігурувала у ставці, гравець, який робив цю ставку, вважається програлим і викладає одну зі своїх кісток на центр стола.

Наприклад, один із гравців зробив ставку «5 трійок». Гравець, що йде за ним, сказав «не вірю». Усі гравці підняли стаканчики й перерахували кістки з номіналом «трійка» та з номіналом «одиниця» (вони є джокерами), і виявилося, що на столі 4 «трійки». У цьому випадку програлим вважається гравець, який блефував.

Якщо кісток названого номіналу більше або дорівнює кількості кісток у ставці, програлим вважається гравець, який сказав «не вірю». Він повинен віддати одну зі своїх кісток на центр стола.

Наприклад, один із гравців зробив ставку «10 двійок». Гравець, що йде за ним, сказав «не вірю». Усі гравці підняли стаканчики й перерахували кістки з номіналом «двійка» та з номіналом «одиниця» (вони є джокерами), і виявилося, що на столі 10+ «двійок». У цьому випадку програлим вважається гравець, який «не повірив».

Після того, як хтось із гравців втратив кістку, гравці знову кидають кістки, і першим ходить гравець, який програв.</p>
    </>
  )
}

function GamePage() {
  const [state, setState] = useState(null);
  const [aiMessage, setAiMessage] = useState("");
  const [roundResult, setRoundResult] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [face, setFace] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingCurrent, setCheckingCurrent] = useState(true);

  useEffect(() => {
    api.get("/game/current")
      .then((res) => setState(res.data))
      .catch(() => setState(null))
      .finally(() => setCheckingCurrent(false));
  }, []);

  const startGame = async (difficulty) => {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/game/start", { difficulty });
      setState(data);

      setAiMessage("");
      setRoundResult(null);
    } catch {
      setError("не вдалося почати гру");
    } finally {
      setLoading(false);
    }
  };

  const applyResponse = (data) => {
    setState(data.state);
    setAiMessage(data.aiMessage || "");
    setRoundResult(data.roundResult || null);
  };

  const handleBid = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setRoundResult(null); 
    setAiMessage("");
    try {
      const { data } = await api.post("/game/bid", { quantity: Number(quantity), face: Number(face) });
      applyResponse(data);
    } catch (err) {
      setError(err.response?.data?.message || "нелегальна ставка або сервера Геміні перевантажані");
    } finally {
      setLoading(false);
    }
  };

  const handleDudo = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/game/dudo");
      applyResponse(data);
    } catch (err) {
      setError(err.response?.data?.message || "помилка виклику Донт траст");
    } finally {
      setLoading(false);
    }
  };

  if (checkingCurrent) {
    return <TerminalWindow title="perudo.exe"><Line>checking active session...</Line></TerminalWindow>;
  }

  if (!state || state.isGameEnded) {
    return (
      <>
        {state?.isGameEnded && (
          <TerminalWindow title="game_over.log">
            <Line className={state.playerWon ? "win" : "lose"}>
              {state.playerWon ? ">>> YOU WIN <<<" : ">>> YOU LOSE <<<"}
            </Line>
            {roundResult && (
              <Line>
                final reveal — you: [{roundResult.playerDice.join(",")}] | ai: [{roundResult.aiDice.join(",")}]
              </Line>
            )}
            <Line><Link to="/profile">see updated rating in profile →</Link></Line>
          </TerminalWindow>
        )}
        <DifficultySelect onStart={startGame} loading={loading} />
      </>
    );
  }

  return (
    <TerminalWindow title={`perudo.exe --difficulty=${state.difficulty}`}>
      <Line>round: {state.round} | your dice: {state.playerDice.length} | ai dice: {state.aiDiceCount}</Line>

      <div className="dice-row">
        <span className="dice-label">YOU:</span>
        {state.playerDice.map((d, i) => <Dice key={i} value={d} />)}
      </div>
      <div className="dice-row">
        <span className="dice-label">AI:</span>
        {Array.from({ length: state.aiDiceCount }).map((_, i) => <Dice key={i} value="?" />)}
      </div>

      <Line>
        current bid: {state.currentBidQuantity > 0
          ? `${state.currentBidQuantity} x ${state.currentBidNominal} (${state.lastBidByPlayer ? "you" : "ai"})`
          : "none yet"}
      </Line>

      {aiMessage && <div className="ai-message">AI: "{aiMessage}"</div>}

      {roundResult && (
        <div className="round-result">
          <Line>--- round resolved ---</Line>
          <Line>bid was {roundResult.bidQuantity} x {roundResult.bidFace}, actual count: {roundResult.actualCount}</Line>
          <Line>reveal — you: [{roundResult.playerDice.join(",")}] | ai: [{roundResult.aiDice.join(",")}]</Line>
          <Line className={roundResult.playerLostDie ? "lose" : "win"}>
            {roundResult.playerLostDie ? "you lost a die" : "ai lost a die"}
          </Line>
        </div>
      )}

      {error && <div className="term-error">! {error}</div>}

      {state.isPlayerTurn ? (
        <>
          <Line>bid history: {state.bidHistory.length ? state.bidHistory.join(" → ") : "empty"}</Line>
          <form onSubmit={handleBid} className="term-form-inline">
            <label>qty</label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <label>face</label>
            <select value={face} onChange={(e) => setFace(e.target.value)}>
              {[1, 2, 3, 4, 5, 6].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <button type="submit" className="term-btn" disabled={loading}>[ bid ]</button>
            <button type="button" className="term-btn danger" disabled={loading || state.currentBidQuantity === 0} onClick={handleDudo}>
              [ DUDO! ]
            </button>
          </form>
        </>
      ) : (
        <Line>waiting for ai...</Line>
      )}
    </TerminalWindow>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <div className="term-screen">
        <Nav />
        <div className="term-content">
          <Routes>
            <Route path="/" element={<Navigate to="/leaderboard" replace />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/rule" element={<RulePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/play" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}