import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const APP_VERSION = "0.1.1";
const CONFIG_STORAGE_KEY = "internal-crm-config-v1";
// Optional inline runtime config for deployments that prefer editing a file instead of using the setup screen.
// Fill only public Supabase URL and anon key. Never put service_role key, database password, or private tokens here.
window.CRM_CONFIG = window.CRM_CONFIG || {
  supabaseUrl: "",
  supabaseAnonKey: ""
};


const ROUTES = {
  MY_WORK: "my-work",
  LEADS: "leads",
  DEMOS: "demos",
  CUSTOMERS: "customers",
  TASKS: "tasks",
  HISTORY: "history",
  SETUP: "setup"
};

const ROLE_LABELS = {
  admin: "Admin",
  manager: "Manager",
  mkt: "Marketing",
  sale: "Sale",
  cs: "Customer Success"
};

const STAGE_LABELS = {
  lead: "Lead",
  demo: "Demo",
  customer: "Customer",
  lost: "Lost",
  churn: "Churn",
  archived: "Archived"
};

const TASK_STATUS_LABELS = {
  open: "เปิดอยู่",
  done: "เสร็จแล้ว",
  cancelled: "ยกเลิก"
};

const DEMO_STATUS_LABELS = {
  queued: "รอจัดคิว",
  scheduled: "นัดแล้ว",
  in_progress: "กำลังเดโม่",
  completed: "จบเดโม่",
  cancelled: "ยกเลิก",
  lost: "ไม่ไปต่อ",
  converted: "เป็นลูกค้าแล้ว"
};

const RISK_LABELS = {
  low: "ต่ำ",
  medium: "กลาง",
  high: "สูง"
};

const app = document.querySelector("#app");
const toastRoot = document.querySelector("#toast-root");

let supabase = null;
let authSubscription = null;
let realtimeChannel = null;
let isLoading = false;

const state = {
  route: ROUTES.MY_WORK,
  session: null,
  profile: null,
  profiles: [],
  cases: [],
  demos: [],
  customers: [],
  tasks: [],
  activities: [],
  selectedCaseId: null,
  filters: {
    leads: "active",
    demos: "active",
    customers: "active",
    tasks: "open",
    search: ""
  }
};

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function attr(value) {
  return escapeHTML(value).replaceAll("`", "&#096;");
}

function fmtDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(date);
}

function fmtDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysFromNowISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function role() {
  return state.profile?.role || "guest";
}

function can(roleNames) {
  return roleNames.includes(role());
}

function currentUserId() {
  return state.session?.user?.id || null;
}

function profileName(profile) {
  if (!profile) return "-";
  return profile.full_name || profile.email || profile.id || "-";
}

function caseTitle(item) {
  if (!item) return "-";
  const company = item.company_name || "ไม่ระบุบริษัท";
  const contact = item.contact_name ? ` / ${item.contact_name}` : "";
  return `${company}${contact}`;
}

function caseNo(item) {
  return item?.case_number ? `#${String(item.case_number).padStart(5, "0")}` : "-";
}

function badge(label, type = "muted") {
  return `<span class="badge ${type}">${escapeHTML(label)}</span>`;
}

function stageBadge(stage) {
  const type = stage === "customer" ? "success" : stage === "lost" || stage === "churn" ? "danger" : stage === "demo" ? "warning" : "primary";
  return badge(STAGE_LABELS[stage] || stage, type);
}

function riskBadge(risk) {
  const type = risk === "high" ? "danger" : risk === "medium" ? "warning" : "success";
  return badge(RISK_LABELS[risk] || risk || "-", type);
}

function showToast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  toastRoot.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function showError(error, fallback = "เกิดข้อผิดพลาด") {
  const message = error?.message || String(error || fallback);
  console.error(error);
  showToast(message, "error");
}

function getRuntimeConfig() {
  const windowConfig = window.CRM_CONFIG || {};
  const localConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || "{}");
  const supabaseUrl = localConfig.supabaseUrl || windowConfig.supabaseUrl || "";
  const supabaseAnonKey = localConfig.supabaseAnonKey || windowConfig.supabaseAnonKey || "";
  return { supabaseUrl, supabaseAnonKey };
}

function hasRuntimeConfig() {
  const config = getRuntimeConfig();
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

function initSupabase() {
  const config = getRuntimeConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) return null;

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

async function boot() {
  if (!hasRuntimeConfig()) {
    state.route = ROUTES.SETUP;
    render();
    return;
  }

  supabase = initSupabase();
  if (!supabase) {
    renderSetup("กรุณาตั้งค่า Supabase URL และ anon key");
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    showError(error);
  }

  state.session = data?.session || null;

  if (authSubscription) authSubscription.unsubscribe();
  authSubscription = supabase.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    if (session) {
      await loadCurrentUser();
      await refreshData();
      setupRealtime();
    } else {
      state.profile = null;
      state.profiles = [];
      state.cases = [];
      state.demos = [];
      state.customers = [];
      state.tasks = [];
      state.activities = [];
      cleanupRealtime();
      render();
    }
  }).data.subscription;

  if (state.session) {
    await loadCurrentUser();
    await refreshData();
    setupRealtime();
  }

  bindVisibilityReconnect();
  render();
}

async function loadCurrentUser() {
  if (!state.session) return;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active")
    .eq("id", state.session.user.id)
    .maybeSingle();

  if (error) throw error;
  state.profile = data;
}

async function refreshData() {
  if (!state.session || !state.profile) return;
  isLoading = true;
  render();

  try {
    await Promise.all([
      loadProfiles(),
      loadCases(),
      loadDemos(),
      loadCustomers(),
      loadTasks()
    ]);
  } catch (error) {
    showError(error, "โหลดข้อมูลไม่สำเร็จ");
  } finally {
    isLoading = false;
    render();
  }
}

async function loadProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active")
    .eq("is_active", true)
    .order("role", { ascending: true })
    .order("full_name", { ascending: true });

  if (error) throw error;
  state.profiles = data || [];
}

const CASE_SELECT = `
  id,case_number,stage,source_team,source_channel,company_name,contact_name,contact_email,contact_phone,
  interested_product,interest_level,qualification_notes,current_need,lost_reason,churn_reason,churned_at,
  next_follow_up_at,owner_sale_id,owner_cs_id,created_by,created_at,updated_at,converted_to_customer_at,
  owner_sale:profiles!crm_cases_owner_sale_id_fkey(id,email,full_name,role),
  owner_cs:profiles!crm_cases_owner_cs_id_fkey(id,email,full_name,role),
  creator:profiles!crm_cases_created_by_fkey(id,email,full_name,role)
`;

