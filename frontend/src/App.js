import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

const CATEGORIES = [
  { key: "all",         label: "All Mail",      color: "#5f6368", bg: "#f1f3f4" },
  { key: "Hackathon",   label: "Hackathons",    color: "#c5221f", bg: "#fce8e6" },
  { key: "CodeContest", label: "Code Contests", color: "#7627bb", bg: "#f3e8fd" },
  { key: "CollegeInfo", label: "College Info",  color: "#1a73e8", bg: "#e8f0fe" },
  { key: "Jobs",        label: "Jobs",          color: "#188038", bg: "#e6f4ea" },
  { key: "Social",      label: "Social",        color: "#0097a7", bg: "#e0f7fa" },
  { key: "Finance",     label: "Finance",       color: "#b06000", bg: "#fef0cd" },
  { key: "OTP",         label: "OTP / Alerts",  color: "#c5221f", bg: "#fce8e6" },
  { key: "Promotions",  label: "Promotions",    color: "#5f6368", bg: "#f1f3f4" },
  { key: "Other",       label: "Other",         color: "#5f6368", bg: "#f1f3f4" },
];

function getInitials(from) {
  const name = from.split("<")[0].trim().replace(/"/g, "");
  const words = name.split(" ");
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(from) {
  const colors = ["#1a73e8", "#188038", "#7627bb", "#b06000", "#c5221f", "#0097a7"];
  let hash = 0;
  for (let c of from) hash = c.charCodeAt(0) + hash * 31;
  return colors[Math.abs(hash) % colors.length];
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ status, onRefresh }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f6f8fc" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "48px 40px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: 400, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "#ea4335", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✉</div>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: "#202124", marginBottom: 8 }}>Gmail AI Sorter</h1>
        <p style={{ fontSize: 14, color: "#5f6368", marginBottom: 32 }}>Sort your emails automatically with AI.</p>

        <div style={{ marginBottom: 12 }}>
          {status.personalConnected ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 24px", background: "#e6f4ea", borderRadius: 8, color: "#188038", fontSize: 14, fontWeight: 500 }}>
              ✓ Personal Gmail Connected
            </div>
          ) : (
            <a href={`${API}/auth/personal`} style={{ display: "block", padding: "12px 24px", background: "#1a73e8", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
              Connect Personal Gmail
            </a>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          {status.collegeConnected ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 24px", background: "#e6f4ea", borderRadius: 8, color: "#188038", fontSize: 14, fontWeight: 500 }}>
              ✓ College Gmail Connected
            </div>
          ) : (
            <a href={`${API}/auth/college`} style={{ display: "block", padding: "12px 24px", background: "#fff", border: "1px solid #dadce0", borderRadius: 8, color: "#202124", fontSize: 14, fontWeight: 500, textDecoration: "none", marginTop: 8 }}>
              Connect College Gmail (Optional)
            </a>
          )}
        </div>

        {status.personalConnected && (
          <button onClick={onRefresh} style={{ width: "100%", padding: "12px", background: "#188038", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 500, border: "none", cursor: "pointer" }}>
            Refresh Inbox →
          </button>
        )}

        <p style={{ fontSize: 12, color: "#9aa0a6", marginTop: 20 }}>
          We only classify your emails. They are never shared with anyone.
        </p>
      </div>
    </div>
  );
}

