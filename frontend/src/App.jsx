import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  Suspense,
} from "react";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
const Editor = React.lazy(() => import("@monaco-editor/react"));
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "./api.js";
import {
  Activity,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Command,
  ExternalLink,
  FileCode2,
  Filter,
  Folder,
  Grid2X2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Terminal,
  Trash2,
  Upload,
  UserRound,
  X,
  Zap,
} from "lucide-react";

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);
const asText = (value) => {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};
const IconButton = ({ children, ...p }) => (
  <button className="icon-btn" {...p}>
    {children}
  </button>
);
function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    localStorage.getItem("cv_token")
      ? JSON.parse(localStorage.getItem("cv_user") || "null")
      : null,
  );
  const [loading, setLoading] = useState(!!localStorage.getItem("cv_token"));
  useEffect(() => {
    if (!localStorage.getItem("cv_token")) return;
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem("cv_user", JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem("cv_token");
        localStorage.removeItem("cv_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);
  const login = (data) => {
    localStorage.setItem("cv_token", data.token);
    localStorage.setItem("cv_user", JSON.stringify(data.user));
    setUser(data.user);
  };
  const logout = () => {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("cv_token");
    localStorage.removeItem("cv_user");
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="loading-screen">
        <div className="brand-mark">
          <Code2 />
        </div>
        Opening your vault…
      </div>
    );
  return user ? children : <Navigate to="/login" replace />;
}
function Shell({ children }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const isSubmissionDetail = loc.pathname.startsWith("/submissions/");
  const [collapsed, setCollapsed] = useState(false);
  const items = [
    ["/", "Overview", LayoutDashboard],
    ["/problems", "My problems", BookOpen],
    ["/collections", "Collections", Folder],
    ["/submissions", "Submissions", History],
  ];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Code2 size={17} />
          </span>
          {!collapsed && (
            <span>
              ProblemPad<span className="brand-dot">.</span>
            </span>
          )}
        </Link>
        <div className="side-label">WORKSPACE</div>
        <nav>
          {items.map(([href, label, Icon]) => (
            <Link
              key={href}
              to={href}
              title={label}
              className={`nav-item ${loc.pathname === href || (href === "/submissions" && isSubmissionDetail) ? "active" : ""}`}
            >
              <Icon size={17} />
              {!collapsed && <span>{label}</span>}
              {href === "/problems" && !collapsed && (
                <span className="nav-shortcut">⌘ K</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="vault-card">
            <div className="vault-icon">
              <ShieldCheck size={17} />
            </div>
            {!collapsed && (
              <div>
                <strong>Your vault</strong>
                <small>Private by default</small>
              </div>
            )}
          </div>
          <button className="nav-item" onClick={logout}>
            <LogOut size={17} />
            {!collapsed && <span>Sign out</span>}
          </button>
          <button
            className="profile-row"
            onClick={() => setCollapsed(!collapsed)}
          >
            <span className="avatar">
              {user?.name?.slice(0, 1).toUpperCase()}
            </span>
            {!collapsed && (
              <>
                <span className="profile-name">
                  {user?.name}
                  <small>{user?.email}</small>
                </span>
                <MoreHorizontal size={17} />
              </>
            )}
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {isSubmissionDetail ? "Submission details" : items.find((x) => x[0] === loc.pathname)?.[1] || "Solve problem"}
            </strong>
          </div>
          <div className="top-actions">
            <div className="search-pill">
              <Search size={15} />
              <span>Search problems...</span>
              <kbd>⌘ K</kbd>
            </div>
            <div className="user-avatar">
              {user?.name?.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
function AuthPage({ mode }) {
  const { login } = useAuth(),
    navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post(
        `/auth/${mode === "signup" ? "register" : "login"}`,
        form,
      );
      login(data);
      navigate("/");
    } catch (e) {
      setError(
        e.response?.data?.error ||
          "Could not connect to ProblemPad. Check that the server is running.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Code2 size={17} />
          </span>
          <span>
            ProblemPad<span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="visual-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> YOUR PERSONAL DSA WORKSPACE
          </div>
          <h1>
            Build a library
            <br />
            of <em>what you solve.</em>
          </h1>
          <p>
            Every problem, solution, and insight — organized in one quiet place.
          </p>
          <div className="code-preview">
            <div className="code-head">
              <span>
                <i />
                main.py
              </span>
              <span>PYTHON</span>
            </div>
            <pre>
              <b>01</b> <span className="code-purple">def</span>{" "}
              <span className="code-blue">two_sum</span>(nums, target):
              <br />
              <b>02</b> seen = {"{}"}
              <br />
              <b>03</b> <span className="code-purple">for</span> i, n{" "}
              <span className="code-purple">in</span> enumerate(nums):
              <br />
              <b>04</b> need = target - n<br />
              <b>05</b> <span className="code-purple">if</span> need{" "}
              <span className="code-purple">in</span> seen:
              <br />
              <b>06</b> <span className="code-purple">return</span> [seen[need],
              i]
              <br />
              <b>07</b> seen[n] = i
            </pre>
            <div className="code-status">
              <span>
                <i /> All tests passed
              </span>
              <span>0.02s</span>
            </div>
          </div>
        </div>
        <div className="auth-footer">
          A calmer space for getting better at problem solving.
        </div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="mobile-brand">
            <span className="brand-mark">
              <Code2 size={17} />
            </span>{" "}
            ProblemPad<span className="brand-dot">.</span>
          </div>
          <span className="eyebrow">
            {mode === "signup" ? "GET STARTED" : "WELCOME BACK"}
          </span>
          <h2>
            {mode === "signup" ? "Create your account" : "Sign in to ProblemPad"}
          </h2>
          <p className="form-sub">
            {mode === "signup"
              ? "Start building your personal problem library."
              : "Pick up where you left off."}
          </p>
          <form onSubmit={submit}>
            {mode === "signup" && (
              <label>
                Your name
                <input
                  required
                  placeholder="e.g. Alex Morgan"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
            )}
            <label>
              Email address
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                required
                minLength="8"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            {error && <div className="error-banner">{error}</div>}
            <button className="primary-btn full" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
              <ArrowRight size={16} />
            </button>
          </form>
          <div className="auth-switch">
            {mode === "signup"
              ? "Already have an account?"
              : "New to ProblemPad?"}{" "}
            <Link to={mode === "signup" ? "/login" : "/signup"}>
              {mode === "signup" ? "Sign in" : "Create an account"}
            </Link>
          </div>
          <div className="auth-secure">
            <ShieldCheck size={14} /> Your data is private and encrypted in
            transit
          </div>
        </div>
      </div>
    </div>
  );
}
function Empty({ icon: Icon = BookOpen, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={21} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
function StatCard({ title, value, caption, icon: Icon, tint }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tint}`}>
        <Icon size={17} />
      </div>
      <span className="stat-title">{title}</span>
      <strong>{value}</strong>
      <small>{caption}</small>
    </div>
  );
}
function Dashboard() {
  const [data, setData] = useState(null),
    [err, setErr] = useState("");
  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setData(r.data))
      .catch((e) =>
        setErr(e.response?.data?.error || "Unable to load dashboard"),
      );
  }, []);
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">TUESDAY, OCTOBER 21</div>
          <h1>
            Your workspace<span className="heading-period">.</span>
          </h1>
          <p>A clear view of your problem solving practice.</p>
        </div>
        <Link className="primary-btn" to="/problems/new">
          <Plus size={16} /> New problem
        </Link>
      </div>
      {err && <div className="error-banner">{err}</div>}
      <section className="stat-grid">
        <StatCard
          title="Total problems"
          value={data?.stats?.total ?? "—"}
          caption="In your library"
          icon={BookOpen}
          tint="blue"
        />
        <StatCard
          title="Solved"
          value={data?.stats?.solved ?? "—"}
          caption="Problems completed"
          icon={Check}
          tint="green"
        />
        <StatCard
          title="To solve"
          value={data?.stats?.unsolved ?? "—"}
          caption="Ready when you are"
          icon={Activity}
          tint="orange"
        />
        <StatCard
          title="Collections"
          value={data?.collections?.length ?? "—"}
          caption="Curated groups"
          icon={Folder}
          tint="purple"
        />
      </section>
      <div className="dashboard-grid">
        <section className="panel recent-panel">
          <div className="panel-header">
            <div>
              <h2>Recently opened</h2>
              <p>Your latest problems, ready to continue.</p>
            </div>
            <Link to="/problems" className="text-link">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {data?.recentProblems?.length ? (
            data.recentProblems.map((p) => <ProblemRow key={p._id} p={p} />)
          ) : data ? (
            <Empty
              icon={BookOpen}
              title="Your library starts here"
              description="Save the problems you want to practice and build a collection that grows with you."
              action={
                <Link to="/problems/new" className="secondary-btn">
                  <Plus size={15} /> Create your first problem
                </Link>
              }
            />
          ) : (
            <div className="skeleton-list" />
          )}
        </section>
        <section className="panel activity-panel">
          <div className="panel-header">
            <div>
              <h2>Recent submissions</h2>
              <p>A quick look at your recent runs.</p>
            </div>
            <Link to="/submissions" className="text-link">
              History <ArrowRight size={14} />
            </Link>
          </div>
          {data?.recentSubmissions?.length ? (
            data.recentSubmissions.map((s) => (
              <div className="submission-row" key={s._id}>
                <span
                  className={`result-dot ${s.status === "Accepted" ? "pass" : "fail"}`}
                >
                  {s.status === "Accepted" ? (
                    <Check size={12} />
                  ) : (
                    <X size={12} />
                  )}
                </span>
                <span className="submission-title">
                  {s.problem?.title || "Problem"}
                </span>
                <span
                  className={`status-tag ${s.status === "Accepted" ? "tag-green" : "tag-red"}`}
                >
                  {s.status}
                </span>
              </div>
            ))
          ) : data ? (
            <Empty
              icon={Terminal}
              title="No submissions yet"
              description="Your runs and accepted solutions will show up here."
            />
          ) : (
            <div className="skeleton-list" />
          )}
        </section>
        <section className="panel collections-panel">
          <div className="panel-header">
            <div>
              <h2>Your collections</h2>
              <p>Keep related problems together.</p>
            </div>
            <Link to="/collections" className="text-link">
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          {data?.collections?.length ? (
            data.collections.slice(0, 4).map((c) => (
              <Link to="/collections" className="collection-row" key={c._id}>
                <span className="collection-folder">
                  <Folder size={16} />
                </span>
                <span>
                  {c.name}
                  <small>{c.problems?.length || 0} problems</small>
                </span>
                <ChevronRight size={15} />
              </Link>
            ))
          ) : data ? (
            <Empty
              icon={Folder}
              title="Make space for a new collection"
              description="Group problems by topic, interview, or whatever works for you."
              action={
                <Link className="text-link" to="/collections">
                  Create a collection <ArrowRight size={14} />
                </Link>
              }
            />
          ) : (
            <div className="skeleton-list" />
          )}
        </section>
        <section className="practice-card">
          <div className="practice-glow" />
          <div className="practice-symbol">
            <BrainCircuit size={21} />
          </div>
          <div className="practice-copy">
            <span className="eyebrow">A LITTLE, OFTEN</span>
            <h3>Progress is built one problem at a time.</h3>
            <p>Pick something from your library and get back in the flow.</p>
          </div>
          <Link className="practice-link" to="/problems">
            Open your library <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </div>
  );
}
function ProblemRow({ p, onDelete }) {
  return (
    <div className="problem-row">
      <span className={`difficulty-dot ${p.difficulty?.toLowerCase()}`} />
      <div className="problem-name">
        <Link to={`/problems/${p._id}`}>{p.title}</Link>
        <small>
          {(p.topics || []).slice(0, 3).join(" · ") || "Uncategorized"}
        </small>
      </div>
      <span className={`difficulty ${p.difficulty?.toLowerCase()}`}>
        {p.difficulty || "Medium"}
      </span>
      <span className="problem-date">
        {new Date(p.updatedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })}
      </span>
      <Link className="row-open" to={`/problems/${p._id}`}>
        <ArrowRight size={15} />
      </Link>
      {onDelete && (
        <button
          className="delete-small"
          title="Delete"
          onClick={() => onDelete(p._id)}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
function ProblemLibrary() {
  const [items, setItems] = useState([]),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const load = () =>
    api
      .get("/problems", { params: { search } })
      .then((r) => setItems(r.data.items))
      .catch((e) =>
        setError(e.response?.data?.error || "Unable to load problems"),
      )
      .finally(() => setBusy(false));
  useEffect(() => {
    setBusy(true);
    const id = setTimeout(load, 180);
    return () => clearTimeout(id);
  }, [search]);
  const del = async (id) => {
    if (!confirm("Delete this problem and its saved drafts?")) return;
    await api.delete(`/problems/${id}`);
    setItems(items.filter((p) => p._id !== id));
  };
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR PERSONAL LIBRARY</div>
          <h1>
            My problems<span className="heading-period">.</span>
          </h1>
          <p>Every challenge you want to keep working on.</p>
        </div>
        <Link className="primary-btn" to="/problems/new">
          <Plus size={16} /> New problem
        </Link>
      </div>
      <div className="library-toolbar">
        <div className="input-search">
          <Search size={16} />
          <input
            placeholder="Search by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>⌘ K</kbd>
        </div>
        <button
          className="secondary-btn"
          onClick={() => document.getElementById("import-file").click()}
        >
          <Upload size={15} /> Import text
        </button>
        <input
          id="import-file"
          type="file"
          accept=".txt,.md"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const text = await file.text();
              sessionStorage.setItem("cv_import", text);
              location.href = "/problems/new";
            }
          }}
        />
      </div>
      {error && <div className="error-banner">{error}</div>}
      <section className="panel table-panel">
        <div className="table-header">
          <span>PROBLEM</span>
          <span>DIFFICULTY</span>
          <span>UPDATED</span>
          <span />
        </div>
        {busy ? (
          <div className="skeleton-list" />
        ) : items.length ? (
          items.map((p) => <ProblemRow key={p._id} p={p} onDelete={del} />)
        ) : (
          <Empty
            icon={BookOpen}
            title={
              search
                ? "No problems match that search"
                : "Your problem library is empty"
            }
            description={
              search
                ? "Try a different title or clear your search."
                : "Save a problem from a prompt or start with one you want to solve."
            }
            action={
              <Link className="secondary-btn" to="/problems/new">
                <Plus size={15} /> Create a problem
              </Link>
            }
          />
        )}
      </section>
      <div className="list-footnote">
        <ShieldCheck size={14} /> Only you can see your private problems.
      </div>
    </div>
  );
}
function ProblemForm() {
  const nav = useNavigate();
  const [form, setForm] = useState({
      title: "",
      statement: "",
      difficulty: "Medium",
      topics: "",
      constraints: "",
      inputFormat: "",
      outputFormat: "",
      visibility: "private",
    }),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false),
    [ai, setAi] = useState(false);
  useEffect(() => {
    const imported = sessionStorage.getItem("cv_import");
    if (imported) {
      sessionStorage.removeItem("cv_import");
      setForm((v) => ({
        ...v,
        statement: imported,
        title:
          imported
            .split("\n")
            .find((x) => x.trim())
            ?.slice(0, 160) || "",
      }));
    }
  }, []);
  const patch = (k, v) => setForm({ ...form, [k]: v });
  const create = async () => {
    setBusy(true);
    setErr("");
    try {
      const { data } = await api.post("/problems", {
        ...form,
        topics: form.topics
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      nav(`/problems/${data.problem._id}`);
    } catch (e) {
      const details = e.response?.data?.details;
      const detailText = Array.isArray(details)
        ? details.map((item) => `${item.path.join(".") || "request"}: ${item.message}`).join(" · ")
        : "";
      setErr(detailText || e.response?.data?.error || "Could not save problem");
    } finally {
      setBusy(false);
    }
  };
  const parseAI = async () => {
    setAi(true);
    setErr("");
    try {
      const { data } = await api.post("/ai/parse-problem", {
        text: form.statement,
      });
      setForm({
        ...form,
        ...data.problem,
        title: asText(data.problem.title ?? form.title),
        statement: asText(data.problem.statement ?? form.statement),
        inputFormat: asText(data.problem.inputFormat ?? form.inputFormat),
        outputFormat: asText(data.problem.outputFormat ?? form.outputFormat),
        constraints: asText(data.problem.constraints ?? form.constraints),
        topics: Array.isArray(data.problem.topics)
          ? data.problem.topics.join(", ")
          : form.topics,
      });
    } catch (e) {
      setErr(e.response?.data?.error || "AI parsing failed");
    } finally {
      setAi(false);
    }
  };
  return (
    <div className="page-content form-page">
      <Link to="/problems" className="back-link">
        <ArrowLeft size={15} /> Back to problems
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ADD TO YOUR LIBRARY</div>
          <h1>
            New problem<span className="heading-period">.</span>
          </h1>
          <p>Capture the challenge and the details you’ll need to solve it.</p>
        </div>
      </div>
      <div className="form-layout">
        <div className="panel create-form">
          <label>
            Problem title <span className="required">*</span>
            <input
              value={form.title}
              onChange={(e) => patch("title", e.target.value)}
              placeholder="e.g. Two Sum"
              maxLength={160}
            />
          </label>
          <div className="field-split">
            <label>
              Difficulty
              <select
                value={form.difficulty}
                onChange={(e) => patch("difficulty", e.target.value)}
              >
                {["Easy", "Medium", "Hard", "Custom"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Topics <small>Separate with commas</small>
              <input
                value={form.topics}
                onChange={(e) => patch("topics", e.target.value)}
                placeholder="Arrays, Hash Table"
              />
            </label>
          </div>
          <label>
            Problem statement
            <textarea
              rows={12}
              value={form.statement}
              onChange={(e) => patch("statement", e.target.value)}
              placeholder="Paste or write the full problem statement in Markdown…"
            />
          </label>
          <button
            className="ai-parse-btn"
            onClick={parseAI}
            disabled={!form.statement || ai}
          >
            <BrainCircuit size={16} />
            {ai ? "Reading your problem…" : "Use AI to organize statement"}
            <span>Gemini</span>
          </button>
          <div className="field-split">
            <label>
              Input format
              <textarea
                rows={3}
                value={form.inputFormat}
                onChange={(e) => patch("inputFormat", e.target.value)}
                placeholder="Describe the input"
              />
            </label>
            <label>
              Output format
              <textarea
                rows={3}
                value={form.outputFormat}
                onChange={(e) => patch("outputFormat", e.target.value)}
                placeholder="Describe the output"
              />
            </label>
          </div>
          <label>
            Constraints
            <textarea
              rows={3}
              value={form.constraints}
              onChange={(e) => patch("constraints", e.target.value)}
              placeholder="e.g. 1 ≤ n ≤ 10⁵"
            />
          </label>
          <label>
            Visibility
            <select
              value={form.visibility}
              onChange={(e) => patch("visibility", e.target.value)}
            >
              <option value="private">Private — only you can access</option>
              <option value="public">Public — shareable</option>
            </select>
          </label>
          {err && <div className="error-banner">{err}</div>}
          <div className="form-footer">
            <span>
              <ShieldCheck size={14} /> Saved privately to your library
            </span>
            <button
              className="primary-btn"
              onClick={create}
              disabled={!form.title || busy}
            >
              {busy ? "Saving…" : "Save problem"}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="panel preview-panel">
          <div className="panel-header">
            <div>
              <h2>Live preview</h2>
              <p>How your problem will appear.</p>
            </div>
            <span className="preview-live">
              <i /> LIVE
            </span>
          </div>
          <div className="preview-body">
            <h2>{form.title || "Problem title"}</h2>
            <span className={`difficulty ${form.difficulty.toLowerCase()}`}>
              {form.difficulty}
            </span>
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {asText(form.statement) ||
                  "*Your problem statement preview will appear here.*"}
              </ReactMarkdown>
            </div>
            {form.constraints && (
              <>
                <h4>Constraints</h4>
                <div className="markdown">
                  <ReactMarkdown>{asText(form.constraints)}</ReactMarkdown>
                </div>
              </>
            )}
            {form.topics && (
              <div className="topic-list">
                {form.topics
                  .split(",")
                  .filter(Boolean)
                  .map((t) => (
                    <span key={t}>{t.trim()}</span>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
const starters = {
  python:
    "class Solution:\n    def solve(self, nums):\n        # Your code here\n        pass\n",
  javascript: "function solve(nums) {\n  // Your code here\n}\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}\n",
  java: "import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}\n",
};
function Workspace() {
  const { id } = useParams(),
    [problem, setProblem] = useState(null),
    [language, setLanguage] = useState("python"),
    [code, setCode] = useState(starters.python),
    [tests, setTests] = useState([]),
    [submissions, setSubmissions] = useState([]),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [generating, setGenerating] = useState(false),
    [generationComplete, setGenerationComplete] = useState(false),
    [generationMessage, setGenerationMessage] = useState(""),
    [tab, setTab] = useState("testcases"),
    [draftReady, setDraftReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let canceled = false;
    api
      .get(`/problems/${id}`)
      .then((r) => {
        if (!canceled) setProblem(r.data.problem);
      })
      .catch((e) => setError(e.response?.data?.error || "Problem unavailable"));
    return () => {
      canceled = true;
    };
  }, [id]);
  useEffect(() => {
    if (!problem) return;
    api
      .get(`/problems/${id}/test-cases`)
      .then((r) => setTests(r.data.tests))
      .catch(() => {});
    api
      .get(`/problems/${id}/draft`, { params: { language } })
      .then((r) => {
        setCode(r.data.draft?.code || starters[language]);
        setDraftReady(true);
      })
      .catch(() => setDraftReady(true));
  }, [id, language, problem]);
  useEffect(() => {
    if (!problem) return;
    let canceled = false;
    api
      .get(`/problems/${id}/submissions`)
      .then((r) => {
        if (!canceled) setSubmissions(r.data.items || []);
      })
      .catch(() => {
        if (!canceled) setSubmissions([]);
      });
    return () => {
      canceled = true;
    };
  }, [id, problem]);
  useEffect(() => {
    if (!draftReady || !problem) return;
    const timer = setTimeout(
      () =>
        api.put(`/problems/${id}/draft`, { language, code }).catch(() => {}),
      700,
    );
    return () => clearTimeout(timer);
  }, [code, language, id, draftReady, problem]);
  const act = async (submit) => {
    setBusy(true);
    setError("");
    setTab("result");
    setResult(null);
    try {
      const { data } = await api.post(
        `/problems/${id}/${submit ? "submit" : "run"}`,
        { code, language },
      );
      setResult(data);
      if (submit && data.submission) {
        setSubmissions((current) => [
          data.submission,
          ...current.filter((item) => item._id !== data.submission._id),
        ]);
      }
    } catch (e) {
      setError(e.response?.data?.error || "Execution failed");
    } finally {
      setBusy(false);
    }
  };
  const resetCode = () => {
    setCode(starters[language]);
    setResult(null);
    setError("");
    setTab("testcases");
  };
  const addTest = async () => {
    const input = prompt("Test input (multiline supported):");
    if (input === null) return;
    const expectedOutput = prompt("Expected output:") ?? "";
    try {
      const { data } = await api.post(`/problems/${id}/test-cases`, {
        input,
        expectedOutput,
        visibility: "sample",
      });
      setTests(data.tests);
    } catch (e) {
      setError(e.response?.data?.error || "Could not add test");
    }
  };
  const aiAlreadyGenerated =
    generationComplete ||
    Boolean(problem?.aiTestsGeneratedAt) ||
    tests.some((testCase) => testCase.source === "ai");
  const gen = async () => {
    if (generating || aiAlreadyGenerated) return;
    setGenerating(true);
    setGenerationMessage("");
    try {
      const { data } = await api.post(`/problems/${id}/generate-tests`);
      setTests((v) => [...v, ...data.tests]);
      setGenerationComplete(true);
      setProblem((current) => ({
        ...current,
        aiTestsGeneratedAt: data.aiTestsGeneratedAt || new Date().toISOString(),
      }));
      setGenerationMessage(
        "AI candidates are unverified; review expected outputs before relying on them.",
      );
    } catch (e) {
      const message = e.response?.data?.error || e.message || "Generation failed";
      setGenerationMessage(message);
      if (e.response?.status === 409 && message.includes("already been generated")) {
        setGenerationComplete(true);
        api.get(`/problems/${id}`).then((r) => setProblem(r.data.problem)).catch(() => {});
        api.get(`/problems/${id}/test-cases`).then((r) => setTests(r.data.tests)).catch(() => {});
      }
    } finally {
      setGenerating(false);
    }
  };
  const delTest = async (t) => {
    await api.delete(`/test-cases/${t._id}`);
    setTests(tests.filter((x) => x._id !== t._id));
  };
  const editTest = async (t) => {
    const input = prompt("Edit test input:", t.input);
    if (input === null) return;
    const expectedOutput = prompt("Edit expected output:", t.expectedOutput);
    if (expectedOutput === null) return;
    const { data } = await api.patch(`/test-cases/${t._id}`, {
      input,
      expectedOutput,
    });
    setTests(tests.map((x) => (x._id === t._id ? { ...x, ...data.test } : x)));
  };
  const approveTest = async (t) => {
    const { data } = await api.patch(`/test-cases/${t._id}`, {
      verified: !t.verified,
    });
    setTests(tests.map((x) => (x._id === t._id ? { ...x, ...data.test } : x)));
  };
  if (!problem)
    return (
      <div className="workspace-loading">{error || "Loading problem…"}</div>
    );
  return (
    <div className="workspace-page">
      <div className="workspace-top">
        <Link className="back-link" to="/problems">
          <ArrowLeft size={15} /> Problem library
        </Link>
        <span className="workspace-crumb">/ {problem.title}</span>
        <div className="workspace-top-right">
          <span className="autosave">
            <i /> Draft saved
          </span>
          <IconButton title="Settings">
            <Settings size={16} />
          </IconButton>
        </div>
      </div>
      <div className="workspace-grid">
        <section className="problem-pane">
          <div className="problem-title-head">
            <div>
              <span className="eyebrow">PROBLEM</span>
              <h1>{problem.title}</h1>
              <div className="problem-meta">
                <span
                  className={`difficulty ${problem.difficulty?.toLowerCase()}`}
                >
                  {problem.difficulty}
                </span>
                {problem.topics?.map((t) => (
                  <span className="topic-chip" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <button className="icon-btn">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="problem-tabs">
            <button className="selected">Description</button>
            <button
              onClick={() =>
                document
                  .getElementById("tests-panel")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Test cases <span>{tests.length}</span>
            </button>
            <button>Notes</button>
          </div>
          <div className="problem-scroll">
            <div className="markdown problem-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {asText(problem.statement) ||
                  "*No problem statement has been added yet.*"}
              </ReactMarkdown>
            </div>
            {problem.inputFormat && (
              <>
                <h3>Input format</h3>
                <p>{asText(problem.inputFormat)}</p>
              </>
            )}
            {problem.outputFormat && (
              <>
                <h3>Output format</h3>
                <p>{asText(problem.outputFormat)}</p>
              </>
            )}
            {problem.constraints && (
              <>
                <h3>Constraints</h3>
                <div className="constraint-box">{asText(problem.constraints)}</div>
              </>
            )}
            <div className="tests-panel" id="tests-panel">
              <div className="test-head">
                <h3>
                  Test cases <span>{tests.length}</span>
                </h3>
                <button className="mini-btn" onClick={addTest}>
                  <Plus size={14} /> Add
                </button>
              </div>
              {tests.map((t, i) => (
                <details className="test-card" key={t._id}>
                  <summary>
                    <span className="test-index">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>Case {i + 1}</span>
                    <span className="test-type">{t.visibility}</span>
                    {t.source === "ai" && !t.verified && (
                      <span className="unverified">Unverified</span>
                    )}
                    <ChevronDown size={14} />
                  </summary>
                  <div className="test-body">
                    <small>INPUT</small>
                    <pre>{t.input}</pre>
                    <small>EXPECTED OUTPUT</small>
                    <pre>{t.expectedOutput}</pre>
                    <button className="text-link" onClick={() => editTest(t)}>
                      Edit
                    </button>
                    {t.source === "ai" && !t.verified && (
                      <button
                        className="text-link"
                        onClick={() => approveTest(t)}
                      >
                        Approve expected output
                      </button>
                    )}
                    <button className="delete-small" onClick={() => delTest(t)}>
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </details>
              ))}
              <div className="test-actions">
                <button
                  className="text-link"
                  onClick={gen}
                  disabled={busy || generating || aiAlreadyGenerated}
                  aria-live="polite"
                >
                  <BrainCircuit size={15} />
                  {generating
                    ? "Generating test cases…"
                    : aiAlreadyGenerated
                      ? "AI test cases generated"
                      : "Generate with AI"}
                </button>
                <button className="text-link" onClick={addTest}>
                  <Plus size={15} /> Add test
                </button>
              </div>
              {generationMessage && (
                <div
                  className={generationComplete ? "ai-generation-notice" : "error-banner"}
                  role="status"
                >
                  {generationMessage}
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="editor-pane">
          <div className="editor-toolbar">
            <div className="language-select">
              <Code2 size={15} />
              <select
                value={language}
                onChange={(e) => {
                  setDraftReady(false);
                  setLanguage(e.target.value);
                }}
              >
                {[
                  ["python", "Python 3"],
                  ["cpp", "C++"],
                  ["java", "Java"],
                  ["javascript", "JavaScript"],
                ].map(([v, l]) => (
                  <option value={v} key={v}>
                    {l}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} />
            </div>
            <span className="editor-saved">
              <i /> Saved
            </span>
            <div className="editor-options">
              <button
                className="reset-code-btn"
                type="button"
                title="Reset code to starter template"
                onClick={resetCode}
              >
                <RotateCcw size={14} /> Reset
              </button>
              <button className="icon-btn" title="Font size">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
          <div className="monaco-wrap">
            <Suspense fallback={<div className="muted">Loading editor?</div>}>
              <Editor
                height="100%"
                language={language === "cpp" ? "cpp" : language}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "JetBrains Mono, Consolas, monospace",
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 18 },
                  renderLineHighlight: "gutter",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  tabSize: 4,
                }}
              />
            </Suspense>
          </div>
          <div className="results-drawer">
            <div className="result-tabs">
              <button
                className={tab === "testcases" ? "active" : ""}
                onClick={() => setTab("testcases")}
              >
                <Grid2X2 size={14} /> Test cases <span>{tests.length}</span>
              </button>
              <button
                className={tab === "result" ? "active" : ""}
                onClick={() => setTab("result")}
              >
                <Terminal size={14} /> Result
              </button>
              <button
                className={tab === "submissions" ? "active" : ""}
                onClick={() => setTab("submissions")}
              >
                <History size={14} /> Submissions
              </button>
            </div>
            <div className="result-content">
              {tab === "testcases" && (
                <div className="compact-tests">
                  {tests.length ? (
                    tests
                      .filter((t) => t.visibility === "sample")
                      .slice(0, 3)
                      .map((t, i) => (
                        <div className="compact-case" key={t._id}>
                          <span>Case {i + 1}</span>
                          <code>
                            {t.input.replaceAll("\n", " ↵ ").slice(0, 65) ||
                              "(empty)"}
                          </code>
                          <Check size={14} />
                        </div>
                      ))
                  ) : (
                    <span className="muted">
                      Add test cases to run your code.
                    </span>
                  )}
                </div>
              )}
              {tab === "result" &&
                (busy ? (
                  <div className="running">
                    <span className="spinner" /> Running against your test
                    suite…
                  </div>
                ) : error ? (
                  <div className="run-error">
                    <X size={15} />
                    {error}
                  </div>
                ) : result ? (
                  <>
                    <div
                      className={`run-summary ${result.status === "Accepted" ? "accepted" : "rejected"}`}
                    >
                      <span className="result-dot">
                        {result.status === "Accepted" ? (
                          <Check size={13} />
                        ) : (
                          <X size={13} />
                        )}
                      </span>
                      <strong>{result.status}</strong>
                      <span>
                        {result.results.filter((x) => x.passed).length} /{" "}
                        {result.results.length} tests passed
                      </span>
                    </div>
                    {result.results.map((r, i) => (
                      <details className="run-case" key={i} open={!r.passed}>
                        <summary>
                          <strong>Case {i + 1}</strong>
                          <span className={r.passed ? "pass-text" : "fail-text"}>
                            {r.passed
                              ? "Passed"
                              : r.compileError
                                ? "Compile error"
                                : r.runtimeError
                                  ? "Runtime error"
                                  : "Wrong answer"}
                          </span>
                          {!r.passed && !r.compileError && !r.runtimeError && (
                            <small>Expected and actual output</small>
                          )}
                          <ChevronDown size={14} />
                        </summary>
                        {!r.passed && (
                          <div className="run-case-details">
                            {!r.compileError && !r.runtimeError && (
                              <div className="output-comparison">
                                <div>
                                  <label>Expected output</label>
                                  <pre>{r.expected || "(empty output)"}</pre>
                                </div>
                                <div>
                                  <label>Your output</label>
                                  <pre>{r.actual || "(empty output)"}</pre>
                                </div>
                              </div>
                            )}
                            {r.stderr && (
                              <div className="execution-error">
                                <label>{r.compileError ? "Compiler error" : "Runtime error"}</label>
                                <pre>{r.stderr}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </details>
                    ))}
                  </>
                ) : (
                  <span className="muted">
                    Run your code to see the results.
                  </span>
                ))}
              {tab === "submissions" && (
                submissions.length ? (
                  <div className="workspace-submissions">
                    {submissions.map((submission) => (
                      <Link className="workspace-submission" key={submission._id} to={`/submissions/${submission._id}`}>
                        <span className={`status-tag ${submission.status === "Accepted" ? "tag-green" : "tag-red"}`}>
                          {submission.status}
                        </span>
                        <span>{submission.language}</span>
                        <time>{new Date(submission.createdAt).toLocaleString()}</time>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span className="muted">
                    Your saved submissions will appear here after you submit.
                  </span>
                )
              )}
            </div>
          </div>
          <div className="editor-footer">
            <span>
              <span className="footer-dot" /> Ready
            </span>
            <div>
              <button
                className="run-btn"
                onClick={() => act(false)}
                disabled={busy}
              >
                <Terminal size={15} /> Run
              </button>
              <button
                className="submit-btn"
                onClick={() => act(true)}
                disabled={busy}
              >
                <Zap size={15} /> Submit
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
function Collections() {
  const [rows, setRows] = useState([]),
    [err, setErr] = useState("");
  const load = () =>
    api
      .get("/collections")
      .then((r) => setRows(r.data.items))
      .catch((e) =>
        setErr(e.response?.data?.error || "Could not load collections"),
      );
  useEffect(() => {
    load();
  }, []);
  const create = async () => {
    const name = prompt("Collection name");
    if (!name) return;
    await api.post("/collections", { name });
    load();
  };
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ORGANIZE YOUR PRACTICE</div>
          <h1>
            Collections<span className="heading-period">.</span>
          </h1>
          <p>Group related problems into focused sets.</p>
        </div>
        <button className="primary-btn" onClick={create}>
          <Plus size={16} /> New collection
        </button>
      </div>
      {err && <div className="error-banner">{err}</div>}
      <div className="collection-grid">
        {rows.map((c) => (
          <div className="panel collection-card" key={c._id}>
            <div className="collection-card-top">
              <span className="collection-folder">
                <Folder size={19} />
              </span>
              <button
                className="icon-btn"
                onClick={async () => {
                  if (confirm("Delete this collection?")) {
                    await api.delete(`/collections/${c._id}`);
                    setRows(rows.filter((x) => x._id !== c._id));
                  }
                }}
              >
                <MoreHorizontal size={17} />
              </button>
            </div>
            <h3>{c.name}</h3>
            <p>{c.description || "A focused set of problems."}</p>
            <div className="collection-card-foot">
              <span>{c.problems?.length || 0} problems</span>
              <span className="collection-open">
                <ArrowRight size={15} />
              </span>
            </div>
          </div>
        ))}
        {!rows.length && (
          <div className="panel collection-empty">
            <Empty
              icon={Folder}
              title="Collections keep things in focus"
              description="Create a group for a topic, a study plan, or your next interview."
              action={
                <button className="secondary-btn" onClick={create}>
                  <Plus size={15} /> New collection
                </button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
function Submissions() {
  const [rows, setRows] = useState([]),
    [err, setErr] = useState("");
  useEffect(() => {
    api
      .get("/submissions")
      .then((r) => setRows(r.data.items))
      .catch((e) =>
        setErr(e.response?.data?.error || "Could not load submissions"),
      );
  }, []);
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR PRACTICE HISTORY</div>
          <h1>
            Submissions<span className="heading-period">.</span>
          </h1>
          <p>Runs and solutions you’ve submitted to your judge.</p>
        </div>
      </div>
      {err && <div className="error-banner">{err}</div>}
      <section className="panel table-panel">
        <div className="submission-table-head">
          <span>RESULT</span>
          <span>PROBLEM</span>
          <span>LANGUAGE</span>
          <span>SUBMITTED</span>
        </div>
        {rows.map((s) => (
          <Link className="submission-table-row" key={s._id} to={`/submissions/${s._id}`} title="View submitted code">
            <span
              className={`status-tag ${s.status === "Accepted" ? "tag-green" : "tag-red"}`}
            >
              {s.status}
            </span>
            <span className="submission-problem-title">
              {s.problem?.title || "Problem"} <ArrowRight size={13} />
            </span>
            <span>{s.language}</span>
            <span>{new Date(s.createdAt).toLocaleString()}</span>
          </Link>
        ))}
        {!rows.length && (
          <Empty
            icon={History}
            title="No submissions yet"
            description="When you submit a solution, you can revisit the result here."
          />
        )}
      </section>
    </div>
  );
}
function SubmissionDetail() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    setError("");
    api.get(`/submissions/${id}`)
      .then((response) => {
        if (!canceled) setSubmission(response.data.submission);
      })
      .catch((requestError) => {
        if (!canceled) setError(requestError.response?.data?.error || "Could not load submission");
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });
    return () => { canceled = true; };
  }, [id]);

  const passed = submission?.results?.filter((result) => result.passed).length || 0;
  return (
    <div className="page-content submission-detail-page">
      <Link to="/submissions" className="back-link"><ArrowLeft size={15} /> All submissions</Link>
      {loading ? (
        <div className="skeleton-list" aria-label="Loading submission" />
      ) : error ? (
        <div className="error-banner" role="alert">{error}</div>
      ) : submission && (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">SUBMISSION HISTORY</div>
              <h1>Submitted solution<span className="heading-period">.</span></h1>
              {submission.problem?._id ? (
                <Link className="submission-detail-problem" to={`/problems/${submission.problem._id}`}>
                  {submission.problem.title || "Open problem"} <ArrowRight size={14} />
                </Link>
              ) : (
                <p>{submission.problem?.title || "Problem"}</p>
              )}
            </div>
          </div>
          <div className="panel submission-detail-meta">
            <div><small>RESULT</small><span className={`status-tag ${submission.status === "Accepted" ? "tag-green" : "tag-red"}`}>{submission.status}</span></div>
            <div><small>LANGUAGE</small><strong>{submission.language}</strong></div>
            <div><small>TESTS PASSED</small><strong>{passed} / {submission.results?.length || 0}</strong></div>
            <div><small>SUBMITTED</small><strong>{new Date(submission.createdAt).toLocaleString()}</strong></div>
          </div>
          <section className="panel submission-code-panel">
            <div className="submission-code-heading"><h2>Submitted code</h2><span>Saved with this submission</span></div>
            <Suspense fallback={<div className="submission-code-loading">Loading code editor…</div>}>
              <Editor
                height="480px"
                language={submission.language === "cpp" ? "cpp" : submission.language}
                theme="vs-dark"
                value={submission.code || ""}
                options={{ readOnly: true, domReadOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, fontSize: 14, fontFamily: "JetBrains Mono, Consolas, monospace", padding: { top: 18 } }}
              />
            </Suspense>
          </section>
        </>
      )}
    </div>
  );
}
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route
          path="/"
          element={
            <Guard>
              <Shell>
                <Dashboard />
              </Shell>
            </Guard>
          }
        />
        <Route
          path="/problems"
          element={
            <Guard>
              <Shell>
                <ProblemLibrary />
              </Shell>
            </Guard>
          }
        />
        <Route
          path="/problems/new"
          element={
            <Guard>
              <Shell>
                <ProblemForm />
              </Shell>
            </Guard>
          }
        />
        <Route
          path="/problems/:id"
          element={
            <Guard>
              <Shell>
                <Workspace />
              </Shell>
            </Guard>
          }
        />
        <Route
          path="/collections"
          element={
            <Guard>
              <Shell>
                <Collections />
              </Shell>
            </Guard>
          }
        />
        <Route
          path="/submissions"
          element={
            <Guard>
              <Shell>
                <Submissions />
              </Shell>
            </Guard>
          }
        />
        <Route
          path="/submissions/:id"
          element={
            <Guard>
              <Shell>
                <SubmissionDetail />
              </Shell>
            </Guard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