async function loadCases() {
  const { data, error } = await supabase
    .from("crm_cases")
    .select(CASE_SELECT)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  state.cases = data || [];
}

async function loadDemos() {
  const { data, error } = await supabase
    .from("demo_sessions")
    .select(`
      id,case_id,demo_status,scheduled_at,start_date,end_date,actual_start_at,actual_end_at,
      demo_users,requirements,demo_result,notes,next_follow_up_at,created_by,assigned_cs_id,created_at,updated_at,
      crm_cases(${CASE_SELECT}),
      assigned_cs:profiles!demo_sessions_assigned_cs_id_fkey(id,email,full_name,role)
    `)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  state.demos = data || [];
}

async function loadCustomers() {
  const { data, error } = await supabase
    .from("customer_profiles")
    .select(`
      id,case_id,customer_since,plan_name,billing_cycle,renewal_date,risk_level,health_status,usage_status,
      training_status,notes,created_at,updated_at,
      crm_cases(${CASE_SELECT})
    `)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  state.customers = data || [];
}

async function loadTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id,case_id,title,task_type,status,priority,due_date,assigned_to,created_by,completed_at,notes,created_at,updated_at,
      crm_cases(id,case_number,stage,company_name,contact_name,owner_sale_id,owner_cs_id),
      assignee:profiles!tasks_assigned_to_fkey(id,email,full_name,role),
      creator:profiles!tasks_created_by_fkey(id,email,full_name,role)
    `)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  state.tasks = data || [];
}

async function loadActivities(caseId) {
  const { data, error } = await supabase
    .from("case_activities")
    .select(`
      id,case_id,actor_id,activity_type,from_stage,to_stage,title,description,metadata,created_at,
      actor:profiles!case_activities_actor_id_fkey(id,email,full_name,role)
    `)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  state.activities = data || [];
}

function bindVisibilityReconnect() {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

async function handleVisibilityChange() {
  if (document.visibilityState !== "visible" || !supabase || !state.session) return;
  await supabase.auth.getSession();
  setupRealtime();
}

function cleanupRealtime() {
  if (realtimeChannel && supabase) {
    supabase.removeChannel(realtimeChannel);
  }
  realtimeChannel = null;
}

function setupRealtime() {
  if (!supabase || !state.session) return;
  cleanupRealtime();

  realtimeChannel = supabase
    .channel("internal-crm-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "crm_cases" }, () => refreshData())
    .on("postgres_changes", { event: "*", schema: "public", table: "demo_sessions" }, () => refreshData())
    .on("postgres_changes", { event: "*", schema: "public", table: "customer_profiles" }, () => refreshData())
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => refreshData())
    .on("postgres_changes", { event: "*", schema: "public", table: "case_activities" }, () => {
      if (state.selectedCaseId) loadActivities(state.selectedCaseId).then(render);
    })
    .subscribe();
}

function render() {
  if (state.route === ROUTES.SETUP || !hasRuntimeConfig()) {
    renderSetup();
    return;
  }

  if (!state.session) {
    renderLogin();
    return;
  }

  if (!state.profile) {
    app.innerHTML = layoutShell(`<div class="error-box">ไม่พบ profile ของผู้ใช้ กรุณาตรวจ trigger profiles หรือ role ใน Supabase</div>`);
    return;
  }

  const page = renderRoute();
  app.innerHTML = layoutShell(page);
}

function renderSetup(errorMessage = "") {
  app.innerHTML = `
    <main class="setup-layout">
      <section class="setup-card">
        ${brandBlock()}
        <h2>ตั้งค่า Supabase</h2>
        <p class="inline-help">ใส่ Supabase URL และ anon key เท่านั้น ห้ามใส่ service_role key หรือ database password</p>
        ${errorMessage ? `<div class="error-box">${escapeHTML(errorMessage)}</div>` : ""}
        <form class="form" data-action="save-config">
          <div class="field">
            <label for="supabaseUrl">Supabase URL</label>
            <input id="supabaseUrl" name="supabaseUrl" placeholder="https://YOUR_PROJECT_ID.supabase.co" required />
          </div>
          <div class="field">
            <label for="supabaseAnonKey">Supabase anon key</label>
            <textarea id="supabaseAnonKey" name="supabaseAnonKey" placeholder="public anon key" required></textarea>
          </div>
          <button class="btn primary" type="submit">บันทึกและเริ่มใช้งาน</button>
        </form>
      </section>
    </main>
  `;
}

function renderLogin() {
  app.innerHTML = `
    <main class="auth-layout">
      <section class="auth-card">
        ${brandBlock()}
        <form class="form" data-action="login">
          <div class="field">
            <label for="email">อีเมล</label>
            <input id="email" name="email" type="email" autocomplete="email" required />
          </div>
          <div class="field">
            <label for="password">รหัสผ่าน</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <button class="btn primary" type="submit">เข้าสู่ระบบ</button>
          <p class="inline-help">ระบบนี้ใช้ Supabase Auth สำหรับผู้ใช้ภายใน อีเมล/รหัสผ่านต้องถูกสร้างใน Supabase Auth ก่อน</p>
        </form>
      </section>
    </main>
  `;
}

function brandBlock() {
  return `
    <div class="brand">
      <div class="brand-mark">CRM</div>
      <div>
        <h1 class="brand-title">Internal CRM</h1>
        <p class="brand-subtitle">Lead → Demo → Customer journey</p>
      </div>
    </div>
  `;
}

function layoutShell(content) {
  const navItems = [
    [ROUTES.MY_WORK, "งานของฉัน"],
    [ROUTES.LEADS, "Lead"],
    [ROUTES.DEMOS, "Demo"],
    [ROUTES.CUSTOMERS, "Customer"],
    [ROUTES.TASKS, "Task"],
    [ROUTES.HISTORY, "History"]
  ];

  const nav = navItems.map(([key, label]) => `
    <button class="nav-button ${state.route === key ? "active" : ""}" data-route="${attr(key)}" type="button">
      <span>${escapeHTML(label)}</span>
    </button>
  `).join("");

  return `
    <div class="layout">
      <aside class="sidebar">
        ${brandBlock()}
        <nav class="nav">${nav}</nav>
        <div class="user-box">
          <strong>${escapeHTML(profileName(state.profile))}</strong>
          <span>${escapeHTML(ROLE_LABELS[role()] || role())}</span>
          <span>${escapeHTML(state.profile?.email || "")}</span>
          <div class="actions" style="margin-top:12px">
            <button class="btn ghost" data-action="refresh" type="button">รีเฟรช</button>
            <button class="btn ghost" data-action="logout" type="button">ออก</button>
          </div>
        </div>
      </aside>
      <main class="content">
        ${isLoading ? `<div class="inline-help">กำลังโหลดข้อมูล...</div>` : ""}
        ${content}
      </main>
      ${state.selectedCaseId ? renderCaseDrawer() : ""}
    </div>
  `;
}

function renderRoute() {
  switch (state.route) {
    case ROUTES.MY_WORK:
      return renderMyWork();
    case ROUTES.LEADS:
      return renderLeads();
    case ROUTES.DEMOS:
      return renderDemos();
    case ROUTES.CUSTOMERS:
      return renderCustomers();
    case ROUTES.TASKS:
      return renderTasks();
    case ROUTES.HISTORY:
      return renderHistory();
    default:
      return renderMyWork();
  }
}

function pageHeader(title, subtitle, actions = "") {
  return `
    <div class="topbar">
      <div>
        <h2 class="page-title">${escapeHTML(title)}</h2>
        <p class="page-subtitle">${escapeHTML(subtitle)}</p>
      </div>
      <div class="actions">${actions}</div>
    </div>
  `;
}

function renderMyWork() {
  const me = currentUserId();
  const leadDue = state.cases.filter(item =>
    item.stage === "lead" &&
    item.owner_sale_id === me &&
    item.next_follow_up_at &&
    item.next_follow_up_at <= daysFromNowISO(7)
  );

  const myOpenTasks = state.tasks.filter(task =>
    task.status === "open" &&
    task.assigned_to === me
  );

  const demoEnding = state.demos.filter(demo =>
    ["queued", "scheduled", "in_progress"].includes(demo.demo_status) &&
    demo.end_date &&
    demo.end_date <= daysFromNowISO(7) &&
    (can(["admin", "manager", "cs"]) || demo.crm_cases?.owner_sale_id === me)
  );

  const highRisk = state.customers.filter(customer =>
    customer.risk_level === "high" &&
    can(["admin", "manager", "cs"])
  );

  return `
    ${pageHeader("งานของฉัน", "รายการที่ควรทำต่อทันทีตาม role และ due date")}
    <section class="grid grid-3">
      ${metricCard("Task เปิดอยู่", myOpenTasks.length)}
      ${metricCard("Lead ต้องติดตาม", leadDue.length)}
      ${metricCard("Demo ใกล้สิ้นสุด", demoEnding.length)}
    </section>

    <section class="grid grid-2" style="margin-top:16px">
      ${panel("Task ของฉัน", renderTaskMiniList(myOpenTasks))}
      ${panel("Lead ที่ต้องติดตาม", renderCaseMiniList(leadDue))}
      ${panel("Demo ใกล้สิ้นสุด", renderDemoMiniList(demoEnding))}
      ${panel("Customer ความเสี่ยงสูง", renderCustomerMiniList(highRisk))}
    </section>
  `;
}

function metricCard(label, number) {
  return `
    <div class="card metric">
      <div class="metric-number">${escapeHTML(number)}</div>
      <div class="metric-label">${escapeHTML(label)}</div>
    </div>
  `;
}

function panel(title, body) {
  return `
    <section class="panel">
      <div class="panel-header"><h3 class="panel-title">${escapeHTML(title)}</h3></div>
      <div class="panel-body">${body}</div>
    </section>
  `;
}

function renderCaseMiniList(items) {
  if (!items.length) return `<div class="empty">ยังไม่มีรายการ</div>`;
  return `<div class="list">${items.slice(0, 8).map(renderCaseCard).join("")}</div>`;
}

function renderDemoMiniList(items) {
  if (!items.length) return `<div class="empty">ยังไม่มีรายการ</div>`;
  return `<div class="list">${items.slice(0, 8).map(renderDemoCard).join("")}</div>`;
}

function renderCustomerMiniList(items) {
  if (!items.length) return `<div class="empty">ยังไม่มีรายการ</div>`;
  return `<div class="list">${items.slice(0, 8).map(renderCustomerCard).join("")}</div>`;
}

function renderTaskMiniList(items) {
  if (!items.length) return `<div class="empty">ยังไม่มีรายการ</div>`;
  return `<div class="list">${items.slice(0, 8).map(renderTaskCard).join("")}</div>`;
}

function renderLeads() {
  const canCreateLead = can(["admin", "mkt", "sale"]);
  const activeStages = state.filters.leads === "lost" ? ["lost"] : state.filters.leads === "all" ? ["lead", "demo", "customer", "lost", "churn"] : ["lead"];
  const items = state.cases.filter(item => activeStages.includes(item.stage));

  return `
    ${pageHeader("Lead", "สร้าง ติดตาม ส่ง Demo หรือปิด Lost โดยข้อมูล journey ไม่หาย", canCreateLead ? `<button class="btn primary" data-action="toggle-create-lead" type="button">+ สร้าง Lead</button>` : "")}
    ${canCreateLead ? renderLeadForm() : ""}
    ${renderLeadFilters()}
    <div class="list">${items.length ? items.map(renderCaseCard).join("") : `<div class="empty">ยังไม่มี Lead</div>`}</div>
  `;
}

function renderLeadForm() {
  const defaultSale = role() === "sale" ? currentUserId() : "";

  const saleOptions = state.profiles
    .filter(p => p.role === "sale" && p.is_active)
    .map(p => `<option value="${attr(p.id)}" ${p.id === defaultSale ? "selected" : ""}>${escapeHTML(profileName(p))}</option>`)
    .join("");

  return `
    <section class="panel hidden" data-section="create-lead" style="margin-bottom:16px">
      <div class="panel-header"><h3 class="panel-title">สร้าง Lead ใหม่</h3></div>
      <div class="panel-body">
        <form class="form" data-action="create-lead">
          <div class="form-row">
            <div class="field">
              <label>ชื่อบริษัท / หน่วยงาน *</label>
              <input name="company_name" required />
            </div>
            <div class="field">
              <label>ชื่อผู้ติดต่อ</label>
              <input name="contact_name" />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>อีเมล</label>
              <input name="contact_email" type="email" />
            </div>
            <div class="field">
              <label>เบอร์โทร</label>
              <input name="contact_phone" />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>แหล่งที่มา</label>
              <input name="source_channel" placeholder="เช่น Facebook, Website, Referral" />
            </div>
            <div class="field">
              <label>Sale Owner *</label>
              <select name="owner_sale_id" required>
                <option value="">เลือก Sale</option>
                ${saleOptions}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>สินค้าที่สนใจ</label>
              <input name="interested_product" />
            </div>
            <div class="field">
              <label>ระดับความสนใจ</label>
              <select name="interest_level">
                <option value="">ไม่ระบุ</option>
                <option value="low">ต่ำ</option>
                <option value="medium">กลาง</option>
                <option value="high">สูง</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label>รายละเอียด / เงื่อนไขเบื้องต้น</label>
            <textarea name="qualification_notes"></textarea>
          </div>
          <div class="form-row">
            <div class="field">
              <label>วันที่ต้องติดตามต่อ</label>
              <input name="next_follow_up_at" type="date" value="${attr(daysFromNowISO(3))}" />
            </div>
            <div class="field">
              <label>ทีมที่สร้าง</label>
              <select name="source_team">
                <option value="mkt">MKT</option>
                <option value="sale" ${role() === "sale" ? "selected" : ""}>Sale</option>
              </select>
            </div>
          </div>
          <input type="hidden" name="default_sale_id" value="${attr(defaultSale)}" />
          <div class="actions">
            <button class="btn primary" type="submit">บันทึก Lead</button>
            <button class="btn ghost" type="button" data-action="toggle-create-lead">ยกเลิก</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderLeadFilters() {
  const filters = [["active", "Lead เปิดอยู่"], ["lost", "Lost"], ["all", "ทั้งหมด"]];
  return `
    <div class="toolbar">
      <div class="filters">
        ${filters.map(([key, label]) => `<button class="filter-chip ${state.filters.leads === key ? "active" : ""}" data-filter-group="leads" data-filter-value="${attr(key)}" type="button">${escapeHTML(label)}</button>`).join("")}
      </div>
    </div>
  `;
}