// ─── Email Detail ─────────────────────────────────────────────────────────────
function EmailDetail({ email, onBack }) {
  const cat = CATEGORIES.find(c => c.key === email.category) || CATEGORIES[9];
  return (
    <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
      <button onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", fontSize: 14, marginBottom: 20, padding: "6px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}
        onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}>
        ← Back
      </button>

      <h2 style={{ fontSize: 22, fontWeight: 400, color: "#202124", marginBottom: 20 }}>{email.subject}</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "#f8f9fa", borderRadius: 12, marginBottom: 20, border: "1px solid #e0e0e0" }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: getAvatarColor(email.from), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 500, flexShrink: 0 }}>
          {getInitials(email.from)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#202124", marginBottom: 3 }}>
            {email.from.split("<")[0].trim().replace(/"/g, "")}
          </div>
          <div style={{ fontSize: 12, color: "#5f6368" }}>
            {email.from.match(/<(.+)>/)?.[1] || email.from}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: cat.bg, color: cat.color, fontWeight: 500 }}>{cat.label}</span>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: email.source === "College" ? "#e8f0fe" : "#e6f4ea", color: email.source === "College" ? "#1a73e8" : "#188038", fontWeight: 500 }}>{email.source || "Personal"}</span>
        </div>
      </div>

      <div style={{ padding: 24, background: "#fff", borderRadius: 12, border: "1px solid #e0e0e0", minHeight: 200 }}>
        <p style={{ color: "#5f6368", fontSize: 14, lineHeight: 1.8 }}>
          This email was sent by <strong style={{ color: "#202124" }}>{email.from.split("<")[0].trim().replace(/"/g, "")}</strong>.
        </p>
        <p style={{ color: "#5f6368", fontSize: 14, lineHeight: 1.8, marginTop: 12 }}>
          Subject: <strong style={{ color: "#202124" }}>{email.subject}</strong>
        </p>
        <div style={{ marginTop: 24, padding: "14px 16px", background: "#f8f9fa", borderRadius: 8, border: "1px solid #e0e0e0" }}>
          <p style={{ color: "#5f6368", fontSize: 13, marginBottom: 10 }}>View the full email in Gmail:</p>
          <a href="https://mail.google.com" target="_blank" rel="noreferrer"
            style={{ padding: "8px 20px", background: "#1a73e8", color: "#fff", borderRadius: 6, fontSize: 13, textDecoration: "none" }}>
            Open in Gmail ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [status, setStatus]       = useState({ personalConnected: false, collegeConnected: false });
  const [emails, setEmails]       = useState({});
  const [active, setActive]       = useState("all");
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const [showInbox, setShowInbox] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    
    if (error) {
      alert(`Authentication failed: ${error}`);
      window.history.replaceState({}, '', '/');
    }

    // Check session status
    const checkStatus = () => {
      axios.get(`${API}/api/status`, { withCredentials: true })
        .then(r => {
          setStatus(r.data);
          if (r.data.personalConnected) setShowInbox(true);
        })
        .catch(err => {
          console.error('Status check error:', err);
        });
    };

    checkStatus();

    // After OAuth callback, wait a moment and check again
    if (params.get('personal') === 'connected' || params.get('college') === 'connected') {
      window.history.replaceState({}, '', '/');
      // Add slight delay to ensure session is fully saved
      setTimeout(() => {
        checkStatus();
      }, 500);
    }
  }, []);
  useEffect(() => {
  fetch(`${API}/health`).catch(() => {});
}, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/emails`, { withCredentials: true });
      setEmails(r.data);
      setShowInbox(true);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  const logout = async () => {
    await axios.get(`${API}/auth/logout`, { withCredentials: true });
    setStatus({ personalConnected: false, collegeConnected: false });
    setEmails({});
    setShowInbox(false);
  };

  const allEmails = Object.entries(emails).flatMap(([cat, list]) =>
    list.map(e => ({ ...e, category: cat }))
  );
  const displayed = active === "all" ? allEmails : (emails[active] || []).map(e => ({ ...e, category: active }));
  const countFor  = key => key === "all" ? allEmails.length : (emails[key] || []).length;

  if (!showInbox) return <LoginScreen status={status} onRefresh={fetchEmails} />;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Google Sans', Roboto, sans-serif", background: "#f6f8fc" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: "#f6f8fc", padding: "16px 8px", flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, background: "#ea4335", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✉</div>
          <span style={{ fontSize: 20, color: "#202124", fontWeight: 500 }}>Gmail AI</span>
        </div>

        <button onClick={fetchEmails} disabled={loading}
          style={{ margin: "0 8px 16px", padding: "10px", background: loading ? "#ccc" : "#1a73e8", color: "#fff", border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500 }}>
          {loading ? "Loading..." : "🔄 Refresh Emails"}
        </button>

        {CATEGORIES.map(cat => {
          const count   = countFor(cat.key);
          const isActive = active === cat.key;
          return (
            <div key={cat.key} onClick={() => { setActive(cat.key); setSelected(null); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", borderRadius: "0 24px 24px 0", cursor: "pointer", marginBottom: 2, background: isActive ? "#d3e3fd" : "transparent", color: isActive ? "#0b57d0" : "#202124", fontWeight: isActive ? 600 : 400 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14 }}>{cat.label}</span>
              {count > 0 && <span style={{ fontSize: 12, color: isActive ? "#0b57d0" : "#5f6368" }}>{count}</span>}
            </div>
          );
        })}

        <div style={{ marginTop: "auto", padding: "8px 16px", borderTop: "1px solid #e0e0e0" }}>
          {status.collegeConnected
            ? <div style={{ fontSize: 12, color: "#188038", marginBottom: 8 }}>✓ College Connected</div>
            : <a href={`${API}/auth/college`} style={{ display: "block", fontSize: 12, color: "#1a73e8", marginBottom: 8, textDecoration: "none" }}>+ Connect College Gmail</a>
          }
          <button onClick={logout}
            style={{ background: "none", border: "1px solid #dadce0", borderRadius: 6, padding: "6px 12px", fontSize: 12, color: "#5f6368", cursor: "pointer", width: "100%" }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", borderRadius: "16px 0 0 16px", margin: "8px 0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {selected ? (
          <EmailDetail email={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 500, color: "#202124" }}>
                {CATEGORIES.find(c => c.key === active)?.label}
              </span>
              <span style={{ fontSize: 13, color: "#5f6368", marginLeft: "auto" }}>
                {displayed.length} emails
              </span>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#5f6368", gap: 12 }}>
                  <div style={{ width: 40, height: 40, border: "3px solid #e0e0e0", borderTop: "3px solid #1a73e8", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <p>AI is classifying your emails...</p>
                </div>
              )}

              {!loading && allEmails.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#5f6368", gap: 12 }}>
                  <span style={{ fontSize: 48 }}>📭</span>
                  <p style={{ fontSize: 15 }}>Refresh your inbox to load new emails.</p>
                </div>
              )}

              {!loading && displayed.length === 0 && allEmails.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#5f6368", gap: 8 }}>
                  <span style={{ fontSize: 40 }}>📂</span>
                  <p>There are no emails in this category.</p>
                </div>
              )}

              {!loading && displayed.map((email, i) => {
                const cat = CATEGORIES.find(c => c.key === email.category) || CATEGORIES[9];
                return (
                  <div key={i} onClick={() => setSelected(email)}
                    style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 24px", borderBottom: "1px solid #f0f0f0", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f6f8fc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: getAvatarColor(email.from), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 500, flexShrink: 0 }}>
                      {getInitials(email.from)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#202124", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                          {email.from.split("<")[0].trim().replace(/"/g, "")}
                        </span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: cat.bg, color: cat.color, fontWeight: 500, flexShrink: 0 }}>{cat.label}</span>
                        {email.source && (
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: email.source === "College" ? "#e8f0fe" : "#e6f4ea", color: email.source === "College" ? "#1a73e8" : "#188038", fontWeight: 500, flexShrink: 0 }}>{email.source}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "#202124", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {email.subject}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
