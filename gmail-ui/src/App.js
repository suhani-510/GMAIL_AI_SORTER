import { useState, useEffect } from "react";

const CATEGORIES = [
  { key: "all", label: "All Mail", color: "#5f6368", bg: "#f1f3f4" },
  { key: "Hackathon", label: "Hackathons", color: "#c5221f", bg: "#fce8e6" },
  { key: "CodeContest", label: "Code Contests", color: "#7627bb", bg: "#f3e8fd" },
  { key: "CollegeInfo", label: "College Info", color: "#1a73e8", bg: "#e8f0fe" },
  { key: "Jobs", label: "Jobs", color: "#188038", bg: "#e6f4ea" },
  { key: "Social", label: "Social", color: "#0097a7", bg: "#e0f7fa" },
  { key: "Finance", label: "Finance", color: "#b06000", bg: "#fef0cd" },
  { key: "OTP", label: "OTP / Alerts", color: "#c5221f", bg: "#fce8e6" },
  { key: "Promotions", label: "Promotions", color: "#5f6368", bg: "#f1f3f4" },
  { key: "Other", label: "Other", color: "#5f6368", bg: "#f1f3f4" },
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

function EmailDetail({ email, onBack }) {
  const cat = CATEGORIES.find(c => c.key === email.category) || CATEGORIES[9];
  return (
    <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto", background: "#fff" }}>
      {/* Back button */}
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#5f6368", fontSize: 14, marginBottom: 20, padding: "6px 12px", borderRadius: 20, transition: "background 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}>
        ← Back
      </button>

      {/* Subject */}
      <h2 style={{ fontSize: 22, fontWeight: 400, color: "#202124", marginBottom: 20 }}>
        {email.subject}
      </h2>

      {/* Sender info card */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: "#f8f9fa", borderRadius: 12, marginBottom: 20, border: "1px solid #e0e0e0" }}>
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: cat.bg, color: cat.color, fontWeight: 500 }}>
            {cat.label}
          </span>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: email.source === "College" ? "#e8f0fe" : "#e6f4ea", color: email.source === "College" ? "#1a73e8" : "#188038", fontWeight: 500 }}>
            {email.source || "Personal"}
          </span>
        </div>
      </div>

      {/* Email body placeholder */}
      <div style={{ padding: "24px", background: "#fff", borderRadius: 12, border: "1px solid #e0e0e0", minHeight: 200 }}>
        <p style={{ color: "#5f6368", fontSize: 14, lineHeight: 1.8 }}>
          Yeh email <strong style={{ color: "#202124" }}>{email.from.split("<")[0].trim().replace(/"/g, "")}</strong> ne bheji hai.
        </p>
        <p style={{ color: "#5f6368", fontSize: 14, lineHeight: 1.8, marginTop: 12 }}>
          Subject: <strong style={{ color: "#202124" }}>{email.subject}</strong>
        </p>
        <div style={{ marginTop: 20, padding: "12px 16px", background: "#f8f9fa", borderRadius: 8, border: "1px solid #e0e0e0" }}>
          <p style={{ color: "#5f6368", fontSize: 13 }}>
            Full email body dekhne ke liye Gmail mein open karo →
          </p>
          <a href={`https://mail.google.com/mail/u/0/#inbox`} target="_blank" rel="noreferrer"
            style={{ display: "inline-block", marginTop: 8, padding: "8px 16px", background: "#1a73e8", color: "#fff", borderRadius: 6, fontSize: 13, textDecoration: "none" }}>
            Gmail mein kholо
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [emails, setEmails] = useState({});
  const [active, setActive] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("https://gmail-ai-sorter.onrender.com/all-emails")
      .then((r) => r.json())
      .then((data) => { setEmails(data); setLoading(false); })
      .catch(() => { setError("Server se connect nahi ho paya. server.js chal raha hai?"); setLoading(false); });
  }, []);

  const allEmails = Object.entries(emails).flatMap(([cat, list]) =>
    list.map((e) => ({ ...e, category: cat }))
  );

  const displayed = active === "all" ? allEmails : (emails[active] || []).map((e) => ({ ...e, category: active }));
  const countFor = (key) => key === "all" ? allEmails.length : (emails[key] || []).length;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Google Sans', Roboto, sans-serif", background: "#f6f8fc" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: "#f6f8fc", padding: "16px 8px", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, background: "#ea4335", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 18 }}>✉</span>
          </div>
          <span style={{ fontSize: 20, color: "#202124", fontWeight: 500 }}>Gmail AI</span>
        </div>

        {CATEGORIES.map((cat) => {
          const count = countFor(cat.key);
          const isActive = active === cat.key;
          return (
            <div key={cat.key} onClick={() => { setActive(cat.key); setSelected(null); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", borderRadius: "0 24px 24px 0", cursor: "pointer", marginBottom: 2, background: isActive ? "#d3e3fd" : "transparent", fontWeight: isActive ? 600 : 400, color: isActive ? "#0b57d0" : "#202124" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14 }}>{cat.label}</span>
              {count > 0 && <span style={{ fontSize: 12, color: isActive ? "#0b57d0" : "#5f6368", fontWeight: 500 }}>{count}</span>}
            </div>
          );
        })}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", borderRadius: "16px 0 0 16px", margin: "8px 0 8px 0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>

        {selected ? (
          <EmailDetail email={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            {/* Topbar */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 500, color: "#202124" }}>
                {CATEGORIES.find(c => c.key === active)?.label}
              </span>
              <span style={{ fontSize: 13, color: "#5f6368", marginLeft: "auto" }}>
                {displayed.length} emails
              </span>
            </div>

            {/* Email list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#5f6368", fontSize: 15 }}>
                  Emails load ho rahi hain...
                </div>
              )}
              {error && (
                <div style={{ padding: 32, color: "#c5221f", fontSize: 14 }}>{error}</div>
              )}
              {!loading && !error && displayed.length === 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#5f6368", fontSize: 15 }}>
                  Is category mein koi email nahi
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
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#202124", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                          {email.from.split("<")[0].trim().replace(/"/g, "")}
                        </span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: cat.bg, color: cat.color, fontWeight: 500, flexShrink: 0 }}>
                          {cat.label}
                        </span>
                        {email.source && (
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: email.source === "College" ? "#e8f0fe" : "#e6f4ea", color: email.source === "College" ? "#1a73e8" : "#188038", fontWeight: 500, flexShrink: 0 }}>
                            {email.source}
                          </span>
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
    </div>
  );
}