function renderCaseCard(item) {
  return `
    <article class="case-card">
      <div class="case-head">
        <div>
          <h3 class="case-title">${escapeHTML(caseNo(item))} ${escapeHTML(caseTitle(item))}</h3>
          <div class="case-meta">
            ${stageBadge(item.stage)}
            ${item.interest_level ? badge(`Interest: ${item.interest_level}`, "muted") : ""}
            <span>Sale: ${escapeHTML(profileName(item.owner_sale))}</span>
            <span>Follow-up: ${escapeHTML(fmtDate(item.next_follow_up_at))}</span>
          </div>
        </div>
        <button class="btn ghost" data-action="open-case" data-id="${attr(item.id)}" type="button">ดูประวัติ</button>
      </div>
      <div class="case-note">${escapeHTML(item.qualification_notes || item.current_need || "ยังไม่มี note")}</div>
      ${renderCaseActions(item)}
    </article>
  `;
}

function renderCaseActions(item) {
  const actions = [];

  if (item.stage === "lead" && (can(["admin"]) || item.owner_sale_id === currentUserId())) {
    actions.push(`<button class="btn warning" data-action="send-demo" data-id="${attr(item.id)}" type="button">ส่งเข้า Demo</button>`);
    actions.push(`<button class="btn success" data-action="convert-customer" data-id="${attr(item.id)}" type="button">เป็น Customer</button>`);
    actions.push(`<button class="btn danger" data-action="close-lost" data-id="${attr(item.id)}" type="button">ปิด Lost</button>`);
  }

  if (item.stage === "demo" && can(["admin", "cs"])) {
    actions.push(`<button class="btn success" data-action="convert-customer" data-id="${attr(item.id)}" type="button">Demo จบ: เป็น Customer</button>`);
    actions.push(`<button class="btn danger" data-action="close-lost" data-id="${attr(item.id)}" type="button">Demo จบ: Lost</button>`);
  }

  if (item.stage === "customer" && can(["admin", "cs"])) {
    actions.push(`<button class="btn danger" data-action="mark-churn" data-id="${attr(item.id)}" type="button">Mark Churn</button>`);
  }

  if (item.stage !== "archived" && can(["admin", "mkt", "sale", "cs"])) {
    actions.push(`<button class="btn ghost" data-action="create-task-for-case" data-id="${attr(item.id)}" type="button">+ Task</button>`);
  }

  return actions.length ? `<div class="actions">${actions.join("")}</div>` : "";
}

