/* CRM Central v0.1.1 — GitHub Pages + Supabase
   IMPORTANT:
   1) Put your Supabase project URL and anon key below.
   2) Never put service_role key in this file.
*/
const APP_VERSION = "0.1.1";
const SUPABASE_URL = "https://eplqmkiftafkvqdgvsfp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbHFta2lmdGFma3ZxZGd2c2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzY1MDcsImV4cCI6MjA5NzExMjUwN30.sfAcajUcAl8mniP1FeOF94jKYCKybNAqf2xqtQpXm0c";

const ROLE_LABELS = {
  marketing: "Marketing",
  sales: "Sales",
  cs: "Customer Support",
  management: "Management",
  admin: "Admin",
};

const ACCOUNT_STAGE = {
  lead: { label: "Lead", color: "blue" },
  demo: { label: "Demo", color: "purple" },
  customer: { label: "Customer", color: "green" },
  closed: { label: "Closed / Lost", color: "red" },
};

const LEAD_STATUS = [
  "New Lead",
  "Assigned to Sales",
  "Contacted",
  "Follow-up",
  "รอติดต่อใหม่",
  "นัดเข้าพบแล้ว",
  "เสนอราคา",
  "ทดลองใช้ demo",
  "Interested in Demo",
  "Converted to Customer",
  "Not Interested",
  "Lost",
];

const DEMO_STATUS = [
  "Demo Requested",
  "Scheduling",
  "Demo Scheduled",
  "Demo Completed",
  "Demo Extended",
  "Follow-up After Demo",
  "Won / Converted",
  "Lost After Demo",
];

const CUSTOMER_STATUS = [
  "New Customer",
  "Onboarding",
  "Training",
  "Active",
  "Support Needed",
  "Inactive / Closed",
];

const TASK_TYPE = [
  "Demo",
  "Onboarding",
  "Training",
  "Support",
  "Follow-up",
  "Internal Coordination",
];

const TASK_STATUS = [
  "To Do",
  "In Progress",
  "Waiting Customer",
  "Waiting Internal",
  "Done",
  "Overdue",
];

const PRIORITY = ["Low", "Medium", "High", "Urgent"];

const LEAD_SOURCE = [
  "Facebook Ads",
  "Google Ads",
  "Website Form",
  "LINE OA",
  "Event / Booth",
  "Referral",
  "Cold Call",
  "Sales หาเอง",
  "อื่นๆ",
];

const PRODUCTS = [
  "POS Standard",
  "POS Pro",
  "ระบบสมาชิก",
  "ระบบสต็อก",
  "แพ็กเกจ All-in-One",
  "อื่นๆ",
];

const NAV_ITEMS = [
  { id: "dashboard", icon: "📊", label: "Dashboard", title: "Dashboard", sub: "ภาพรวม Lead · Demo · Customer · Task" },
  { id: "accounts", icon: "🏢", label: "Accounts", title: "Accounts", sub: "Lead / Demo / Customer ใน record เดียว" },
  { id: "demos", icon: "🖥️", label: "Demo Sessions", title: "Demo Sessions", sub: "Demo หลายรอบต่อ Account" },
  { id: "tasks", icon: "✅", label: "CS Tasks", title: "CS Tasks", sub: "งาน Demo / Onboarding / Training / Support" },
  { id: "events", icon: "🕓", label: "Activity", title: "Activity Log", sub: "Note / Update / Audit / Notification" },
  { id: "admin", icon: "⚙️", label: "Admin", title: "Admin", sub: "User / Role / Queue / Export" },
];

let supabaseClient = null;

const state = {
  session: null,
  profile: null,
  profiles: [],
  accounts: [],
  demoSessions: [],
  tasks: [],
  events: [],
  currentPage: "dashboard",
  filters: {
    accounts: { q: "", stage: "", owner: "", status: "" },
    demos: { q: "", status: "", owner: "" },
    tasks: { q: "", status: "", owner: "", priority: "" },
    events: { q: "", type: "" },
  },
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  $("#versionText").textContent = `v${APP_VERSION}`;
  wireGlobalEvents();
  buildNav();

  if (!isConfigured()) {
    showAuth();
    $("#setupWarning").classList.remove("hidden");
    return;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });

  const { data } = await supabaseClient.auth.getSession();
  state.session = data.session;

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    state.session = session;
    if (session) bootApp();
    else showAuth();
  });

  if (state.session) await bootApp();
  else showAuth();
}

function isConfigured() {
  return SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("YOUR_PROJECT_REF") && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");
}

function wireGlobalEvents() {
  $("#loginForm").addEventListener("submit", login);
  $("#logoutBtn").addEventListener("click", logout);
  $("#refreshBtn").addEventListener("click", () => bootApp(true));
  $("#modalCloseBtn").addEventListener("click", closeModal);
  $("#modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
  $("#notifBtn").addEventListener("click", toggleNotifPanel);
  $("#markReadBtn").addEventListener("click", markAllNotificationsRead);
}

async function login(event) {
  event.preventDefault();
  setLoading($("#loginBtn"), true, "กำลังเข้าสู่ระบบ...");
  try {
    const email = $("#loginEmail").value.trim();
    const password = $("#loginPassword").value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    toast("เข้าสู่ระบบแล้ว", "ok");
  } catch (error) {
    toast(error.message || "เข้าสู่ระบบไม่สำเร็จ", "err");
  } finally {
    setLoading($("#loginBtn"), false, "เข้าสู่ระบบ");
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  state.session = null;
  state.profile = null;
  showAuth();
}

async function bootApp(isManualRefresh = false) {
  try {
    showApp();
    await loadAll();
    updateUserUI();
    buildNav();
    render();
    if (isManualRefresh) toast("รีเฟรชข้อมูลแล้ว", "ok");
  } catch (error) {
    console.error(error);
    toast(error.message || "โหลดข้อมูลไม่สำเร็จ", "err");
  }
}

function showAuth() {
  $("#authView").classList.remove("hidden");
  $("#app").classList.add("hidden");
  $("#notifPanel").classList.add("hidden");
}

function showApp() {
  $("#authView").classList.add("hidden");
  $("#app").classList.remove("hidden");
}

async function loadAll() {
  const userId = state.session?.user?.id;
  if (!userId) throw new Error("Missing session");

  const profileRes = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data) {
    throw new Error("ไม่พบ profile ของ user นี้ กรุณารัน SQL สร้าง/promote profile ตาม README");
  }

  state.profile = profileRes.data;

  const [profilesRes, accountsRes, demosRes, tasksRes, eventsRes] = await Promise.all([
    supabaseClient.from("profiles").select("*").order("role").order("sales_queue_order", { nullsFirst: false }).order("full_name"),
    supabaseClient.from("accounts").select("*").order("updated_at", { ascending: false }).limit(500),
    supabaseClient.from("demo_sessions").select("*").order("created_at", { ascending: false }).limit(500),
    supabaseClient.from("cs_tasks").select("*").order("updated_at", { ascending: false }).limit(500),
    supabaseClient.from("app_events").select("*").order("created_at", { ascending: false }).limit(700),
  ]);

  [profilesRes, accountsRes, demosRes, tasksRes, eventsRes].forEach((res) => {
    if (res.error) throw res.error;
  });

  state.profiles = profilesRes.data || [];
  state.accounts = accountsRes.data || [];
  state.demoSessions = demosRes.data || [];
  state.tasks = tasksRes.data || [];
  state.events = eventsRes.data || [];
}

function updateUserUI() {
  const p = state.profile;
  $("#userName").textContent = p.full_name || p.email || "-";
  $("#userRole").textContent = ROLE_LABELS[p.role] || p.role || "-";
  $("#userAvatar").textContent = initials(p.full_name || p.email || "?");
  renderNotifBadge();
}

function buildNav() {
  const nav = $("#nav");
  nav.innerHTML = NAV_ITEMS.map((item) => {
    const count = navCount(item.id);
    return `
      <button type="button" class="${state.currentPage === item.id ? "active" : ""}" data-page="${escAttr(item.id)}">
        <span>${item.icon}</span>
        <span class="nav-label">${esc(item.label)}</span>
        ${count ? `<span class="nav-count">${count}</span>` : ""}
      </button>
    `;
  }).join("");

  nav.querySelectorAll("button[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => goto(btn.dataset.page));
  });
}

