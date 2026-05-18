import { useState, useEffect, useCallback } from "react";

// ─── INITIAL DATA ────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  currentUser: null,
  users: [
    { id: "emp1", name: "Priya Sharma", email: "priya@atomquest.com", role: "employee", managerId: "mgr1", department: "Engineering" },
    { id: "emp2", name: "Rohan Mehta", email: "rohan@atomquest.com", role: "employee", managerId: "mgr1", department: "Engineering" },
    { id: "emp3", name: "Aisha Khan", email: "aisha@atomquest.com", role: "employee", managerId: "mgr2", department: "Sales" },
    { id: "mgr1", name: "Vikram Nair", email: "vikram@atomquest.com", role: "manager", managerId: "admin1", department: "Engineering" },
    { id: "mgr2", name: "Sunita Rao", email: "sunita@atomquest.com", role: "manager", managerId: "admin1", department: "Sales" },
    { id: "admin1", name: "HR Admin", email: "admin@atomquest.com", role: "admin", managerId: null, department: "HR" },
  ],
  goalSheets: {},   // keyed by userId
  auditLogs: [],
  cycles: [
    { id: "cy2024", name: "FY 2024-25", status: "active", startDate: "2024-05-01", endDate: "2025-04-30" }
  ],
  checkIns: {},     // keyed by `${userId}_${quarter}`
  sharedGoals: [],  // pushed by admin/manager
  escalationRules: [
    { id: "esc1", event: "goal_not_submitted", days: 7, active: true },
    { id: "esc2", event: "goal_not_approved", days: 5, active: true },
    { id: "esc3", event: "checkin_not_done", days: 14, active: true },
  ],
  notifications: {},
};