function renderDemos() {
  const items = state.demos.filter(demo => {
    if (state.filters.demos === "history") return ["completed", "cancelled", "lost", "converted"].includes(demo.demo_status);
    if (state.filters.demos === "all") return true;
    return ["queued", "scheduled", "in_progress"].includes(demo.demo_status);
  });

  const filters = [["active", "กำลังดำเนินการ"], ["history", "ประวัติ"], ["all", "ทั้งหมด"]];

  return `
    ${pageHeader("Demo Queue", "CS เห็นรายการ Demo ร่วมกันทั้งทีม และประวัติ Demo ไม่หายหลังเปลี่ยนสถานะ")}
    <div class="toolbar">
      <div class="filters">
        ${filters.map(([key, label]) => `<button class="filter-chip ${state.filters.demos === key ? "active" : ""}" data-filter-group="demos" data-filter-value="${attr(key)}" type="button">${escapeHTML(label)}</button>`).join("")}
      </div>
    </div>
    <div class="list">${items.length ? items.map(renderDemoCard).join("") : `<div class="empty">ยังไม่มีรายการ Demo</div>`}</div>
  `;
}

function renderDemoCard(demo) {
  const item = demo.crm_cases;
  if (!item) return "";
  const canEditDemo = can(["admin", "cs"]);

  return `
    <article class="case-card">
      <div class="case-head">
        <div>
          <h3 class="case-title">${escapeHTML(caseNo(item))} ${escapeHTML(caseTitle(item))}</h3>
          <div class="case-meta">
            ${badge(DEMO_STATUS_LABELS[demo.demo_status] || demo.demo_status, demo.demo_status === "converted" ? "success" : "warning")}
            ${stageBadge(item.stage)}
            <span>เริ่ม: ${escapeHTML(fmtDate(demo.start_date))}</span>
            <span>สิ้นสุด: ${escapeHTML(fmtDate(demo.end_date))}</span>
            <span>CS: ${escapeHTML(profileName(demo.assigned_cs))}</span>
          </div>
        </div>
        <button class="btn ghost" data-action="open-case" data-id="${attr(item.id)}" type="button">ดูประวัติ</button>
      </div>
      <div class="case-note">${escapeHTML(demo.requirements || demo.notes || "ยังไม่มีรายละเอียด Demo")}</div>
      <div class="actions">
        ${canEditDemo ? `<button class="btn ghost" data-action="edit-demo" data-id="${attr(demo.id)}" type="button">อัปเดต Demo</button>` : ""}
        ${canEditDemo && item.stage === "demo" ? `<button class="btn success" data-action="convert-customer" data-id="${attr(item.id)}" type="button">เป็น Customer</button>` : ""}
        ${canEditDemo && item.stage === "demo" ? `<button class="btn danger" data-action="close-lost" data-id="${attr(item.id)}" type="button">ปิด Lost</button>` : ""}
      </div>
    </article>
  `;
}