function navCount(page) {
  if (page === "tasks") return state.tasks.filter((t) => isTaskOverdue(t)).length;
  if (page === "demos") return state.demoSessions.filter((d) => ["Demo Requested", "Scheduling", "Demo Scheduled", "Demo Extended"].includes(d.status)).length;
  if (page === "accounts") return state.accounts.filter((a) => a.lifecycle_stage === "lead").length;
  return 0;
}

function goto(page) {
  state.currentPage = page;
  const item = NAV_ITEMS.find((n) => n.id === page);
  $("#pageTitle").textContent = item?.title || page;
  $("#pageSub").textContent = item?.sub || "";
  buildNav();
  render();
}

function render() {
  const content = $("#content");
  if (state.currentPage === "dashboard") content.innerHTML = renderDashboard();
  else if (state.currentPage === "accounts") content.innerHTML = renderAccounts();
  else if (state.currentPage === "demos") content.innerHTML = renderDemos();
  else if (state.currentPage === "tasks") content.innerHTML = renderTasks();
  else if (state.currentPage === "events") content.innerHTML = renderEvents();
  else if (state.currentPage === "admin") content.innerHTML = renderAdmin();
  else content.innerHTML = emptyState("ไม่พบหน้า", "📭");
  bindPageEvents();
  renderNotifBadge();
}