const THRUST_AREAS = ["Revenue Growth", "Customer Experience", "Operational Efficiency", "People & Culture", "Innovation", "Compliance & Risk"];
const UOM_TYPES = ["Min (Numeric/%)", "Max (Numeric/%)", "Timeline", "Zero-based"];
const QUARTERS = ["Q1 (Jul)", "Q2 (Oct)", "Q3 (Jan)", "Q4 (Mar/Apr)"];
const GOAL_STATUSES = ["Not Started", "On Track", "Completed"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function computeScore(uom, planned, actual) {
  if (!planned || !actual) return null;
  const p = parseFloat(planned), a = parseFloat(actual);
  if (isNaN(p) || isNaN(a) || p === 0) return null;
  if (uom.startsWith("Min")) return Math.min((a / p) * 100, 150).toFixed(1);
  if (uom.startsWith("Max")) return Math.min((p / a) * 100, 150).toFixed(1);
  if (uom === "Zero-based") return a === 0 ? "100.0" : "0.0";
  return null;
}

function Badge({ label, color }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-sky-50 text-sky-700 border border-sky-200",
    gray: "bg-gray-100 text-gray-500 border border-gray-200",
    purple: "bg-violet-50 text-violet-700 border border-violet-200",
    gold: "bg-[#FDB813]/15 text-[#b58200] border border-[#FDB813]/30",
  };
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${colors[color] || colors.gray}`}>{label}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Sidebar({ user, active, setActive, onLogout }) {
  const roleNav = {
    employee: [
      { id: "my-goals", label: "My Goals", icon: "🎯" },
      { id: "checkin", label: "Check-ins", icon: "📝" },
    ],
    manager: [
      { id: "team-dashboard", label: "Team Dashboard", icon: "👥" },
      { id: "approvals", label: "Approvals", icon: "✅" },
      { id: "manager-checkin", label: "Team Check-ins", icon: "💬" },
      { id: "analytics", label: "Analytics", icon: "📊" },
    ],
    admin: [
      { id: "admin-overview", label: "Overview", icon: "🏠" },
      { id: "completion-dashboard", label: "Completion", icon: "📋" },
      { id: "audit-log", label: "Audit Log", icon: "🔍" },
      { id: "shared-goals", label: "Shared Goals", icon: "🔗" },
      { id: "escalations", label: "Escalations", icon: "🚨" },
      { id: "analytics", label: "Analytics", icon: "📊" },
      { id: "cycle-mgmt", label: "Cycle Mgmt", icon: "⚙️" },
    ],
  };

  const roleColors = { employee: "from-[#0c0c0c] to-[#1a1a1a]", manager: "from-[#0c0c0c] to-[#1a1a1a]", admin: "from-[#0c0c0c] to-[#1a1a1a]" };

  return (
    <div className={`w-64 min-h-screen bg-gradient-to-b ${roleColors[user.role]} border-r border-[#FDB813]/15 flex flex-col text-white shadow-xl`}>
      <div className="p-5 border-b border-white/10">
        <div className="text-xl font-black tracking-tight text-[#FDB813]">⚛ AtomQuest</div>
        <div className="text-xs opacity-60 mt-0.5">Goal Tracking Portal</div>
      </div>
      <div className="p-4 border-b border-white/10">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="font-semibold text-sm">{user.name}</div>
          <div className="text-xs opacity-70 capitalize">{user.role} · {user.department}</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {(roleNav[user.role] || []).map(item => (
          <button key={item.id} onClick={() => setActive(item.id)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active === item.id ? "bg-[#FDB813]/15 text-[#FDB813] shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "hover:bg-white/5 text-gray-400"}`}>
            <span className="mr-2">{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={onLogout} className="w-full text-left px-3 py-2 rounded-xl text-sm opacity-70 hover:opacity-100 hover:bg-white/10 transition-all">
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ users, onLogin }) {
  const [selected, setSelected] = useState("");
  const demoAccounts = users.slice(0, 6);
  const roleColors = { employee: "border-[#FDB813]/50 bg-[#FDB813]/10", manager: "border-[#FDB813]/50 bg-[#FDB813]/10", admin: "border-[#FDB813]/50 bg-[#FDB813]/10" };
  const roleIcons = { employee: "👤", manager: "👔", admin: "🛡️" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">⚛</div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">AtomQuest</h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">Goal Setting & Tracking Portal</p>
        </div>
        <div className="bg-white shadow-lg border border-gray-200/60 rounded-3xl p-8">
          <h2 className="text-gray-900 font-semibold mb-5 text-center">Select a demo account to continue</h2>
          <div className="grid grid-cols-2 gap-3">
            {demoAccounts.map(u => (
              <button key={u.id} onClick={() => setSelected(u.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${selected === u.id ? roleColors[u.role] + " scale-[1.02]" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{roleIcons[u.role]}</span>
                  <span className={`text-sm font-bold ${selected === u.id ? "text-gray-900" : "text-gray-900"}`}>{u.name}</span>
                </div>
                <div className={`text-xs capitalize ${selected === u.id ? "text-gray-600" : "text-gray-500"}`}>{u.role} · {u.department}</div>
              </button>
            ))}
          </div>
          <button onClick={() => selected && onLogin(selected)} disabled={!selected}
            className="mt-6 w-full bg-[#FDB813] text-black hover:bg-[#e0a310] font-bold py-3 rounded-2xl disabled:opacity-40 shadow-md hover:shadow-lg transition-all text-sm tracking-wide">
            Sign In →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EMPLOYEE: MY GOALS ───────────────────────────────────────────────────────
function MyGoals({ state, setState, user }) {
  const sheet = state.goalSheets[user.id] || { goals: [], status: "draft", cycleId: "cy2024" };
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [form, setForm] = useState({ title: "", thrustArea: "", description: "", uom: "", target: "", weightage: "" });
  const [err, setErr] = useState("");

  const locked = sheet.status === "approved";
  const totalWeight = sheet.goals.reduce((s, g) => s + Number(g.weightage), 0);

  function saveGoal() {
    setErr("");
    if (!form.title || !form.thrustArea || !form.uom || !form.target || !form.weightage) return setErr("All fields required.");
    const w = Number(form.weightage);
    if (w < 10) return setErr("Minimum weightage per goal is 10%.");
    const goals = editGoal ? sheet.goals.map(g => g.id === editGoal.id ? { ...g, ...form } : g) : [...sheet.goals, { id: Date.now().toString(), ...form, status: "Not Started", actuals: {} }];
    if (goals.length > 8) return setErr("Maximum 8 goals allowed.");
    const newTotal = goals.reduce((s, g) => s + Number(g.weightage), 0);
    if (newTotal > 100) return setErr(`Total weightage would be ${newTotal}% — exceeds 100%.`);
    const newSheet = { ...sheet, goals };
    setState(s => ({ ...s, goalSheets: { ...s.goalSheets, [user.id]: newSheet } }));
    setShowForm(false); setEditGoal(null); setForm({ title: "", thrustArea: "", description: "", uom: "", target: "", weightage: "" });
  }

  function deleteGoal(id) {
    const goals = sheet.goals.filter(g => g.id !== id);
    setState(s => ({ ...s, goalSheets: { ...s.goalSheets, [user.id]: { ...sheet, goals } } }));
  }

  function submitSheet() {
    if (totalWeight !== 100) return setErr("Total weightage must equal exactly 100% before submission.");
    if (sheet.goals.length === 0) return setErr("Add at least one goal.");
    const log = { id: Date.now(), user: user.name, action: "Goal sheet submitted", time: new Date().toISOString(), goalSheetOwner: user.id };
    setState(s => ({
      ...s,
      goalSheets: { ...s.goalSheets, [user.id]: { ...sheet, status: "pending" } },
      auditLogs: [log, ...s.auditLogs],
    }));
  }

  const statusColor = { draft: "gray", pending: "yellow", approved: "green", rework: "red" };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Goals</h1>
          <p className="text-gray-400 text-sm mt-0.5">FY 2024-25 · {user.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label={`Status: ${sheet.status}`} color={statusColor[sheet.status] || "gray"} />
          <Badge label={`Weight: ${totalWeight}/100%`} color={totalWeight === 100 ? "green" : totalWeight > 100 ? "red" : "yellow"} />
        </div>
      </div>

      {sheet.status === "rework" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          ⚠️ Your goal sheet was returned for rework. Please review and resubmit.
          {sheet.reworkComment && <div className="mt-1 font-medium">Manager comment: "{sheet.reworkComment}"</div>}
        </div>
      )}

      {err && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600">{err}</div>}

      <div className="space-y-3 mb-6">
        {sheet.goals.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-gray-400">No goals yet. Add your first goal below.</p>
          </div>
        )}
        {sheet.goals.map((g, i) => (
          <div key={g.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                  <span className="font-bold text-gray-900">{g.title}</span>
                  {g.shared && <Badge label="Shared" color="purple" />}
                  <Badge label={g.thrustArea} color="blue" />
                </div>
                <p className="text-sm text-gray-400 mb-2">{g.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  <span className="bg-gray-100 rounded-lg px-2 py-1">UoM: {g.uom}</span>
                  <span className="bg-gray-100 rounded-lg px-2 py-1">Target: {g.target}</span>
                  <span className="bg-[#FDB813]/20 rounded-lg px-2 py-1 font-semibold text-[#FDB813]">Weight: {g.weightage}%</span>
                </div>
              </div>
              {!locked && !g.shared && (
                <div className="flex gap-2 ml-4">
                  <button onClick={() => { setEditGoal(g); setForm(g); setShowForm(true); }} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">Edit</button>
                  <button onClick={() => deleteGoal(g.id)} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg">Remove</button>
                </div>
              )}
              {g.shared && !locked && (
                <div className="ml-4 text-xs text-purple-600 font-medium">Title & Target locked</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {!locked && sheet.goals.length < 8 && (
          <button onClick={() => { setShowForm(true); setEditGoal(null); setForm({ title: "", thrustArea: "", description: "", uom: "", target: "", weightage: "" }); }}
            className="bg-[#FDB813] text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e0a310] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow transition">
            + Add Goal
          </button>
        )}
        {!locked && sheet.status !== "pending" && (
          <button onClick={submitSheet} className="bg-[#FDB813] text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e0a310] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow transition">
            Submit for Approval
          </button>
        )}
        {sheet.status === "pending" && <div className="text-sm text-amber-600 font-medium py-2.5">⏳ Awaiting manager approval…</div>}
        {locked && <div className="text-sm text-emerald-600 font-medium py-2.5">🔒 Goals are locked after approval.</div>}
      </div>

      {showForm && (
        <Modal title={editGoal ? "Edit Goal" : "Add New Goal"} onClose={() => { setShowForm(false); setErr(""); }}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Goal Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Increase Sales Revenue"
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Thrust Area *</label>
                <select value={form.thrustArea} onChange={e => setForm(f => ({ ...f, thrustArea: e.target.value }))}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50">
                  <option value="">Select…</option>
                  {THRUST_AREAS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Unit of Measurement *</label>
                <select value={form.uom} onChange={e => setForm(f => ({ ...f, uom: e.target.value }))}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50">
                  <option value="">Select…</option>
                  {UOM_TYPES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Target *</label>
                <input value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="e.g. 1000000"
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Weightage (%) *</label>
                <input type="number" min={10} max={100} value={form.weightage} onChange={e => setForm(f => ({ ...f, weightage: e.target.value }))}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50" />
              </div>
            </div>
            {err && <div className="text-red-600 text-sm bg-red-50 rounded-lg p-2">{err}</div>}
            <div className="flex gap-3 pt-2">
              <button onClick={saveGoal} className="bg-[#FDB813] text-black px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e0a310] flex-1">Save Goal</button>
              <button onClick={() => { setShowForm(false); setErr(""); }} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── EMPLOYEE: CHECK-INS ──────────────────────────────────────────────────────
function CheckIn({ state, setState, user }) {
  const sheet = state.goalSheets[user.id];
  const [selectedQ, setSelectedQ] = useState(QUARTERS[0]);
  const [actuals, setActuals] = useState({});

  if (!sheet || sheet.status !== "approved") {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-2xl font-black text-gray-900 mb-4">Quarterly Check-ins</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-amber-700 font-medium">Goals must be approved before check-ins are available.</p>
        </div>
      </div>
    );
  }

  const key = `${user.id}_${selectedQ}`;
  const existing = state.checkIns[key] || {};

  function saveActuals() {
    const merged = { ...existing, ...actuals, savedAt: new Date().toISOString() };
    setState(s => ({ ...s, checkIns: { ...s.checkIns, [key]: merged } }));
    alert("Actuals saved successfully!");
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Quarterly Check-ins</h1>
      <p className="text-gray-400 text-sm mb-5">Log your actual achievements against planned targets.</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setSelectedQ(q)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${selectedQ === q ? "bg-[#FDB813] text-black" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {q}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {sheet.goals.map(g => {
          const savedActual = existing[g.id] || {};
          const currentActual = actuals[g.id] || savedActual;
          const score = computeScore(g.uom, g.target, currentActual.value);
          return (
            <div key={g.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-gray-900">{g.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{g.thrustArea} · {g.uom} · Target: {g.target}</div>
                </div>
                {score && <div className="text-right"><div className="text-xs text-gray-400">Score</div><div className={`text-xl font-black ${parseFloat(score) >= 100 ? "text-emerald-600" : "text-amber-500"}`}>{score}%</div></div>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Actual Achievement</label>
                  <input type="text" defaultValue={savedActual.value || ""}
                    onChange={e => setActuals(a => ({ ...a, [g.id]: { ...currentActual, value: e.target.value } }))}
                    placeholder="Enter actual…"
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Status</label>
                  <select defaultValue={savedActual.status || "Not Started"}
                    onChange={e => setActuals(a => ({ ...a, [g.id]: { ...currentActual, status: e.target.value } }))}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50">
                    {GOAL_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Remarks</label>
                  <input type="text" defaultValue={savedActual.remarks || ""}
                    onChange={e => setActuals(a => ({ ...a, [g.id]: { ...currentActual, remarks: e.target.value } }))}
                    placeholder="Optional…"
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={saveActuals} className="mt-5 bg-[#FDB813] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#e0a310] transition text-sm">
        Save Check-in Data
      </button>
    </div>
  );
}

// ─── MANAGER: APPROVALS ───────────────────────────────────────────────────────
function Approvals({ state, setState, user }) {
  const myTeam = state.users.filter(u => u.managerId === user.id);
  const [selected, setSelected] = useState(null);
  const [inlineEdits, setInlineEdits] = useState({});
  const [comment, setComment] = useState("");

  function approveSheet(uid) {
    const sheet = state.goalSheets[uid];
    if (!sheet) return;
    const updatedGoals = sheet.goals.map(g => inlineEdits[g.id] ? { ...g, ...inlineEdits[g.id] } : g);
    const log = { id: Date.now(), user: user.name, action: `Approved goal sheet for ${state.users.find(u => u.id === uid)?.name}`, time: new Date().toISOString(), goalSheetOwner: uid };
    setState(s => ({
      ...s,
      goalSheets: { ...s.goalSheets, [uid]: { ...sheet, goals: updatedGoals, status: "approved" } },
      auditLogs: [log, ...s.auditLogs],
    }));
    setSelected(null); setInlineEdits({});
  }

  function returnSheet(uid) {
    const sheet = state.goalSheets[uid];
    const log = { id: Date.now(), user: user.name, action: `Returned goal sheet for ${state.users.find(u => u.id === uid)?.name} (${comment})`, time: new Date().toISOString(), goalSheetOwner: uid };
    setState(s => ({
      ...s,
      goalSheets: { ...s.goalSheets, [uid]: { ...sheet, status: "rework", reworkComment: comment } },
      auditLogs: [log, ...s.auditLogs],
    }));
    setSelected(null); setComment("");
  }

  const statusColor = { draft: "gray", pending: "yellow", approved: "green", rework: "red" };

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-5">Goal Approvals</h1>
      <div className="space-y-3">
        {myTeam.map(emp => {
          const sheet = state.goalSheets[emp.id];
          const st = sheet?.status || "not submitted";
          return (
            <div key={emp.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900">{emp.name}</div>
                <div className="text-xs text-gray-400">{emp.department}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge label={st} color={statusColor[st] || "gray"} />
                {sheet && st !== "not submitted" && (
                  <button onClick={() => setSelected(emp.id)} className="text-xs bg-[#FDB813]/10 text-[#FDB813] px-3 py-1.5 rounded-lg font-semibold hover:bg-[#FDB813]/20">
                    {st === "pending" ? "Review →" : "View"}
                  </button>
                )}
                {!sheet && <span className="text-xs text-gray-400">No submission yet</span>}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (() => {
        const emp = state.users.find(u => u.id === selected);
        const sheet = state.goalSheets[selected];
        const totalWeight = sheet.goals.reduce((s, g) => s + Number(inlineEdits[g.id]?.weightage ?? g.weightage), 0);
        return (
          <Modal title={`Review: ${emp.name}'s Goals`} onClose={() => { setSelected(null); setInlineEdits({}); }}>
            <div className="space-y-3">
              {sheet.goals.map(g => (
                <div key={g.id} className="border border-gray-200 rounded-xl p-3">
                  <div className="font-semibold text-gray-800 text-sm">{g.title}</div>
                  <div className="text-xs text-gray-400 mb-2">{g.thrustArea} · {g.uom}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Target</label>
                      <input defaultValue={g.target} onChange={e => setInlineEdits(ie => ({ ...ie, [g.id]: { ...ie[g.id], target: e.target.value } }))}
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Weightage (%)</label>
                      <input type="number" defaultValue={g.weightage} onChange={e => setInlineEdits(ie => ({ ...ie, [g.id]: { ...ie[g.id], weightage: e.target.value } }))}
                        className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                    </div>
                  </div>
                </div>
              ))}
              <div className={`text-sm font-semibold ${totalWeight === 100 ? "text-emerald-600" : "text-red-600"}`}>
                Total Weightage: {totalWeight}%{totalWeight !== 100 && " (must be 100%)"}
              </div>
              {sheet.status === "pending" && (
                <>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Comment (for rework)</label>
                    <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Explain what needs changing…"
                      className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => approveSheet(selected)} disabled={totalWeight !== 100}
                      className="flex-1 bg-[#FDB813] text-black py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-[#e0a310]">
                      ✅ Approve
                    </button>
                    <button onClick={() => returnSheet(selected)}
                      className="flex-1 bg-[#d6990b] text-gray-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#b37f07]">
                      ↩ Return for Rework
                    </button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ─── MANAGER: TEAM DASHBOARD ──────────────────────────────────────────────────
function TeamDashboard({ state, user }) {
  const myTeam = state.users.filter(u => u.managerId === user.id);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-5">Team Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-center">
          <div className="text-3xl font-black text-gray-900">{myTeam.length}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Team Members</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-center">
          <div className="text-3xl font-black text-emerald-600">{myTeam.filter(u => state.goalSheets[u.id]?.status === "approved").length}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Goals Approved</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-center">
          <div className="text-3xl font-black text-amber-500">{myTeam.filter(u => state.goalSheets[u.id]?.status === "pending").length}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Pending Review</div>
        </div>
      </div>

      <div className="space-y-3">
        {myTeam.map(emp => {
          const sheet = state.goalSheets[emp.id];
          const totalGoals = sheet?.goals?.length || 0;
          const completedGoals = sheet?.goals?.filter(g => {
            const ci = state.checkIns[`${emp.id}_Q4 (Mar/Apr)`];
            return ci && ci[g.id]?.status === "Completed";
          }).length || 0;

          return (
            <div key={emp.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-gray-900">{emp.name}</div>
                  <div className="text-xs text-gray-400">{emp.department}</div>
                </div>
                <Badge label={sheet?.status || "not submitted"} color={{ approved: "green", pending: "yellow", rework: "red", draft: "gray" }[sheet?.status] || "gray"} />
              </div>
              {sheet && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>{totalGoals} goals · {completedGoals} completed</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#FDB813] h-2 rounded-full transition-all" style={{ width: totalGoals ? `${(completedGoals / totalGoals) * 100}%` : "0%" }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MANAGER: TEAM CHECK-INS ──────────────────────────────────────────────────
function ManagerCheckIn({ state, setState, user }) {
  const myTeam = state.users.filter(u => u.managerId === user.id);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [selectedQ, setSelectedQ] = useState(QUARTERS[0]);
  const [comments, setComments] = useState({});

  function saveComment(empId, quarter) {
    const key = `${empId}_${quarter}_mgr`;
    setState(s => ({ ...s, checkIns: { ...s.checkIns, [key]: { comment: comments[key], by: user.name, at: new Date().toISOString() } } }));
    alert("Check-in comment saved!");
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-5">Team Check-ins</h1>
      <div className="flex gap-2 mb-5 flex-wrap">
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setSelectedQ(q)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${selectedQ === q ? "bg-[#FDB813] text-black" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {q}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {myTeam.map(emp => {
          const sheet = state.goalSheets[emp.id];
          const ciKey = `${emp.id}_${selectedQ}`;
          const ci = state.checkIns[ciKey] || {};
          const mgrKey = `${emp.id}_${selectedQ}_mgr`;
          const mgrCi = state.checkIns[mgrKey];
          const hasActuals = sheet?.goals?.some(g => ci[g.id]?.value);

          return (
            <div key={emp.id} className="bg-white border border-gray-200 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setSelectedEmp(selectedEmp === emp.id ? null : emp.id)}>
                <div>
                  <div className="font-bold text-gray-900">{emp.name}</div>
                  <div className="text-xs text-gray-400">{hasActuals ? "✅ Actuals submitted" : "⏳ No actuals yet"}</div>
                </div>
                <span className="text-gray-400 text-sm">{selectedEmp === emp.id ? "▲" : "▼"}</span>
              </div>

              {selectedEmp === emp.id && sheet && (
                <div className="border-t border-gray-200 p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-200">
                          <th className="text-left py-2 pr-3">Goal</th>
                          <th className="text-left py-2 pr-3">Target</th>
                          <th className="text-left py-2 pr-3">Actual</th>
                          <th className="text-left py-2 pr-3">Status</th>
                          <th className="text-left py-2">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.goals.map(g => {
                          const actual = ci[g.id] || {};
                          const score = computeScore(g.uom, g.target, actual.value);
                          return (
                            <tr key={g.id} className="border-b border-gray-50">
                              <td className="py-2 pr-3 font-medium text-gray-800">{g.title}</td>
                              <td className="py-2 pr-3 text-gray-400">{g.target}</td>
                              <td className="py-2 pr-3 text-gray-600">{actual.value || "—"}</td>
                              <td className="py-2 pr-3"><Badge label={actual.status || "Not Started"} color={{ "Not Started": "gray", "On Track": "yellow", Completed: "green" }[actual.status] || "gray"} /></td>
                              <td className="py-2 font-semibold">{score ? `${score}%` : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Check-in Comment</label>
                    <textarea rows={2} value={comments[`${emp.id}_${selectedQ}_mgr`] || mgrCi?.comment || ""}
                      onChange={e => setComments(c => ({ ...c, [`${emp.id}_${selectedQ}_mgr`]: e.target.value }))}
                      placeholder="Document the discussion…"
                      className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50" />
                    <button onClick={() => saveComment(emp.id, selectedQ)} className="mt-2 bg-[#FDB813] text-black px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#e0a310]">
                      Save Comment
                    </button>
                    {mgrCi && <p className="text-xs text-gray-400 mt-1">Last saved: {new Date(mgrCi.at).toLocaleString()}</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADMIN: OVERVIEW ──────────────────────────────────────────────────────────
function AdminOverview({ state }) {
  const employees = state.users.filter(u => u.role === "employee");
  const managers = state.users.filter(u => u.role === "manager");
  const total = employees.length;
  const submitted = employees.filter(u => state.goalSheets[u.id]?.status !== "draft" && state.goalSheets[u.id]).length;
  const approved = employees.filter(u => state.goalSheets[u.id]?.status === "approved").length;
  const pending = employees.filter(u => state.goalSheets[u.id]?.status === "pending").length;

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-5">Admin Overview</h1>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Employees", value: total, color: "text-gray-900", bg: "bg-white border border-gray-200" },
          { label: "Submitted", value: submitted, color: "text-sky-600", bg: "bg-sky-50 border border-sky-100" },
          { label: "Approved", value: approved, color: "text-emerald-600", bg: "bg-emerald-50 border border-emerald-100" },
          { label: "Pending", value: pending, color: "text-amber-600", bg: "bg-amber-50 border border-amber-100" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 text-center`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">All Employees</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400">
            <tr>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Department</th>
              <th className="text-left px-5 py-3">Manager</th>
              <th className="text-left px-5 py-3">Goal Status</th>
              <th className="text-left px-5 py-3">Goals</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const sheet = state.goalSheets[emp.id];
              const mgr = state.users.find(u => u.id === emp.managerId);
              return (
                <tr key={emp.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-5 py-3 text-gray-400">{emp.department}</td>
                  <td className="px-5 py-3 text-gray-400">{mgr?.name || "—"}</td>
                  <td className="px-5 py-3">
                    <Badge label={sheet?.status || "not submitted"} color={{ approved: "green", pending: "yellow", rework: "red", draft: "gray" }[sheet?.status] || "gray"} />
                  </td>
                  <td className="px-5 py-3 text-gray-400">{sheet?.goals?.length || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ADMIN: COMPLETION DASHBOARD ─────────────────────────────────────────────
function CompletionDashboard({ state }) {
  const employees = state.users.filter(u => u.role === "employee");

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-5">Completion Dashboard</h1>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400">
            <tr>
              <th className="text-left px-5 py-3">Employee</th>
              {QUARTERS.map(q => <th key={q} className="text-center px-3 py-3">{q}</th>)}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{emp.name}</td>
                {QUARTERS.map(q => {
                  const ci = state.checkIns[`${emp.id}_${q}`];
                  const hasData = ci && Object.keys(ci).some(k => k !== "savedAt");
                  return (
                    <td key={q} className="text-center px-3 py-3">
                      {hasData ? <span className="text-[#FDB813] font-bold">✓</span> : <span className="text-gray-600">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ADMIN: AUDIT LOG ─────────────────────────────────────────────────────────
function AuditLog({ state }) {
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-5">Audit Log</h1>
      {state.auditLogs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-400">No audit events yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.auditLogs.map(log => (
            <div key={log.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="w-2 h-2 rounded-full bg-[#FDB813] mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-gray-800 text-sm">{log.action}</div>
                <div className="text-xs text-gray-400 mt-0.5">By {log.user} · {new Date(log.time).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN: SHARED GOALS ──────────────────────────────────────────────────────
function SharedGoals({ state, setState, user }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", thrustArea: "", uom: "", target: "", recipients: [] });
  const employees = state.users.filter(u => u.role === "employee");

  function pushGoal() {
    if (!form.title || !form.thrustArea || !form.uom || !form.target || form.recipients.length === 0) return alert("Fill all fields and select recipients.");
    const sharedGoal = { id: Date.now().toString(), ...form, shared: true, status: "Not Started", actuals: {} };
    let updatedSheets = { ...state.goalSheets };
    for (const uid of form.recipients) {
      const sheet = updatedSheets[uid] || { goals: [], status: "draft", cycleId: "cy2024" };
      if (sheet.goals.length >= 8) continue;
      updatedSheets[uid] = { ...sheet, goals: [...sheet.goals, { ...sharedGoal, weightage: "10" }] };
    }
    const log = { id: Date.now(), user: user.name, action: `Shared goal "${form.title}" with ${form.recipients.length} employees`, time: new Date().toISOString() };
    setState(s => ({ ...s, goalSheets: updatedSheets, auditLogs: [log, ...s.auditLogs], sharedGoals: [...s.sharedGoals, sharedGoal] }));
    setShowForm(false); setForm({ title: "", thrustArea: "", uom: "", target: "", recipients: [] });
  }

  function toggleRecipient(uid) {
    setForm(f => ({ ...f, recipients: f.recipients.includes(uid) ? f.recipients.filter(r => r !== uid) : [...f.recipients, uid] }));
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-black text-gray-900">Shared Goals</h1>
        <button onClick={() => setShowForm(true)} className="bg-[#FDB813] text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e0a310]">
          + Push Shared Goal
        </button>
      </div>

      {state.sharedGoals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-2">🔗</div>
          <p className="text-gray-400">No shared goals pushed yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.sharedGoals.map(g => (
            <div key={g.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-gray-900">{g.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{g.thrustArea} · {g.uom} · Target: {g.target}</div>
                </div>
                <Badge label={`${g.recipients.length} recipients`} color="purple" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Push Shared Goal" onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Goal Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Thrust Area *</label>
                <select value={form.thrustArea} onChange={e => setForm(f => ({ ...f, thrustArea: e.target.value }))}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50">
                  <option value="">Select…</option>
                  {THRUST_AREAS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">UoM *</label>
                <select value={form.uom} onChange={e => setForm(f => ({ ...f, uom: e.target.value }))}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50">
                  <option value="">Select…</option>
                  {UOM_TYPES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Target *</label>
                <input value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB813]/50" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Recipients *</label>
              <div className="space-y-2">
                {employees.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-gray-50">
                    <input type="checkbox" checked={form.recipients.includes(emp.id)} onChange={() => toggleRecipient(emp.id)} className="rounded" />
                    <span className="text-sm">{emp.name} <span className="text-gray-400">({emp.department})</span></span>
                  </label>
                ))}
              </div>
            </div>
            <button onClick={pushGoal} className="w-full bg-[#FDB813] text-black py-2.5 rounded-xl text-sm font-semibold hover:bg-[#e0a310]">
              Push to Selected Employees
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ADMIN: ESCALATIONS ───────────────────────────────────────────────────────
function EscalationsView({ state, setState }) {
  function toggleRule(id) {
    setState(s => ({ ...s, escalationRules: s.escalationRules.map(r => r.id === id ? { ...r, active: !r.active } : r) }));
  }
  function updateDays(id, days) {
    setState(s => ({ ...s, escalationRules: s.escalationRules.map(r => r.id === id ? { ...r, days: Number(days) } : r) }));
  }

  const employees = state.users.filter(u => u.role === "employee");
  const escalations = employees.filter(u => !state.goalSheets[u.id] || state.goalSheets[u.id].status === "draft");

  const eventLabels = { goal_not_submitted: "Goal Not Submitted", goal_not_approved: "Goal Not Approved by Manager", checkin_not_done: "Quarterly Check-in Not Completed" };

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-5">Escalation Rules</h1>
      <div className="grid grid-cols-1 gap-4 mb-8">
        {state.escalationRules.map(rule => (
          <div key={rule.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center gap-4">
            <div className="flex-1">
              <div className="font-semibold text-gray-800">{eventLabels[rule.event]}</div>
              <div className="flex items-center gap-2 mt-2">
                <label className="text-xs text-gray-400">Trigger after</label>
                <input type="number" value={rule.days} min={1} onChange={e => updateDays(rule.id, e.target.value)}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center" />
                <span className="text-xs text-gray-400">days</span>
              </div>
            </div>
            <button onClick={() => toggleRule(rule.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${rule.active ? "bg-[#FDB813]/20 text-[#FDB813]" : "bg-gray-100 text-gray-400"}`}>
              {rule.active ? "Active" : "Inactive"}
            </button>
          </div>
        ))}
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-3">Current Escalation Queue</h2>
      {escalations.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <p className="text-gray-400">No escalations at this time. 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {escalations.map(emp => (
            <div key={emp.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-amber-800">{emp.name}</span>
                <span className="text-amber-600 text-xs ml-2">— Goal not submitted</span>
              </div>
              <Badge label="Escalated" color="yellow" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function Analytics({ state, user }) {
  const employees = state.users.filter(u => u.role === "employee");
  const myTeam = user.role === "manager" ? employees.filter(u => u.managerId === user.id) : employees;

  const thrustCounts = {};
  myTeam.forEach(emp => {
    (state.goalSheets[emp.id]?.goals || []).forEach(g => {
      thrustCounts[g.thrustArea] = (thrustCounts[g.thrustArea] || 0) + 1;
    });
  });

  const maxCount = Math.max(...Object.values(thrustCounts), 1);

  const uomCounts = {};
  myTeam.forEach(emp => {
    (state.goalSheets[emp.id]?.goals || []).forEach(g => {
      uomCounts[g.uom] = (uomCounts[g.uom] || 0) + 1;
    });
  });

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-gray-900 mb-5">Analytics</h1>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h2 className="font-bold text-gray-700 mb-4">Goals by Thrust Area</h2>
          {Object.keys(thrustCounts).length === 0 ? <p className="text-gray-400 text-sm">No data yet.</p> : (
            <div className="space-y-3">
              {Object.entries(thrustCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{k}</span><span>{v}</span></div>
                  <div className="bg-gray-100 rounded-full h-2"><div className="bg-[#FDB813] h-2 rounded-full" style={{ width: `${(v / maxCount) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h2 className="font-bold text-gray-700 mb-4">Goals by UoM Type</h2>
          {Object.keys(uomCounts).length === 0 ? <p className="text-gray-400 text-sm">No data yet.</p> : (
            <div className="space-y-3">
              {Object.entries(uomCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{k}</span><span>{v}</span></div>
                  <div className="bg-gray-100 rounded-full h-2"><div className="bg-[#FDB813] h-2 rounded-full" style={{ width: `${(v / Math.max(...Object.values(uomCounts))) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] col-span-2">
          <h2 className="font-bold text-gray-700 mb-4">Check-in Completion by Quarter</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-400">
                <tr>
                  <th className="text-left pb-2">Employee</th>
                  {QUARTERS.map(q => <th key={q} className="text-center pb-2">{q}</th>)}
                </tr>
              </thead>
              <tbody>
                {myTeam.map(emp => (
                  <tr key={emp.id} className="border-t border-gray-50">
                    <td className="py-2 font-medium text-gray-800">{emp.name}</td>
                    {QUARTERS.map(q => {
                      const ci = state.checkIns[`${emp.id}_${q}`];
                      const done = ci && Object.keys(ci).some(k => k !== "savedAt");
                      return <td key={q} className="text-center py-2">{done ? <span className="text-[#FDB813] font-bold">✓</span> : <span className="text-gray-700">○</span>}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN: CYCLE MANAGEMENT ──────────────────────────────────────────────────
function CycleMgmt({ state, setState }) {
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-black text-gray-900 mb-5">Cycle Management</h1>
      <div className="space-y-3">
        {state.cycles.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900">{c.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{c.startDate} → {c.endDate}</div>
            </div>
            <Badge label={c.status} color={c.status === "active" ? "green" : "gray"} />
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-700 mb-3 text-sm">Check-in Schedule (FY 2024-25)</h2>
        <div className="space-y-2 text-sm">
          {[
            { period: "Phase 1 — Goal Setting", window: "1st May", action: "Goal Creation, Submission & Approval" },
            { period: "Q1 Check-in", window: "July", action: "Progress Update — Planned vs. Actual" },
            { period: "Q2 Check-in", window: "October", action: "Progress Update — Planned vs. Actual" },
            { period: "Q3 Check-in", window: "January", action: "Progress Update — Planned vs. Actual" },
            { period: "Q4 / Annual", window: "March / April", action: "Final Achievement Capture" },
          ].map(r => (
            <div key={r.period} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="w-32 font-semibold text-gray-700 text-xs">{r.period}</div>
              <div className="w-24 text-gray-400 text-xs">{r.window}</div>
              <div className="flex-1 text-gray-600 text-xs">{r.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [activeView, setActiveView] = useState(null);

  const user = state.currentUser ? state.users.find(u => u.id === state.currentUser) : null;

  function handleLogin(userId) {
    const u = state.users.find(x => x.id === userId);
    const defaultViews = { employee: "my-goals", manager: "team-dashboard", admin: "admin-overview" };
    setActiveView(defaultViews[u.role]);
    setState(s => ({ ...s, currentUser: userId }));
  }

  function handleLogout() {
    setState(s => ({ ...s, currentUser: null }));
    setActiveView(null);
  }

  if (!user) return <LoginScreen users={state.users} onLogin={handleLogin} />;

  const views = {
    "my-goals": <MyGoals state={state} setState={setState} user={user} />,
    "checkin": <CheckIn state={state} setState={setState} user={user} />,
    "team-dashboard": <TeamDashboard state={state} user={user} />,
    "approvals": <Approvals state={state} setState={setState} user={user} />,
    "manager-checkin": <ManagerCheckIn state={state} setState={setState} user={user} />,
    "analytics": <Analytics state={state} user={user} />,
    "admin-overview": <AdminOverview state={state} />,
    "completion-dashboard": <CompletionDashboard state={state} />,
    "audit-log": <AuditLog state={state} />,
    "shared-goals": <SharedGoals state={state} setState={setState} user={user} />,
    "escalations": <EscalationsView state={state} setState={setState} />,
    "cycle-mgmt": <CycleMgmt state={state} setState={setState} />,
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] text-gray-900">
      <Sidebar user={user} active={activeView} setActive={setActiveView} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        {views[activeView] || <div className="p-6 text-gray-400">Select a section from the sidebar.</div>}
      </main>
    </div>
  );
}