function renderCustomers() {
  const items = state.customers.filter(customer => {
    const stage = customer.crm_cases?.stage;
    if (state.filters.customers === "churn") return stage === "churn";
    if (state.filters.customers === "all") return true;
    return stage === "customer";
  });

  const filters = [["active", "ลูกค้าปัจจุบัน"], ["churn", "Churn"], ["all", "ทั้งหมด"]];
  return `
    ${pageHeader("Customer", "CS ดูแลข้อมูลลูกค้า Training Usage Billing Risk และสถานะลูกค้า")}
    <div class="toolbar">
      <div class="filters">
        ${filters.map(([key, label]) => `<button class="filter-chip ${state.filters.customers === key ? "active" : ""}" data-filter-group="customers" data-filter-value="${attr(key)}" type="button">${escapeHTML(label)}</button>`).join("")}
      </div>
    </div>
    <div class="list">${items.length ? items.map(renderCustomerCard).join("") : `<div class="empty">ยังไม่มี Customer</div>`}</div>
  `;
}

function renderCustomerCard(customer) {
  const item = customer.crm_cases;
  if (!item) return "";
  const canEdit = can(["admin", "cs"]);

  return `
    <article class="case-card">
      <div class="case-head">
        <div>
          <h3 class="case-title">${escapeHTML(caseNo(item))} ${escapeHTML(caseTitle(item))}</h3>
          <div class="case-meta">
            ${stageBadge(item.stage)}
            ${riskBadge(customer.risk_level)}
            <span>Plan: ${escapeHTML(customer.plan_name || "-")}</span>
            <span>Billing: ${escapeHTML(customer.billing_cycle || "-")}</span>
            <span>Renewal: ${escapeHTML(fmtDate(customer.renewal_date))}</span>
          </div>
        </div>
        <button class="btn ghost" data-action="open-case" data-id="${attr(item.id)}" type="button">ดูประวัติ</button>
      </div>
      <div class="case-note">Health: ${escapeHTML(customer.health_status || "-")} / Usage: ${escapeHTML(customer.usage_status || "-")} / Training: ${escapeHTML(customer.training_status || "-")}</div>
      <div class="actions">
        ${canEdit ? `<button class="btn ghost" data-action="edit-customer" data-id="${attr(customer.id)}" type="button">อัปเดต Customer</button>` : ""}
        ${canEdit && item.stage === "customer" ? `<button class="btn danger" data-action="mark-churn" data-id="${attr(item.id)}" type="button">Mark Churn</button>` : ""}
        ${can(["admin", "mkt", "sale", "cs"]) ? `<button class="btn ghost" data-action="create-task-for-case" data-id="${attr(item.id)}" type="button">+ Task</button>` : ""}
      </div>
    </article>
  `;
}

function renderTasks() {
  const items = state.tasks.filter(task => {
    if (state.filters.tasks === "all") return true;
    return task.status === state.filters.tasks;
  });

  const filters = [["open", "เปิดอยู่"], ["done", "เสร็จแล้ว"], ["cancelled", "ยกเลิก"], ["all", "ทั้งหมด"]];

  return `
    ${pageHeader("Task", "งาน follow-up, demo, training, billing และ risk ที่ต้องมี owner/due date", can(["admin", "mkt", "sale", "cs"]) ? `<button class="btn primary" data-action="create-task" type="button">+ สร้าง Task</button>` : "")}
    <section class="panel hidden" data-section="create-task" style="margin-bottom:16px">
      <div class="panel-header"><h3 class="panel-title">สร้าง Task</h3></div>
      <div class="panel-body">${renderTaskForm()}</div>
    </section>
    <div class="toolbar">
      <div class="filters">
        ${filters.map(([key, label]) => `<button class="filter-chip ${state.filters.tasks === key ? "active" : ""}" data-filter-group="tasks" data-filter-value="${attr(key)}" type="button">${escapeHTML(label)}</button>`).join("")}
      </div>
    </div>
    <div class="list">${items.length ? items.map(renderTaskCard).join("") : `<div class="empty">ยังไม่มี Task</div>`}</div>
  `;
}

function renderTaskForm(caseId = "") {
  const caseOptions = state.cases
    .filter(item => !["archived"].includes(item.stage))
    .map(item => `<option value="${attr(item.id)}" ${caseId === item.id ? "selected" : ""}>${escapeHTML(caseNo(item))} ${escapeHTML(caseTitle(item))}</option>`)
    .join("");

  const userOptions = state.profiles
    .filter(p => p.is_active)
    .map(p => `<option value="${attr(p.id)}" ${currentUserId() === p.id ? "selected" : ""}>${escapeHTML(profileName(p))} (${escapeHTML(ROLE_LABELS[p.role] || p.role)})</option>`)
    .join("");

  return `
    <form class="form" data-action="save-task">
      <div class="form-row">
        <div class="field">
          <label>Case *</label>
          <select name="case_id" required>
            <option value="">เลือก Case</option>
            ${caseOptions}
          </select>
        </div>
        <div class="field">
          <label>ผู้รับผิดชอบ *</label>
          <select name="assigned_to" required>${userOptions}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="field">
          <label>หัวข้อ *</label>
          <input name="title" required />
        </div>
        <div class="field">
          <label>ประเภทงาน</label>
          <select name="task_type">
            <option value="follow_up">Follow-up</option>
            <option value="demo">Demo</option>
            <option value="training">Training</option>
            <option value="billing">Billing</option>
            <option value="risk">Risk</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="field">
          <label>Due date</label>
          <input name="due_date" type="date" value="${attr(daysFromNowISO(2))}" />
        </div>
        <div class="field">
          <label>Priority</label>
          <select name="priority">
            <option value="normal">ปกติ</option>
            <option value="high">สูง</option>
            <option value="low">ต่ำ</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Note</label>
        <textarea name="notes"></textarea>
      </div>
      <div class="actions">
        <button class="btn primary" type="submit">บันทึก Task</button>
        <button class="btn ghost" type="button" data-action="create-task">ยกเลิก</button>
      </div>
    </form>
  `;
}

function canUpdateTask(task) {
  if (role() === "manager") return false;
  return task.assigned_to === currentUserId() || task.created_by === currentUserId() || can(["admin", "cs"]);
}