function renderDashboard() {
  const total = state.accounts.length;
  const leads = state.accounts.filter((a) => a.lifecycle_stage === "lead").length;
  const demos = state.accounts.filter((a) => a.lifecycle_stage === "demo").length;
  const customers = state.accounts.filter((a) => a.lifecycle_stage === "customer").length;
  const closed = state.accounts.filter((a) => a.lifecycle_stage === "closed").length;
  const demoRounds = state.demoSessions.length;
  const openTasks = state.tasks.filter((t) => t.status !== "Done").length;
  const overdue = state.tasks.filter((t) => isTaskOverdue(t)).length;
  const mktNoMax = Math.max(-1, ...state.accounts.map((a) => Number.isInteger(a.marketing_lead_no) ? a.marketing_lead_no : -1));

  return `
    <div class="stats">
      ${stat("Accounts ทั้งหมด", total, "ทุก origin")}
      ${stat("Lead", leads, "รอ Sales ดูแล")}
      ${stat("Demo", demos, `${demoRounds} demo session`)}
      ${stat("Customer", customers, "ปิดเป็นลูกค้าแล้ว")}
      ${stat("Closed / Lost", closed, "ตัดจบ")}
      ${stat("Open CS Task", openTasks, "ยังไม่ Done")}
      ${stat("Task Overdue", overdue, overdue ? "ต้องติดตามด่วน" : "ไม่มีค้าง")}
      ${stat("Marketing Lead No. ล่าสุด", mktNoMax >= 0 ? mktNoMax : "-", "เลขรัน Marketing")}
    </div>

    <div class="grid two">
      <div class="card">
        <div class="card-head"><h3>Account Stage</h3></div>
        <div class="card-body">${barChart(groupCount(state.accounts, "lifecycle_stage"), (k) => ACCOUNT_STAGE[k]?.label || k)}</div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Sales Owner</h3></div>
        <div class="card-body">${barChart(groupCount(state.accounts, "sales_owner_id"), (k) => userName(k))}</div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Demo Status</h3></div>
        <div class="card-body">${barChart(groupCount(state.demoSessions, "status"), (k) => k)}</div>
      </div>
      <div class="card">
        <div class="card-head"><h3>CS Task by Owner</h3></div>
        <div class="card-body">${barChart(groupCount(state.tasks, "cs_owner_id"), (k) => userName(k))}</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-head"><h3>Performance รายคน</h3></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>ผู้ใช้</th><th>Role</th><th>Active</th><th>Accounts</th><th>Demo</th><th>Customer</th><th>Tasks</th><th>Overdue</th></tr>
          </thead>
          <tbody>
            ${state.profiles.filter((u) => ["sales", "cs"].includes(u.role)).map((u) => {
              const acc = state.accounts.filter((a) => a.sales_owner_id === u.id || a.cs_owner_id === u.id);
              const dms = state.demoSessions.filter((d) => d.cs_owner_id === u.id);
              const cus = acc.filter((a) => a.lifecycle_stage === "customer");
              const tasks = state.tasks.filter((t) => t.cs_owner_id === u.id);
              const od = tasks.filter((t) => isTaskOverdue(t)).length;
              return `
                <tr>
                  <td><strong>${esc(u.full_name || u.email)}</strong></td>
                  <td>${esc(ROLE_LABELS[u.role] || u.role)}</td>
                  <td>${u.is_active ? pill("Active", "green") : pill("Inactive", "gray")}</td>
                  <td>${acc.length}</td>
                  <td>${dms.length}</td>
                  <td>${cus.length}</td>
                  <td>${tasks.length}</td>
                  <td>${od ? pill(String(od), "red") : "0"}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAccounts() {
  const f = state.filters.accounts;
  let rows = state.accounts.slice();

  if (f.q) {
    const q = f.q.toLowerCase();
    rows = rows.filter((a) => [
      a.company_name, a.contact_name, a.phone, a.email, a.line_id, a.lead_source, String(a.marketing_lead_no ?? "")
    ].some((v) => String(v || "").toLowerCase().includes(q)));
  }
  if (f.stage) rows = rows.filter((a) => a.lifecycle_stage === f.stage);
  if (f.owner) rows = rows.filter((a) => a.sales_owner_id === f.owner || a.cs_owner_id === f.owner);
  if (f.status) rows = rows.filter((a) => [a.lead_status, a.customer_status].includes(f.status));

  return `
    <div class="toolbar">
      ${searchInput("accounts", f.q)}
      ${selectFilter("accounts", "stage", "ทุก Stage", Object.keys(ACCOUNT_STAGE), (v) => ACCOUNT_STAGE[v].label)}
      ${selectFilter("accounts", "owner", "ทุก Owner", usersForOwnerOptions().map((u) => u.id), (id) => userName(id))}
      ${selectFilter("accounts", "status", "ทุก Status", uniq([...LEAD_STATUS, ...CUSTOMER_STATUS]), (v) => v)}
      <button class="btn primary" type="button" data-action="new-account">＋ เพิ่ม Account</button>
    </div>

    ${rows.length ? `
      <div class="card table-wrap">
        <table>
          <thead>
            <tr><th>No.</th><th>Account</th><th>Stage</th><th>Status</th><th>Sales Owner</th><th>CS Owner</th><th>Follow-up</th><th></th></tr>
          </thead>
          <tbody>
            ${rows.map((a) => `
              <tr class="clickable" data-action="view-account" data-id="${escAttr(a.id)}">
                <td>${a.marketing_lead_no ?? `<span class="muted">—</span>`}</td>
                <td><div class="twoline"><strong>${esc(a.company_name || "-")}</strong><small>${esc(a.contact_name || "")} ${esc(a.phone || "")}</small></div></td>
                <td>${stagePill(a.lifecycle_stage)}</td>
                <td>${esc(accountStatus(a) || "—")}</td>
                <td>${esc(userName(a.sales_owner_id))}</td>
                <td>${esc(userName(a.cs_owner_id))}</td>
                <td>${formatDate(a.next_followup_date)}</td>
                <td><button class="btn small" type="button" data-action="edit-account" data-id="${escAttr(a.id)}">แก้ไข</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : emptyState("ยังไม่มี Account ตรงกับเงื่อนไข", "🏢")}
  `;
}

function renderDemos() {
  const f = state.filters.demos;
  let rows = state.demoSessions.slice();

  if (f.q) {
    const q = f.q.toLowerCase();
    rows = rows.filter((d) => {
      const a = accountById(d.account_id);
      return [a?.company_name, d.status, d.notes, d.pain_point, d.demo_result].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }
  if (f.status) rows = rows.filter((d) => d.status === f.status);
  if (f.owner) rows = rows.filter((d) => d.cs_owner_id === f.owner);

  return `
    <div class="toolbar">
      ${searchInput("demos", f.q)}
      ${selectFilter("demos", "status", "ทุก Status", DEMO_STATUS, (v) => v)}
      ${selectFilter("demos", "owner", "ทุก CS", state.profiles.filter((u) => u.role === "cs").map((u) => u.id), (id) => userName(id))}
      <button class="btn primary" type="button" data-action="new-demo">＋ สร้าง Demo Session</button>
    </div>

    ${rows.length ? `
      <div class="card table-wrap">
        <table>
          <thead>
            <tr><th>Account</th><th>รอบ</th><th>CS Owner</th><th>Status</th><th>วัน/เวลา</th><th>Follow-up</th><th></th></tr>
          </thead>
          <tbody>
            ${rows.map((d) => {
              const a = accountById(d.account_id);
              return `
                <tr class="clickable" data-action="view-demo" data-id="${escAttr(d.id)}">
                  <td><div class="twoline"><strong>${esc(a?.company_name || "-")}</strong><small>${esc(d.id)}</small></div></td>
                  <td>${d.demo_no || "-"}</td>
                  <td>${esc(userName(d.cs_owner_id))}</td>
                  <td>${statusPill(d.status)}</td>
                  <td>${formatDate(d.demo_date)} ${esc(d.demo_time || "")}</td>
                  <td>${formatDate(d.next_followup_date)}</td>
                  <td><button class="btn small" type="button" data-action="edit-demo" data-id="${escAttr(d.id)}">แก้ไข</button></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    ` : emptyState("ยังไม่มี Demo Session", "🖥️")}
  `;
}

function renderTasks() {
  const f = state.filters.tasks;
  let rows = state.tasks.slice();

  if (f.q) {
    const q = f.q.toLowerCase();
    rows = rows.filter((t) => {
      const a = accountById(t.account_id);
      return [t.task_name, t.notes, t.blocker, a?.company_name].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }
  if (f.status) {
    if (f.status === "Overdue") rows = rows.filter((t) => isTaskOverdue(t));
    else rows = rows.filter((t) => t.status === f.status);
  }
  if (f.owner) rows = rows.filter((t) => t.cs_owner_id === f.owner);
  if (f.priority) rows = rows.filter((t) => t.priority === f.priority);

  return `
    <div class="stats">
      ${stat("To Do", state.tasks.filter((t) => t.status === "To Do").length, "")}
      ${stat("In Progress", state.tasks.filter((t) => t.status === "In Progress").length, "")}
      ${stat("Done", state.tasks.filter((t) => t.status === "Done").length, "")}
      ${stat("Overdue", state.tasks.filter((t) => isTaskOverdue(t)).length, "")}
    </div>

    <div class="toolbar">
      ${searchInput("tasks", f.q)}
      ${selectFilter("tasks", "status", "ทุก Status", TASK_STATUS, (v) => v)}
      ${selectFilter("tasks", "owner", "ทุก CS", state.profiles.filter((u) => u.role === "cs").map((u) => u.id), (id) => userName(id))}
      ${selectFilter("tasks", "priority", "ทุก Priority", PRIORITY, (v) => v)}
      <button class="btn primary" type="button" data-action="new-task">＋ สร้าง Task</button>
    </div>

    ${rows.length ? `
      <div class="card table-wrap">
        <table>
          <thead>
            <tr><th>Task</th><th>Account</th><th>Type</th><th>CS Owner</th><th>Status</th><th>Priority</th><th>Due</th><th></th></tr>
          </thead>
          <tbody>
            ${rows.map((t) => {
              const overdue = isTaskOverdue(t);
              const a = accountById(t.account_id);
              return `
                <tr class="clickable" data-action="view-task" data-id="${escAttr(t.id)}">
                  <td><div class="twoline"><strong>${esc(t.task_name)}</strong><small>${t.blocker ? `🚧 ${esc(t.blocker)}` : esc(t.notes || "")}</small></div></td>
                  <td>${esc(a?.company_name || "-")}</td>
                  <td>${esc(t.task_type || "-")}</td>
                  <td>${esc(userName(t.cs_owner_id))}</td>
                  <td>${overdue ? pill("Overdue", "red") : statusPill(t.status)}</td>
                  <td>${priorityPill(t.priority)}</td>
                  <td>${formatDate(t.due_date)}</td>
                  <td><button class="btn small" type="button" data-action="edit-task" data-id="${escAttr(t.id)}">แก้ไข</button></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    ` : emptyState("ยังไม่มี CS Task", "✅")}
  `;
}

function renderEvents() {
  const f = state.filters.events;
  let rows = state.events.slice();

  if (f.q) {
    const q = f.q.toLowerCase();
    rows = rows.filter((e) => [e.title, e.message, e.event_type].some((v) => String(v || "").toLowerCase().includes(q)));
  }
  if (f.type) rows = rows.filter((e) => e.event_type === f.type);

  return `
    <div class="toolbar">
      ${searchInput("events", f.q)}
      ${selectFilter("events", "type", "ทุก Type", uniq(state.events.map((e) => e.event_type).filter(Boolean)), (v) => v)}
    </div>

    <div class="card">
      <div class="card-body">
        ${rows.length ? `
          <ul class="timeline">
            ${rows.map((e) => `
              <li>
                <strong>${esc(e.title || e.event_type || "Event")}</strong>
                ${e.message ? ` — ${esc(e.message)}` : ""}
                <div class="muted">${esc(userName(e.created_by))} · ${formatDateTime(e.created_at)}</div>
              </li>
            `).join("")}
          </ul>
        ` : emptyState("ยังไม่มี Activity", "🕓")}
      </div>
    </div>
  `;
}

function renderAdmin() {
  if (!hasRole(["admin", "management"])) {
    return `<div class="alert warning">หน้านี้สำหรับ Admin / Management เท่านั้น</div>`;
  }
  const exportBtns = `
    <button class="btn" type="button" data-action="export-accounts">Export Accounts CSV</button>
    <button class="btn" type="button" data-action="export-demos">Export Demo CSV</button>
    <button class="btn" type="button" data-action="export-tasks">Export Task CSV</button>
  `;

  return `
    <div class="grid two">
      <div class="card">
        <div class="card-head">
          <h3>Users / Roles / Sales Queue</h3>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th>Queue</th><th></th></tr></thead>
            <tbody>
              ${state.profiles.map((u) => `
                <tr>
                  <td><strong>${esc(u.full_name || "-")}</strong></td>
                  <td>${esc(u.email || "-")}</td>
                  <td>${esc(ROLE_LABELS[u.role] || u.role)}</td>
                  <td>${u.is_active ? pill("Active", "green") : pill("Inactive", "gray")}</td>
                  <td>${u.sales_queue_order ?? "-"}</td>
                  <td>${hasRole(["admin"]) ? `<button class="btn small" type="button" data-action="edit-user" data-id="${escAttr(u.id)}">แก้ไข</button>` : ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Export / Backup</h3></div>
        <div class="card-body">
          <p class="muted">Export ใช้ข้อมูลที่ RLS อนุญาตให้ user ปัจจุบันเห็นเท่านั้น</p>
          <div class="row-actions" style="flex-wrap:wrap">${exportBtns}</div>
          <div class="section-title">Sales Auto Assign</div>
          <p>Marketing Lead จะใช้ round-robin จาก Sales ที่ <strong>active</strong> เรียงตาม <code>sales_queue_order</code></p>
        </div>
      </div>
    </div>
  `;
}

function bindPageEvents() {
  $all("[data-action]").forEach((el) => {
    el.addEventListener("click", async (event) => {
      event.stopPropagation();
      const action = el.dataset.action;
      const id = el.dataset.id;

      if (action === "new-account") return openAccountForm();
      if (action === "edit-account") return openAccountForm(id);
      if (action === "view-account") return openAccountDetail(id);

      if (action === "new-demo") return openDemoForm();
      if (action === "edit-demo") return openDemoForm(id);
      if (action === "view-demo") return openDemoDetail(id);

      if (action === "new-task") return openTaskForm();
      if (action === "edit-task") return openTaskForm(id);
      if (action === "view-task") return openTaskDetail(id);

      if (action === "edit-user") return openUserForm(id);

      if (action === "export-accounts") return exportCSV("accounts", state.accounts);
      if (action === "export-demos") return exportCSV("demo_sessions", state.demoSessions);
      if (action === "export-tasks") return exportCSV("cs_tasks", state.tasks);
    });
  });

  $all("[data-filter-page]").forEach((el) => {
    el.addEventListener("input", onFilterChange);
    el.addEventListener("change", onFilterChange);
  });
}

function onFilterChange(event) {
  const page = event.target.dataset.filterPage;
  const key = event.target.dataset.filterKey;
  state.filters[page][key] = event.target.value;
  render();
}

function openAccountForm(id = null, preset = {}) {
  const isEdit = Boolean(id);
  const account = isEdit ? accountById(id) : preset;
  if (isEdit && !account) return toast("ไม่พบ Account", "err");

  const role = state.profile.role;
  const allowedOrigins = role === "marketing" ? ["marketing"] :
    role === "sales" ? ["sales"] :
    role === "cs" ? ["cs"] :
    ["marketing", "sales", "cs"];

  const origin = account.origin || allowedOrigins[0] || "sales";
  const stageOptions = !isEdit && role === "marketing" ? ["lead"] :
    !isEdit && role === "cs" ? ["customer"] :
    Object.keys(ACCOUNT_STAGE);
  const stage = account.lifecycle_stage || (origin === "cs" ? "customer" : "lead");

  const fields = [
    { key: "origin", label: "Origin", type: "select", options: allowedOrigins, value: origin, required: true, disabled: isEdit },
    { key: "lifecycle_stage", label: "Stage", type: "select", options: stageOptions, value: stage, required: true },
    { key: "company_name", label: "Company Name", value: account.company_name || "", required: true },
    { key: "contact_name", label: "Contact Name", value: account.contact_name || "" },
    { key: "phone", label: "Phone", value: account.phone || "" },
    { key: "email", label: "Email", type: "email", value: account.email || "" },
    { key: "line_id", label: "LINE ID", value: account.line_id || "" },
    { key: "lead_source", label: "Lead Source", type: "select", options: ["", ...LEAD_SOURCE], value: account.lead_source || "" },
    { key: "campaign", label: "Campaign / Channel", value: account.campaign || "" },
    { key: "sales_owner_id", label: "Sales Owner", type: "select", options: ["", ...salesUsers().map((u) => u.id)], optionLabel: userName, value: account.sales_owner_id || defaultSalesOwnerForForm(origin), required: stage === "customer" || origin === "cs" },
    { key: "cs_owner_id", label: "CS Owner", type: "select", options: ["", ...csUsers().map((u) => u.id)], optionLabel: userName, value: account.cs_owner_id || "" },
    { key: "lead_status", label: "Lead Status", type: "select", options: ["", ...LEAD_STATUS], value: account.lead_status || "New Lead" },
    { key: "customer_status", label: "Customer Status", type: "select", options: ["", ...CUSTOMER_STATUS], value: account.customer_status || "" },
    { key: "priority", label: "Priority", type: "select", options: PRIORITY, value: account.priority || "Medium" },
    { key: "next_action", label: "Next Action", value: account.next_action || "" },
    { key: "next_followup_date", label: "Next Follow-up Date", type: "date", value: account.next_followup_date || "" },
    { key: "product_package", label: "Product / Package", type: "select", options: ["", ...PRODUCTS], value: account.product_package || "" },
    { key: "customer_start_date", label: "Customer Start Date", type: "date", value: account.customer_start_date || "" },
    { key: "notes", label: "Notes", type: "textarea", value: account.notes || "", full: true },
  ];

  openForm(isEdit ? "แก้ไข Account" : "เพิ่ม Account", fields, async (values) => {
    if (!values.company_name.trim()) throw new Error("กรุณากรอก Company Name");
    if (values.lifecycle_stage === "customer" && !values.sales_owner_id) {
      throw new Error("Customer ทุก record ต้องมี Sales Owner");
    }

    if (isEdit) {
      await updateAccount(id, values, account);
    } else {
      await createAccount(values);
    }
  });
}

function defaultSalesOwnerForForm(origin) {
  if (origin === "sales" && state.profile.role === "sales") return state.profile.id;
  return "";
}

async function createAccount(values) {
  const origin = values.origin;

  if (origin === "marketing") {
    const payload = normalizeAccountPayload(values);
    payload.lifecycle_stage = "lead";
    const { error } = await supabaseClient.rpc("create_marketing_account", { payload });
    if (error) throw error;
    toast("สร้าง Marketing Lead + Auto Assign Sales แล้ว", "ok");
  } else {
    const payload = normalizeAccountPayload(values);
    payload.marketing_lead_no = null;
    payload.origin = origin;
    payload.created_by = state.profile.id;

    if (origin === "sales") payload.sales_owner_id = state.profile.role === "sales" ? state.profile.id : payload.sales_owner_id;
    if (origin === "cs") {
      payload.lifecycle_stage = "customer";
      if (!payload.sales_owner_id) throw new Error("CS-created Customer ต้องเลือก Sales Owner");
    }

    const { data, error } = await supabaseClient.from("accounts").insert(payload).select().single();
    if (error) throw error;
    await logEvent({ account_id: data.id, event_type: "audit", title: "สร้าง Account", message: data.company_name });
    toast("สร้าง Account แล้ว", "ok");
  }

  closeModal();
  await bootApp();
}

async function updateAccount(id, values, before) {
  const payload = normalizeAccountPayload(values);
  delete payload.origin;
  delete payload.marketing_lead_no;
  payload.updated_at = new Date().toISOString();

  if (payload.lifecycle_stage === "customer" && !payload.sales_owner_id) {
    throw new Error("Customer ทุก record ต้องมี Sales Owner");
  }

  const { error } = await supabaseClient.from("accounts").update(payload).eq("id", id);
  if (error) throw error;

  await logEvent({
    account_id: id,
    event_type: "audit",
    title: "แก้ไข Account",
    message: before.company_name,
    metadata: { before_stage: before.lifecycle_stage, after_stage: payload.lifecycle_stage },
  });

  toast("บันทึก Account แล้ว", "ok");
  closeModal();
  await bootApp();
}

function normalizeAccountPayload(values) {
  const payload = {};
  [
    "origin", "lifecycle_stage", "company_name", "contact_name", "phone", "email", "line_id",
    "lead_source", "campaign", "sales_owner_id", "cs_owner_id", "lead_status", "customer_status",
    "priority", "next_action", "next_followup_date", "product_package", "customer_start_date", "notes"
  ].forEach((k) => {
    payload[k] = values[k] === "" ? null : values[k];
  });

  if (!payload.lifecycle_stage) payload.lifecycle_stage = payload.origin === "cs" ? "customer" : "lead";
  if (!payload.lead_status) payload.lead_status = "New Lead";
  if (!payload.priority) payload.priority = "Medium";
  return payload;
}

function openAccountDetail(id) {
  const a = accountById(id);
  if (!a) return toast("ไม่พบ Account", "err");
  const demos = state.demoSessions.filter((d) => d.account_id === id).sort((x, y) => (x.demo_no || 0) - (y.demo_no || 0));
  const tasks = state.tasks.filter((t) => t.account_id === id);
  const events = state.events.filter((e) => e.account_id === id).slice(0, 20);

  const body = `
    <div class="detail">
      ${detailRow("Marketing Lead No.", a.marketing_lead_no ?? "—")}
      ${detailRow("Origin", esc(a.origin || "—"))}
      ${detailRow("Stage", stagePill(a.lifecycle_stage))}
      ${detailRow("Status", esc(accountStatus(a) || "—"))}
      ${detailRow("Company", esc(a.company_name || "—"))}
      ${detailRow("Contact", esc(a.contact_name || "—"))}
      ${detailRow("Phone / Email", `${esc(a.phone || "—")} · ${esc(a.email || "—")}`)}
      ${detailRow("LINE", esc(a.line_id || "—"))}
      ${detailRow("Sales Owner", esc(userName(a.sales_owner_id)))}
      ${detailRow("CS Owner", esc(userName(a.cs_owner_id)))}
      ${detailRow("Source", esc(a.lead_source || "—"))}
      ${detailRow("Follow-up", formatDate(a.next_followup_date))}
      ${detailRow("Product", esc(a.product_package || "—"))}
      ${detailRow("Created", formatDateTime(a.created_at))}
    </div>

    <div class="section-title">Notes</div>
    ${a.notes ? `<div class="note-item">${esc(a.notes)}<div class="meta">Main note</div></div>` : `<div class="muted">ยังไม่มี notes</div>`}

    <div class="section-title">Demo Sessions (${demos.length})</div>
    ${demos.length ? demos.map((d) => `
      <div class="note-item">
        <strong>Demo รอบ ${d.demo_no}</strong> — ${statusPill(d.status)}
        <div class="meta">${formatDate(d.demo_date)} ${esc(d.demo_time || "")} · CS: ${esc(userName(d.cs_owner_id))}</div>
      </div>
    `).join("") : `<div class="muted">ยังไม่มี demo</div>`}

    <div class="section-title">CS Tasks (${tasks.length})</div>
    ${tasks.length ? tasks.map((t) => `
      <div class="note-item">
        <strong>${esc(t.task_name)}</strong> — ${isTaskOverdue(t) ? pill("Overdue", "red") : statusPill(t.status)}
        <div class="meta">Due ${formatDate(t.due_date)} · CS: ${esc(userName(t.cs_owner_id))}</div>
      </div>
    `).join("") : `<div class="muted">ยังไม่มี task</div>`}

    <div class="section-title">Activity</div>
    ${events.length ? `<ul class="timeline">${events.map((e) => `<li><strong>${esc(e.title || e.event_type)}</strong>${e.message ? ` — ${esc(e.message)}` : ""}<div class="muted">${formatDateTime(e.created_at)}</div></li>`).join("")}</ul>` : `<div class="muted">—</div>`}
  `;

  const footer = `
    <button class="btn" type="button" onclick="openAccountForm('${id}')">แก้ไข</button>
    <button class="btn" type="button" onclick="openNoteForm('account','${id}')">＋ Note</button>
    <button class="btn" type="button" onclick="openDemoForm(null, '${id}')">＋ Demo รอบใหม่</button>
    <button class="btn" type="button" onclick="openTaskForm(null, '${id}')">＋ Task</button>
    <button class="btn primary" type="button" onclick="convertAccountToCustomer('${id}')">เป็น Customer</button>
    <button class="btn danger-soft" type="button" onclick="closeAccountLost('${id}')">ตัดจบ / Lost</button>
  `;

  showModal(`Account — ${a.company_name}`, body, footer, true);
}

async function convertAccountToCustomer(id) {
  const a = accountById(id);
  if (!a) return toast("ไม่พบ Account", "err");
  if (!a.sales_owner_id) return toast("ต้องมี Sales Owner ก่อนแปลงเป็น Customer", "err");

  const { error } = await supabaseClient.from("accounts").update({
    lifecycle_stage: "customer",
    customer_status: a.customer_status || "New Customer",
    lead_status: a.lead_status || "Converted to Customer",
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) return toast(error.message, "err");
  await logEvent({ account_id: id, event_type: "audit", title: "Converted เป็น Customer", message: a.company_name });
  toast("แปลงเป็น Customer แล้ว", "ok");
  closeModal();
  await bootApp();
}

async function closeAccountLost(id) {
  const a = accountById(id);
  if (!a) return toast("ไม่พบ Account", "err");
  const { error } = await supabaseClient.from("accounts").update({
    lifecycle_stage: "closed",
    lead_status: a.lead_status === "Interested in Demo" ? "Lost" : (a.lead_status || "Lost"),
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) return toast(error.message, "err");
  await logEvent({ account_id: id, event_type: "audit", title: "ตัดจบ / Lost", message: a.company_name });
  toast("ตัดจบแล้ว", "ok");
  closeModal();
  await bootApp();
}

function openDemoForm(id = null, accountIdPreset = null) {
  const isEdit = Boolean(id);
  const demo = isEdit ? demoById(id) : {};
  if (isEdit && !demo) return toast("ไม่พบ Demo", "err");

  const accountId = accountIdPreset || demo.account_id || "";
  const defaultCs = defaultCsOwnerForDemo(accountId, demo.cs_owner_id);

  const fields = [
    { key: "account_id", label: "Account", type: "select", options: ["", ...state.accounts.map((a) => a.id)], optionLabel: accountName, value: accountId, required: true },
    { key: "cs_owner_id", label: "CS Owner", type: "select", options: ["", ...csUsers().map((u) => u.id)], optionLabel: userName, value: defaultCs, required: true },
    { key: "status", label: "Demo Status", type: "select", options: DEMO_STATUS, value: demo.status || "Demo Requested" },
    { key: "demo_date", label: "Demo Date", type: "date", value: demo.demo_date || "" },
    { key: "demo_time", label: "Demo Time", type: "time", value: demo.demo_time || "" },
    { key: "next_followup_date", label: "Next Follow-up Date", type: "date", value: demo.next_followup_date || "" },
    { key: "pain_point", label: "Pain Point", type: "textarea", value: demo.pain_point || "", full: true },
    { key: "demo_result", label: "Demo Result", type: "textarea", value: demo.demo_result || "", full: true },
    { key: "notes", label: "Notes", type: "textarea", value: demo.notes || "", full: true },
  ];

  openForm(isEdit ? "แก้ไข Demo Session" : "สร้าง Demo Session", fields, async (values) => {
    if (!values.account_id) throw new Error("กรุณาเลือก Account");
    if (!values.cs_owner_id) throw new Error("กรุณาเลือก CS Owner");

    if (isEdit) await updateDemo(id, values);
    else await createDemo(values);
  });
}

function defaultCsOwnerForDemo(accountId, current) {
  if (current) return current;
  const account = accountById(accountId);
  const latest = state.demoSessions
    .filter((d) => d.account_id === accountId && d.cs_owner_id)
    .sort((a, b) => (b.demo_no || 0) - (a.demo_no || 0))[0];

  return latest?.cs_owner_id || account?.cs_owner_id || (state.profile.role === "cs" ? state.profile.id : "");
}

async function createDemo(values) {
  const account = accountById(values.account_id);
  if (!account) throw new Error("ไม่พบ Account");

  const nextNo = 1 + Math.max(0, ...state.demoSessions.filter((d) => d.account_id === values.account_id).map((d) => d.demo_no || 0));
  const payload = {
    account_id: values.account_id,
    demo_no: nextNo,
    cs_owner_id: values.cs_owner_id,
    status: values.status || "Demo Requested",
    demo_date: values.demo_date || null,
    demo_time: values.demo_time || null,
    next_followup_date: values.next_followup_date || null,
    pain_point: values.pain_point || null,
    demo_result: values.demo_result || null,
    notes: values.notes || null,
    created_by: state.profile.id,
  };

  const { data, error } = await supabaseClient.from("demo_sessions").insert(payload).select().single();
  if (error) throw error;

  await supabaseClient.from("accounts").update({
    lifecycle_stage: "demo",
    cs_owner_id: values.cs_owner_id,
    lead_status: account.lead_status || "Interested in Demo",
    updated_at: new Date().toISOString(),
  }).eq("id", values.account_id);

  await logEvent({ account_id: values.account_id, demo_session_id: data.id, event_type: "audit", title: `สร้าง Demo รอบ ${nextNo}`, message: account.company_name });
  closeModal();
  toast("สร้าง Demo Session แล้ว", "ok");
  await bootApp();
}

async function updateDemo(id, values) {
  const demo = demoById(id);
  const payload = {
    cs_owner_id: values.cs_owner_id || null,
    status: values.status || "Demo Requested",
    demo_date: values.demo_date || null,
    demo_time: values.demo_time || null,
    next_followup_date: values.next_followup_date || null,
    pain_point: values.pain_point || null,
    demo_result: values.demo_result || null,
    notes: values.notes || null,
    closed_at: ["Won / Converted", "Lost After Demo"].includes(values.status) ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseClient.from("demo_sessions").update(payload).eq("id", id);
  if (error) throw error;

  await logEvent({ account_id: demo.account_id, demo_session_id: id, event_type: "audit", title: "แก้ไข Demo Session", message: payload.status });
  closeModal();
  toast("บันทึก Demo แล้ว", "ok");
  await bootApp();
}

function openDemoDetail(id) {
  const d = demoById(id);
  if (!d) return toast("ไม่พบ Demo", "err");
  const a = accountById(d.account_id);
  const body = `
    <div class="detail">
      ${detailRow("Account", esc(a?.company_name || "—"))}
      ${detailRow("Demo No.", d.demo_no || "—")}
      ${detailRow("CS Owner", esc(userName(d.cs_owner_id)))}
      ${detailRow("Status", statusPill(d.status))}
      ${detailRow("Demo Date/Time", `${formatDate(d.demo_date)} ${esc(d.demo_time || "")}`)}
      ${detailRow("Follow-up", formatDate(d.next_followup_date))}
      ${detailRow("Pain Point", esc(d.pain_point || "—"))}
      ${detailRow("Result", esc(d.demo_result || "—"))}
    </div>
    <div class="section-title">Notes</div>
    ${d.notes ? `<div class="note-item">${esc(d.notes)}</div>` : `<div class="muted">—</div>`}
  `;

  const footer = `
    <button class="btn" type="button" onclick="openDemoForm('${id}')">แก้ไข</button>
    <button class="btn" type="button" onclick="openTaskForm(null, '${d.account_id}', '${id}')">＋ Task</button>
    <button class="btn" type="button" onclick="openDemoForm(null, '${d.account_id}')">ต่อ Demo รอบใหม่</button>
    <button class="btn primary" type="button" onclick="convertAccountToCustomer('${d.account_id}')">ปิดเป็น Customer</button>
  `;
  showModal(`Demo — ${a?.company_name || ""}`, body, footer);
}

function openTaskForm(id = null, accountIdPreset = null, demoSessionIdPreset = null) {
  const isEdit = Boolean(id);
  const task = isEdit ? taskById(id) : {};
  if (isEdit && !task) return toast("ไม่พบ Task", "err");

  const fields = [
    { key: "task_name", label: "Task Name", value: task.task_name || "", required: true, full: true },
    { key: "account_id", label: "Account", type: "select", options: ["", ...state.accounts.map((a) => a.id)], optionLabel: accountName, value: accountIdPreset || task.account_id || "", required: true },
    { key: "demo_session_id", label: "Demo Session", type: "select", options: ["", ...state.demoSessions.map((d) => d.id)], optionLabel: demoLabel, value: demoSessionIdPreset || task.demo_session_id || "" },
    { key: "cs_owner_id", label: "CS Owner", type: "select", options: ["", ...csUsers().map((u) => u.id)], optionLabel: userName, value: task.cs_owner_id || (state.profile.role === "cs" ? state.profile.id : ""), required: true },
    { key: "task_type", label: "Task Type", type: "select", options: TASK_TYPE, value: task.task_type || "Support" },
    { key: "status", label: "Status", type: "select", options: TASK_STATUS.filter((s) => s !== "Overdue"), value: task.status || "To Do" },
    { key: "priority", label: "Priority", type: "select", options: PRIORITY, value: task.priority || "Medium" },
    { key: "due_date", label: "Due Date", type: "date", value: task.due_date || "" },
    { key: "blocker", label: "Blocker", value: task.blocker || "", full: true },
    { key: "notes", label: "Notes", type: "textarea", value: task.notes || "", full: true },
  ];

  openForm(isEdit ? "แก้ไข CS Task" : "สร้าง CS Task", fields, async (values) => {
    if (!values.task_name.trim()) throw new Error("กรุณากรอก Task Name");
    if (!values.account_id) throw new Error("กรุณาเลือก Account");
    if (!values.cs_owner_id) throw new Error("กรุณาเลือก CS Owner");

    if (isEdit) await updateTask(id, values);
    else await createTask(values);
  });
}

async function createTask(values) {
  const payload = normalizeTaskPayload(values);
  payload.created_by = state.profile.id;

  const { data, error } = await supabaseClient.from("cs_tasks").insert(payload).select().single();
  if (error) throw error;

  await logEvent({ account_id: data.account_id, demo_session_id: data.demo_session_id, task_id: data.id, event_type: "audit", title: "สร้าง CS Task", message: data.task_name });
  closeModal();
  toast("สร้าง Task แล้ว", "ok");
  await bootApp();
}

async function updateTask(id, values) {
  const task = taskById(id);
  const payload = normalizeTaskPayload(values);
  payload.closed_at = values.status === "Done" ? new Date().toISOString() : null;
  payload.updated_at = new Date().toISOString();

  const { error } = await supabaseClient.from("cs_tasks").update(payload).eq("id", id);
  if (error) throw error;

  await logEvent({ account_id: task.account_id, demo_session_id: task.demo_session_id, task_id: id, event_type: "audit", title: "แก้ไข CS Task", message: payload.status });
  closeModal();
  toast("บันทึก Task แล้ว", "ok");
  await bootApp();
}

function normalizeTaskPayload(values) {
  return {
    task_name: values.task_name,
    account_id: values.account_id || null,
    demo_session_id: values.demo_session_id || null,
    cs_owner_id: values.cs_owner_id || null,
    task_type: values.task_type || "Support",
    status: values.status || "To Do",
    priority: values.priority || "Medium",
    due_date: values.due_date || null,
    blocker: values.blocker || null,
    notes: values.notes || null,
  };
}

function openTaskDetail(id) {
  const t = taskById(id);
  if (!t) return toast("ไม่พบ Task", "err");
  const a = accountById(t.account_id);
  const body = `
    <div class="detail">
      ${detailRow("Account", esc(a?.company_name || "—"))}
      ${detailRow("Task Type", esc(t.task_type || "—"))}
      ${detailRow("Status", isTaskOverdue(t) ? pill("Overdue", "red") : statusPill(t.status))}
      ${detailRow("Priority", priorityPill(t.priority))}
      ${detailRow("CS Owner", esc(userName(t.cs_owner_id)))}
      ${detailRow("Due Date", formatDate(t.due_date))}
      ${detailRow("Blocker", esc(t.blocker || "—"))}
      ${detailRow("Created", formatDateTime(t.created_at))}
    </div>
    <div class="section-title">Notes</div>
    ${t.notes ? `<div class="note-item">${esc(t.notes)}</div>` : `<div class="muted">—</div>`}
  `;
  const footer = `
    <button class="btn" type="button" onclick="openTaskForm('${id}')">แก้ไข</button>
    <button class="btn" type="button" onclick="openNoteForm('task','${id}')">＋ Note</button>
    ${t.status !== "Done" ? `<button class="btn primary" type="button" onclick="markTaskDone('${id}')">ปิดงาน</button>` : ""}
  `;
  showModal(`Task — ${t.task_name}`, body, footer);
}

async function markTaskDone(id) {
  const t = taskById(id);
  const { error } = await supabaseClient.from("cs_tasks").update({
    status: "Done",
    closed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) return toast(error.message, "err");
  await logEvent({ account_id: t.account_id, demo_session_id: t.demo_session_id, task_id: id, event_type: "audit", title: "ปิด Task", message: t.task_name });
  toast("ปิดงานแล้ว", "ok");
  closeModal();
  await bootApp();
}

function openNoteForm(type, id) {
  const fields = [{ key: "message", label: "Note", type: "textarea", value: "", required: true, full: true }];
  openForm("เพิ่ม Note", fields, async (values) => {
    if (!values.message.trim()) throw new Error("กรุณากรอก Note");

    const payload = { event_type: "note", title: "เพิ่ม Note", message: values.message };
    if (type === "account") payload.account_id = id;
    if (type === "task") {
      const task = taskById(id);
      payload.task_id = id;
      payload.account_id = task?.account_id || null;
      payload.demo_session_id = task?.demo_session_id || null;
    }

    await logEvent(payload);
    closeModal();
    toast("เพิ่ม Note แล้ว", "ok");
    await bootApp();
  });
}

function openUserForm(id) {
  const user = state.profiles.find((u) => u.id === id);
  if (!user) return toast("ไม่พบ User", "err");

  const fields = [
    { key: "full_name", label: "Full Name", value: user.full_name || "" },
    { key: "role", label: "Role", type: "select", options: Object.keys(ROLE_LABELS), value: user.role || "sales", required: true },
    { key: "is_active", label: "Active", type: "select", options: ["true", "false"], value: String(user.is_active !== false) },
    { key: "sales_queue_order", label: "Sales Queue Order", type: "number", value: user.sales_queue_order ?? "" },
  ];

  openForm("แก้ไข User", fields, async (values) => {
    const payload = {
      full_name: values.full_name || null,
      role: values.role,
      is_active: values.is_active === "true",
      sales_queue_order: values.sales_queue_order === "" ? null : Number(values.sales_queue_order),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseClient.from("profiles").update(payload).eq("id", id);
    if (error) throw error;

    await logEvent({ event_type: "audit", title: "แก้ไข User", message: user.email });
    closeModal();
    toast("บันทึก User แล้ว", "ok");
    await bootApp();
  });
}

async function logEvent(payload) {
  const record = {
    event_type: payload.event_type || "audit",
    title: payload.title || null,
    message: payload.message || null,
    account_id: payload.account_id || null,
    demo_session_id: payload.demo_session_id || null,
    task_id: payload.task_id || null,
    assigned_to_id: payload.assigned_to_id || null,
    metadata: payload.metadata || {},
    created_by: state.profile?.id || null,
  };

  const { error } = await supabaseClient.from("app_events").insert(record);
  if (error) console.warn("logEvent failed", error);
}

function renderNotifBadge() {
  const unread = state.events.filter((e) => e.event_type === "notification" && e.assigned_to_id === state.profile?.id && !e.is_read).length;
  const badge = $("#notifBadge");
  if (unread) {
    badge.textContent = unread > 9 ? "9+" : String(unread);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function toggleNotifPanel() {
  const panel = $("#notifPanel");
  panel.classList.toggle("hidden");
  if (!panel.classList.contains("hidden")) renderNotifList();
}

function renderNotifList() {
  const rows = state.events.filter((e) => e.event_type === "notification" && e.assigned_to_id === state.profile?.id).slice(0, 60);
  $("#notifList").innerHTML = rows.length ? rows.map((n) => `
    <div class="notif ${n.is_read ? "" : "unread"}">
      <div>🔔</div>
      <div>
        <strong>${esc(n.title || "Notification")}</strong>
        ${n.message ? `<div>${esc(n.message)}</div>` : ""}
        <small class="muted">${formatDateTime(n.created_at)}</small>
      </div>
    </div>
  `).join("") : `<div class="empty"><div class="big">🔔</div>ไม่มีการแจ้งเตือน</div>`;
}

async function markAllNotificationsRead() {
  const ids = state.events.filter((e) => e.event_type === "notification" && e.assigned_to_id === state.profile?.id && !e.is_read).map((e) => e.id);
  if (!ids.length) return;
  const { error } = await supabaseClient.from("app_events").update({ is_read: true }).in("id", ids);
  if (error) return toast(error.message, "err");
  await bootApp();
  renderNotifList();
}

function openForm(title, fields, onSave) {
  const body = `<div class="form-grid">${fields.map(fieldHTML).join("")}</div>`;
  const footer = `
    <button class="btn" type="button" onclick="closeModal()">ยกเลิก</button>
    <button id="modalSaveBtn" class="btn primary" type="button">บันทึก</button>
  `;
  showModal(title, body, footer);

  $("#modalSaveBtn").addEventListener("click", async () => {
    const btn = $("#modalSaveBtn");
    setLoading(btn, true, "กำลังบันทึก...");
    try {
      const values = {};
      fields.forEach((f) => {
        const el = $(`#field_${cssEscape(f.key)}`);
        values[f.key] = el ? el.value : "";
      });
      await onSave(values);
    } catch (error) {
      console.error(error);
      toast(error.message || "บันทึกไม่สำเร็จ", "err");
      setLoading(btn, false, "บันทึก");
    }
  });
}

function fieldHTML(f) {
  const id = `field_${f.key}`;
  const required = f.required ? "required" : "";
  const disabled = f.disabled ? "disabled" : "";
  const value = f.value ?? "";
  let input = "";

  if (f.type === "select") {
    input = `<select id="${escAttr(id)}" ${required} ${disabled}>
      ${(f.options || []).map((opt) => `<option value="${escAttr(opt)}" ${String(value) === String(opt) ? "selected" : ""}>${esc(f.optionLabel ? f.optionLabel(opt) : (opt === "" ? "(ไม่ระบุ)" : opt))}</option>`).join("")}
    </select>`;
  } else if (f.type === "textarea") {
    input = `<textarea id="${escAttr(id)}" ${required} ${disabled}>${esc(value)}</textarea>`;
  } else {
    input = `<input id="${escAttr(id)}" type="${escAttr(f.type || "text")}" value="${escAttr(value)}" ${required} ${disabled} />`;
  }

  return `<label class="${f.full ? "full" : ""}">${esc(f.label)}${f.required ? " *" : ""}${input}</label>`;
}

function showModal(title, body, footer, large = false) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modalFooter").innerHTML = footer || `<button class="btn" onclick="closeModal()">ปิด</button>`;
  $("#modal").classList.toggle("large", Boolean(large));
  $("#modalOverlay").classList.remove("hidden");
}

function closeModal() {
  $("#modalOverlay").classList.add("hidden");
  $("#modalBody").innerHTML = "";
  $("#modalFooter").innerHTML = "";
}

function searchInput(page, value) {
  return `<div class="search"><input type="text" placeholder="ค้นหา..." value="${escAttr(value || "")}" data-filter-page="${escAttr(page)}" data-filter-key="q"></div>`;
}

function selectFilter(page, key, label, options, optionLabel) {
  const value = state.filters[page]?.[key] || "";
  return `
    <select data-filter-page="${escAttr(page)}" data-filter-key="${escAttr(key)}">
      <option value="">${esc(label)}</option>
      ${options.map((opt) => `<option value="${escAttr(opt)}" ${String(value) === String(opt) ? "selected" : ""}>${esc(optionLabel ? optionLabel(opt) : opt)}</option>`).join("")}
    </select>
  `;
}

function detailRow(k, v) {
  return `<div class="detail-row"><div class="k">${esc(k)}</div><div class="v">${v}</div></div>`;
}

function stat(label, num, foot) {
  return `<div class="stat"><div class="label">${esc(label)}</div><div class="num">${esc(num)}</div><div class="foot">${esc(foot || "")}</div></div>`;
}

function emptyState(message, icon) {
  return `<div class="card"><div class="empty"><div class="big">${icon || "📭"}</div>${esc(message)}</div></div>`;
}

function pill(text, color = "gray") {
  return `<span class="pill ${escAttr(color)}">${esc(text)}</span>`;
}

function stagePill(stage) {
  const s = ACCOUNT_STAGE[stage] || { label: stage || "-", color: "gray" };
  return pill(s.label, s.color);
}

function statusPill(status) {
  const s = String(status || "");
  let color = "gray";
  if (/Won|Converted|Done|Active|Completed/i.test(s)) color = "green";
  else if (/Lost|Closed|Overdue|Not Interested/i.test(s)) color = "red";
  else if (/Follow|Waiting|Scheduling|Extended|เสนอราคา|รอ/i.test(s)) color = "amber";
  else if (/Demo|Training/i.test(s)) color = "purple";
  else if (/New|Contacted|Scheduled|Progress|Onboarding/i.test(s)) color = "blue";
  return pill(s || "-", color);
}

function priorityPill(priority) {
  const p = priority || "Medium";
  const color = p === "Urgent" ? "red" : p === "High" ? "amber" : p === "Low" ? "gray" : "blue";
  return pill(p, color);
}

function barChart(map, labelFn) {
  const entries = Object.entries(map).filter(([key]) => key && key !== "null" && key !== "undefined").sort((a, b) => b[1] - a[1]);
  if (!entries.length) return `<div class="muted">ยังไม่มีข้อมูล</div>`;
  const max = Math.max(...entries.map(([, value]) => value), 1);
  return entries.map(([key, value]) => {
    const width = Math.max(8, Math.round((value / max) * 100));
    return `
      <div class="bar-row">
        <div class="bar-label" title="${escAttr(labelFn(key))}">${esc(labelFn(key))}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${width}%">${value}</div></div>
      </div>
    `;
  }).join("");
}

function groupCount(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "(ไม่ระบุ)";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function exportCSV(name, rows) {
  if (!hasRole(["admin", "management"])) return toast("เฉพาะ Admin / Management เท่านั้น", "err");
  if (!rows.length) return toast("ไม่มีข้อมูลให้ export", "err");

  const cols = Object.keys(rows[0]).filter((k) => !["metadata"].includes(k));
  const csv = [cols.join(",")]
    .concat(rows.map((row) => cols.map((col) => csvCell(row[col])).join(",")))
    .join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}_${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Export แล้ว", "ok");
}

function csvCell(value) {
  const s = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function accountStatus(a) {
  if (!a) return "";
  if (a.lifecycle_stage === "customer") return a.customer_status || a.lead_status;
  return a.lead_status || a.customer_status || "";
}

function accountById(id) {
  return state.accounts.find((a) => a.id === id);
}

function demoById(id) {
  return state.demoSessions.find((d) => d.id === id);
}

function taskById(id) {
  return state.tasks.find((t) => t.id === id);
}

function userName(id) {
  if (!id) return "—";
  const user = state.profiles.find((u) => u.id === id);
  return user?.full_name || user?.email || id;
}

function accountName(id) {
  if (!id) return "(เลือก Account)";
  const a = accountById(id);
  return a ? `${a.company_name} ${a.marketing_lead_no != null ? `(No. ${a.marketing_lead_no})` : ""}` : id;
}

function demoLabel(id) {
  if (!id) return "(ไม่ผูก Demo)";
  const d = demoById(id);
  const a = d ? accountById(d.account_id) : null;
  return d ? `Demo ${d.demo_no} — ${a?.company_name || ""}` : id;
}

function usersForOwnerOptions() {
  return state.profiles.filter((u) => ["sales", "cs"].includes(u.role));
}

function salesUsers() {
  return state.profiles.filter((u) => u.role === "sales" && u.is_active !== false).sort((a, b) => (a.sales_queue_order ?? 9999) - (b.sales_queue_order ?? 9999));
}

function csUsers() {
  return state.profiles.filter((u) => u.role === "cs" && u.is_active !== false).sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
}

function hasRole(roles) {
  return roles.includes(state.profile?.role);
}

function isTaskOverdue(task) {
  return task.status !== "Done" && task.due_date && task.due_date < today();
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(String(value).length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function initials(name) {
  return String(name || "?").trim().slice(0, 1).toUpperCase();
}

function uniq(arr) {
  return [...new Set(arr.filter((x) => x != null && x !== ""))];
}

function setLoading(button, loading, text) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = text;
}

function toast(message, type = "") {
  const wrap = $("#toastWrap");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .25s";
    setTimeout(() => el.remove(), 260);
  }, 2600);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c]));
}

function escAttr(value) {
  return esc(value).replace(/`/g, "&#096;");
}

function cssEscape(value) {
  if (window.CSS && CSS.escape) return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

// Expose selected functions for modal inline buttons.
window.openAccountForm = openAccountForm;
window.openDemoForm = openDemoForm;
window.openTaskForm = openTaskForm;
window.openNoteForm = openNoteForm;
window.convertAccountToCustomer = convertAccountToCustomer;
window.closeAccountLost = closeAccountLost;
window.markTaskDone = markTaskDone;
window.closeModal = closeModal;