function renderTaskCard(task) {
  const item = task.crm_cases;
  const dueType = task.status === "done" ? "success" : task.due_date && task.due_date < todayISO() ? "danger" : "muted";
  const taskCanUpdate = canUpdateTask(task);

  return `
    <article class="case-card">
      <div class="case-head">
        <div>
          <h3 class="case-title">${escapeHTML(task.title)}</h3>
          <div class="case-meta">
            ${badge(TASK_STATUS_LABELS[task.status] || task.status, task.status === "done" ? "success" : task.status === "cancelled" ? "danger" : "primary")}
            ${badge(`Due: ${fmtDate(task.due_date)}`, dueType)}
            <span>Owner: ${escapeHTML(profileName(task.assignee))}</span>
            <span>Case: ${escapeHTML(item ? `${caseNo(item)} ${caseTitle(item)}` : "-")}</span>
          </div>
        </div>
        ${item ? `<button class="btn ghost" data-action="open-case" data-id="${attr(item.id)}" type="button">ดู Case</button>` : ""}
      </div>
      <div class="case-note">${escapeHTML(task.notes || "")}</div>
      <div class="actions">
        ${task.status === "open" && taskCanUpdate ? `<button class="btn success" data-action="complete-task" data-id="${attr(task.id)}" type="button">เสร็จแล้ว</button>` : ""}
        ${task.status === "open" && taskCanUpdate ? `<button class="btn danger" data-action="cancel-task" data-id="${attr(task.id)}" type="button">ยกเลิก</button>` : ""}
      </div>
    </article>
  `;
}

function renderHistory() {
  const items = state.cases;
  return `
    ${pageHeader("History", "ค้นย้อนหลังจาก case เดียวกัน แม้เปลี่ยน Lead → Demo → Customer → Lost/Churn แล้ว")}
    <div class="table-wrap panel">
      <table class="table">
        <thead>
          <tr>
            <th>Case</th>
            <th>Stage</th>
            <th>Sale</th>
            <th>Contact</th>
            <th>Follow-up</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td><strong>${escapeHTML(caseNo(item))}</strong><br>${escapeHTML(caseTitle(item))}</td>
              <td>${stageBadge(item.stage)}</td>
              <td>${escapeHTML(profileName(item.owner_sale))}</td>
              <td>${escapeHTML(item.contact_email || item.contact_phone || "-")}</td>
              <td>${escapeHTML(fmtDate(item.next_follow_up_at))}</td>
              <td>${escapeHTML(fmtDateTime(item.updated_at))}</td>
              <td><button class="btn ghost" data-action="open-case" data-id="${attr(item.id)}" type="button">ดูประวัติ</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCaseDrawer() {
  const item = state.cases.find(c => c.id === state.selectedCaseId);
  if (!item) return "";
  const demos = state.demos.filter(demo => demo.case_id === item.id);
  const customers = state.customers.filter(customer => customer.case_id === item.id);
  const tasks = state.tasks.filter(task => task.case_id === item.id);

  return `
    <div class="drawer-backdrop" data-action="close-drawer">
      <aside class="drawer" role="dialog" aria-modal="true" aria-label="Case history">
        <div class="drawer-header">
          <div>
            <h2 class="page-title">${escapeHTML(caseNo(item))} ${escapeHTML(caseTitle(item))}</h2>
            <p class="page-subtitle">${escapeHTML(item.contact_email || "")} ${escapeHTML(item.contact_phone || "")}</p>
          </div>
          <button class="btn ghost" data-action="close-drawer" type="button">ปิด</button>
        </div>

        <section class="grid">
          <div class="card">
            <h3>ข้อมูลหลัก</h3>
            <p>${stageBadge(item.stage)} ${item.lost_reason ? badge(`Lost: ${item.lost_reason}`, "danger") : ""} ${item.churn_reason ? badge(`Churn: ${item.churn_reason}`, "danger") : ""}</p>
            <p><strong>Sale:</strong> ${escapeHTML(profileName(item.owner_sale))}</p>
            <p><strong>Need:</strong> ${escapeHTML(item.current_need || item.qualification_notes || "-")}</p>
          </div>

          <div class="card">
            <h3>Demo History</h3>
            ${demos.length ? demos.map(demo => `
              <div class="timeline-item">
                <strong>${escapeHTML(DEMO_STATUS_LABELS[demo.demo_status] || demo.demo_status)}: ${escapeHTML(fmtDate(demo.start_date))} - ${escapeHTML(fmtDate(demo.end_date))}</strong>
                <span>${escapeHTML(demo.requirements || demo.demo_result || demo.notes || "-")}</span>
              </div>
            `).join("") : `<div class="empty">ยังไม่มี Demo history</div>`}
          </div>

          <div class="card">
            <h3>Customer Snapshot</h3>
            ${customers.length ? customers.map(customer => `
              <p>${riskBadge(customer.risk_level)} Plan: ${escapeHTML(customer.plan_name || "-")} / Billing: ${escapeHTML(customer.billing_cycle || "-")}</p>
              <p>Health: ${escapeHTML(customer.health_status || "-")} / Usage: ${escapeHTML(customer.usage_status || "-")} / Training: ${escapeHTML(customer.training_status || "-")}</p>
            `).join("") : `<div class="empty">ยังไม่มีข้อมูล Customer</div>`}
          </div>

          <div class="card">
            <h3>Task</h3>
            ${tasks.length ? tasks.map(task => `<p>${badge(TASK_STATUS_LABELS[task.status] || task.status)} ${escapeHTML(task.title)} — ${escapeHTML(fmtDate(task.due_date))}</p>`).join("") : `<div class="empty">ยังไม่มี Task</div>`}
          </div>

          <div class="card">
            <h3>Activity Log</h3>
            <div class="timeline">
              ${state.activities.length ? state.activities.map(activity => `
                <div class="timeline-item">
                  <strong>${escapeHTML(activity.title || activity.activity_type)}</strong>
                  <span>${escapeHTML(fmtDateTime(activity.created_at))} โดย ${escapeHTML(profileName(activity.actor))}</span>
                  <span>${escapeHTML(activity.description || "")}</span>
                </div>
              `).join("") : `<div class="empty">ยังไม่มี activity</div>`}
            </div>
          </div>
        </section>
      </aside>
    </div>
  `;
}

function getFormData(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === "" ? null : value]));
}

async function withButtonLoading(button, fn) {
  if (!button) return fn();
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = "กำลังบันทึก...";
  try {
    return await fn();
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

async function createActivity(caseId, activityType, title, description, fromStage = null, toStage = null, metadata = {}) {
  const { error } = await supabase.from("case_activities").insert({
    case_id: caseId,
    actor_id: currentUserId(),
    activity_type: activityType,
    title,
    description,
    from_stage: fromStage,
    to_stage: toStage,
    metadata
  });
  if (error) throw error;
}

async function handleLogin(form, button) {
  const data = getFormData(form);
  await withButtonLoading(button, async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });
    if (error) throw error;
  });
}

async function handleSaveConfig(form, button) {
  const data = getFormData(form);
  await withButtonLoading(button, async () => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({
      supabaseUrl: data.supabaseUrl,
      supabaseAnonKey: data.supabaseAnonKey
    }));
    showToast("บันทึก config แล้ว");
    await boot();
  });
}

async function handleCreateLead(form, button) {
  const data = getFormData(form);
  const ownerSaleId = data.owner_sale_id || data.default_sale_id;
  if (!ownerSaleId) throw new Error("กรุณาเลือก Sale Owner");

  await withButtonLoading(button, async () => {
    const payload = {
      stage: "lead",
      source_team: data.source_team || role(),
      source_channel: data.source_channel,
      company_name: data.company_name,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      interested_product: data.interested_product,
      interest_level: data.interest_level,
      qualification_notes: data.qualification_notes,
      next_follow_up_at: data.next_follow_up_at,
      owner_sale_id: ownerSaleId,
      created_by: currentUserId(),
      updated_by: currentUserId()
    };

    const { data: inserted, error } = await supabase
      .from("crm_cases")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;
    await createActivity(inserted.id, "lead_created", "สร้าง Lead", `สร้าง Lead โดย ${ROLE_LABELS[role()] || role()}`);
    showToast("สร้าง Lead แล้ว");
    form.reset();
    await refreshData();
  });
}

async function sendLeadToDemo(caseId) {
  const item = state.cases.find(c => c.id === caseId);
  if (!item) return;

  const requirements = window.prompt("รายละเอียด requirement สำหรับ Demo", item.current_need || item.qualification_notes || "");
  if (requirements === null) return;

  const startDate = window.prompt("วันเริ่ม Demo (YYYY-MM-DD)", todayISO());
  if (startDate === null) return;

  const endDate = window.prompt("วันสิ้นสุด Demo (YYYY-MM-DD)", daysFromNowISO(7));
  if (endDate === null) return;

  const { error: updateError } = await supabase
    .from("crm_cases")
    .update({
      stage: "demo",
      current_need: requirements,
      updated_by: currentUserId()
    })
    .eq("id", caseId);

  if (updateError) throw updateError;

  const { error: demoError } = await supabase
    .from("demo_sessions")
    .insert({
      case_id: caseId,
      demo_status: "queued",
      start_date: startDate || todayISO(),
      end_date: endDate || daysFromNowISO(7),
      requirements,
      created_by: currentUserId()
    });

  if (demoError) throw demoError;

  await createActivity(caseId, "sent_to_demo", "ส่งเข้า Demo Queue", requirements, item.stage, "demo");
  showToast("ส่งเข้า Demo Queue แล้ว");
  await refreshData();
}

async function convertToCustomer(caseId) {
  const item = state.cases.find(c => c.id === caseId);
  if (!item) return;

  const planName = window.prompt("Plan / Package ที่ลูกค้าใช้", "");
  if (planName === null) return;

  const billingCycle = window.prompt("รอบบิล เช่น monthly, yearly", "monthly");
  if (billingCycle === null) return;

  const today = todayISO();

  const { error: updateError } = await supabase
    .from("crm_cases")
    .update({
      stage: "customer",
      converted_to_customer_at: new Date().toISOString(),
      updated_by: currentUserId()
    })
    .eq("id", caseId);

  if (updateError) throw updateError;

  const { error: customerError } = await supabase
    .from("customer_profiles")
    .upsert({
      case_id: caseId,
      customer_since: today,
      plan_name: planName,
      billing_cycle: billingCycle,
      risk_level: "low",
      health_status: "new",
      usage_status: "not_started",
      training_status: "pending"
    }, { onConflict: "case_id" });

  if (customerError) throw customerError;

  const activeDemo = state.demos.find(d => d.case_id === caseId && ["queued", "scheduled", "in_progress"].includes(d.demo_status));
  if (activeDemo) {
    await supabase
      .from("demo_sessions")
      .update({ demo_status: "converted", actual_end_at: new Date().toISOString(), demo_result: "converted_to_customer" })
      .eq("id", activeDemo.id);
  }

  await createActivity(caseId, "converted_to_customer", "เปลี่ยนเป็น Customer", `Plan: ${planName || "-"}, Billing: ${billingCycle || "-"}`, item.stage, "customer");
  showToast("เปลี่ยนเป็น Customer แล้ว");
  await refreshData();
}

async function closeAsLost(caseId) {
  const item = state.cases.find(c => c.id === caseId);
  if (!item) return;

  const reason = window.prompt("เหตุผล Lost", item.lost_reason || "");
  if (!reason) return;

  const { error } = await supabase
    .from("crm_cases")
    .update({
      stage: "lost",
      lost_reason: reason,
      updated_by: currentUserId()
    })
    .eq("id", caseId);

  if (error) throw error;

  await supabase
    .from("demo_sessions")
    .update({ demo_status: "lost", actual_end_at: new Date().toISOString(), demo_result: reason })
    .eq("case_id", caseId)
    .in("demo_status", ["queued", "scheduled", "in_progress"]);

  await createActivity(caseId, "closed_lost", "ปิดเป็น Lost", reason, item.stage, "lost");
  showToast("ปิด Lost แล้ว");
  await refreshData();
}

async function markChurn(caseId) {
  const item = state.cases.find(c => c.id === caseId);
  if (!item) return;

  const reason = window.prompt("เหตุผล Churn", item.churn_reason || "");
  if (!reason) return;

  const { error } = await supabase
    .from("crm_cases")
    .update({
      stage: "churn",
      churn_reason: reason,
      churned_at: new Date().toISOString(),
      updated_by: currentUserId()
    })
    .eq("id", caseId);

  if (error) throw error;

  await createActivity(caseId, "marked_churn", "เปลี่ยนเป็น Churn", reason, item.stage, "churn");
  showToast("บันทึก Churn แล้ว");
  await refreshData();
}

async function editDemo(demoId) {
  const demo = state.demos.find(d => d.id === demoId);
  if (!demo) return;

  const status = window.prompt("สถานะ Demo: queued, scheduled, in_progress, completed, cancelled", demo.demo_status || "scheduled");
  if (status === null) return;

  const result = window.prompt("ผลการเดโม่ / หมายเหตุ", demo.demo_result || demo.notes || "");
  if (result === null) return;

  const nextFollowUp = window.prompt("วันติดตามต่อ (YYYY-MM-DD)", demo.next_follow_up_at || daysFromNowISO(3));
  if (nextFollowUp === null) return;

  const { error } = await supabase
    .from("demo_sessions")
    .update({
      demo_status: status,
      demo_result: result,
      notes: result,
      next_follow_up_at: nextFollowUp || null,
      actual_end_at: ["completed", "cancelled", "lost", "converted"].includes(status) ? new Date().toISOString() : demo.actual_end_at
    })
    .eq("id", demoId);

  if (error) throw error;

  await createActivity(demo.case_id, "demo_updated", "อัปเดต Demo", `${status}: ${result || "-"}`);
  showToast("อัปเดต Demo แล้ว");
  await refreshData();
}

async function editCustomer(customerId) {
  const customer = state.customers.find(c => c.id === customerId);
  if (!customer) return;

  const riskLevel = window.prompt("Risk: low, medium, high", customer.risk_level || "low");
  if (riskLevel === null) return;

  const healthStatus = window.prompt("Health status", customer.health_status || "");
  if (healthStatus === null) return;

  const usageStatus = window.prompt("Usage status", customer.usage_status || "");
  if (usageStatus === null) return;

  const trainingStatus = window.prompt("Training status", customer.training_status || "pending");
  if (trainingStatus === null) return;

  const { error } = await supabase
    .from("customer_profiles")
    .update({
      risk_level: riskLevel,
      health_status: healthStatus,
      usage_status: usageStatus,
      training_status: trainingStatus
    })
    .eq("id", customerId);

  if (error) throw error;

  await createActivity(customer.case_id, "customer_updated", "อัปเดต Customer", `Risk: ${riskLevel}, Health: ${healthStatus}, Usage: ${usageStatus}`);
  showToast("อัปเดต Customer แล้ว");
  await refreshData();
}

async function createTaskForCase(caseId) {
  const title = window.prompt("หัวข้อ Task", "");
  if (!title) return;

  const dueDate = window.prompt("Due date (YYYY-MM-DD)", daysFromNowISO(2));
  if (dueDate === null) return;

  const assignedTo = window.prompt("User ID ผู้รับผิดชอบ (ว่าง = ตัวเอง)", currentUserId());
  if (assignedTo === null) return;

  const { error } = await supabase
    .from("tasks")
    .insert({
      case_id: caseId,
      title,
      task_type: "follow_up",
      status: "open",
      priority: "normal",
      due_date: dueDate || null,
      assigned_to: assignedTo || currentUserId(),
      created_by: currentUserId()
    });

  if (error) throw error;

  await createActivity(caseId, "task_created", "สร้าง Task", title);
  showToast("สร้าง Task แล้ว");
  await refreshData();
}

async function saveTask(form, button) {
  const data = getFormData(form);

  await withButtonLoading(button, async () => {
    const { error } = await supabase
      .from("tasks")
      .insert({
        case_id: data.case_id,
        title: data.title,
        task_type: data.task_type,
        status: "open",
        priority: data.priority,
        due_date: data.due_date,
        assigned_to: data.assigned_to,
        created_by: currentUserId(),
        notes: data.notes
      });

    if (error) throw error;

    await createActivity(data.case_id, "task_created", "สร้าง Task", data.title);
    showToast("สร้าง Task แล้ว");
    form.reset();
    await refreshData();
  });
}

async function updateTaskStatus(taskId, status) {
  const task = state.tasks.find(t => t.id === taskId);
  const payload = {
    status,
    completed_at: status === "done" ? new Date().toISOString() : null
  };

  const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);
  if (error) throw error;

  if (task?.case_id) {
    await createActivity(task.case_id, "task_status_updated", `Task: ${TASK_STATUS_LABELS[status] || status}`, task.title);
  }

  showToast("อัปเดต Task แล้ว");
  await refreshData();
}

async function openCase(caseId) {
  state.selectedCaseId = caseId;
  await loadActivities(caseId);
  render();
}

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-action]");
  if (!form) return;
  event.preventDefault();

  const action = form.dataset.action;
  const button = event.submitter || form.querySelector("button[type='submit']");

  try {
    if (action === "login") await handleLogin(form, button);
    if (action === "save-config") await handleSaveConfig(form, button);
    if (action === "create-lead") await handleCreateLead(form, button);
    if (action === "save-task") await saveTask(form, button);
  } catch (error) {
    showError(error);
  }
});

document.addEventListener("click", async (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    state.route = routeButton.dataset.route;
    state.selectedCaseId = null;
    render();
    return;
  }

  const filterButton = event.target.closest("[data-filter-group]");
  if (filterButton) {
    state.filters[filterButton.dataset.filterGroup] = filterButton.dataset.filterValue;
    render();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;

  if (
    button.dataset.action === "close-drawer" &&
    event.target.closest(".drawer") &&
    !event.target.closest('button[data-action="close-drawer"]')
  ) {
    return;
  }

  const action = button.dataset.action;
  const id = button.dataset.id;

  const run = async () => {
    if (action === "refresh") await refreshData();
    if (action === "logout") await supabase.auth.signOut();
    if (action === "toggle-create-lead") document.querySelector('[data-section="create-lead"]')?.classList.toggle("hidden");
    if (action === "create-task") document.querySelector('[data-section="create-task"]')?.classList.toggle("hidden");
    if (action === "open-case") await openCase(id);
    if (action === "close-drawer") {
      state.selectedCaseId = null;
      state.activities = [];
      render();
    }
    if (action === "send-demo") await sendLeadToDemo(id);
    if (action === "convert-customer") await convertToCustomer(id);
    if (action === "close-lost") await closeAsLost(id);
    if (action === "mark-churn") await markChurn(id);
    if (action === "edit-demo") await editDemo(id);
    if (action === "edit-customer") await editCustomer(id);
    if (action === "create-task-for-case") await createTaskForCase(id);
    if (action === "complete-task") await updateTaskStatus(id, "done");
    if (action === "cancel-task") await updateTaskStatus(id, "cancelled");
  };

  try {
    const asyncActions = new Set([
      "refresh", "logout", "open-case", "send-demo", "convert-customer", "close-lost",
      "mark-churn", "edit-demo", "edit-customer", "create-task-for-case",
      "complete-task", "cancel-task"
    ]);

    if (asyncActions.has(action)) {
      await withButtonLoading(button, run);
    } else {
      await run();
    }
  } catch (error) {
    showError(error);
  }
});

window.addEventListener("beforeunload", cleanupRealtime);

boot().catch((error) => {
  showError(error, "เริ่มระบบไม่สำเร็จ");
  renderSetup(error.message);
});

window.INTERNAL_CRM_VERSION = APP_VERSION;
