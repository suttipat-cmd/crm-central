
/*
  ระบบ CRM ภายใน
  Version: 1.4.0
  Stack: GitHub Pages + Supabase
  Files: README.md, index.html, script.js, style.css
*/

const APP_VERSION = '1.4.0'

const CONFIG = {
  supabaseUrl: 'https://eplqmkiftafkvqdgvsfp.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbHFta2lmdGFma3ZxZGd2c2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzY1MDcsImV4cCI6MjA5NzExMjUwN30.sfAcajUcAl8mniP1FeOF94jKYCKybNAqf2xqtQpXm0c'
}

const ROLES = {
  PENDING: 'pending',
  ADMIN: 'admin',
  MKT: 'mkt',
  SALE: 'sale',
  CS: 'cs',
  MANAGER: 'manager'
}

const ROUTES = [
  { key: 'dashboard', label: 'ภาพรวม', icon: '📊', roles: ['admin', 'mkt', 'sale', 'cs', 'manager'] },
  { key: 'my-work', label: 'งานของฉัน', icon: '🧭', roles: ['admin', 'mkt', 'sale', 'cs', 'manager'] },
  { key: 'leads', label: 'ลีด', icon: '🎯', roles: ['admin', 'mkt', 'sale', 'manager'] },
  { key: 'accounts', label: 'บัญชี', icon: '🏢', roles: ['admin', 'mkt', 'sale', 'cs', 'manager'] },
  { key: 'demo', label: 'เดโม', icon: '🧪', roles: ['admin', 'sale', 'cs', 'manager'] },
  { key: 'customers', label: 'ลูกค้า', icon: '🤝', roles: ['admin', 'sale', 'cs', 'manager'] },
  { key: 'tasks', label: 'งานติดตาม', icon: '✅', roles: ['admin', 'sale', 'cs', 'manager'] },
  { key: 'training', label: 'อบรม', icon: '🎓', roles: ['admin', 'sale', 'cs', 'manager'] },
  { key: 'reports', label: 'รายงาน', icon: '📈', roles: ['admin', 'manager'] },
  { key: 'admin', label: 'ผู้ดูแล', icon: '⚙️', roles: ['admin'] }
]

const TABLES = {
  profiles: 'profiles',
  accounts: 'accounts',
  contacts: 'account_contacts',
  activities: 'account_activities',
  demos: 'demo_sessions',
  demoUsers: 'demo_users',
  demoLogs: 'demo_logs',
  customers: 'customer_profiles',
  trainings: 'training_sessions',
  trainingParticipants: 'training_participants',
  modules: 'modules',
  accountสินค้า: 'account_modules',
  tasks: 'tasks',
  taskComments: 'task_comments',
  assignmentHistory: 'assignment_history',
  statusHistory: 'status_history',
  lostReasons: 'lost_reasons',
  leadประเภทs: 'lead_sources',
  campaigns: 'campaigns',
  contactสถานะes: 'contact_statuses',
  businessTypes: 'business_types',
  leadChannels: 'lead_channels',
  accountCsผู้รับผิดชอบs: 'account_cs_owners',
  appSettings: 'app_settings'
}

const MASTER_TABLES = [
  { key: 'leadประเภทs', table: TABLES.leadประเภทs, label: 'แหล่งที่มาs', nameField: 'name' },
  { key: 'campaigns', table: TABLES.campaigns, label: 'แคมเปญs', nameField: 'name' },
  { key: 'modules', table: TABLES.modules, label: 'สินค้า', nameField: 'module_name' },
  { key: 'contactสถานะes', table: TABLES.contactสถานะes, label: 'Contact สถานะes', nameField: 'name' },
  { key: 'businessTypes', table: TABLES.businessTypes, label: 'ประเภทธุรกิจ', nameField: 'name' },
  { key: 'leadChannels', table: TABLES.leadChannels, label: 'ช่องทาง', nameField: 'name' },
  { key: 'lostReasons', table: TABLES.lostReasons, label: 'เหตุผลที่ปิด', nameField: 'reason_name' }
]

const STAGE_LABELS = {
  lead: 'Lead',
  demo: 'เดโม',
  customer: 'Customer',
  lost: 'Lost'
}

const STATUS_LABELS = {
  new: 'New',
  assigned: 'Assigned',
  contacted: 'Contacted',
  follow_up: 'ติดตามต่อ',
  demo_requested: 'Demo Requested',
  demo_active: 'Demo ใช้งาน',
  customer_active: 'Customer ใช้งาน',
  lost: 'Lost',
  churned: 'Churned'
}

const state = {
  client: null,
  session: null,
  user: null,
  profile: null,
  loading: false,
  viewModes: {
    leads: 'table',
    accounts: 'table',
    demo: 'table',
    customers: 'table',
    tasks: 'board',
    training: 'calendar'
  },
  sidebarCollapsed: true,
  modal: null,
  filters: {
    leads: { q: '', stage: 'lead', status: '', owner: '', channel: '', source: '', campaign: '', businessType: '', sort: 'updated_desc', page: 1, pageSize: 25 },
    accounts: { q: '', stage: '', status: '', owner: '', channel: '', source: '', campaign: '', businessType: '', sort: 'updated_desc', page: 1, pageSize: 25 },
    demo: { q: '', status: '', owner: '', sort: 'updated_desc', page: 1, pageSize: 25 },
    customers: { q: '', status: '', owner: '', sort: 'updated_desc', page: 1, pageSize: 25 },
    tasks: { q: '', status: '', owner: '', priority: '', sort: 'due_asc', page: 1, pageSize: 25 },
    training: { q: '', status: '', owner: '', sort: 'date_asc', page: 1, pageSize: 25 }
  },
  accountTabs: {},
  lastSyncedAt: null,
  cache: {
    profiles: [],
    accounts: [],
    contacts: [],
    activities: [],
    demos: [],
    demoUsers: [],
    demoLogs: [],
    customers: [],
    trainings: [],
    trainingParticipants: [],
    modules: [],
    accountสินค้า: [],
    tasks: [],
    taskComments: [],
    assignmentHistory: [],
    statusHistory: [],
    lostReasons: [],
    leadประเภทs: [],
    campaigns: [],
    contactสถานะes: [],
    businessTypes: [],
    leadChannels: [],
    accountCsผู้รับผิดชอบs: []
  }
}

const app = document.getElementById('app')
const toastRoot = document.getElementById('toast-root')
let filterTimer = null
let fieldSeq = 0

document.addEventListener('DOMContentLoaded', init)
window.addEventListener('hashchange', () => render())
document.addEventListener('click', onClick)
document.addEventListener('submit', onSubmit)
document.addEventListener('change', onChange)
document.addEventListener('input', onInput)

async function init() {
  state.sidebarCollapsed = true

  if (!isConfigured()) {
    renderSetupRequired()
    return
  }

  try {
    state.client = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoรีเฟรชToken: true,
        detectSessionInUrl: true
      }
    })

    const { data, error } = await state.client.auth.getSession()
    if (error) throw error
    state.session = data.session
    state.user = data.session?.user || null

    state.client.auth.onAuthStateChange(async (_event, session) => {
      state.session = session
      state.user = session?.user || null
      if (state.user) {
        await bootstrapUser()
      } else {
        state.profile = null
        resetCache()
      }
      render()
    })

    if (state.user) {
      await bootstrapUser()
    }

    render()
  } catch (error) {
    renderFatalError(error)
  }
}

function isConfigured() {
  return CONFIG.supabaseUrl.startsWith('https://') &&
    !CONFIG.supabaseUrl.includes('YOUR_PROJECT_REF') &&
    CONFIG.supabaseAnonKey &&
    !CONFIG.supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')
}

function resetCache() {
  Object.keys(state.cache).forEach((key) => {
    state.cache[key] = []
  })
}

async function bootstrapUser() {
  state.loading = true
  renderLoading('กำลังโหลดสิทธิ์ผู้ใช้...')
  await loadProfile()
  if (isใช้งานUser()) {
    await loadAllData()
  }
  state.loading = false
}

async function loadProfile() {
  const { data, error } = await state.client
    .from(TABLES.profiles)
    .select('*')
    .eq('id', state.user.id)
    .maybeSingle()

  if (error) throw error
  state.profile = data || {
    id: state.user.id,
    email: state.user.email,
    role: ROLES.PENDING,
    is_active: false
  }
}

function isใช้งานUser() {
  return Boolean(state.profile && state.profile.is_active && state.profile.role !== ROLES.PENDING)
}

function hasสิทธิ์(roles) {
  if (!Array.isArray(roles)) return false
  return roles.includes(state.profile?.role)
}

function isAdmin() {
  return state.profile?.role === ROLES.ADMIN
}

function isManager() {
  return state.profile?.role === ROLES.MANAGER
}

function isReadOnly() {
  return isManager()
}

async function loadAllData() {
  const tables = [
    ['profiles', TABLES.profiles, '*', 'display_name'],
    ['accounts', TABLES.accounts, '*', 'updated_at'],
    ['contacts', TABLES.contacts, '*', 'created_at'],
    ['activities', TABLES.activities, '*', 'created_at'],
    ['demos', TABLES.demos, '*', 'updated_at'],
    ['demoUsers', TABLES.demoUsers, '*', 'created_at'],
    ['demoLogs', TABLES.demoLogs, '*', 'created_at'],
    ['customers', TABLES.customers, '*', 'updated_at'],
    ['trainings', TABLES.trainings, '*', 'training_date'],
    ['trainingParticipants', TABLES.trainingParticipants, '*', 'created_at'],
    ['modules', TABLES.modules, '*', 'module_name'],
    ['accountสินค้า', TABLES.accountสินค้า, '*', 'created_at'],
    ['tasks', TABLES.tasks, '*', 'due_at'],
    ['taskComments', TABLES.taskComments, '*', 'created_at'],
    ['assignmentHistory', TABLES.assignmentHistory, '*', 'created_at'],
    ['statusHistory', TABLES.statusHistory, '*', 'created_at'],
    ['lostReasons', TABLES.lostReasons, '*', 'reason_name'],
    ['leadประเภทs', TABLES.leadประเภทs, '*', 'name'],
    ['campaigns', TABLES.campaigns, '*', 'name'],
    ['contactสถานะes', TABLES.contactสถานะes, '*', 'name'],
    ['businessTypes', TABLES.businessTypes, '*', 'name'],
    ['leadChannels', TABLES.leadChannels, '*', 'name'],
    ['accountCsผู้รับผิดชอบs', TABLES.accountCsผู้รับผิดชอบs, '*', 'created_at']
  ]

  const results = await Promise.all(tables.map(async ([cacheKey, table, select, order]) => {
    let query = state.client.from(table).select(select)
    if (order === 'updated_at' || order === 'created_at') {
      query = query.order(order, { ascending: false })
    } else {
      query = query.order(order, { ascending: true, nullsFirst: false })
    }

    const { data, error } = await query
    if (error) throw new Error(`${table}: ${error.message}`)
    return [cacheKey, data || []]
  }))

  for (const [cacheKey, rows] of results) {
    state.cache[cacheKey] = rows
  }
  state.lastSyncedAt = new วันที่().toISOString()
}

function render() {
  if (!isConfigured()) {
    renderSetupRequired()
    return
  }

  if (!state.user) {
    renderLogin()
    return
  }

  if (!isใช้งานUser()) {
    renderPending()
    return
  }

  const route = getRoute()

  if (route.key === 'unauthorized') {
    app.innerHTML = renderAppLayout('ไม่มีสิทธิ์เข้าถึง', renderUnauthorized(), '')
    return
  }

  if (route.key === 'not-found') {
    app.innerHTML = renderAppLayout('ไม่พบหน้า', renderNotFound(), '')
    return
  }

  const nav = route.key === 'account'
    ? { key: 'accounts', label: 'บัญชี Detail', roles: ['admin', 'mkt', 'sale', 'cs', 'manager'] }
    : ROUTES.find((item) => item.key === route.key)

  if (!nav) {
    app.innerHTML = renderAppLayout('ไม่พบหน้า', renderNotFound(), '')
    return
  }

  if (!hasสิทธิ์(nav.roles)) {
    app.innerHTML = renderAppLayout('ไม่มีสิทธิ์เข้าถึง', renderUnauthorized(), '')
    return
  }

  app.innerHTML = renderAppLayout(nav.label, renderRoute(route), nav.key)
}


function renderAppLayout(title, content, activeKey) {
  const collapsedClass = state.sidebarCollapsed ? 'sidebar-collapsed' : ''
  return `
    <div class="app-layout ${collapsedClass}">
      ${renderSidebar(activeKey)}
      <main class="main">
        ${renderTopbar(title)}
        <section class="content" id="page-content">
          ${content}
        </section>
      </main>
      ${renderModal()}
    </div>
  `
}

function renderSidebar(activeKey) {
  const links = ROUTES
    .filter((item) => hasสิทธิ์(item.roles))
    .map((item) => `
      <button class="nav-link ${activeKey === item.key ? 'active' : ''}" data-nav="${item.key}" type="button" title="${escapeAttr(item.label)}" aria-label="${escapeAttr(item.label)}">
        <span class="nav-icon" aria-hidden="true">${item.icon}</span><span class="nav-label">${escapeHTML(item.label)}</span>
      </button>
    `).join('')

  return `
    <aside class="sidebar" aria-label="Main navigation">
      <div class="brand">
        <div class="brand-mark">CRM</div>
        <div class="brand-copy">
          <span class="brand-title">ระบบ CRM ภายใน</span>
          <span class="brand-version">v${APP_VERSION}</span>
        </div>
        <button class="sidebar-toggle" type="button" data-action="toggle-sidebar" title="${state.sidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}" aria-label="${state.sidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}">
          ${state.sidebarCollapsed ? '›' : '‹'}
        </button>
      </div>
      <nav class="nav">${links}</nav>
      <div class="sidebar-footer">
        <div class="nav-label">${escapeHTML(roleLabel(state.profile.role))}</div>
        <div class="nav-label">${escapeHTML(state.profile.display_name || state.profile.email || '')}</div>
      </div>
    </aside>
  `
}

function renderTopbar(title) {
  return `
    <header class="topbar">
      <div>
        <h1>${escapeHTML(title)}</h1>
        <div class="topbar-meta">อัปเดตล่าสุด: ${state.lastSyncedAt ? formatวันที่Time(state.lastSyncedAt) : '-'}</div>
      </div>
      <div class="user-chip">
        <span>${escapeHTML(state.profile.display_name || state.profile.email || '')}</span>
        <span class="role-pill">${escapeHTML(roleLabel(state.profile.role))}</span>
        <button class="btn small" type="button" data-action="refresh-data">รีเฟรช</button>
        <button class="btn small" type="button" data-action="logout">ออกจากระบบ</button>
      </div>
    </header>
  `
}
function renderRoute(route) {
  if (route.key === 'dashboard') return renderDashboard()
  if (route.key === 'my-work') return renderMyWork()
  if (route.key === 'leads') return renderLeads()
  if (route.key === 'accounts') return renderบัญชีs()
  if (route.key === 'account') return renderบัญชีDetail(route.id)
  if (route.key === 'demo') return renderDemo()
  if (route.key === 'customers') return renderCustomers()
  if (route.key === 'tasks') return renderTasks()
  if (route.key === 'training') return renderTraining()
  if (route.key === 'reports') return renderReports()
  if (route.key === 'admin') return renderAdmin()
  if (route.key === 'unauthorized') return renderUnauthorized()
  if (route.key === 'not-found') return renderNotFound()
  return renderNotFound()
}

function getRoute() {
  const hash = (location.hash || '#/dashboard').replace(/^#\/?/, '')
  const [key, id] = hash.split('/')
  if (key === 'account' && id) return { key: 'account', id }
  return { key: key || 'dashboard' }
}

function renderSetupRequired() {
  app.innerHTML = `
    <div class="center-screen">
      <div class="setup-card">
        <h1>ต้องตั้งค่า Supabase ก่อน</h1>
        <p>เปิดไฟล์ <strong>script.js</strong> แล้วแก้ค่า <code>CONFIG.supabaseUrl</code> และ <code>CONFIG.supabaseAnonKey</code> ให้ตรงกับโปรเจกต์ Supabase ของคุณ</p>
        <pre class="code-block">const CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
}</pre>
        <p class="muted">ห้ามใช้ service_role key ใน frontend</p>
      </div>
    </div>
  `
}

function renderFatalError(error) {
  app.innerHTML = `
    <div class="center-screen">
      <div class="setup-card">
        <h1>โหลดระบบไม่สำเร็จ</h1>
        <p>${escapeHTML(error.message || String(error))}</p>
      </div>
    </div>
  `
}

function renderLoading(message) {
  app.innerHTML = `
    <div class="boot-screen">
      <div class="spinner"></div>
      <p>${escapeHTML(message || 'กำลังโหลด...')}</p>
    </div>
  `
}

function renderLogin() {
  app.innerHTML = `
    <div class="center-screen auth-screen">
      <form class="login-card" data-form="login" novalidate>
        <div class="brand-lockup">
          <div class="brand-mark">CRM</div>
          <div>
            <h1>ระบบ CRM ภายใน</h1>
            <p>ระบบจัดการ Lead, Demo, Customer, Training และ Task สำหรับทีมภายใน</p>
          </div>
        </div>
        <div class="form-grid single">
          <div class="field">
            <label for="login-email">อีเมลองค์กร</label>
            <input id="login-email" name="email" type="email" required autocomplete="email" placeholder="name@company.com">
          </div>
          <div class="field">
            <label for="login-password">รหัสผ่าน</label>
            <input id="login-password" name="password" type="password" required autocomplete="current-password" placeholder="กรอกรหัสผ่าน">
          </div>
          <button class="btn primary block" type="submit">เข้าสู่ระบบ</button>
        </div>
        <div class="auth-help">
          <strong>เข้าไม่ได้?</strong> ตรวจสอบว่า Admin เปิดสิทธิ์และตั้ง role ให้บัญชีนี้แล้ว หากลืมรหัสผ่านให้รีเซ็ตจาก Supabase Auth หรือติดต่อผู้ดูแลระบบ
        </div>
        <div class="login-foot">Production · v${APP_VERSION}</div>
      </form>
    </div>
  `
}
function renderPending() {
  app.innerHTML = `
    <div class="center-screen auth-screen">
      <div class="pending-card">
        <h1>บัญชียังไม่พร้อมใช้งาน</h1>
        <p>บัญชีนี้เข้าสู่ระบบได้แล้ว แต่ยังต้องให้ Admin กำหนด role และเปิดสถานะ ใช้งาน ก่อนใช้งานระบบ</p>
        <div class="meta-grid">
          <div class="meta-label">อีเมล</div><div>${escapeHTML(state.user.email || '')}</div>
          <div class="meta-label">สิทธิ์</div><div>${escapeHTML(state.profile?.role || 'pending')}</div>
          <div class="meta-label">ใช้งาน</div><div>${state.profile?.is_active ? 'Yes' : 'No'}</div>
        </div>
        <div class="callout warning">
          แจ้ง Admin ให้เข้าเมนู Admin Settings → ผู้ใช้ / สิทธิ์ แล้วตั้ง role และ status เป็น ใช้งาน
        </div>
        <hr>
        <button class="btn" type="button" data-action="logout">ออกจากระบบ</button>
      </div>
    </div>
  `
}
function renderDashboard() {
  const accounts = state.cache.accounts
  const leads = accounts.filter((a) => a.lifecycle_stage === 'lead')
  const demos = accounts.filter((a) => a.lifecycle_stage === 'demo')
  const customers = accounts.filter((a) => a.lifecycle_stage === 'customer')
  const lost = accounts.filter((a) => a.lifecycle_stage === 'lost')
  const tasks = state.cache.tasks
  const overdue = tasks.filter((t) => t.status !== 'done' && t.due_at && new วันที่(t.due_at) < startOfToday())
  const todayTrainings = state.cache.trainings.filter((t) => t.training_date === todayISO())

  return `
    <div class="page-header">
      <div>
        <h2>ภาพรวมระบบ</h2>
        <p>สรุป Lead, Demo, Customer, Lost, Task และ Training ตามสิทธิ์ของผู้ใช้</p>
      </div>
      <div class="actions">
        <button class="btn primary" type="button" data-nav="my-work">ดูงานของฉัน</button>
        <button class="btn" type="button" data-action="print">พิมพ์</button>
      </div>
    </div>

    <div class="grid grid-4">
      ${renderKpi('Lead', leads.length, 'กำลัง qualify')}
      ${renderKpi('เดโม', demos.length, 'อยู่ใน demo flow')}
      ${renderKpi('Customer', customers.length, 'ลูกค้าปัจจุบัน')}
      ${renderKpi('Lost/Churn', lost.length, 'ปิดเป็น lost')}
    </div>

    <div class="grid grid-3" style="margin-top:16px">
      ${renderKpi('เปิด Tasks', tasks.filter((t) => !['done', 'cancelled'].includes(t.status)).length, 'งานที่ยังไม่ปิด')}
      ${renderKpi('Overdue', overdue.length, 'งานเลยกำหนด')}
      ${renderKpi('Training Today', todayTrainings.length, 'สอนใช้งานวันนี้')}
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <h3>Lead Journey Snapshot</h3>
        ${renderMiniJourney()}
      </div>
      <div class="card">
        <h3>งานด่วน / ใกล้ครบกำหนด</h3>
        ${renderTaskList(overdue.concat(tasks.filter((t) => t.status !== 'done')).slice(0, 6), true)}
      </div>
    </div>
  `
}

function renderMyWork() {
  const accounts = state.cache.accounts
  const tasks = state.cache.tasks.filter((task) => task.assigned_to === state.user.id || isAdmin() || isManager())
  const openTasks = tasks.filter((task) => !['done', 'cancelled'].includes(task.status))
  const overdue = openTasks.filter((task) => task.due_at && new วันที่(task.due_at) < startOfToday())
  const todayTasks = openTasks.filter((task) => datePart(task.due_at) === todayISO())
  const myLeads = accounts.filter((account) => account.lifecycle_stage === 'lead' && (account.sale_owner_id === state.user.id || isAdmin() || isManager()))
  const demoEndingSoon = state.cache.demos
    .filter((demo) => demo.end_date && ['requested', 'active', 'extended'].includes(demo.demo_status || ''))
    .filter((demo) => daysFromToday(demo.end_date) <= 7 && daysFromToday(demo.end_date) >= 0)

  return `
    <div class="page-header">
      <div>
        <h2>งานของฉัน</h2>
        <p>รวมรายการที่ควรทำต่อวันนี้ แยกตามสิทธิ์และบทบาทของผู้ใช้</p>
      </div>
      <div class="actions">
        <button class="btn" type="button" data-action="refresh-data">รีเฟรช</button>
      </div>
    </div>

    <div class="grid grid-4">
      ${renderKpi('Lead ที่ดูแล', myLeads.length, 'Lead ที่ต้องติดตาม')}
      ${renderKpi('Task วันนี้', todayTasks.length, 'ครบกำหนดวันนี้')}
      ${renderKpi('Overdue', overdue.length, 'เลยกำหนด')}
      ${renderKpi('Demo ใกล้หมด', demoEndingSoon.length, 'ภายใน 7 วัน')}
    </div>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <h3>งานที่ต้องทำก่อน</h3>
        ${renderTaskList(overdue.concat(todayTasks).slice(0, 8), true)}
      </div>
      <div class="card">
        <h3>Lead ที่ควรติดตาม</h3>
        ${renderบัญชีList(myLeads.slice(0, 8))}
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Demo ใกล้หมดอายุ</h3>
      ${simpleRowsTable(['บัญชี', 'สถานะ', 'Start', 'End', ''], demoEndingSoon.map((demo) => [
        accountTitle(findบัญชี(demo.account_id)),
        badge(demo.demo_status || '-'),
        formatวันที่(demo.start_date),
        formatวันที่(demo.end_date),
        `<button class="btn small" type="button" data-nav-account="${demo.account_id}">เปิด</button>`
      ]))}
    </div>
  `
}

function renderUnauthorized() {
  return `
    <div class="center-card">
      <h2>คุณไม่มีสิทธิ์เข้าหน้านี้</h2>
      <p class="muted">สิทธิ์ปัจจุบันของคุณคือ ${escapeHTML(roleLabel(state.profile?.role || 'pending'))} หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อ Admin เพื่อปรับ role หรือ active status</p>
      <div class="actions">
        <button class="btn primary" type="button" data-nav="dashboard">กลับ Dashboard</button>
        <button class="btn" type="button" data-action="refresh-data">รีเฟรช สิทธิ์</button>
      </div>
    </div>
  `
}

function renderNotFound() {
  return `
    <div class="center-card">
      <h2>ไม่พบหน้าที่ต้องการ</h2>
      <p class="muted">ลิงก์อาจไม่ถูกต้อง หรือรายการนี้อาจถูกลบ/ไม่มีสิทธิ์เข้าถึง</p>
      <div class="actions">
        <button class="btn primary" type="button" data-nav="dashboard">กลับ Dashboard</button>
        <button class="btn" type="button" data-nav="accounts">ไปหน้า บัญชีs</button>
      </div>
    </div>
  `
}


function renderKpi(label, value, hint) {
  return `
    <div class="card kpi">
      <div class="kpi-value">${Number(value || 0).toLocaleString()}</div>
      <div class="kpi-label">${escapeHTML(label)}</div>
      <div class="help">${escapeHTML(hint || '')}</div>
    </div>
  `
}

function renderMiniJourney() {
  const rows = [
    ['Lead → Lost', countPath('lead_lost')],
    ['Lead → Customer', countPath('lead_customer')],
    ['Lead → Demo → Lost', countPath('demo_lost')],
    ['Lead → Demo → Customer', countPath('demo_customer')],
    ['Customer → Lost/Churn', countPath('customer_lost')]
  ]

  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Journey</th><th>จำนวน</th></tr></thead>
        <tbody>${rows.map(([label, value]) => `<tr><td>${escapeHTML(label)}</td><td>${value}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  `
}

function countPath(type) {
  const accounts = state.cache.accounts
  if (type === 'lead_lost') return accounts.filter((a) => a.lifecycle_stage === 'lost' && a.lost_from_stage === 'lead').length
  if (type === 'demo_lost') return accounts.filter((a) => a.lifecycle_stage === 'lost' && a.lost_from_stage === 'demo').length
  if (type === 'customer_lost') return accounts.filter((a) => a.lifecycle_stage === 'lost' && a.lost_from_stage === 'customer').length
  if (type === 'lead_customer') return accounts.filter((a) => a.lifecycle_stage === 'customer' && !hasDemo(a.id)).length
  if (type === 'demo_customer') return accounts.filter((a) => a.lifecycle_stage === 'customer' && hasDemo(a.id)).length
  return 0
}

function hasDemo(accountId) {
  return state.cache.demos.some((demo) => demo.account_id === accountId)
}


function renderLeads() {
  const leadJourneys = state.cache.accounts
  const filter = getFilter('leads')
  if (filter.stage === undefined || filter.stage === null) filter.stage = 'lead'

  const tabs = [
    ['', 'ทั้งหมด'],
    ['lead', 'ใช้งาน Lead'],
    ['demo', 'อยู่ใน Demo'],
    ['customer', 'เป็น Customer แล้ว'],
    ['lost', 'Lost / Churn']
  ]

  return `
    <div class="page-header">
      <div>
        <h2>Lead Journey</h2>
        <p>Default แสดง Lead ที่ยัง active แต่ข้อมูลที่เปลี่ยนเป็น Demo / Customer / Lost ยังดูต่อได้จาก tab อื่น</p>
      </div>
      <div class="actions">
        ${hasสิทธิ์([ROLES.ADMIN, ROLES.MKT]) ? `<button class="btn primary" type="button" data-open-modal="create-mkt-lead">+ สร้าง MKT Lead</button>` : ''}
        ${hasสิทธิ์([ROLES.ADMIN, ROLES.SALE]) ? `<button class="btn primary" type="button" data-open-modal="create-sales-lead">+ Sale สร้าง Lead</button>` : ''}
      </div>
    </div>

    <div class="tabs lead-tabs" role="tablist" aria-label="Lead journey filters">
      ${tabs.map(([stage, label]) => `
        <button class="tab ${String(filter.stage || '') === String(stage) ? 'active' : ''}" type="button" data-lead-tab="${escapeAttr(stage)}">
          ${escapeHTML(label)}
        </button>
      `).join('')}
    </div>

    <div class="card">
      <div class="page-header compact-header">
        <div>
          <h3>Lead Journey List</h3>
          <p>แสดงตามสิทธิ์ของผู้ใช้และ filter ปัจจุบัน</p>
        </div>
        ${renderViewSwitcher('leads')}
      </div>
      ${renderบัญชีsCollection(leadJourneys, 'leads')}
    </div>
  `
}


function renderLeadCreatePanel() {
  const canCreateMkt = hasสิทธิ์([ROLES.ADMIN, ROLES.MKT])
  const canCreateSale = hasสิทธิ์([ROLES.ADMIN, ROLES.SALE])
  if (!canCreateMkt && !canCreateSale) return ''

  return `
    <div class="actions lead-create-actions">
      ${canCreateMkt ? `<button class="btn primary" type="button" data-open-modal="create-mkt-lead">+ สร้าง MKT Lead</button>` : ''}
      ${canCreateSale ? `<button class="btn primary" type="button" data-open-modal="create-sales-lead">+ Sale สร้าง Lead</button>` : ''}
    </div>
  `
}


function renderMktLeadForm() {
  const today = todayISO()
  const salesPreview = activeSalesชื่อs()
  return `
    <form class="form-grid modal-form" data-form="create-mkt-lead" novalidate>
      <div class="form-section full">
        <h3>ข้อมูลจาก Marketing</h3>
        <p class="card-subtitle">ระบบจะออกลำดับ MKT และ assign Sale แบบ round-robin หลัง บันทึก</p>
      </div>
      ${readonlyDisplay('running_no_preview', 'ลำดับ MKT', 'ระบบจะออกเลขอัตโนมัติ')}
      ${readonlyDisplay('source_type_preview', 'ที่มา Lead', 'Marketing')}
      ${selectField('lead_channel_id', 'ช่องทาง', state.cache.leadChannels, 'id', 'name', true)}
      ${selectField('campaign_id', 'แคมเปญ', state.cache.campaigns, 'id', 'name', false)}
      ${readonlyDisplay('created_at_preview', 'วันที่บันทึก', today)}
      ${inputField('contact_name', 'ผู้ติดต่อ', 'text', false)}
      ${inputField('phone', 'เบอร์หลัก', 'text', false)}
      ${inputField('email', 'อีเมล', 'email', false)}
      ${inputField('company_name', 'ชื่อบริษัท', 'text', false)}
      ${multiSelectField('module_ids', 'สินค้า / สินค้า', state.cache.modules, 'id', 'module_name')}
      ${inputField('cars_estimate', 'จำนวนรถโดยประมาณ', 'number', false)}
      ${readonlyDisplay('sale_assignment_preview', 'เซลล์ที่ระบบจะ assign', salesPreview || 'จะแสดงหลัง บันทึก')}
      <div class="field full" data-field="initial_note">
        <label for="mkt-initial-note">ข้อมูล Lead</label>
        <textarea id="mkt-initial-note" name="initial_note" placeholder="รายละเอียด Lead จาก Marketing"></textarea>
        <div class="field-error" data-field-error="initial_note"></div>
      </div>
      <div class="full modal-actions">
        <button class="btn" type="button" data-close-modal>ยกเลิก</button>
        <button class="btn primary" type="submit">บันทึก</button>
      </div>
    </form>
  `
}


function renderSaleLeadForm() {
  return `
    <form class="form-grid modal-form" data-form="create-sales-lead" novalidate>
      <div class="form-section full">
        <h3>ข้อมูลที่ Sale สร้างเอง</h3>
        <p class="card-subtitle">Lead นี้ไม่มีลำดับ MKT และ owner คือ Sale ที่ login อยู่</p>
      </div>
      ${inputField('company_name', 'บริษัท', 'text', false)}
      ${inputField('contact_name', 'ผู้ติดต่อ', 'text', false)}
      ${inputField('position', 'ตำแหน่ง', 'text', false)}
      ${inputField('phone', 'เบอร์หลัก', 'text', false)}
      ${inputField('phone_2', 'เบอร์ 2', 'text', false)}
      ${inputField('phone_3', 'เบอร์ 3', 'text', false)}
      ${inputField('email', 'อีเมล', 'email', false)}
      ${inputField('email_2', 'อีเมล 2', 'email', false)}
      ${inputField('tax_id', 'เลขผู้เสียภาษี', 'text', false)}
      <div class="field full" data-field="address">
        <label for="sale-address">ที่อยู่</label>
        <textarea id="sale-address" name="address"></textarea>
        <div class="field-error" data-field-error="address"></div>
      </div>
      ${selectField('business_type_id', 'ธุรกิจ', state.cache.businessTypes, 'id', 'name', false)}
      <div class="field full" data-field="initial_note">
        <label for="sale-initial-note">รายละเอียด</label>
        <textarea id="sale-initial-note" name="initial_note"></textarea>
        <div class="field-error" data-field-error="initial_note"></div>
      </div>
      ${inputField('cars_estimate', 'จำนวนรถ', 'number', false, '0')}
      ${multiSelectField('module_ids', 'สินค้า / สินค้า', state.cache.modules, 'id', 'module_name')}
      ${inputField('current_gps_provider', 'GPS ปัจจุบัน', 'text', false)}
      <div class="field full" data-field="note">
        <label for="sale-note">หมายเหตุ</label>
        <textarea id="sale-note" name="note"></textarea>
        <div class="field-error" data-field-error="note"></div>
      </div>
      ${readonlyDisplay('sale_email_preview', 'อีเมลเซลล์', state.profile?.email || state.user?.email || '-')}
      ${selectField('lead_channel_id', 'ช่องทาง', state.cache.leadChannels, 'id', 'name', true)}
      <div class="full modal-actions">
        <button class="btn" type="button" data-close-modal>ยกเลิก</button>
        <button class="btn primary" type="submit">บันทึก</button>
      </div>
    </form>
  `
}

function renderบัญชีs() {
  const accounts = state.cache.accounts
  return `
    <div class="page-header">
      <div>
        <h2>บัญชีs</h2>
        <p>ข้อมูลกลางของ Lead / Demo / Customer / Lost</p>
      </div>
      ${renderViewSwitcher('accounts')}
    </div>
    ${renderบัญชีsCollection(accounts, 'accounts')}
  `
}

function renderDemo() {
  const demoบัญชีs = state.cache.accounts.filter((a) => a.lifecycle_stage === 'demo')
  return `
    <div class="page-header">
      <div>
        <h2>Demo Queue</h2>
        <p>CS เห็น Demo ร่วมกันทั้งทีม และสามารถเลือก CS owner ได้มากกว่า 1 คน</p>
      </div>
      ${renderViewSwitcher('demo')}
    </div>
    ${renderบัญชีsCollection(demoบัญชีs, 'demo')}
  `
}

function renderCustomers() {
  const customers = state.cache.accounts.filter((a) => a.lifecycle_stage === 'customer')
  return `
    <div class="page-header">
      <div>
        <h2>Customers</h2>
        <p>ข้อมูลลูกค้า จำนวนรถ Module รอบบิล ระดับการใช้งาน และ Task</p>
      </div>
      ${renderViewSwitcher('customers')}
    </div>
    ${renderบัญชีsCollection(customers, 'customers')}
  `
}

function renderTasks() {
  const tasks = state.cache.tasks
  return `
    <div class="page-header">
      <div>
        <h2>Tasks</h2>
        <p>มุมมองงานติดตามลูกค้า รองรับ Board, Calendar, Table และ Timeline</p>
      </div>
      ${renderViewSwitcher('tasks')}
    </div>
    <div class="card">
      ${renderTaskCollection(tasks, 'tasks')}
    </div>
  `
}

function renderTraining() {
  const trainings = state.cache.trainings
  return `
    <div class="page-header">
      <div>
        <h2>Training Sessions</h2>
        <p>บันทึกการสอนใช้งานทั้งช่วง Demo และ Customer พร้อมครั้งที่และรายละเอียด</p>
      </div>
      ${renderViewSwitcher('training')}
    </div>
    <div class="card">
      ${renderTrainingCollection(trainings, 'training')}
    </div>
  `
}

function renderReports() {
  const accounts = state.cache.accounts
  const leadประเภทs = state.cache.leadประเภทs.map((source) => {
    const count = accounts.filter((a) => a.lead_source_id === source.id).length
    return [source.name, count]
  })

  const sales = state.cache.profiles.filter((p) => p.role === ROLES.SALE).map((sale) => {
    const owned = accounts.filter((a) => a.sale_owner_id === sale.id)
    const won = owned.filter((a) => a.lifecycle_stage === 'customer').length
    const lost = owned.filter((a) => a.lifecycle_stage === 'lost').length
    return [displayUser(sale.id), owned.length, won, lost]
  })

  return `
    <div class="page-header">
      <div>
        <h2>Reports</h2>
        <p>รายงานภาพรวมสำหรับ Manager/Admin</p>
      </div>
      <div class="actions"><button class="btn" type="button" data-action="print">พิมพ์</button></div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <h3>Lead by ประเภท</h3>
        ${simpleRowsTable(['ประเภท', 'Count'], leadประเภทs)}
      </div>
      <div class="card">
        <h3>Sale Performance</h3>
        ${simpleRowsTable(['Sale', 'บัญชี', 'Won', 'Lost'], sales)}
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h3>Lifecycle Detail</h3>
      ${renderMiniJourney()}
    </div>
  `
}

function renderAdmin() {
  return `
    <div class="page-header">
      <div>
        <h2>Admin Settings</h2>
        <p>จัดการ role, active status, master list และข้อมูลตั้งต้นของระบบ</p>
      </div>
    </div>
    <div class="grid">
      ${renderProfilesAdmin()}
      ${MASTER_TABLES.map(renderMasterAdmin).join('')}
    </div>
  `
}

function renderProfilesAdmin() {
  const rows = state.cache.profiles.map((profile) => `
    <tr>
      <td>${escapeHTML(profile.email || '')}</td>
      <td>
        <input value="${escapeAttr(profile.display_name || '')}" data-profile-field="display_name" data-profile-id="${profile.id}">
      </td>
      <td>
        <select data-profile-field="role" data-profile-id="${profile.id}">
          ${['pending', 'admin', 'mkt', 'sale', 'cs', 'manager'].map((role) => `<option value="${role}" ${profile.role === role ? 'selected' : ''}>${roleLabel(role)}</option>`).join('')}
        </select>
      </td>
      <td>
        <select data-profile-field="is_active" data-profile-id="${profile.id}">
          <option value="true" ${profile.is_active ? 'selected' : ''}>ใช้งาน</option>
          <option value="false" ${!profile.is_active ? 'selected' : ''}>ปิดใช้งาน</option>
        </select>
      </td>
      <td><button class="btn small primary" type="button" data-action="save-profile" data-id="${profile.id}">บันทึก</button></td>
    </tr>
  `).join('')

  return `
    <div class="card">
      <h3>ผู้ใช้ / สิทธิ์</h3>
      <p class="card-subtitle">User ต้องถูกสร้างใน Supabase Auth ก่อน แล้ว Admin มากำหนด role/is_active ที่นี่</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>อีเมล</th><th>ชื่อแสดงผล</th><th>สิทธิ์</th><th>สถานะ</th><th></th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="empty">ยังไม่มีผู้ใช้</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `
}


function renderMasterAdmin(config) {
  const rows = (state.cache[config.key] || []).map((row) => `
    <tr>
      <td>${escapeHTML(row[config.nameField] || '')}</td>
      <td>${row.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}</td>
      <td>
        <button class="btn small" type="button" data-action="toggle-master" data-table="${config.table}" data-id="${row.id}" data-active="${row.is_active ? 'false' : 'true'}">
          ${row.is_active ? 'ปิดใช้' : 'เปิดใช้'}
        </button>
      </td>
    </tr>
  `).join('')

  return `
    <div class="card">
      <div class="section-head">
        <h3>${escapeHTML(config.label)}</h3>
        <button class="btn small primary" type="button" data-open-modal="create-master" data-table="${escapeAttr(config.table)}" data-name-field="${escapeAttr(config.nameField)}" data-label="${escapeAttr(config.label)}">+ เพิ่ม</button>
      </div>
      <div class="table-wrap" style="margin-top:12px">
        <table>
          <thead><tr><th>ชื่อ</th><th>สถานะ</th><th></th></tr></thead>
          <tbody>${rows || '<tr><td colspan="3" class="empty">ยังไม่มี master data</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `
}

function renderบัญชีDetail(accountId) {
  const account = state.cache.accounts.find((item) => item.id === accountId)
  if (!account) {
    return renderNotFound()
  }

  const activeTab = state.accountTabs[accountId] || 'overview'
  const tabs = [
    ['overview', 'ภาพรวม'],
    ['demo', 'เดโม'],
    ['training', 'อบรม'],
    ['customer', 'Customer'],
    ['tasks', 'งานติดตาม'],
    ['history', 'History']
  ]

  const contentByTab = {
    overview: `${renderบัญชีOverviewCard(account)}${renderผู้ติดต่อCard(account)}${renderActivitiesCard(account)}`,
    demo: renderDemoCard(account),
    training: renderTrainingCard(account),
    customer: renderCustomerCard(account),
    tasks: renderTasksCard(account),
    history: `${renderHistoryCard(account)}${renderActivitiesCard(account)}`
  }

  return `
    <div class="page-header">
      <div>
        <h2>${escapeHTML(accountTitle(account))}</h2>
        <p>${renderRunningNo(account)} ${badge(account.lifecycle_stage)} ${badge(account.lifecycle_status || '-')}</p>
      </div>
      <div class="actions">
        <button class="btn" type="button" data-nav="accounts">กลับ</button>
        <button class="btn" type="button" data-action="print">พิมพ์</button>
      </div>
    </div>

    <div class="tabs account-tabs" role="tablist" aria-label="บัญชี sections">
      ${tabs.map(([key, label]) => `
        <button class="tab ${activeTab === key ? 'active' : ''}" type="button" role="tab" aria-selected="${activeTab === key ? 'true' : 'false'}" data-account-tab="${key}" data-account-id="${account.id}">
          ${escapeHTML(label)}
        </button>
      `).join('')}
    </div>

    <div class="detail-layout">
      <div class="stack">
        ${contentByTab[activeTab] || contentByTab.overview}
      </div>
      <aside class="stack sticky-side">
        ${renderบัญชีActions(account)}
        ${renderบัญชีMeta(account)}
        ${activeTab !== 'history' ? renderHistoryCard(account) : ''}
      </aside>
    </div>
  `
}

function renderบัญชีOverviewCard(account) {
  return `
    <div class="card">
      <div class="section-head">
        <h3>บัญชี Overview</h3>
        ${!isReadOnly() ? `<button class="btn small primary" type="button" data-open-modal="account-overview" data-account-id="${account.id}">แก้ไขข้อมูล</button>` : ''}
      </div>
      <div class="meta-grid detail-meta">
        <div class="meta-label">ชื่อบริษัท</div><div>${escapeHTML(account.company_name || '-')}</div>
        <div class="meta-label">ชื่อย่อ</div><div>${escapeHTML(account.short_name || '-')}</div>
        <div class="meta-label">เลขผู้เสียภาษี</div><div>${escapeHTML(account.tax_id || '-')}</div>
        <div class="meta-label">จำนวนรถ</div><div>${escapeHTML(String(account.cars_estimate || '-'))}</div>
        <div class="meta-label">ช่องทาง</div><div>${escapeHTML(masterชื่อ('leadChannels', account.lead_channel_id))}</div>
        <div class="meta-label">แหล่งที่มา</div><div>${escapeHTML(masterชื่อ('leadประเภทs', account.lead_source_id))}</div>
        <div class="meta-label">แคมเปญ</div><div>${escapeHTML(masterชื่อ('campaigns', account.campaign_id))}</div>
        <div class="meta-label">ธุรกิจ</div><div>${escapeHTML(masterชื่อ('businessTypes', account.business_type_id))}</div>
        <div class="meta-label">GPS ปัจจุบัน</div><div>${escapeHTML(account.current_gps_provider || '-')}</div>
        <div class="meta-label">ที่อยู่</div><div>${escapeHTML(account.address || '-')}</div>
        <div class="meta-label">สถานะการติดต่อ</div><div>${escapeHTML(masterชื่อ('contactสถานะes', account.contact_status_id))}</div>
        <div class="meta-label">สินค้า</div><div>${escapeHTML(accountModuleชื่อs(account.id).join(', ') || '-')}</div>
        <div class="meta-label">รายละเอียด</div><div>${escapeHTML(account.product_interest || account.initial_note || '-')}</div>
      </div>
    </div>
  `
}

function renderบัญชีOverviewForm(account) {
  const disabled = isReadOnly() ? 'disabled' : ''
  return `
    <form class="card" data-form="account-overview" data-account-id="${account.id}">
      <h3>บัญชี Overview</h3>
      <div class="form-grid">
        ${inputField('company_name', 'ชื่อบริษัท', 'text', false, account.company_name || '', disabled)}
        ${inputField('short_name', 'ชื่อย่อ', 'text', false, account.short_name || '', disabled)}
        ${inputField('tax_id', 'เลขผู้เสียภาษี', 'text', false, account.tax_id || '', disabled)}
        ${inputField('cars_estimate', 'จำนวนรถ', 'number', false, account.cars_estimate || '', disabled)}
        ${selectField('lead_channel_id', 'ช่องทาง', state.cache.leadChannels, 'id', 'name', false, account.lead_channel_id || '', disabled)}
        ${selectField('lead_source_id', 'แหล่งที่มา Lead', state.cache.leadประเภทs, 'id', 'name', false, account.lead_source_id || '', disabled)}
        ${selectField('campaign_id', 'แคมเปญ', state.cache.campaigns, 'id', 'name', false, account.campaign_id || '', disabled)}
        ${selectField('business_type_id', 'ธุรกิจ', state.cache.businessTypes, 'id', 'name', false, account.business_type_id || '', disabled)}
        ${selectField('contact_status_id', 'สถานะการติดต่อ', state.cache.contactสถานะes, 'id', 'name', false, account.contact_status_id || '', disabled)}
        ${inputField('current_gps_provider', 'GPS ปัจจุบัน', 'text', false, account.current_gps_provider || '', disabled)}
        <div class="field full" data-field="address">
          <label>ที่อยู่</label>
          <textarea name="address" ${disabled}>${escapeHTML(account.address || '')}</textarea>
          <div class="field-error" data-field-error="address"></div>
        </div>
        ${multiSelectField('module_ids', 'สินค้า', state.cache.modules, 'id', 'module_name', accountModuleIds(account.id), disabled)}
        <div class="field full">
          <label>รายละเอียด / รายละเอียดความสนใจ</label>
          <textarea name="product_interest" ${disabled}>${escapeHTML(account.product_interest || account.initial_note || '')}</textarea>
        </div>
        <div class="full actions">
          <button class="btn primary" type="submit" ${disabled}>บันทึก Overview</button>
        </div>
      </div>
    </form>
  `
}


function renderผู้ติดต่อCard(account) {
  const contacts = state.cache.contacts.filter((c) => c.account_id === account.id)
  const rows = contacts.map((c) => `
    <tr>
      <td>${escapeHTML(c.contact_name || '-')}</td>
      <td>${escapeHTML(c.position || '-')}</td>
      <td>${escapeHTML([c.phone, c.phone_2, c.phone_3].filter(Boolean).join(', ') || '-')}</td>
      <td>${escapeHTML([c.email, c.email_2].filter(Boolean).join(', ') || '-')}</td>
      <td>${escapeHTML(c.contact_role || '-')}</td>
    </tr>
  `).join('')

  return `
    <div class="card">
      <div class="section-head">
        <h3>ผู้ติดต่อ</h3>
        ${!isReadOnly() ? `<button class="btn small primary" type="button" data-open-modal="add-contact" data-account-id="${account.id}">+ เพิ่ม Contact</button>` : ''}
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ชื่อ</th><th>ตำแหน่ง</th><th>เบอร์</th><th>อีเมล</th><th>สิทธิ์</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="empty">ยังไม่มีผู้ติดต่อ</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `
}


function renderActivitiesCard(account) {
  const activities = state.cache.activities
    .filter((a) => a.account_id === account.id)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))

  const items = activities.map((activity) => `
    <div class="list-item">
      <div class="list-title">
        <span>${escapeHTML(activity.title || activity.activity_type || 'หมายเหตุ')}</span>
        <span class="muted">${formatวันที่Time(activity.created_at)}</span>
      </div>
      <div class="list-meta">${escapeHTML(activity.content || '')}</div>
      ${activity.next_follow_up_at ? `<div>${badge('ติดตามต่อ: ' + formatวันที่Time(activity.next_follow_up_at))}</div>` : ''}
    </div>
  `).join('')

  return `
    <div class="card">
      <div class="section-head">
        <h3>Activities / หมายเหตุs</h3>
        ${!isReadOnly() ? `<button class="btn small primary" type="button" data-open-modal="add-activity" data-account-id="${account.id}">+ เพิ่ม บันทึก</button>` : ''}
      </div>
      <div class="list-view">${items || emptyState('ยังไม่มี activity', 'เพิ่ม note, call log หรือ follow-up เพื่อเก็บประวัติของ account นี้')}</div>
    </div>
  `
}


function renderDemoCard(account) {
  const demos = state.cache.demos.filter((d) => d.account_id === account.id)
  const demoRows = demos.map((demo) => `
    <tr>
      <td>${badge(demo.demo_status || '-')}</td>
      <td>${formatวันที่(demo.start_date)}</td>
      <td>${formatวันที่(demo.end_date)}</td>
      <td>${escapeHTML(demo.demo_result || '-')}</td>
      <td><button class="btn small" type="button" data-open-modal="edit-demo" data-demo-id="${demo.id}">Edit</button></td>
    </tr>
  `).join('')

  return `
    <div class="card">
      <div class="section-head">
        <h3>Demo</h3>
        ${!isReadOnly() && account.lifecycle_stage !== 'lost' ? `<button class="btn small primary" type="button" data-open-modal="request-demo" data-account-id="${account.id}">+ ขอเดโม</button>` : ''}
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>สถานะ</th><th>Start</th><th>End</th><th>ผลลัพธ์</th><th></th></tr></thead>
          <tbody>${demoRows || '<tr><td colspan="5" class="empty">ยังไม่มี Demo</td></tr>'}</tbody>
        </table>
      </div>
      ${demos.map(renderDemoDetail).join('')}
    </div>
  `
}


function renderDemoDetail(demo) {
  const users = state.cache.demoUsers.filter((u) => u.demo_session_id === demo.id)
  const logs = state.cache.demoLogs.filter((l) => l.demo_session_id === demo.id).slice(0, 6)

  return `
    <div class="card compact subcard">
      <div class="section-head">
        <h3>Demo Detail: ${formatวันที่(demo.start_date)} - ${formatวันที่(demo.end_date)}</h3>
        <div class="actions">
          ${!isReadOnly() ? `<button class="btn small" type="button" data-open-modal="edit-demo" data-demo-id="${demo.id}">แก้ไขเดโม</button>` : ''}
          ${!isReadOnly() ? `<button class="btn small primary" type="button" data-open-modal="add-demo-user" data-demo-id="${demo.id}" data-account-id="${demo.account_id}">+ Demo User</button>` : ''}
        </div>
      </div>
      <div class="meta-grid detail-meta">
        <div class="meta-label">สถานะ</div><div>${badge(demo.demo_status || '-')}</div>
        <div class="meta-label">ผลการ Demo</div><div>${escapeHTML(demo.demo_result || '-')}</div>
        <div class="meta-label">ความต้องการ</div><div>${escapeHTML(demo.requirement_note || '-')}</div>
        <div class="meta-label">ติดตามต่อ</div><div>${escapeHTML(demo.follow_up_note || '-')}</div>
      </div>

      <h3 style="margin-top:14px">Demo Users</h3>
      ${simpleRowsTable(['อีเมล', 'ชื่อ', 'รหัสผ่าน'], users.map((u) => [u.user_email || '-', u.user_name || '-', u.demo_password || '-']))}

      <h3 style="margin-top:14px">Demo Logs</h3>
      <div class="list-view">${logs.map((log) => `<div class="list-item"><div class="list-title">${escapeHTML(log.log_type || 'log')}<span class="muted">${formatวันที่Time(log.created_at)}</span></div><div class="list-meta">${escapeHTML(log.message || '')}</div></div>`).join('') || '<div class="empty">ยังไม่มี log</div>'}</div>
    </div>
  `
}

function renderRequestDemoForm(account) {
  if (account.lifecycle_stage === 'lost') return ''
  const csProfiles = state.cache.profiles.filter((p) => p.role === ROLES.CS && p.is_active)
  return `
    <form class="form-grid" style="margin-top:14px" data-form="request-demo" data-account-id="${account.id}">
      <h3 class="full">Request / Add Demo</h3>
      ${inputField('start_date', 'วันที่เริ่ม Demo', 'date', true)}
      ${inputField('end_date', 'วันที่สิ้นสุด Demo', 'date', true)}
      ${multiSelectField('module_ids', 'Module ที่ Demo', state.cache.modules, 'id', 'module_name')}
      ${multiSelectField('cs_owner_ids', 'CS ผู้รับผิดชอบs', csProfiles, 'id', 'display_name')}
      <div class="field full"><label>Demo หมายเหตุ</label><textarea name="requirement_note"></textarea></div>
      <div class="full actions"><button class="btn primary" type="submit">ขอเดโม</button></div>
    </form>
  `
}


function renderTrainingCard(account) {
  const trainings = state.cache.trainings.filter((t) => t.account_id === account.id)
  const rows = trainings.map((t) => [
    `#${t.session_no || '-'}`,
    t.training_phase || '-',
    formatวันที่(t.training_date),
    displayUser(t.trainer_id),
    t.status || '-',
    `<button class="btn small" type="button" data-nav="training">View</button>`
  ])

  return `
    <div class="card">
      <div class="section-head">
        <h3>Training</h3>
        ${!isReadOnly() ? `<button class="btn small primary" type="button" data-open-modal="add-training" data-account-id="${account.id}">+ เพิ่ม Training</button>` : ''}
      </div>
      ${simpleRowsTable(['ครั้งที่', 'ช่วงงาน', 'วันที่', 'ผู้สอน', 'สถานะ', ''], rows)}
      ${trainings.map((training) => renderTrainingSessionDetail(account, training)).join('')}
    </div>
  `
}


function renderTrainingSessionDetail(account, training) {
  const participants = state.cache.trainingParticipants.filter((p) => p.training_session_id === training.id)
  const participantRows = participants.map((p) => [
    p.participant_type || '-',
    p.participant_type === 'internal' ? displayUser(p.profile_id) : (p.name_snapshot || contactชื่อ(p.contact_id)),
    p.email_snapshot || contactอีเมล(p.contact_id) || '-',
    p.role_note || '-'
  ])

  return `
    <div class="card compact subcard">
      <div class="section-head">
        <h3>Training #${escapeHTML(training.session_no || '-')} Participants</h3>
        ${!isReadOnly() ? `<button class="btn small primary" type="button" data-open-modal="add-training-participant" data-training-id="${training.id}" data-account-id="${account.id}">+ Participant</button>` : ''}
      </div>
      ${simpleRowsTable(['Type', 'ชื่อ', 'อีเมล', 'สิทธิ์/หมายเหตุ'], participantRows)}
    </div>
  `
}

function renderTrainingForm(account) {
  const demos = state.cache.demos.filter((d) => d.account_id === account.id)
  const customer = state.cache.customers.find((c) => c.account_id === account.id)
  return `
    <form class="form-grid" style="margin-top:14px" data-form="add-training" data-account-id="${account.id}">
      ${selectStaticField('training_phase', 'ช่วงงาน', ['demo', 'customer'], true, account.lifecycle_stage === 'customer' ? 'customer' : 'demo')}
      ${inputField('session_no', 'ครั้งที่', 'number', false, '')}
      ${inputField('training_date', 'วันที่สอน', 'date', true, todayISO())}
      ${selectField('trainer_id', 'ผู้สอนฝั่งเรา', state.cache.profiles.filter((p) => p.role === ROLES.CS || p.role === ROLES.ADMIN), 'id', 'display_name', false, state.user.id)}
      ${selectField('demo_session_id', 'Demo Session', demos, 'id', 'start_date', false)}
      <input type="hidden" name="customer_profile_id" value="${customer?.id || ''}">
      ${selectStaticField('status', 'สถานะ', ['planned', 'done', 'cancelled'], true, 'planned')}
      <div class="field full"><label>รายละเอียดที่สอน</label><textarea name="training_detail" required></textarea></div>
      <div class="field full"><label>ปัญหา/คำถาม</label><textarea name="issue_note"></textarea></div>
      <div class="field full"><label>Next Action</label><textarea name="next_action"></textarea></div>
      <div class="full actions"><button class="btn primary" type="submit">เพิ่มอบรม</button></div>
    </form>
  `
}


function renderCustomerCard(account) {
  const customer = state.cache.customers.find((c) => c.account_id === account.id)
  if (!customer) {
    return `
      <div class="card">
        <div class="section-head">
          <h3>ข้อมูลลูกค้า</h3>
          ${!isReadOnly() ? `<button class="btn small primary" type="button" data-open-modal="customer-profile" data-account-id="${account.id}">+ บันทึก ข้อมูลลูกค้า</button>` : ''}
        </div>
        ${emptyState('ยังไม่มี ข้อมูลลูกค้า', 'เมื่อ account นี้เป็นลูกค้าแล้ว ให้บันทึกข้อมูลลูกค้า จำนวนรถ billing และ engagement ที่นี่')}
      </div>
    `
  }

  return `
    <div class="card">
      <div class="section-head">
        <h3>ข้อมูลลูกค้า</h3>
        ${!isReadOnly() ? `<button class="btn small primary" type="button" data-open-modal="customer-profile" data-account-id="${account.id}" data-customer-id="${customer.id}">แก้ไขลูกค้า</button>` : ''}
      </div>
      <div class="meta-grid detail-meta">
        <div class="meta-label">รหัสลูกค้า</div><div>${escapeHTML(customer.customer_code || '-')}</div>
        <div class="meta-label">ผู้รับผิดชอบ</div><div>${escapeHTML(displayUser(customer.owner_id))}</div>
        <div class="meta-label">จำนวนรถ</div><div>${escapeHTML(String(customer.cars || account.cars_estimate || '-'))}</div>
        <div class="meta-label">การใช้งาน</div><div>${escapeHTML(customer.functions || '-')}</div>
        <div class="meta-label">Start</div><div>${formatวันที่(customer.start_date)}</div>
        <div class="meta-label">รอบบิล</div><div>${formatวันที่(customer.billing_date)}</div>
        <div class="meta-label">ระดับการใช้งาน</div><div>${badge(customer.engagement_level || '-')}</div>
        <div class="meta-label">สถานะ</div><div>${badge(customer.customer_status || '-')}</div>
        <div class="meta-label">หมายเหตุ</div><div>${escapeHTML(customer.note || '-')}</div>
      </div>
    </div>
  `
}


function renderTasksCard(account) {
  const tasks = state.cache.tasks.filter((t) => t.account_id === account.id)
  return `
    <div class="card">
      <div class="section-head">
        <h3>Tasks</h3>
        ${!isReadOnly() ? `<button class="btn small primary" type="button" data-open-modal="add-task" data-account-id="${account.id}">+ เพิ่ม Task</button>` : ''}
      </div>
      ${renderTaskList(tasks, false)}
    </div>
  `
}

function renderTaskForm(account) {
  const demos = state.cache.demos.filter((d) => d.account_id === account.id)
  return `
    <form class="form-grid" style="margin-top:14px" data-form="add-task" data-account-id="${account.id}">
      ${inputField('title', 'หัวข้องาน', 'text', true)}
      ${selectField('demo_session_id', 'Demo Session', demos, 'id', 'start_date', false)}
      ${selectStaticField('task_type', 'ประเภทงาน', ['follow_up', 'onboarding', 'support', 'renewal', 'issue', 'other'], true, 'follow_up')}
      ${selectStaticField('priority', 'ความสำคัญ', ['low', 'medium', 'high', 'urgent'], true, 'medium')}
      ${selectField('assigned_to', 'ผู้รับผิดชอบ', state.cache.profiles.filter((p) => p.is_active), 'id', 'display_name', true, state.user.id)}
      ${inputField('due_at', 'กำหนด วันที่', 'datetime-local', false)}
      <div class="field full"><label>รายละเอียด</label><textarea name="description"></textarea></div>
      <div class="full actions"><button class="btn primary" type="submit">เพิ่มงาน</button></div>
    </form>
  `
}

function renderTaskList(tasks, compact) {
  if (!tasks.length) return '<div class="empty">ยังไม่มี task</div>'
  const rows = tasks.map((task) => `
    <div class="list-item">
      <div class="list-title">
        <span>${escapeHTML(task.title || '-')}</span>
        <span>${badge(task.status || 'open')} ${badge(task.priority || 'medium')}</span>
      </div>
      <div class="list-meta">
        บัญชี: ${escapeHTML(accountTitle(findบัญชี(task.account_id)))}<br>
        ผู้รับผิดชอบ: ${escapeHTML(displayUser(task.assigned_to))} · กำหนด: ${formatวันที่Time(task.due_at)}
      </div>
      ${compact ? '' : `<div class="actions"><button class="btn small" type="button" data-action="mark-task-done" data-id="${task.id}">Done</button><button class="btn small" type="button" data-nav-account="${task.account_id}">เปิด บัญชี</button></div>`}
    </div>
  `).join('')
  return `<div class="list-view">${rows}</div>`
}


function renderบัญชีActions(account) {
  if (isReadOnly()) return ''
  const canConvert = account.lifecycle_stage !== 'customer' && account.lifecycle_stage !== 'lost'
  const canLost = account.lifecycle_stage !== 'lost'
  return `
    <div class="card">
      <h3>Actions</h3>
      <div class="actions">
        ${canConvert ? `<button class="btn primary" type="button" data-action="convert-customer" data-id="${account.id}">เปลี่ยนเป็นลูกค้า</button>` : ''}
        ${canLost ? `<button class="btn danger" type="button" data-open-modal="mark-lost" data-account-id="${account.id}">ปิดเป็น Lost</button>` : ''}
      </div>
    </div>
  `
}


function renderLostForm(account) {
  return `
    <form class="form-grid single" data-form="mark-lost" data-account-id="${account.id}" novalidate>
      <div class="callout warning">การ ปิดเป็น Lost จะเปลี่ยน stage ของ account นี้ และบันทึกเหตุผลไว้ในประวัติ</div>
      ${selectField('lost_reason_id', 'Lost Reason', state.cache.lostReasons, 'id', 'reason_name', true)}
      <div class="field"><label>Lost หมายเหตุ *</label><textarea name="lost_note" required></textarea><div class="field-error" data-field-error="lost_note"></div></div>
      <button class="btn danger" type="submit">ยืนยันปิด Lost</button>
    </form>
  `
}

function renderบัญชีMeta(account) {
  const contacts = state.cache.contacts.filter((c) => c.account_id === account.id)
  const csผู้รับผิดชอบs = state.cache.accountCsผู้รับผิดชอบs.filter((o) => o.account_id === account.id).map((o) => displayUser(o.cs_user_id)).join(', ') || '-'
  return `
    <div class="card">
      <h3>Meta</h3>
      <div class="meta-grid">
        <div class="meta-label">เลข MKT</div><div>${renderRunningNo(account)}</div>
        <div class="meta-label">ประเภท</div><div>${escapeHTML(account.source_type || '-')}</div>
        <div class="meta-label">Sale ผู้รับผิดชอบ</div><div>${escapeHTML(displayUser(account.sale_owner_id))}</div>
        <div class="meta-label">CS ผู้รับผิดชอบs</div><div>${escapeHTML(csผู้รับผิดชอบs)}</div>
        <div class="meta-label">ช่องทาง</div><div>${escapeHTML(masterชื่อ('leadChannels', account.lead_channel_id))}</div>
        <div class="meta-label">แหล่งที่มา</div><div>${escapeHTML(masterชื่อ('leadประเภทs', account.lead_source_id))}</div>
        <div class="meta-label">แคมเปญ</div><div>${escapeHTML(masterชื่อ('campaigns', account.campaign_id))}</div>
        <div class="meta-label">ธุรกิจ</div><div>${escapeHTML(masterชื่อ('businessTypes', account.business_type_id))}</div>
        <div class="meta-label">ผู้ติดต่อ</div><div>${contacts.length}</div>
        <div class="meta-label">สร้างเมื่อ</div><div>${formatวันที่Time(account.created_at)}</div>
        <div class="meta-label">อัปเดต</div><div>${formatวันที่Time(account.updated_at)}</div>
      </div>
    </div>
  `
}

function renderHistoryCard(account) {
  const rows = state.cache.statusHistory
    .filter((h) => h.account_id === account.id)
    .slice(0, 12)
    .map((h) => [formatวันที่Time(h.created_at), `${h.from_stage || '-'} → ${h.to_stage || '-'}`, displayUser(h.changed_by), h.reason || '-'])
  return `
    <div class="card">
      <h3>สถานะ History</h3>
      ${simpleRowsTable(['วันที่', 'Stage', 'By', 'Reason'], rows)}
    </div>
  `
}

function renderViewSwitcher(key) {
  const mode = state.viewModes[key] || 'table'
  const modes = ['board', 'calendar', 'list', 'table', 'timeline']
  return `
    <div class="view-switcher">
      ${modes.map((item) => `<button class="view-btn ${mode === item ? 'active' : ''}" type="button" data-view-key="${key}" data-view-mode="${item}">${viewLabel(item)}</button>`).join('')}
    </div>
  `
}

function renderบัญชีsCollection(items, key) {
  const prepared = prepareCollection(items, key, 'accounts')
  const mode = state.viewModes[key] || 'table'
  let body = ''
  if (mode === 'board') body = renderบัญชีBoard(prepared.items, key)
  else if (mode === 'calendar') body = renderบัญชีCalendar(prepared.items)
  else if (mode === 'list') body = renderบัญชีList(prepared.items)
  else if (mode === 'timeline') body = renderบัญชีTimeline(prepared.items)
  else body = renderบัญชีTable(prepared.items)

  return `
    ${renderCollectionToolbar(key, 'accounts', items.length, prepared.total)}
    ${body}
    ${renderPagination(key, prepared)}
  `
}

function renderTaskCollection(items, key) {
  const prepared = prepareCollection(items, key, 'tasks')
  const mode = state.viewModes[key] || 'board'
  let body = ''
  if (mode === 'board') body = renderTaskBoard(prepared.items)
  else if (mode === 'calendar') body = renderCalendarEvents(prepared.items.map((task) => ({ date: datePart(task.due_at), title: `Task: ${task.title}`, accountId: task.account_id })))
  else if (mode === 'timeline') body = renderTimelineEvents(prepared.items.map((task) => ({ title: task.title, start: datePart(task.created_at), end: datePart(task.due_at), accountId: task.account_id })))
  else if (mode === 'list') body = renderTaskList(prepared.items, false)
  else body = renderTaskTable(prepared.items)

  return `
    ${renderCollectionToolbar(key, 'tasks', items.length, prepared.total)}
    ${body}
    ${renderPagination(key, prepared)}
  `
}

function renderTrainingCollection(items, key) {
  const prepared = prepareCollection(items, key, 'training')
  const mode = state.viewModes[key] || 'calendar'
  let body = ''
  if (mode === 'calendar') body = renderCalendarEvents(prepared.items.map((t) => ({ date: t.training_date, title: `Training #${t.session_no}: ${accountTitle(findบัญชี(t.account_id))}`, accountId: t.account_id })))
  else if (mode === 'timeline') body = renderTimelineEvents(prepared.items.map((t) => ({ title: `Training #${t.session_no}: ${accountTitle(findบัญชี(t.account_id))}`, start: t.training_date, end: t.training_date, accountId: t.account_id })))
  else if (mode === 'board') body = renderTrainingBoard(prepared.items)
  else if (mode === 'list') body = renderTrainingList(prepared.items)
  else body = renderTrainingTable(prepared.items)

  return `
    ${renderCollectionToolbar(key, 'training', items.length, prepared.total)}
    ${body}
    ${renderPagination(key, prepared)}
  `
}

function renderCollectionToolbar(key, type, rawTotal, filteredTotal) {
  const filter = getFilter(key)
  const owners = state.cache.profiles.filter((p) => p.is_active || p.role !== ROLES.PENDING)
  return `
    <div class="filter-panel" data-filter-panel="${key}">
      <div class="filter-row">
        <label class="search-field">
          <span>ค้นหา</span>
          <input type="search" value="${escapeAttr(filter.q || '')}" data-filter-control data-filter-key="${key}" data-filter-name="q" placeholder="ค้นหาเลข MKT, บริษัท, ผู้ติดต่อ, เบอร์, อีเมล">
        </label>
        ${type === 'accounts' ? selectFilter(key, 'stage', 'Stage', [['', 'ทั้งหมด'], ['lead', 'Lead'], ['demo', 'เดโม'], ['customer', 'Customer'], ['lost', 'Lost']], filter.stage || '') : ''}
        ${type === 'accounts' || type === 'tasks' || type === 'training' ? selectFilter(key, 'status', 'สถานะ', filterOptionsFor(type, key, 'status'), filter.status || '') : ''}
        ${selectFilter(key, 'owner', 'ผู้รับผิดชอบ', [['', 'ทุกคน']].concat(owners.map((p) => [p.id, displayUser(p.id)])), filter.owner || '')}
      </div>
      <div class="filter-row secondary">
        ${type === 'accounts' ? selectFilter(key, 'channel', 'ช่องทาง', [['', 'ทุกช่องทาง']].concat(state.cache.leadChannels.map((r) => [r.id, r.name])), filter.channel || '') : ''}
        ${type === 'accounts' ? selectFilter(key, 'source', 'แหล่งที่มา', [['', 'ทุกแหล่ง']].concat(state.cache.leadประเภทs.map((r) => [r.id, r.name])), filter.source || '') : ''}
        ${type === 'accounts' ? selectFilter(key, 'campaign', 'แคมเปญ', [['', 'ทุกแคมเปญ']].concat(state.cache.campaigns.map((r) => [r.id, r.name])), filter.campaign || '') : ''}
        ${type === 'accounts' ? selectFilter(key, 'businessType', 'ธุรกิจ', [['', 'ทุกธุรกิจ']].concat(state.cache.businessTypes.map((r) => [r.id, r.name])), filter.businessType || '') : ''}
        ${type === 'tasks' ? selectFilter(key, 'priority', 'ความสำคัญ', [['', 'ทุก ความสำคัญ'], ['low', 'low'], ['medium', 'medium'], ['high', 'high'], ['urgent', 'urgent']], filter.priority || '') : ''}
        ${selectFilter(key, 'sort', 'Sort', sortOptionsFor(type), filter.sort || '')}
        ${selectFilter(key, 'pageSize', 'Rows', [['10', '10'], ['25', '25'], ['50', '50'], ['100', '100']], String(filter.pageSize || 25))}
        <button class="btn small" type="button" data-action="clear-filters" data-filter-key="${key}">Clear</button>
        <span class="result-count">แสดง ${filteredTotal} จาก ${rawTotal} รายการ</span>
      </div>
    </div>
  `
}

function selectFilter(key, name, label, options, selected) {
  return `
    <label class="filter-control">
      <span>${escapeHTML(label)}</span>
      <select data-filter-control data-filter-key="${key}" data-filter-name="${name}">
        ${options.map(([value, text]) => `<option value="${escapeAttr(value)}" ${String(selected) === String(value) ? 'selected' : ''}>${escapeHTML(text)}</option>`).join('')}
      </select>
    </label>
  `
}

function filterOptionsFor(type, key, name) {
  if (type === 'tasks') return [['', 'ทุกสถานะ'], ['open', 'open'], ['in_progress', 'in_progress'], ['blocked', 'blocked'], ['done', 'done'], ['cancelled', 'cancelled']]
  if (type === 'training') return [['', 'ทุกสถานะ'], ['planned', 'planned'], ['done', 'done'], ['cancelled', 'cancelled']]
  return [['', 'ทุกสถานะ'], ['new', 'new'], ['assigned', 'assigned'], ['contacted', 'contacted'], ['follow_up', 'follow_up'], ['demo_requested', 'demo_requested'], ['customer_active', 'customer_active'], ['lost', 'lost'], ['churned', 'churned']]
}

function sortOptionsFor(type) {
  if (type === 'tasks') return [['due_asc', 'กำหนด date ใกล้สุด'], ['updated_desc', 'อัปเดตล่าสุด'], ['priority_desc', 'ความสำคัญ สูงสุด']]
  if (type === 'training') return [['date_asc', 'วันที่ใกล้สุด'], ['updated_desc', 'อัปเดตล่าสุด']]
  return [['updated_desc', 'อัปเดตล่าสุด'], ['created_desc', 'สร้างล่าสุด'], ['running_asc', 'เลข MKT น้อยไปมาก'], ['name_asc', 'ชื่อ A-Z']]
}

function prepareCollection(items, key, type) {
  const filter = getFilter(key)
  let rows = filterCollection(items, filter, type)
  rows = sortCollection(rows, filter.sort, type)
  const total = rows.length
  const pageSize = Math.max(1, Number(filter.pageSize || 25))
  const maxPage = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, Number(filter.page || 1)), maxPage)
  filter.page = page
  filter.pageSize = pageSize
  const start = (page - 1) * pageSize
  return {
    items: rows.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    maxPage
  }
}


function getFilter(key) {
  if (!state.filters[key]) {
    state.filters[key] = defaultFilter(key)
  }
  return state.filters[key]
}


function defaultFilter(key) {
  if (key === 'leads') return { q: '', stage: 'lead', status: '', owner: '', channel: '', source: '', campaign: '', businessType: '', sort: 'updated_desc', page: 1, pageSize: 25 }
  if (key === 'accounts') return { q: '', stage: '', status: '', owner: '', channel: '', source: '', campaign: '', businessType: '', sort: 'updated_desc', page: 1, pageSize: 25 }
  if (key === 'tasks') return { q: '', status: '', owner: '', priority: '', sort: 'due_asc', page: 1, pageSize: 25 }
  if (key === 'training') return { q: '', status: '', owner: '', sort: 'date_asc', page: 1, pageSize: 25 }
  if (key === 'demo' || key === 'customers') return { q: '', status: '', owner: '', sort: 'updated_desc', page: 1, pageSize: 25 }
  return { q: '', sort: 'updated_desc', page: 1, pageSize: 25 }
}

function filterCollection(items, filter, type) {
  const q = String(filter.q || '').trim().toLowerCase()
  return items.filter((item) => {
    if (q && !matchesSearch(item, q, type)) return false
    if (filter.stage && item.lifecycle_stage !== filter.stage) return false
    if (filter.status) {
      const status = item.lifecycle_status || item.status || item.demo_status || item.customer_status
      if (status !== filter.status) return false
    }
    if (filter.owner) {
      const ownerFields = [item.sale_owner_id, item.assigned_to, item.trainer_id, item.owner_id, item.cs_owner_id]
      if (!ownerFields.includes(filter.owner)) return false
    }
    if (filter.channel && item.lead_channel_id !== filter.channel) return false
    if (filter.source && item.lead_source_id !== filter.source) return false
    if (filter.campaign && item.campaign_id !== filter.campaign) return false
    if (filter.businessType && item.business_type_id !== filter.businessType) return false
    if (filter.priority && item.priority !== filter.priority) return false
    return true
  })
}

function matchesSearch(item, q, type) {
  const account = type === 'tasks' || type === 'training' ? findบัญชี(item.account_id) : item
  const contacts = account?.id ? state.cache.contacts.filter((c) => c.account_id === account.id) : []
  const haystack = [
    account?.running_no,
    account?.company_name,
    account?.short_name,
    account?.tax_id,
    account?.address,
    account?.current_gps_provider,
    masterชื่อ('leadChannels', account?.lead_channel_id),
    masterชื่อ('businessTypes', account?.business_type_id),
    account?.initial_note,
    account?.product_interest,
    item.title,
    item.description,
    item.training_detail,
    item.issue_note,
    ...contacts.flatMap((c) => [c.contact_name, c.position, c.email, c.email_2, c.phone, c.phone_2, c.phone_3])
  ].filter(Boolean).join(' ').toLowerCase()
  return haystack.includes(q)
}

function sortCollection(rows, sort, type) {
  const copy = rows.slice()
  copy.sort((a, b) => {
    if (sort === 'created_desc') return String(b.created_at || '').localeCompare(String(a.created_at || ''))
    if (sort === 'running_asc') return Number(a.running_no || 999999999) - Number(b.running_no || 999999999)
    if (sort === 'name_asc') return accountTitle(a).localeCompare(accountTitle(b), 'th')
    if (sort === 'due_asc') return String(a.due_at || '9999').localeCompare(String(b.due_at || '9999'))
    if (sort === 'date_asc') return String(a.training_date || '9999').localeCompare(String(b.training_date || '9999'))
    if (sort === 'priority_desc') return priorityWeight(b.priority) - priorityWeight(a.priority)
    return String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || ''))
  })
  return copy
}

function priorityWeight(priority) {
  return { urgent: 4, high: 3, medium: 2, low: 1 }[priority] || 0
}

function renderPagination(key, prepared) {
  if (prepared.total <= prepared.pageSize) return ''
  return `
    <div class="pagination">
      <button class="btn small" type="button" data-page-key="${key}" data-page-delta="-1" ${prepared.page <= 1 ? 'disabled' : ''}>ก่อนหน้า</button>
      <span>หน้า ${prepared.page} / ${prepared.maxPage}</span>
      <button class="btn small" type="button" data-page-key="${key}" data-page-delta="1" ${prepared.page >= prepared.maxPage ? 'disabled' : ''}>ถัดไป</button>
    </div>
  `
}

function renderบัญชีTable(items) {
  if (!items.length) return emptyState('ไม่พบข้อมูล', 'ลองเปลี่ยนคำค้นหา หรือล้าง filter เพื่อดูรายการทั้งหมด')
  const rows = items.map((a) => `
    <tr>
      <td>${renderRunningNo(a)}</td>
      <td><button class="btn small" type="button" data-nav-account="${a.id}">${escapeHTML(accountTitle(a))}</button></td>
      <td>${badge(a.lifecycle_stage)}</td>
      <td>${badge(a.lifecycle_status || '-')}</td>
      <td>${escapeHTML(displayUser(a.sale_owner_id))}</td>
      <td>${escapeHTML(masterชื่อ('leadChannels', a.lead_channel_id))}</td>
      <td>${escapeHTML(masterชื่อ('campaigns', a.campaign_id))}</td>
      <td>${escapeHTML(masterชื่อ('businessTypes', a.business_type_id))}</td>
      <td>${escapeHTML(String(a.cars_estimate || '-'))}</td>
      <td>${formatวันที่Time(a.updated_at)}</td>
    </tr>
  `).join('')

  return `
    <div class="table-wrap responsive-table">
      <table>
        <thead>
          <tr><th>No.</th><th>บัญชี</th><th>Stage</th><th>สถานะ</th><th>Sale</th><th>ช่องทาง</th><th>แคมเปญ</th><th>ธุรกิจ</th><th>จำนวนรถ</th><th>อัปเดต</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

function renderบัญชีList(items) {
  if (!items.length) return emptyState('ไม่พบข้อมูล', 'ยังไม่มีรายการที่ตรงกับเงื่อนไขนี้')
  return `
    <div class="list-view">
      ${items.map((a) => `
        <div class="list-item">
          <div class="list-title">
            <span>${escapeHTML(accountTitle(a))}</span>
            <span>${badge(a.lifecycle_stage)} ${badge(a.lifecycle_status || '-')}</span>
          </div>
          <div class="list-meta">
            ${renderRunningNo(a)} · Sale: ${escapeHTML(displayUser(a.sale_owner_id))} · จำนวนรถ: ${escapeHTML(String(a.cars_estimate || '-'))}<br>
            ช่องทาง: ${escapeHTML(masterชื่อ('leadChannels', a.lead_channel_id))} · แคมเปญ: ${escapeHTML(masterชื่อ('campaigns', a.campaign_id))} · ธุรกิจ: ${escapeHTML(masterชื่อ('businessTypes', a.business_type_id))}
          </div>
          <div class="actions"><button class="btn small" type="button" data-nav-account="${a.id}">เปิด</button></div>
        </div>
      `).join('')}
    </div>
  `
}

function renderบัญชีBoard(items, key) {
  const groupBy = key === 'tasks' ? 'status' : 'lifecycle_stage'
  const groups = groupRows(items, groupBy)
  const preferred = key === 'demo' ? ['demo'] : ['lead', 'demo', 'customer', 'lost']
  const keys = Array.from(new Set(preferred.concat(Object.keys(groups))))

  return `
    <div class="board">
      ${keys.map((group) => `
        <div class="board-column">
          <div class="board-title"><span>${escapeHTML(STAGE_LABELS[group] || STATUS_LABELS[group] || group)}</span><span>${groups[group]?.length || 0}</span></div>
          ${(groups[group] || []).map((a) => `
            <div class="board-card">
              <strong>${escapeHTML(accountTitle(a))}</strong>
              <div class="list-meta">${renderRunningNo(a)} · ${escapeHTML(displayUser(a.sale_owner_id))}</div>
              <div style="margin-top:8px">${badge(a.lifecycle_status || '-')}</div>
              <div class="actions" style="margin-top:10px"><button class="btn small" type="button" data-nav-account="${a.id}">เปิด</button></div>
            </div>
          `).join('') || '<div class="empty compact-empty">ว่าง</div>'}
        </div>
      `).join('')}
    </div>
  `
}

function renderบัญชีCalendar(items) {
  const events = []
  items.forEach((account) => {
    state.cache.demos.filter((d) => d.account_id === account.id).forEach((demo) => {
      events.push({ date: demo.start_date, title: `Demo Start: ${accountTitle(account)}`, accountId: account.id })
      events.push({ date: demo.end_date, title: `Demo End: ${accountTitle(account)}`, accountId: account.id })
    })
    const customer = state.cache.customers.find((c) => c.account_id === account.id)
    if (customer?.billing_date) events.push({ date: customer.billing_date, title: `รอบบิล: ${accountTitle(account)}`, accountId: account.id })
  })
  return renderCalendarEvents(events)
}

function renderบัญชีTimeline(items) {
  const rows = []
  items.forEach((account) => {
    state.cache.demos.filter((d) => d.account_id === account.id).forEach((demo) => {
      rows.push({ title: `Demo: ${accountTitle(account)}`, start: demo.start_date, end: demo.end_date, accountId: account.id })
    })
    const customer = state.cache.customers.find((c) => c.account_id === account.id)
    if (customer?.start_date) {
      rows.push({ title: `Customer: ${accountTitle(account)}`, start: customer.start_date, end: customer.billing_date || customer.start_date, accountId: account.id })
    }
  })
  return renderTimelineEvents(rows)
}

function renderTaskBoard(items) {
  const groups = groupRows(items, 'status')
  const keys = ['open', 'in_progress', 'blocked', 'done', 'cancelled']
  return `
    <div class="board">
      ${keys.map((group) => `
        <div class="board-column">
          <div class="board-title"><span>${escapeHTML(group)}</span><span>${groups[group]?.length || 0}</span></div>
          ${(groups[group] || []).map((task) => `
            <div class="board-card">
              <strong>${escapeHTML(task.title || '-')}</strong>
              <div class="list-meta">${escapeHTML(accountTitle(findบัญชี(task.account_id)))}<br>กำหนด: ${formatวันที่Time(task.due_at)}</div>
              <div style="margin-top:8px">${badge(task.priority || 'medium')}</div>
              <div class="actions" style="margin-top:10px"><button class="btn small" type="button" data-action="mark-task-done" data-id="${task.id}">Done</button><button class="btn small" type="button" data-nav-account="${task.account_id}">เปิด</button></div>
            </div>
          `).join('') || '<div class="empty compact-empty">ว่าง</div>'}
        </div>
      `).join('')}
    </div>
  `
}

function renderTaskTable(items) {
  if (!items.length) return emptyState('ไม่มี task', 'ยังไม่มีงานที่ตรงกับเงื่อนไขนี้')
  const rows = items.map((task) => `
    <tr>
      <td>${escapeHTML(task.title || '-')}</td>
      <td>${escapeHTML(accountTitle(findบัญชี(task.account_id)))}</td>
      <td>${badge(task.status || 'open')}</td>
      <td>${badge(task.priority || 'medium')}</td>
      <td>${escapeHTML(displayUser(task.assigned_to))}</td>
      <td>${formatวันที่Time(task.due_at)}</td>
      <td><button class="btn small" type="button" data-nav-account="${task.account_id}">เปิด</button></td>
    </tr>
  `).join('')
  return `<div class="table-wrap responsive-table"><table><thead><tr><th>Task</th><th>บัญชี</th><th>สถานะ</th><th>ความสำคัญ</th><th>ผู้รับผิดชอบ</th><th>กำหนด</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
}

function renderTrainingBoard(items) {
  const groups = groupRows(items, 'status')
  const keys = ['planned', 'done', 'cancelled']
  return `<div class="board">${keys.map((key) => `<div class="board-column"><div class="board-title"><span>${key}</span><span>${groups[key]?.length || 0}</span></div>${(groups[key] || []).map(renderTrainingCardItem).join('') || '<div class="empty compact-empty">ว่าง</div>'}</div>`).join('')}</div>`
}

function renderTrainingList(items) {
  if (!items.length) return emptyState('ไม่มี Training', 'ยังไม่มี session ที่ตรงกับเงื่อนไขนี้')
  return `<div class="list-view">${items.map(renderTrainingCardItem).join('')}</div>`
}

function renderTrainingCardItem(t) {
  return `
    <div class="board-card">
      <strong>#${t.session_no || '-'} ${escapeHTML(accountTitle(findบัญชี(t.account_id)))}</strong>
      <div class="list-meta">${escapeHTML(t.training_phase || '-')} · ${formatวันที่(t.training_date)} · ผู้สอน: ${escapeHTML(displayUser(t.trainer_id))}</div>
      <div style="margin-top:8px">${badge(t.status || '-')}</div>
      <div class="actions" style="margin-top:10px"><button class="btn small" type="button" data-nav-account="${t.account_id}">เปิด</button></div>
    </div>
  `
}

function renderTrainingTable(items) {
  if (!items.length) return emptyState('ไม่มี Training', 'ยังไม่มี session ที่ตรงกับเงื่อนไขนี้')
  const rows = items.map((t) => `
    <tr>
      <td>#${t.session_no || '-'}</td>
      <td>${escapeHTML(accountTitle(findบัญชี(t.account_id)))}</td>
      <td>${escapeHTML(t.training_phase || '-')}</td>
      <td>${formatวันที่(t.training_date)}</td>
      <td>${escapeHTML(displayUser(t.trainer_id))}</td>
      <td>${badge(t.status || '-')}</td>
      <td><button class="btn small" type="button" data-nav-account="${t.account_id}">เปิด</button></td>
    </tr>
  `).join('')
  return `<div class="table-wrap responsive-table"><table><thead><tr><th>ครั้งที่</th><th>บัญชี</th><th>ช่วงงาน</th><th>วันที่</th><th>ผู้สอน</th><th>สถานะ</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
}

function renderCalendarEvents(events) {
  const validEvents = events.filter((event) => event.date).sort((a, b) => String(a.date).localeCompare(String(b.date)))
  if (!validEvents.length) return emptyState('ไม่มี event ใน calendar', 'ลองเปลี่ยน filter หรือเพิ่มวันนัดหมาย/กำหนดงาน')
  const groups = groupRows(validEvents, 'date')
  return `
    <div class="calendar">
      ${Object.keys(groups).sort().map((date) => `
        <div class="calendar-day">
          <div class="calendar-date">${formatวันที่(date)}</div>
          <div class="list-view">
            ${groups[date].map((event) => `<div class="list-item"><div class="list-title">${escapeHTML(event.title || '-')}</div><div class="actions"><button class="btn small" type="button" data-nav-account="${event.accountId}">เปิด</button></div></div>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `
}

function renderTimelineEvents(rows) {
  const validRows = rows.filter((row) => row.start || row.end)
  if (!validRows.length) return emptyState('ไม่มีข้อมูล timeline', 'Timeline จะแสดงเมื่อมี start/end date หรือ due date')
  return `
    <div class="timeline">
      ${validRows.map((row) => `
        <div class="timeline-row">
          <div class="list-title">
            <span>${escapeHTML(row.title || '-')}</span>
            <span class="muted">${formatวันที่(row.start)} → ${formatวันที่(row.end)}</span>
          </div>
          <div class="timeline-track"><div class="timeline-bar" style="width:${timelineWidth(row.start, row.end)}%"></div></div>
          <div class="actions" style="margin-top:10px"><button class="btn small" type="button" data-nav-account="${row.accountId}">เปิด</button></div>
        </div>
      `).join('')}
    </div>
  `
}


function renderAddContactForm(account) {
  return `
    <form class="form-grid" data-form="add-contact" data-account-id="${account.id}" novalidate>
      ${inputField('contact_name', 'ชื่อผู้ติดต่อ', 'text', true)}
      ${inputField('position', 'ตำแหน่ง', 'text', false)}
      ${inputField('phone', 'เบอร์หลัก', 'text', false)}
      ${inputField('phone_2', 'เบอร์ 2', 'text', false)}
      ${inputField('phone_3', 'เบอร์ 3', 'text', false)}
      ${inputField('email', 'อีเมล', 'email', false)}
      ${inputField('email_2', 'อีเมล 2', 'email', false)}
      ${selectStaticField('contact_role', 'สิทธิ์', ['primary', 'billing', 'technical', 'user', 'decision_maker', 'other'], false, 'primary')}
      <div class="full actions"><button class="btn primary" type="submit">เพิ่มผู้ติดต่อ</button></div>
    </form>
  `
}

function renderAddบันทึกForm(account) {
  return `
    <form class="form-grid" data-form="add-activity" data-account-id="${account.id}" novalidate>
      ${selectStaticField('activity_type', 'Type', ['note', 'call', 'follow_up', 'mkt_update', 'sale_update', 'cs_update'], false)}
      ${inputField('title', 'Title', 'text', false)}
      <div class="field full"><label>Content *</label><textarea name="content" required></textarea><div class="field-error" data-field-error="content"></div></div>
      ${inputField('next_follow_up_at', 'Next ติดตามต่อ', 'datetime-local', false)}
      <div class="full actions"><button class="btn primary" type="submit">เพิ่มบันทึก</button></div>
    </form>
  `
}

function renderUpdateDemoForm(demo) {
  const disabled = isReadOnly() ? 'disabled' : ''
  return `
    <form class="form-grid" data-form="update-demo" data-demo-id="${demo.id}" novalidate>
      ${selectStaticField('demo_status', 'Demo สถานะ', ['requested', 'active', 'extended', 'ended', 'cancelled', 'converted', 'lost'], true, demo.demo_status || 'requested', disabled)}
      ${inputField('start_date', 'วันที่เริ่ม', 'date', false, demo.start_date || '', disabled)}
      ${inputField('end_date', 'วันที่สิ้นสุด', 'date', false, demo.end_date || '', disabled)}
      <div class="field full"><label>ผลการ Demo</label><textarea name="demo_result" ${disabled}>${escapeHTML(demo.demo_result || '')}</textarea></div>
      <div class="field full"><label>ความต้องการ</label><textarea name="requirement_note" ${disabled}>${escapeHTML(demo.requirement_note || '')}</textarea></div>
      <div class="field full"><label>ติดตามต่อ หมายเหตุ</label><textarea name="follow_up_note" ${disabled}>${escapeHTML(demo.follow_up_note || '')}</textarea></div>
      <div class="full actions"><button class="btn primary" type="submit" ${disabled}>บันทึก Demo</button></div>
    </form>
  `
}

function renderAddDemoUserForm(demoId, accountId) {
  return `
    <form class="form-grid" data-form="add-demo-user" data-demo-id="${demoId}" data-account-id="${accountId}" novalidate>
      ${inputField('user_email', 'อีเมลผู้ใช้งาน', 'email', true)}
      ${inputField('user_name', 'ชื่อผู้ใช้งาน', 'text', false)}
      ${inputField('demo_password', 'รหัสผ่าน Demo', 'text', false)}
      <div class="full actions"><button class="btn primary" type="submit">เพิ่มผู้ใช้เดโม</button></div>
    </form>
  `
}

function renderAddTrainingParticipantForm(training, account) {
  const contacts = state.cache.contacts.filter((c) => c.account_id === account?.id)
  return `
    <form class="form-grid" data-form="add-training-participant" data-training-id="${training.id}" novalidate>
      ${selectStaticField('participant_type', 'Participant Type', ['internal', 'customer'], true, 'customer')}
      ${selectField('profile_id', 'ทีมเรา', state.cache.profiles.filter((p) => p.is_active), 'id', 'display_name', false)}
      ${selectField('contact_id', 'ฝั่งลูกค้า', contacts, 'id', 'contact_name', false)}
      ${inputField('name_snapshot', 'ชื่อ Snapshot', 'text', false)}
      ${inputField('email_snapshot', 'อีเมล Snapshot', 'email', false)}
      <div class="field full"><label>สิทธิ์ / หมายเหตุ</label><textarea name="role_note"></textarea></div>
      <div class="full actions"><button class="btn primary" type="submit">Add Participant</button></div>
    </form>
  `
}

function renderCustomerProfileForm(account) {
  const customer = state.cache.customers.find((c) => c.account_id === account.id)
  const disabled = isReadOnly() ? 'disabled' : ''
  return `
    <form class="form-grid" data-form="customer-profile" data-account-id="${account.id}" data-customer-id="${customer?.id || ''}" novalidate>
      ${inputField('customer_code', 'รหัสลูกค้า', 'text', false, customer?.customer_code || '', disabled)}
      ${selectField('owner_id', 'ผู้รับผิดชอบ', state.cache.profiles.filter((p) => ['cs', 'admin'].includes(p.role)), 'id', 'display_name', false, customer?.owner_id || '', disabled)}
      ${inputField('cars', 'จำนวนรถ / จำนวนรถ', 'number', false, customer?.cars || account.cars_estimate || '', disabled)}
      ${inputField('functions', 'การใช้งาน / Use Case', 'text', false, customer?.functions || '', disabled)}
      ${inputField('start_date', 'Start วันที่', 'date', false, customer?.start_date || '', disabled)}
      ${inputField('billing_date', 'รอบบิล วันที่', 'date', false, customer?.billing_date || '', disabled)}
      ${selectStaticField('engagement_level', 'ระดับการใช้งาน Level', ['low', 'medium', 'high', 'risk'], false, customer?.engagement_level || 'medium', disabled)}
      ${selectStaticField('customer_status', 'สถานะ', ['onboarding', 'active', 'inactive', 'churned'], false, customer?.customer_status || 'onboarding', disabled)}
      <div class="field full"><label>Customer หมายเหตุ</label><textarea name="note" ${disabled}>${escapeHTML(customer?.note || '')}</textarea></div>
      <div class="full actions"><button class="btn primary" type="submit" ${disabled}>บันทึก ข้อมูลลูกค้า</button></div>
    </form>
  `
}

function renderCreateMasterForm(table, nameField) {
  return `
    <form class="form-grid single" data-form="create-master" data-table="${escapeAttr(table)}" data-name-field="${escapeAttr(nameField)}" novalidate>
      ${inputField('name', 'ชื่อรายการ', 'text', true)}
      <div class="full actions"><button class="btn primary" type="submit">Add</button></div>
    </form>
  `
}


function renderModal() {
  if (!state.modal) return ''
  const modal = state.modal
  const title = modalTitle(modal)
  const content = modalContent(modal)

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="modal-card" data-modal-card role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
        <header class="modal-header">
          <div>
            <h2>${escapeHTML(title)}</h2>
            <p>${escapeHTML(modalSubtitle(modal))}</p>
          </div>
          <button class="modal-close" type="button" data-close-modal aria-label="ปิด">×</button>
        </header>
        <div class="modal-body">
          ${content}
        </div>
      </section>
    </div>
  `
}

function modalTitle(modal) {
  const map = {
    'create-mkt-lead': 'สร้าง MKT Lead',
    'create-sales-lead': 'Sale สร้าง Lead',
    'add-contact': 'เพิ่มผู้ติดต่อ',
    'add-activity': 'เพิ่ม บันทึก',
    'request-demo': 'ขอเดโม',
    'edit-demo': 'แก้ไข Demo',
    'add-demo-user': 'เพิ่ม Demo User',
    'add-training': 'เพิ่ม Training',
    'add-training-participant': 'เพิ่มผู้เข้าร่วม Training',
    'customer-profile': 'บันทึก ข้อมูลลูกค้า',
    'add-task': 'เพิ่ม Task',
    'mark-lost': 'ปิดเป็น Lost',
    'create-master': `เพิ่ม ${modal.label || 'Master Data'}`,
    'account-overview': 'แก้ไข บัญชี Overview'
  }
  return map[modal.type] || 'Modal'
}

function modalSubtitle(modal) {
  const account = modal.accountId ? findบัญชี(modal.accountId) : null
  if (account) return accountTitle(account)
  if (modal.type === 'create-mkt-lead') return 'ระบบจะออก เลข MKT และ assign Sale แบบ round-robin'
  if (modal.type === 'create-sales-lead') return 'Lead นี้จะไม่มี เลข MKT และ owner คือ Sale ที่สร้าง'
  return ''
}

function modalContent(modal) {
  const account = modal.accountId ? findบัญชี(modal.accountId) : null
  if (modal.type === 'create-mkt-lead') return renderMktLeadForm()
  if (modal.type === 'create-sales-lead') return renderSaleLeadForm()
  if (modal.type === 'add-contact' && account) return renderAddContactForm(account)
  if (modal.type === 'add-activity' && account) return renderAddบันทึกForm(account)
  if (modal.type === 'request-demo' && account) return renderRequestDemoForm(account)
  if (modal.type === 'edit-demo') {
    const demo = state.cache.demos.find((item) => item.id === modal.demoId)
    return demo ? renderUpdateDemoForm(demo) : emptyState('ไม่พบ Demo', 'ข้อมูลอาจถูกลบหรือไม่มีสิทธิ์เข้าถึง')
  }
  if (modal.type === 'add-demo-user') {
    return modal.demoId && modal.accountId ? renderAddDemoUserForm(modal.demoId, modal.accountId) : emptyState('ไม่พบ Demo', 'ไม่สามารถเพิ่มผู้ใช้งาน Demo ได้')
  }
  if (modal.type === 'add-training' && account) return renderTrainingForm(account)
  if (modal.type === 'add-training-participant') {
    const training = state.cache.trainings.find((item) => item.id === modal.trainingId)
    return training ? renderAddTrainingParticipantForm(training, account || findบัญชี(training.account_id)) : emptyState('ไม่พบ Training', 'ไม่สามารถเพิ่มผู้เข้าร่วมได้')
  }
  if (modal.type === 'customer-profile' && account) return renderCustomerProfileForm(account)
  if (modal.type === 'add-task' && account) return renderTaskForm(account)
  if (modal.type === 'mark-lost' && account) return renderLostForm(account)
  if (modal.type === 'create-master') return renderCreateMasterForm(modal.table, modal.nameField)
  if (modal.type === 'account-overview' && account) return renderบัญชีOverviewForm(account)
  return emptyState('ไม่พบข้อมูล', 'กรุณาปิด modal แล้วลองใหม่')
}

function openModalFromDataset(dataset) {
  state.modal = {
    type: dataset.openModal,
    accountId: dataset.accountId || '',
    demoId: dataset.demoId || '',
    trainingId: dataset.trainingId || '',
    table: dataset.table || '',
    nameField: dataset.nameField || '',
    label: dataset.label || ''
  }
  render()
}

function closeModal() {
  state.modal = null
  render()
}


async function onClick(event) {
  const closeBtn = event.target.closest('[data-close-modal]')
  if (closeBtn || event.target.matches('[data-modal-backdrop]')) {
    closeModal()
    return
  }

  const openModalBtn = event.target.closest('[data-open-modal]')
  if (openModalBtn) {
    openModalFromDataset(openModalBtn.dataset)
    return
  }

  const nav = event.target.closest('[data-nav]')
  if (nav) {
    location.hash = `#/${nav.dataset.nav}`
    return
  }

  const navบัญชี = event.target.closest('[data-nav-account]')
  if (navบัญชี) {
    location.hash = `#/account/${navบัญชี.dataset.navบัญชี}`
    return
  }

  const viewBtn = event.target.closest('[data-view-key]')
  if (viewBtn) {
    state.viewModes[viewBtn.dataset.viewKey] = viewBtn.dataset.viewMode
    render()
    return
  }

  const leadTab = event.target.closest('[data-lead-tab]')
  if (leadTab) {
    const filter = getFilter('leads')
    filter.stage = leadTab.dataset.leadTab
    filter.page = 1
    render()
    return
  }

  const tabBtn = event.target.closest('[data-account-tab]')
  if (tabBtn) {
    state.accountTabs[tabBtn.dataset.accountId] = tabBtn.dataset.accountTab
    render()
    return
  }

  const pageBtn = event.target.closest('[data-page-key]')
  if (pageBtn) {
    const filter = getFilter(pageBtn.dataset.pageKey)
    filter.page = Number(filter.page || 1) + Number(pageBtn.dataset.pageDelta || 0)
    render()
    return
  }

  const action = event.target.closest('[data-action]')
  if (!action) return

  const type = action.dataset.action
  if (type === 'toggle-sidebar') {
    state.sidebarCollapsed = !state.sidebarCollapsed
    localStorage.setItem('crm_sidebar_collapsed', state.sidebarCollapsed ? 'true' : 'false')
    render()
    return
  }

  if (type === 'logout') return withActionBusy(action, logout)
  if (type === 'refresh-data') return withActionBusy(action, refreshData)
  if (type === 'print') return window.print()
  if (type === 'show-lost-form') {
    state.modal = { type: 'mark-lost', accountId: action.dataset.id }
    render()
    return
  }
  if (type === 'convert-customer') return withActionBusy(action, () => convertCustomer(action.dataset.id))
  if (type === 'mark-task-done') return withActionBusy(action, () => markTaskDone(action.dataset.id))
  if (type === 'save-profile') return withActionBusy(action, () => saveProfile(action.dataset.id))
  if (type === 'toggle-master') return withActionBusy(action, () => toggleMaster(action.dataset.table, action.dataset.id, action.dataset.active === 'true'))
  if (type === 'clear-filters') {
    const key = action.dataset.filterKey
    state.filters[key] = defaultFilter(key)
    render()
  }
}


async function onSubmit(event) {
  const form = event.target.closest('form[data-form]')
  if (!form) return
  event.preventDefault()
  if (form.dataset.busy === 'true') return

  const type = form.dataset.form
  let success = false
  try {
    clearFormErrors(form)
    setFormBusy(form, true)

    if (type === 'login') await login(form)
    if (type === 'create-mkt-lead') await createMktLead(form)
    if (type === 'create-sales-lead') await createSalesLead(form)
    if (type === 'account-overview') await saveบัญชีOverview(form)
    if (type === 'add-contact') await addContact(form)
    if (type === 'add-activity') await addบันทึก(form)
    if (type === 'request-demo') await requestDemo(form)
    if (type === 'update-demo') await updateDemo(form)
    if (type === 'add-demo-user') await addDemoUser(form)
    if (type === 'add-training') await addTraining(form)
    if (type === 'add-training-participant') await addTrainingParticipant(form)
    if (type === 'customer-profile') await saveCustomerProfile(form)
    if (type === 'add-task') await addTask(form)
    if (type === 'mark-lost') await markLost(form)
    if (type === 'create-master') await createMaster(form)

    success = true
  } catch (error) {
    showFormError(form, error)
    toast(error.message || String(error), 'error')
  } finally {
    setFormBusy(form, false)
    if (success && form.closest('[data-modal-card]')) {
      state.modal = null
      render()
    }
  }
}

function onChange(event) {
  const target = event.target
  if (target.matches('[data-profile-field]')) {
    target.dataset.dirty = 'true'
  }

  if (target.matches('[data-filter-control]') && target.type !== 'search') {
    const filter = getFilter(target.dataset.filterKey)
    const value = target.value
    filter[target.dataset.filterชื่อ] = target.dataset.filterชื่อ === 'pageSize' ? Number(value) : value
    filter.page = 1
    render()
  }
}

function onInput(event) {
  const target = event.target
  if (!target.matches('[data-filter-control][type="search"]')) return
  const filter = getFilter(target.dataset.filterKey)
  filter[target.dataset.filterชื่อ] = target.value
  filter.page = 1
  window.clearTimeout(filterTimer)
  filterTimer = window.setTimeout(() => render(), 300)
}

async function login(form) {
  const values = formValues(form)
  if (!nullIfBlank(values.email) || !nullIfBlank(values.password)) {
    throw createValidationError('กรุณากรอกอีเมลและรหัสผ่าน', ['email', 'password'])
  }
  const { error } = await state.client.auth.signInWithรหัสผ่าน({
    email: values.email,
    password: values.password
  })
  if (error) throw error
  toast('เข้าสู่ระบบแล้ว', 'success')
}

async function logout() {
  if (state.client) await state.client.auth.signOut()
  state.session = null
  state.user = null
  state.profile = null
  resetCache()
  render()
}

async function refreshData() {
  try {
    await loadAllData()
    render()
    toast('รีเฟรช สำเร็จ', 'success')
  } catch (error) {
    toast(error.message || String(error), 'error')
  }
}


async function createMktLead(form) {
  const values = formValues(form)
  ensureLeadMinimum(values)
  ensureRequired(values, 'lead_channel_id', 'ต้องเลือกช่องทาง', ['lead_channel_id'])
  const { data, error } = await state.client.rpc('create_mkt_lead', {
    p_company_name: nullIfBlank(values.company_name),
    p_contact_name: nullIfBlank(values.contact_name),
    p_phone: nullIfBlank(values.phone),
    p_email: nullIfBlank(values.email),
    p_lead_source_id: nullIfBlank(values.lead_source_id),
    p_lead_channel_id: nullIfBlank(values.lead_channel_id),
    p_campaign_id: nullIfBlank(values.campaign_id),
    p_initial_note: nullIfBlank(values.initial_note),
    p_cars_estimate: numberOrNull(values.cars_estimate),
    p_module_ids: values.module_ids || []
  })
  if (error) throw error

  form.reset()
  await refreshData()

  const account = state.cache.accounts.find((item) => item.id === data)
  const assignedSale = account ? displayUser(account.sale_owner_id) : '-'
  const runningNo = account?.running_no ? `#${account.running_no}` : '-'
  toast(`สร้าง MKT Lead สำเร็จ ${runningNo} / Assigned to: ${assignedSale}`, 'success')
}


async function createSalesLead(form) {
  const values = formValues(form)
  ensureLeadMinimum(values)
  ensureRequired(values, 'lead_channel_id', 'ต้องเลือกช่องทาง', ['lead_channel_id'])
  const { data, error } = await state.client.rpc('create_sales_lead', {
    p_company_name: nullIfBlank(values.company_name),
    p_contact_name: nullIfBlank(values.contact_name),
    p_position: nullIfBlank(values.position),
    p_phone: nullIfBlank(values.phone),
    p_phone_2: nullIfBlank(values.phone_2),
    p_phone_3: nullIfBlank(values.phone_3),
    p_email: nullIfBlank(values.email),
    p_email_2: nullIfBlank(values.email_2),
    p_tax_id: nullIfBlank(values.tax_id),
    p_address: nullIfBlank(values.address),
    p_business_type_id: nullIfBlank(values.business_type_id),
    p_lead_channel_id: nullIfBlank(values.lead_channel_id),
    p_initial_note: nullIfBlank(values.initial_note),
    p_cars_estimate: numberOrNull(values.cars_estimate),
    p_current_gps_provider: nullIfBlank(values.current_gps_provider),
    p_module_ids: values.module_ids || []
  })
  if (error) throw error

  if (nullIfBlank(values.note)) {
    const { error: noteError } = await state.client.from(TABLES.activities).insert({
      account_id: data,
      activity_type: 'sale_update',
      title: 'Sale note',
      content: values.note,
      created_by: state.user.id
    })
    if (noteError) throw noteError
  }

  form.reset()
  await refreshData()
  const account = state.cache.accounts.find((item) => item.id === data)
  toast(`สร้าง Sale Lead สำเร็จ / ผู้รับผิดชอบ: ${displayUser(account?.sale_owner_id || state.user.id)}`, 'success')
}

function ensureLeadMinimum(values) {
  const hasMinimum = [values.company_name, values.contact_name, values.phone, values.phone_2, values.phone_3, values.email, values.email_2, values.initial_note]
    .some((value) => String(value || '').trim())
  if (!hasMinimum) {
    throw createValidationError('ต้องกรอกข้อมูลขั้นต่ำอย่างน้อย 1 อย่าง เช่น ผู้ติดต่อ เบอร์ อีเมล รายละเอียด หรือชื่อบริษัท', ['company_name', 'contact_name', 'phone', 'email', 'initial_note'])
  }
}

function ensureRequired(values, fieldชื่อ, message, fieldชื่อs = [fieldชื่อ]) {
  if (!String(values[fieldชื่อ] || '').trim()) {
    throw createValidationError(message, fieldชื่อs)
  }
}


async function saveบัญชีOverview(form) {
  const accountId = form.dataset.accountId
  const values = formValues(form)
  const payload = {
    company_name: nullIfBlank(values.company_name),
    short_name: nullIfBlank(values.short_name),
    tax_id: nullIfBlank(values.tax_id),
    address: nullIfBlank(values.address),
    cars_estimate: numberOrNull(values.cars_estimate),
    lead_channel_id: nullIfBlank(values.lead_channel_id),
    lead_source_id: nullIfBlank(values.lead_source_id),
    campaign_id: nullIfBlank(values.campaign_id),
    business_type_id: nullIfBlank(values.business_type_id),
    contact_status_id: nullIfBlank(values.contact_status_id),
    current_gps_provider: nullIfBlank(values.current_gps_provider),
    product_interest: nullIfBlank(values.product_interest)
  }

  const { error } = await state.client.from(TABLES.accounts).update(payload).eq('id', accountId)
  if (error) throw error

  await replaceบัญชีสินค้า(accountId, values.module_ids || [], 'interested')
  await refreshData()
  toast('บันทึก บัญชี สำเร็จ', 'success')
}

async function replaceบัญชีสินค้า(accountId, moduleIds, moduleType) {
  const existing = state.cache.accountสินค้า.filter((row) => row.account_id === accountId && row.module_type === moduleType)
  if (existing.length) {
    const { error } = await state.client
      .from(TABLES.accountสินค้า)
      .delete()
      .in('id', existing.map((row) => row.id))
    if (error) throw error
  }

  if (moduleIds.length) {
    const rows = moduleIds.map((moduleId) => ({ account_id: accountId, module_id: moduleId, module_type: moduleType }))
    const { error } = await state.client.from(TABLES.accountสินค้า).insert(rows)
    if (error) throw error
  }
}

async function addContact(form) {
  const values = formValues(form)
  const payload = {
    account_id: form.dataset.accountId,
    contact_name: values.contact_name,
    position: nullIfBlank(values.position),
    email: nullIfBlank(values.email),
    email_2: nullIfBlank(values.email_2),
    phone: nullIfBlank(values.phone),
    phone_2: nullIfBlank(values.phone_2),
    phone_3: nullIfBlank(values.phone_3),
    contact_role: nullIfBlank(values.contact_role),
    created_by: state.user.id
  }

  const { error } = await state.client.from(TABLES.contacts).insert(payload)
  if (error) throw error
  form.reset()
  await refreshData()
  toast('เพิ่ม Contact สำเร็จ', 'success')
}

async function addบันทึก(form) {
  const values = formValues(form)
  const payload = {
    account_id: form.dataset.accountId,
    activity_type: values.activity_type || 'note',
    title: nullIfBlank(values.title),
    content: values.content,
    next_follow_up_at: nullIfBlank(values.next_follow_up_at),
    created_by: state.user.id
  }

  const { error } = await state.client.from(TABLES.activities).insert(payload)
  if (error) throw error
  form.reset()
  await refreshData()
  toast('เพิ่ม บันทึก สำเร็จ', 'success')
}

async function requestDemo(form) {
  const values = formValues(form)
  if (values.start_date && values.end_date && values.end_date < values.start_date) {
    throw createValidationError('วันที่สิ้นสุด Demo ต้องไม่น้อยกว่าวันที่เริ่ม', ['start_date', 'end_date'])
  }
  const { error } = await state.client.rpc('create_demo_request', {
    p_account_id: form.dataset.accountId,
    p_start_date: values.start_date,
    p_end_date: values.end_date,
    p_module_ids: values.module_ids || [],
    p_cs_owner_ids: values.cs_owner_ids || [],
    p_requirement_note: nullIfBlank(values.requirement_note)
  })
  if (error) throw error
  form.reset()
  await refreshData()
  toast('สร้าง Demo สำเร็จ', 'success')
}

async function updateDemo(form) {
  const values = formValues(form)
  const payload = {
    demo_status: values.demo_status,
    start_date: nullIfBlank(values.start_date),
    end_date: nullIfBlank(values.end_date),
    demo_result: nullIfBlank(values.demo_result),
    requirement_note: nullIfBlank(values.requirement_note),
    follow_up_note: nullIfBlank(values.follow_up_note)
  }

  const { error } = await state.client.from(TABLES.demos).update(payload).eq('id', form.dataset.demoId)
  if (error) throw error
  await refreshData()
  toast('บันทึก Demo สำเร็จ', 'success')
}

async function addDemoUser(form) {
  const values = formValues(form)
  const payload = {
    demo_session_id: form.dataset.demoId,
    account_id: form.dataset.accountId,
    user_email: values.user_email,
    user_name: nullIfBlank(values.user_name),
    demo_password: nullIfBlank(values.demo_password),
    is_active: true
  }

  const { error } = await state.client.from(TABLES.demoUsers).insert(payload)
  if (error) throw error
  form.reset()
  await refreshData()
  toast('เพิ่ม Demo User สำเร็จ', 'success')
}

async function addTraining(form) {
  const values = formValues(form)
  const payload = {
    account_id: form.dataset.accountId,
    demo_session_id: nullIfBlank(values.demo_session_id),
    customer_profile_id: nullIfBlank(values.customer_profile_id),
    training_phase: values.training_phase,
    session_no: numberOrNull(values.session_no),
    training_date: values.training_date,
    trainer_id: nullIfBlank(values.trainer_id) || state.user.id,
    training_detail: values.training_detail,
    issue_note: nullIfBlank(values.issue_note),
    next_action: nullIfBlank(values.next_action),
    status: values.status || 'planned',
    created_by: state.user.id
  }

  const { error } = await state.client.from(TABLES.trainings).insert(payload)
  if (error) throw error
  form.reset()
  await refreshData()
  toast('เพิ่ม Training สำเร็จ', 'success')
}

async function addTrainingParticipant(form) {
  const values = formValues(form)
  const payload = {
    training_session_id: form.dataset.trainingId,
    participant_type: values.participant_type,
    profile_id: nullIfBlank(values.profile_id),
    contact_id: nullIfBlank(values.contact_id),
    name_snapshot: nullIfBlank(values.name_snapshot),
    email_snapshot: nullIfBlank(values.email_snapshot),
    role_note: nullIfBlank(values.role_note)
  }

  if (!payload.profile_id && !payload.contact_id && !payload.name_snapshot) {
    throw new Error('ต้องเลือกผู้เข้าร่วมหรือกรอกชื่อ snapshot')
  }

  const { error } = await state.client.from(TABLES.trainingParticipants).insert(payload)
  if (error) throw error
  form.reset()
  await refreshData()
  toast('เพิ่มผู้เข้าร่วม Training สำเร็จ', 'success')
}

async function saveCustomerProfile(form) {
  const values = formValues(form)
  const accountId = form.dataset.accountId
  const customerId = form.dataset.customerId
  const payload = {
    account_id: accountId,
    customer_code: nullIfBlank(values.customer_code),
    owner_id: nullIfBlank(values.owner_id),
    cars: numberOrNull(values.cars),
    functions: nullIfBlank(values.functions),
    start_date: nullIfBlank(values.start_date),
    billing_date: nullIfBlank(values.billing_date),
    engagement_level: values.engagement_level || 'medium',
    customer_status: values.customer_status || 'onboarding',
    note: nullIfBlank(values.note)
  }

  const query = customerId
    ? state.client.from(TABLES.customers).update(payload).eq('id', customerId)
    : state.client.from(TABLES.customers).insert(payload)

  const { error } = await query
  if (error) throw error

  const { error: stageError } = await state.client.rpc('change_account_stage', {
    p_account_id: accountId,
    p_to_stage: 'customer',
    p_to_status: 'customer_active',
    p_lost_reason_id: null,
    p_lost_note: null
  })
  if (stageError) throw stageError

  await refreshData()
  toast('บันทึก ข้อมูลลูกค้า สำเร็จ', 'success')
}

async function addTask(form) {
  const values = formValues(form)
  const payload = {
    account_id: form.dataset.accountId,
    demo_session_id: nullIfBlank(values.demo_session_id),
    title: values.title,
    description: nullIfBlank(values.description),
    task_type: values.task_type || 'follow_up',
    status: 'open',
    priority: values.priority || 'medium',
    assigned_to: values.assigned_to,
    created_by: state.user.id,
    due_at: nullIfBlank(values.due_at)
  }

  const { error } = await state.client.from(TABLES.tasks).insert(payload)
  if (error) throw error
  form.reset()
  await refreshData()
  toast('เพิ่ม Task สำเร็จ', 'success')
}

async function markLost(form) {
  if (!window.confirm('ยืนยันปิด บัญชี นี้เป็น Lost?')) return
  const values = formValues(form)
  const { error } = await state.client.rpc('change_account_stage', {
    p_account_id: form.dataset.accountId,
    p_to_stage: 'lost',
    p_to_status: 'lost',
    p_lost_reason_id: values.lost_reason_id,
    p_lost_note: values.lost_note
  })
  if (error) throw error
  await refreshData()
  toast('ปิดเป็น Lost สำเร็จ', 'success')
}

async function convertCustomer(accountId) {
  if (!window.confirm('ยืนยัน Convert เป็น Customer?')) return
  const { error } = await state.client.rpc('change_account_stage', {
    p_account_id: accountId,
    p_to_stage: 'customer',
    p_to_status: 'customer_active',
    p_lost_reason_id: null,
    p_lost_note: null
  })
  if (error) {
    toast(error.message, 'error')
    return
  }

  const existing = state.cache.customers.find((c) => c.account_id === accountId)
  if (!existing) {
    const account = findบัญชี(accountId)
    const { error: insertError } = await state.client.from(TABLES.customers).insert({
      account_id: accountId,
      owner_id: state.profile.role === ROLES.CS ? state.user.id : null,
      cars: account?.cars_estimate || null,
      engagement_level: 'medium',
      customer_status: 'onboarding'
    })
    if (insertError) {
      toast(insertError.message, 'error')
      return
    }
  }

  await refreshData()
  toast('Convert เป็น Customer แล้ว', 'success')
}

async function markTaskDone(taskId) {
  if (!window.confirm('ยืนยันปิด Task นี้เป็น Done?')) return
  const { error } = await state.client.from(TABLES.tasks).update({
    status: 'done',
    completed_at: new วันที่().toISOString()
  }).eq('id', taskId)
  if (error) {
    toast(error.message, 'error')
    return
  }
  await refreshData()
  toast('ปิด Task แล้ว', 'success')
}

async function saveProfile(profileId) {
  const displayInput = document.querySelector(`[data-profile-id="${profileId}"][data-profile-field="display_name"]`)
  const roleInput = document.querySelector(`[data-profile-id="${profileId}"][data-profile-field="role"]`)
  const activeInput = document.querySelector(`[data-profile-id="${profileId}"][data-profile-field="is_active"]`)
  const payload = {
    display_name: nullIfBlank(displayInput?.value),
    role: roleInput?.value || 'pending',
    is_active: activeInput?.value === 'true'
  }

  const { error } = await state.client.from(TABLES.profiles).update(payload).eq('id', profileId)
  if (error) {
    toast(error.message, 'error')
    return
  }
  await refreshData()
  toast('บันทึก Profile แล้ว', 'success')
}

async function createMaster(form) {
  const values = formValues(form)
  const nameField = form.dataset.nameField
  const payload = { [nameField]: values.name, is_active: true }
  const { error } = await state.client.from(form.dataset.table).insert(payload)
  if (error) throw error
  form.reset()
  await refreshData()
  toast('เพิ่ม Master Data แล้ว', 'success')
}

async function toggleMaster(table, id, active) {
  const { error } = await state.client.from(table).update({ is_active: active }).eq('id', id)
  if (error) {
    toast(error.message, 'error')
    return
  }
  await refreshData()
  toast('อัปเดต Master Data แล้ว', 'success')
}

function showLostForm(accountId) {
  const form = document.getElementById(`lost-form-${accountId}`)
  if (form) form.style.display = form.style.display === 'none' ? 'grid' : 'none'
}

function findบัญชี(accountId) {
  return state.cache.accounts.find((a) => a.id === accountId) || null
}

function accountTitle(account) {
  if (!account) return '-'
  const primary = state.cache.contacts.find((c) => c.account_id === account.id && c.is_primary) ||
    state.cache.contacts.find((c) => c.account_id === account.id)
  return account.company_name || account.short_name || primary?.contact_name || primary?.phone || primary?.email || `บัญชี ${String(account.id).slice(0, 8)}`
}

function renderRunningNo(account) {
  if (!account?.running_no) return '<span class="muted">ไม่มีเลข MKT</span>'
  return `#${escapeHTML(String(account.running_no))}`
}

function accountModuleIds(accountId) {
  return state.cache.accountสินค้า
    .filter((row) => row.account_id === accountId && ['interested', 'demo', 'subscribed'].includes(row.module_type))
    .map((row) => row.module_id)
}

function masterชื่อ(cacheKey, id) {
  if (!id) return '-'
  const table = state.cache[cacheKey] || []
  const row = table.find((item) => item.id === id)
  return row?.name || row?.module_name || row?.reason_name || '-'
}

function displayUser(id) {
  if (!id) return '-'
  const profile = state.cache.profiles.find((p) => p.id === id)
  return profile?.display_name || profile?.email || String(id).slice(0, 8)
}

function contactชื่อ(contactId) {
  if (!contactId) return '-'
  const contact = state.cache.contacts.find((c) => c.id === contactId)
  return contact?.contact_name || '-'
}

function contactอีเมล(contactId) {
  if (!contactId) return ''
  const contact = state.cache.contacts.find((c) => c.id === contactId)
  return contact?.email || ''
}

function roleLabel(role) {
  const labels = {
    pending: 'Pending',
    admin: 'ผู้ดูแล',
    mkt: 'MKT',
    sale: 'Sale',
    cs: 'CS',
    manager: 'Manager'
  }
  return labels[role] || role || '-'
}

function fieldId(name) {
  fieldSeq += 1
  return `${name}-${fieldSeq}`
}


function readonlyDisplay(name, label, value) {
  const id = fieldId(name)
  return `
    <div class="field readonly-field" data-field="${escapeAttr(name)}">
      <label for="${escapeAttr(id)}">${escapeHTML(label)}</label>
      <input id="${escapeAttr(id)}" type="text" value="${escapeAttr(value || '-')}" disabled>
      <div class="help">ข้อมูลนี้ระบบจัดการให้อัตโนมัติ</div>
    </div>
  `
}

function activeSalesชื่อs() {
  const sales = state.cache.profiles
    .filter((profile) => profile.role === ROLES.SALE && profile.is_active)
    .map((profile) => displayUser(profile.id))
    .filter(Boolean)
  return sales.length ? `ระบบจะวน assign ให้ Sale active: ${sales.join(', ')}` : ''
}

function inputField(name, label, type, required, value = '', disabled = '') {
  const id = fieldId(name)
  return `
    <div class="field" data-field="${escapeAttr(name)}">
      <label for="${escapeAttr(id)}">${escapeHTML(label)}${required ? ' *' : ''}</label>
      <input id="${escapeAttr(id)}" name="${escapeAttr(name)}" type="${escapeAttr(type)}" value="${escapeAttr(value)}" ${required ? 'required' : ''} ${disabled} aria-describedby="${escapeAttr(id)}-help">
      <div class="field-error" data-field-error="${escapeAttr(name)}"></div>
    </div>
  `
}

function selectField(name, label, rows, valueField, labelField, required, selected = '', disabled = '') {
  const id = fieldId(name)
  const options = [`<option value="">- เลือก -</option>`].concat((rows || []).map((row) => {
    const labelValue = row[labelField] || row.name || row.email || row.id
    return `<option value="${escapeAttr(row[valueField])}" ${String(selected) === String(row[valueField]) ? 'selected' : ''}>${escapeHTML(labelValue)}</option>`
  })).join('')
  return `
    <div class="field" data-field="${escapeAttr(name)}">
      <label for="${escapeAttr(id)}">${escapeHTML(label)}${required ? ' *' : ''}</label>
      <select id="${escapeAttr(id)}" name="${escapeAttr(name)}" ${required ? 'required' : ''} ${disabled}>${options}</select>
      <div class="field-error" data-field-error="${escapeAttr(name)}"></div>
    </div>
  `
}

function selectStaticField(name, label, values, required, selected = '', disabled = '') {
  const id = fieldId(name)
  const options = [`<option value="">- เลือก -</option>`].concat(values.map((value) => `<option value="${escapeAttr(value)}" ${selected === value ? 'selected' : ''}>${escapeHTML(value)}</option>`)).join('')
  return `
    <div class="field" data-field="${escapeAttr(name)}">
      <label for="${escapeAttr(id)}">${escapeHTML(label)}${required ? ' *' : ''}</label>
      <select id="${escapeAttr(id)}" name="${escapeAttr(name)}" ${required ? 'required' : ''} ${disabled}>${options}</select>
      <div class="field-error" data-field-error="${escapeAttr(name)}"></div>
    </div>
  `
}

function multiSelectField(name, label, rows, valueField, labelField, selected = [], disabled = '') {
  const selectedSet = new Set(Array.isArray(selected) ? selected.map(String) : [])
  const safeชื่อ = escapeAttr(name)
  const controls = (rows || []).map((row) => {
    const value = String(row[valueField])
    const labelValue = row[labelField] || row.name || row.email || row.id
    const id = fieldId(name)
    return `
      <label class="check-chip" for="${escapeAttr(id)}">
        <input id="${escapeAttr(id)}" type="checkbox" name="${safeชื่อ}" value="${escapeAttr(value)}" data-multi-name="${safeชื่อ}" ${selectedSet.has(value) ? 'checked' : ''} ${disabled}>
        <span>${escapeHTML(labelValue)}</span>
      </label>
    `
  }).join('')
  return `
    <div class="field full" data-field="${safeชื่อ}">
      <div class="field-label">${escapeHTML(label)}</div>
      <div class="check-grid">${controls || '<span class="muted">ยังไม่มีรายการให้เลือก</span>'}</div>
      <div class="help">เลือกได้มากกว่า 1 รายการ</div>
      <div class="field-error" data-field-error="${safeชื่อ}"></div>
    </div>
  `
}

function badge(text) {
  const safe = String(text || '-')
  const key = safe.toLowerCase().replace(/\s+/g, '_')
  return `<span class="badge ${escapeAttr(key)}">${escapeHTML(STAGE_LABELS[key] || STATUS_LABELS[key] || safe)}</span>`
}

function simpleRowsTable(headers, rows) {
  if (!rows.length) return emptyState('ไม่มีข้อมูล', 'ยังไม่มีรายการในส่วนนี้')
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map((h) => `<th>${escapeHTML(h)}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell).startsWith('<') ? cell : escapeHTML(String(cell ?? '-'))}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
  `
}

function viewLabel(mode) {
  const labels = {
    board: 'Board',
    calendar: 'Calendar',
    list: 'List',
    table: 'Table',
    timeline: 'Timeline'
  }
  return labels[mode] || mode
}

function groupRows(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field] || 'none'
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})
}

function formValues(form) {
  const formData = new FormData(form)
  const values = {}
  for (const [key, value] of formData.entries()) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      if (!Array.isArray(values[key])) values[key] = [values[key]]
      values[key].push(value)
    } else {
      values[key] = value
    }
  }

  form.querySelectorAll('select[multiple]').forEach((select) => {
    values[select.name] = Array.from(select.selectedOptions).map((option) => option.value).filter(Boolean)
  })

  const multiชื่อs = Array.from(new Set(Array.from(form.querySelectorAll('[data-multi-name]')).map((input) => input.name)))
  multiชื่อs.forEach((name) => {
    values[name] = Array.from(form.querySelectorAll(`[name="${cssEscape(name)}"][data-multi-name]:checked`)).map((input) => input.value).filter(Boolean)
  })

  return values
}


function setFormBusy(form, busy) {
  form.dataset.busy = busy ? 'true' : 'false'
  form.setAttribute('aria-busy', busy ? 'true' : 'false')

  form.querySelectorAll('button').forEach((el) => {
    if (busy) {
      el.dataset.wasปิดใช้d = el.disabled ? 'true' : 'false'
      el.dataset.originalText = el.textContent
      el.disabled = true
      if (el.type === 'submit') el.textContent = 'กำลังบันทึก...'
    } else {
      el.disabled = el.dataset.wasปิดใช้d === 'true'
      if (el.dataset.originalText) el.textContent = el.dataset.originalText
      delete el.dataset.wasปิดใช้d
      delete el.dataset.originalText
    }
  })

  if (!busy) {
    delete form.dataset.busy
    form.removeAttribute('aria-busy')
  }
}


function getStoredSidebarCollapsed() {
  const stored = localStorage.getItem('crm_sidebar_collapsed')
  if (stored === null) return true
  return stored === 'true'
}

async function withActionBusy(button, actionFn) {
  if (!button || button.dataset.busy === 'true') return
  try {
    button.dataset.busy = 'true'
    button.dataset.originalText = button.textContent
    button.disabled = true
    if (!['‹', '›', '×'].includes(button.textContent.trim())) button.textContent = 'กำลังทำงาน...'
    return await actionFn()
  } finally {
    if (button) {
      button.disabled = false
      if (button.dataset.originalText) button.textContent = button.dataset.originalText
      delete button.dataset.originalText
      delete button.dataset.busy
    }
  }
}

function accountModuleชื่อs(accountId) {
  const moduleIds = state.cache.accountสินค้า
    .filter((row) => row.account_id === accountId)
    .map((row) => row.module_id)
  return moduleIds.map((id) => masterชื่อ('modules', id)).filter(Boolean)
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(String(value))
  }
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&')
}


function createValidationError(message, fieldชื่อs = []) {
  const error = new Error(message)
  error.fieldชื่อs = fieldชื่อs
  return error
}

function clearFormErrors(form) {
  form.querySelectorAll('.form-error').forEach((el) => el.remove())
  form.querySelectorAll('.field-error').forEach((el) => { el.textContent = '' })
  form.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'))
}

function showFormError(form, error) {
  clearFormErrors(form)
  const message = error.message || String(error)
  const summary = document.createElement('div')
  summary.classชื่อ = 'form-error'
  summary.setAttribute('role', 'alert')
  summary.textContent = message
  form.prepend(summary)

  const fieldชื่อs = Array.isArray(error.fieldชื่อs) ? error.fieldชื่อs : []
  fieldชื่อs.forEach((name) => {
    const input = form.querySelector(`[name="${cssEscape(name)}"]`)
    const holder = form.querySelector(`[data-field-error="${cssEscape(name)}"]`)
    if (input) input.setAttribute('aria-invalid', 'true')
    if (holder) holder.textContent = message
  })

  const firstInvalid = fieldชื่อs.length ? form.querySelector(`[name="${cssEscape(fieldชื่อs[0])}"]`) : null
  if (firstInvalid && typeof firstInvalid.focus === 'function') {
    firstInvalid.focus()
  } else {
    summary.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function emptyState(title, description, actionHTML = '') {
  return `
    <div class="empty-state">
      <div class="empty-icon">∅</div>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(description || '')}</p>
      ${actionHTML}
    </div>
  `
}

function daysFromToday(dateValue) {
  if (!dateValue) return 999
  const target = new วันที่(dateValue)
  const today = startOfToday()
  return Math.ceil((target - today) / 86400000)
}


function nullIfBlank(value) {
  const text = String(value ?? '').trim()
  return text ? text : null
}

function numberOrNull(value) {
  const text = String(value ?? '').trim()
  if (!text) return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

function formatวันที่(value) {
  if (!value) return '-'
  try {
    return new Intl.วันที่TimeFormat('th-TH', { dateStyle: 'medium' }).format(new วันที่(value))
  } catch (_error) {
    return String(value)
  }
}

function formatวันที่Time(value) {
  if (!value) return '-'
  try {
    return new Intl.วันที่TimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new วันที่(value))
  } catch (_error) {
    return String(value)
  }
}

function todayISO() {
  return new วันที่().toISOString().slice(0, 10)
}

function startOfToday() {
  const date = new วันที่()
  date.setHours(0, 0, 0, 0)
  return date
}

function datePart(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function timelineWidth(start, end) {
  if (!start || !end) return 20
  const s = new วันที่(start)
  const e = new วันที่(end)
  const days = Math.max(1, Math.round((e - s) / 86400000) + 1)
  return Math.max(12, Math.min(100, days * 7))
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function escapeAttr(value) {
  return escapeHTML(value).replaceAll('`', '&#096;')
}

function toast(message, type = 'success') {
  const item = document.createElement('div')
  item.classชื่อ = `toast ${type}`
  item.innerHTML = `<span>${escapeHTML(message)}</span><button type="button" aria-label="close">×</button>`
  item.querySelector('button').addEventListener('click', () => item.remove())
  toastRoot.appendChild(item)
  window.setTimeout(() => item.remove(), 6000)
}


/* v1.4.0 overrides: Thai UI, no legacy Account ID, hover sidebar, master delete guard */
ROUTES.forEach((route) => {
  const labels = {
    dashboard: 'ภาพรวม',
    'my-work': 'งานของฉัน',
    leads: 'ลีด',
    accounts: 'บัญชี',
    demo: 'เดโม',
    customers: 'ลูกค้า',
    tasks: 'งานติดตาม',
    training: 'อบรม',
    reports: 'รายงาน',
    admin: 'ผู้ดูแล'
  }
  if (labels[route.key]) route.label = labels[route.key]
})

MASTER_TABLES.forEach((item) => {
  const labels = {
    leadSources: 'แหล่งที่มา',
    campaigns: 'แคมเปญ',
    modules: 'สินค้า',
    contactStatuses: 'สถานะติดต่อ',
    businessTypes: 'ประเภทธุรกิจ',
    leadChannels: 'ช่องทาง',
    lostReasons: 'เหตุผลที่ปิด'
  }
  if (labels[item.key]) item.label = labels[item.key]
})

Object.assign(STAGE_LABELS, {
  lead: 'ลีด',
  demo: 'เดโม',
  customer: 'ลูกค้า',
  lost: 'ปิดแล้ว'
})

Object.assign(STATUS_LABELS, {
  new: 'ใหม่',
  assigned: 'มอบหมายแล้ว',
  contacted: 'ติดต่อแล้ว',
  follow_up: 'ติดตามต่อ',
  demo_requested: 'ขอเดโม',
  demo_active: 'กำลังเดโม',
  customer_active: 'ลูกค้าใช้งาน',
  lost: 'ปิด Lost',
  churned: 'เลิกใช้งาน',
  open: 'เปิด',
  in_progress: 'กำลังทำ',
  blocked: 'ติดปัญหา',
  done: 'เสร็จแล้ว',
  cancelled: 'ยกเลิก',
  planned: 'วางแผน',
  active: 'ใช้งาน',
  low: 'ต่ำ',
  medium: 'กลาง',
  high: 'สูง',
  urgent: 'ด่วน',
  risk: 'เสี่ยง',
  onboarding: 'เริ่มใช้งาน',
  inactive: 'ไม่ใช้งาน',
  requested: 'รอเดโม',
  extended: 'ขยายเวลา',
  ended: 'จบแล้ว',
  converted: 'เป็นลูกค้า'
})

function renderSidebar(activeKey) {
  const links = ROUTES
    .filter((item) => hasRole(item.roles))
    .map((item) => `
      <button class="nav-link ${activeKey === item.key ? 'active' : ''}" data-nav="${item.key}" type="button" title="${escapeAttr(item.label)}" aria-label="${escapeAttr(item.label)}">
        <span class="nav-icon" aria-hidden="true">${item.icon}</span><span class="nav-label">${escapeHTML(item.label)}</span>
      </button>
    `).join('')

  return `
    <aside class="sidebar" aria-label="เมนูหลัก">
      <div class="brand">
        <div class="brand-mark">CRM</div>
        <div class="brand-copy">
          <span class="brand-title">ระบบ CRM ภายใน</span>
          <span class="brand-version">v${APP_VERSION}</span>
        </div>
      </div>
      <nav class="nav">${links}</nav>
      <div class="sidebar-footer">
        <div class="nav-label">${escapeHTML(roleLabel(state.profile.role))}</div>
        <div class="nav-label">${escapeHTML(state.profile.display_name || state.profile.email || '')}</div>
      </div>
    </aside>
  `
}

function renderTopbar(title) {
  return `
    <header class="topbar">
      <div>
        <h1>${escapeHTML(title)}</h1>
        <div class="topbar-meta">อัปเดต: ${state.lastSyncedAt ? formatDateTime(state.lastSyncedAt) : '-'}</div>
      </div>
      <div class="user-chip">
        <span>${escapeHTML(state.profile.display_name || state.profile.email || '')}</span>
        <span class="role-pill">${escapeHTML(roleLabel(state.profile.role))}</span>
        <button class="btn small" type="button" data-action="refresh-data">รีเฟรช</button>
        <button class="btn small" type="button" data-action="logout">ออกจากระบบ</button>
      </div>
    </header>
  `
}

function roleLabel(role) {
  const labels = {
    pending: 'รอกำหนดสิทธิ์',
    admin: 'ผู้ดูแล',
    mkt: 'MKT',
    sale: 'Sale',
    cs: 'CS',
    manager: 'ผู้จัดการ'
  }
  return labels[role] || role || '-'
}

function viewLabel(mode) {
  const labels = {
    board: 'บอร์ด',
    calendar: 'ปฏิทิน',
    list: 'รายการ',
    table: 'ตาราง',
    timeline: 'ไทม์ไลน์'
  }
  return labels[mode] || mode
}

function renderDashboard() {
  const accounts = state.cache.accounts
  const leads = accounts.filter((a) => a.lifecycle_stage === 'lead')
  const demos = accounts.filter((a) => a.lifecycle_stage === 'demo')
  const customers = accounts.filter((a) => a.lifecycle_stage === 'customer')
  const lost = accounts.filter((a) => a.lifecycle_stage === 'lost')
  const tasks = state.cache.tasks
  const overdue = tasks.filter((t) => t.status !== 'done' && t.due_at && new Date(t.due_at) < startOfToday())
  const todayTrainings = state.cache.trainings.filter((t) => t.training_date === todayISO())

  return `
    <div class="page-header">
      <div><h2>ภาพรวม</h2></div>
      <div class="actions">
        <button class="btn primary" type="button" data-nav="my-work">งานของฉัน</button>
        <button class="btn" type="button" data-action="print">พิมพ์</button>
      </div>
    </div>
    <div class="grid grid-4">
      ${renderKpi('ลีด', leads.length, '')}
      ${renderKpi('เดโม', demos.length, '')}
      ${renderKpi('ลูกค้า', customers.length, '')}
      ${renderKpi('ปิดแล้ว', lost.length, '')}
    </div>
    <div class="grid grid-3" style="margin-top:16px">
      ${renderKpi('งานเปิด', tasks.filter((t) => !['done', 'cancelled'].includes(t.status)).length, '')}
      ${renderKpi('เลยกำหนด', overdue.length, '')}
      ${renderKpi('อบรมวันนี้', todayTrainings.length, '')}
    </div>
    <div class="grid grid-2" style="margin-top:16px">
      <div class="card"><h3>เส้นทางลีด</h3>${renderMiniJourney()}</div>
      <div class="card"><h3>งานเร่งด่วน</h3>${renderTaskList(overdue.concat(tasks.filter((t) => t.status !== 'done')).slice(0, 6), true)}</div>
    </div>
  `
}

function renderLeads() {
  const leadJourneys = state.cache.accounts
  const filter = getFilter('leads')
  if (filter.stage === undefined || filter.stage === null) filter.stage = 'lead'

  const tabs = [
    ['', 'ทั้งหมด'],
    ['lead', 'ลีดเปิด'],
    ['demo', 'เดโม'],
    ['customer', 'เป็นลูกค้า'],
    ['lost', 'ปิดแล้ว']
  ]

  return `
    <div class="page-header">
      <div><h2>ลีด</h2></div>
      <div class="actions">
        ${hasRole([ROLES.ADMIN, ROLES.MKT]) ? `<button class="btn primary" type="button" data-open-modal="create-mkt-lead">+ ลีด MKT</button>` : ''}
        ${hasRole([ROLES.ADMIN, ROLES.SALE]) ? `<button class="btn primary" type="button" data-open-modal="create-sales-lead">+ ลีด Sale</button>` : ''}
      </div>
    </div>
    <div class="tabs lead-tabs" role="tablist" aria-label="ตัวกรองลีด">
      ${tabs.map(([stage, label]) => `
        <button class="tab ${String(filter.stage || '') === String(stage) ? 'active' : ''}" type="button" data-lead-tab="${escapeAttr(stage)}">${escapeHTML(label)}</button>
      `).join('')}
    </div>
    <div class="card">
      <div class="page-header compact-header">
        <div><h3>รายการลีด</h3></div>
        ${renderViewSwitcher('leads')}
      </div>
      ${renderAccountsCollection(leadJourneys, 'leads')}
    </div>
  `
}

function renderAccounts() {
  return `
    <div class="page-header">
      <div><h2>บัญชี</h2></div>
      ${renderViewSwitcher('accounts')}
    </div>
    ${renderAccountsCollection(state.cache.accounts, 'accounts')}
  `
}

function renderDemo() {
  return `
    <div class="page-header">
      <div><h2>เดโม</h2></div>
      ${renderViewSwitcher('demo')}
    </div>
    ${renderAccountsCollection(state.cache.accounts.filter((a) => a.lifecycle_stage === 'demo'), 'demo')}
  `
}

function renderCustomers() {
  return `
    <div class="page-header">
      <div><h2>ลูกค้า</h2></div>
      ${renderViewSwitcher('customers')}
    </div>
    ${renderAccountsCollection(state.cache.accounts.filter((a) => a.lifecycle_stage === 'customer'), 'customers')}
  `
}

function renderTasks() {
  return `
    <div class="page-header">
      <div><h2>งานติดตาม</h2></div>
      ${renderViewSwitcher('tasks')}
    </div>
    <div class="card">${renderTaskCollection(state.cache.tasks, 'tasks')}</div>
  `
}

function renderTraining() {
  return `
    <div class="page-header">
      <div><h2>อบรม</h2></div>
      ${renderViewSwitcher('training')}
    </div>
    <div class="card">${renderTrainingCollection(state.cache.trainings, 'training')}</div>
  `
}

function renderReports() {
  const accounts = state.cache.accounts
  const leadSources = state.cache.leadSources.map((source) => [source.name, accounts.filter((a) => a.lead_source_id === source.id).length])
  const sales = state.cache.profiles.filter((p) => p.role === ROLES.SALE).map((sale) => {
    const owned = accounts.filter((a) => a.sale_owner_id === sale.id)
    return [displayUser(sale.id), owned.length, owned.filter((a) => a.lifecycle_stage === 'customer').length, owned.filter((a) => a.lifecycle_stage === 'lost').length]
  })

  return `
    <div class="page-header">
      <div><h2>รายงาน</h2></div>
      <div class="actions"><button class="btn" type="button" data-action="print">พิมพ์</button></div>
    </div>
    <div class="grid grid-2">
      <div class="card"><h3>ตามแหล่งที่มา</h3>${simpleRowsTable(['แหล่งที่มา', 'จำนวน'], leadSources)}</div>
      <div class="card"><h3>ผลงาน Sale</h3>${simpleRowsTable(['Sale', 'บัญชี', 'ชนะ', 'ปิด'], sales)}</div>
    </div>
    <div class="card" style="margin-top:16px"><h3>เส้นทางลีด</h3>${renderMiniJourney()}</div>
  `
}

function renderAdmin() {
  return `
    <div class="page-header"><div><h2>ผู้ดูแล</h2></div></div>
    <div class="grid">
      ${renderProfilesAdmin()}
      ${MASTER_TABLES.map(renderMasterAdmin).join('')}
    </div>
  `
}

function renderProfilesAdmin() {
  const rows = state.cache.profiles.map((profile) => `
    <tr>
      <td>${escapeHTML(profile.email || '')}</td>
      <td><input value="${escapeAttr(profile.display_name || '')}" data-profile-field="display_name" data-profile-id="${profile.id}"></td>
      <td>
        <select data-profile-field="role" data-profile-id="${profile.id}">
          ${['pending', 'admin', 'mkt', 'sale', 'cs', 'manager'].map((role) => `<option value="${role}" ${profile.role === role ? 'selected' : ''}>${roleLabel(role)}</option>`).join('')}
        </select>
      </td>
      <td>
        <select data-profile-field="is_active" data-profile-id="${profile.id}">
          <option value="true" ${profile.is_active ? 'selected' : ''}>ใช้งาน</option>
          <option value="false" ${!profile.is_active ? 'selected' : ''}>ปิดใช้งาน</option>
        </select>
      </td>
      <td><button class="btn small primary" type="button" data-action="save-profile" data-id="${profile.id}">บันทึก</button></td>
    </tr>
  `).join('')

  return `
    <div class="card">
      <h3>ผู้ใช้ / สิทธิ์</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>อีเมล</th><th>ชื่อ</th><th>สิทธิ์</th><th>สถานะ</th><th></th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" class="empty">ยังไม่มีผู้ใช้</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `
}

function renderMasterAdmin(config) {
  const rows = (state.cache[config.key] || []).map((row) => {
    const usageCount = masterUsageCount(config.key, row.id)
    const canDelete = usageCount === 0
    return `
      <tr>
        <td>${escapeHTML(row[config.nameField] || '')}</td>
        <td>${row.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}</td>
        <td>${usageCount}</td>
        <td>
          <div class="actions">
            <button class="btn small" type="button" data-action="toggle-master" data-table="${config.table}" data-id="${row.id}" data-active="${row.is_active ? 'false' : 'true'}">${row.is_active ? 'ปิดใช้งาน' : 'เปิดใช้'}</button>
            ${canDelete ? `<button class="btn small danger" type="button" data-action="delete-master" data-table="${config.table}" data-cache-key="${config.key}" data-id="${row.id}">ลบ</button>` : ''}
          </div>
        </td>
      </tr>
    `
  }).join('')

  return `
    <div class="card">
      <div class="section-head">
        <h3>${escapeHTML(config.label)}</h3>
        <button class="btn small primary" type="button" data-open-modal="create-master" data-table="${escapeAttr(config.table)}" data-name-field="${escapeAttr(config.nameField)}" data-label="${escapeAttr(config.label)}">+ เพิ่ม</button>
      </div>
      <div class="table-wrap" style="margin-top:12px">
        <table>
          <thead><tr><th>ชื่อ</th><th>สถานะ</th><th>ถูกใช้</th><th></th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4" class="empty">ยังไม่มีข้อมูล</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `
}

document.addEventListener('click', async (event) => {
  const deleteBtn = event.target.closest('[data-action="delete-master"]')
  if (!deleteBtn) return
  event.preventDefault()
  event.stopImmediatePropagation()
  await withActionBusy(deleteBtn, () => deleteMaster(deleteBtn.dataset.table, deleteBtn.dataset.cacheKey, deleteBtn.dataset.id))
}, true)

async function deleteMaster(table, cacheKey, id) {
  const usage = masterUsageCount(cacheKey, id)
  if (usage > 0) {
    toast('รายการนี้ถูกใช้งานแล้ว ให้ปิดใช้งานแทน', 'warning')
    return
  }
  if (!confirm('ลบรายการนี้?')) return
  const { error } = await state.client.from(table).delete().eq('id', id)
  if (error) throw error
  await refreshData()
  toast('ลบรายการแล้ว', 'success')
}

function masterUsageCount(cacheKey, id) {
  if (!id) return 0
  if (cacheKey === 'leadSources') return state.cache.accounts.filter((row) => row.lead_source_id === id).length
  if (cacheKey === 'leadChannels') return state.cache.accounts.filter((row) => row.lead_channel_id === id).length
  if (cacheKey === 'campaigns') return state.cache.accounts.filter((row) => row.campaign_id === id).length
  if (cacheKey === 'businessTypes') return state.cache.accounts.filter((row) => row.business_type_id === id).length
  if (cacheKey === 'contactStatuses') return state.cache.accounts.filter((row) => row.contact_status_id === id).length
  if (cacheKey === 'lostReasons') return state.cache.accounts.filter((row) => row.lost_reason_id === id).length
  if (cacheKey === 'modules') return state.cache.accountModules.filter((row) => row.module_id === id).length
  return 0
}

function modalTitle(modal) {
  const map = {
    'create-mkt-lead': 'เพิ่มลีด MKT',
    'create-sales-lead': 'เพิ่มลีด Sale',
    'add-contact': 'เพิ่มผู้ติดต่อ',
    'add-activity': 'เพิ่มบันทึก',
    'request-demo': 'ขอเดโม',
    'edit-demo': 'แก้ไขเดโม',
    'add-demo-user': 'เพิ่มผู้ใช้เดโม',
    'add-training': 'เพิ่มอบรม',
    'add-training-participant': 'เพิ่มผู้เข้าร่วม',
    'customer-profile': 'ข้อมูลลูกค้า',
    'add-task': 'เพิ่มงาน',
    'mark-lost': 'ปิด Lost',
    'create-master': `เพิ่ม ${modal.label || 'ข้อมูล'}`,
    'account-overview': 'แก้ไขบัญชี'
  }
  return map[modal.type] || 'รายละเอียด'
}

function modalSubtitle(modal) {
  const account = modal.accountId ? findAccount(modal.accountId) : null
  if (account) return accountTitle(account)
  return ''
}

function renderMktLeadForm() {
  const today = todayISO()
  return `
    <form class="form-grid modal-form" data-form="create-mkt-lead" novalidate>
      ${readonlyDisplay('running_no_preview', 'เลข MKT', 'อัตโนมัติ')}
      ${readonlyDisplay('source_type_preview', 'ที่มา', 'Marketing')}
      ${selectField('lead_channel_id', 'ช่องทาง', state.cache.leadChannels, 'id', 'name', true)}
      ${selectField('campaign_id', 'แคมเปญ', state.cache.campaigns, 'id', 'name', false)}
      ${readonlyDisplay('created_at_preview', 'วันที่บันทึก', today)}
      ${inputField('contact_name', 'ผู้ติดต่อ', 'text', false)}
      ${inputField('phone', 'เบอร์หลัก', 'text', false)}
      ${inputField('email', 'อีเมล', 'email', false)}
      ${inputField('company_name', 'บริษัท', 'text', false)}
      ${multiSelectField('module_ids', 'สินค้า', state.cache.modules, 'id', 'module_name')}
      ${inputField('cars_estimate', 'จำนวนรถ', 'number', false)}
      ${readonlyDisplay('sale_assignment_preview', 'Sale ที่ได้รับงาน', 'แสดงหลังบันทึก')}
      <div class="field full" data-field="initial_note">
        <label for="mkt-initial-note">ข้อมูลลีด</label>
        <textarea id="mkt-initial-note" name="initial_note"></textarea>
        <div class="field-error" data-field-error="initial_note"></div>
      </div>
      <div class="full modal-actions">
        <button class="btn" type="button" data-close-modal>ยกเลิก</button>
        <button class="btn primary" type="submit">บันทึก</button>
      </div>
    </form>
  `
}

function renderSaleLeadForm() {
  return `
    <form class="form-grid modal-form" data-form="create-sales-lead" novalidate>
      ${inputField('company_name', 'บริษัท', 'text', false)}
      ${inputField('contact_name', 'ผู้ติดต่อ', 'text', false)}
      ${inputField('position', 'ตำแหน่ง', 'text', false)}
      ${inputField('phone', 'เบอร์หลัก', 'text', false)}
      ${inputField('phone_2', 'เบอร์ 2', 'text', false)}
      ${inputField('phone_3', 'เบอร์ 3', 'text', false)}
      ${inputField('email', 'อีเมล', 'email', false)}
      ${inputField('email_2', 'อีเมล 2', 'email', false)}
      ${inputField('tax_id', 'เลขผู้เสียภาษี', 'text', false)}
      <div class="field full" data-field="address">
        <label for="sale-address">ที่อยู่</label>
        <textarea id="sale-address" name="address"></textarea>
        <div class="field-error" data-field-error="address"></div>
      </div>
      ${selectField('business_type_id', 'ธุรกิจ', state.cache.businessTypes, 'id', 'name', false)}
      <div class="field full" data-field="initial_note">
        <label for="sale-initial-note">รายละเอียด</label>
        <textarea id="sale-initial-note" name="initial_note"></textarea>
        <div class="field-error" data-field-error="initial_note"></div>
      </div>
      ${inputField('cars_estimate', 'จำนวนรถ', 'number', false, '0')}
      ${multiSelectField('module_ids', 'สินค้า', state.cache.modules, 'id', 'module_name')}
      ${inputField('current_gps_provider', 'GPS ปัจจุบัน', 'text', false)}
      <div class="field full" data-field="note">
        <label for="sale-note">หมายเหตุ</label>
        <textarea id="sale-note" name="note"></textarea>
        <div class="field-error" data-field-error="note"></div>
      </div>
      ${readonlyDisplay('sale_email_preview', 'อีเมล Sale', state.profile?.email || state.user?.email || '-')}
      ${selectField('lead_channel_id', 'ช่องทาง', state.cache.leadChannels, 'id', 'name', true)}
      <div class="full modal-actions">
        <button class="btn" type="button" data-close-modal>ยกเลิก</button>
        <button class="btn primary" type="submit">บันทึก</button>
      </div>
    </form>
  `
}

async function createMktLead(form) {
  const values = formValues(form)
  ensureLeadMinimum(values)
  ensureRequired(values, 'lead_channel_id', 'ต้องเลือกช่องทาง', ['lead_channel_id'])
  const { data, error } = await state.client.rpc('create_mkt_lead', {
    p_company_name: nullIfBlank(values.company_name),
    p_contact_name: nullIfBlank(values.contact_name),
    p_phone: nullIfBlank(values.phone),
    p_email: nullIfBlank(values.email),
    p_lead_source_id: null,
    p_lead_channel_id: nullIfBlank(values.lead_channel_id),
    p_campaign_id: nullIfBlank(values.campaign_id),
    p_initial_note: nullIfBlank(values.initial_note),
    p_cars_estimate: numberOrNull(values.cars_estimate),
    p_module_ids: values.module_ids || []
  })
  if (error) throw error
  form.reset()
  await refreshData()
  const account = state.cache.accounts.find((item) => item.id === data)
  toast(`สร้างลีดแล้ว เลข MKT: ${account?.running_no || '-'} / Sale: ${displayUser(account?.sale_owner_id)}`, 'success')
}

async function createSalesLead(form) {
  const values = formValues(form)
  ensureLeadMinimum(values)
  ensureRequired(values, 'lead_channel_id', 'ต้องเลือกช่องทาง', ['lead_channel_id'])
  const { data, error } = await state.client.rpc('create_sales_lead', {
    p_company_name: nullIfBlank(values.company_name),
    p_contact_name: nullIfBlank(values.contact_name),
    p_position: nullIfBlank(values.position),
    p_phone: nullIfBlank(values.phone),
    p_phone_2: nullIfBlank(values.phone_2),
    p_phone_3: nullIfBlank(values.phone_3),
    p_email: nullIfBlank(values.email),
    p_email_2: nullIfBlank(values.email_2),
    p_tax_id: nullIfBlank(values.tax_id),
    p_address: nullIfBlank(values.address),
    p_business_type_id: nullIfBlank(values.business_type_id),
    p_lead_channel_id: nullIfBlank(values.lead_channel_id),
    p_initial_note: nullIfBlank(values.initial_note),
    p_cars_estimate: numberOrNull(values.cars_estimate),
    p_current_gps_provider: nullIfBlank(values.current_gps_provider),
    p_module_ids: values.module_ids || []
  })
  if (error) throw error

  if (nullIfBlank(values.note)) {
    const { error: noteError } = await state.client.from(TABLES.activities).insert({
      account_id: data,
      activity_type: 'sale_update',
      title: 'หมายเหตุจาก Sale',
      content: values.note,
      created_by: state.user.id
    })
    if (noteError) throw noteError
  }

  form.reset()
  await refreshData()
  const account = state.cache.accounts.find((item) => item.id === data)
  toast(`สร้างลีดแล้ว / Sale: ${displayUser(account?.sale_owner_id || state.user.id)}`, 'success')
}

function ensureLeadMinimum(values) {
  const hasMinimum = [values.company_name, values.contact_name, values.phone, values.phone_2, values.phone_3, values.email, values.email_2, values.initial_note]
    .some((value) => String(value || '').trim())
  if (!hasMinimum) {
    throw createValidationError('กรอกข้อมูลอย่างน้อย 1 อย่าง', ['company_name', 'contact_name', 'phone', 'email', 'initial_note'])
  }
}

async function saveAccountOverview(form) {
  const accountId = form.dataset.accountId
  const values = formValues(form)
  const payload = {
    company_name: nullIfBlank(values.company_name),
    short_name: nullIfBlank(values.short_name),
    tax_id: nullIfBlank(values.tax_id),
    address: nullIfBlank(values.address),
    cars_estimate: numberOrNull(values.cars_estimate),
    lead_channel_id: nullIfBlank(values.lead_channel_id),
    lead_source_id: nullIfBlank(values.lead_source_id),
    campaign_id: nullIfBlank(values.campaign_id),
    business_type_id: nullIfBlank(values.business_type_id),
    contact_status_id: nullIfBlank(values.contact_status_id),
    current_gps_provider: nullIfBlank(values.current_gps_provider),
    product_interest: nullIfBlank(values.product_interest)
  }
  const { error } = await state.client.from(TABLES.accounts).update(payload).eq('id', accountId)
  if (error) throw error
  await replaceAccountModules(accountId, values.module_ids || [], 'interested')
  await refreshData()
  toast('บันทึกแล้ว', 'success')
}

function matchesSearch(item, q, type) {
  const account = type === 'tasks' || type === 'training' ? findAccount(item.account_id) : item
  const contacts = account?.id ? state.cache.contacts.filter((c) => c.account_id === account.id) : []
  const haystack = [
    account?.running_no,
    account?.company_name,
    account?.short_name,
    account?.tax_id,
    account?.address,
    account?.current_gps_provider,
    masterName('leadChannels', account?.lead_channel_id),
    masterName('businessTypes', account?.business_type_id),
    account?.initial_note,
    account?.product_interest,
    item.title,
    item.description,
    item.training_detail,
    item.issue_note,
    ...contacts.flatMap((c) => [c.contact_name, c.position, c.email, c.email_2, c.phone, c.phone_2, c.phone_3])
  ].filter(Boolean).join(' ').toLowerCase()
  return haystack.includes(q)
}

function renderAccountOverviewCard(account) {
  return `
    <div class="card">
      <div class="section-head">
        <h3>ข้อมูลบัญชี</h3>
        ${!isReadOnly() ? `<button class="btn small primary" type="button" data-open-modal="account-overview" data-account-id="${account.id}">แก้ไข</button>` : ''}
      </div>
      <div class="meta-grid detail-meta">
        <div class="meta-label">บริษัท</div><div>${escapeHTML(account.company_name || '-')}</div>
        <div class="meta-label">ชื่อย่อ</div><div>${escapeHTML(account.short_name || '-')}</div>
        <div class="meta-label">เลขผู้เสียภาษี</div><div>${escapeHTML(account.tax_id || '-')}</div>
        <div class="meta-label">จำนวนรถ</div><div>${escapeHTML(String(account.cars_estimate || '-'))}</div>
        <div class="meta-label">ช่องทาง</div><div>${escapeHTML(masterName('leadChannels', account.lead_channel_id))}</div>
        <div class="meta-label">แหล่งที่มา</div><div>${escapeHTML(masterName('leadSources', account.lead_source_id))}</div>
        <div class="meta-label">แคมเปญ</div><div>${escapeHTML(masterName('campaigns', account.campaign_id))}</div>
        <div class="meta-label">ธุรกิจ</div><div>${escapeHTML(masterName('businessTypes', account.business_type_id))}</div>
        <div class="meta-label">GPS ปัจจุบัน</div><div>${escapeHTML(account.current_gps_provider || '-')}</div>
        <div class="meta-label">ที่อยู่</div><div>${escapeHTML(account.address || '-')}</div>
        <div class="meta-label">สถานะติดต่อ</div><div>${escapeHTML(masterName('contactStatuses', account.contact_status_id))}</div>
        <div class="meta-label">สินค้า</div><div>${escapeHTML(accountModuleNames(account.id).join(', ') || '-')}</div>
        <div class="meta-label">รายละเอียด</div><div>${escapeHTML(account.product_interest || account.initial_note || '-')}</div>
      </div>
    </div>
  `
}

function renderAccountOverviewForm(account) {
  const disabled = isReadOnly() ? 'disabled' : ''
  return `
    <form class="card" data-form="account-overview" data-account-id="${account.id}">
      <h3>ข้อมูลบัญชี</h3>
      <div class="form-grid">
        ${inputField('company_name', 'บริษัท', 'text', false, account.company_name || '', disabled)}
        ${inputField('short_name', 'ชื่อย่อ', 'text', false, account.short_name || '', disabled)}
        ${inputField('tax_id', 'เลขผู้เสียภาษี', 'text', false, account.tax_id || '', disabled)}
        ${inputField('cars_estimate', 'จำนวนรถ', 'number', false, account.cars_estimate || '', disabled)}
        ${selectField('lead_channel_id', 'ช่องทาง', state.cache.leadChannels, 'id', 'name', false, account.lead_channel_id || '', disabled)}
        ${selectField('lead_source_id', 'แหล่งที่มา', state.cache.leadSources, 'id', 'name', false, account.lead_source_id || '', disabled)}
        ${selectField('campaign_id', 'แคมเปญ', state.cache.campaigns, 'id', 'name', false, account.campaign_id || '', disabled)}
        ${selectField('business_type_id', 'ธุรกิจ', state.cache.businessTypes, 'id', 'name', false, account.business_type_id || '', disabled)}
        ${selectField('contact_status_id', 'สถานะติดต่อ', state.cache.contactStatuses, 'id', 'name', false, account.contact_status_id || '', disabled)}
        ${inputField('current_gps_provider', 'GPS ปัจจุบัน', 'text', false, account.current_gps_provider || '', disabled)}
        <div class="field full" data-field="address">
          <label>ที่อยู่</label>
          <textarea name="address" ${disabled}>${escapeHTML(account.address || '')}</textarea>
          <div class="field-error" data-field-error="address"></div>
        </div>
        ${multiSelectField('module_ids', 'สินค้า', state.cache.modules, 'id', 'module_name', accountModuleIds(account.id), disabled)}
        <div class="field full">
          <label>รายละเอียด</label>
          <textarea name="product_interest" ${disabled}>${escapeHTML(account.product_interest || account.initial_note || '')}</textarea>
        </div>
        <div class="full actions"><button class="btn primary" type="submit" ${disabled}>บันทึก</button></div>
      </div>
    </form>
  `
}

function renderAccountMeta(account) {
  const contacts = state.cache.contacts.filter((c) => c.account_id === account.id)
  const csOwners = state.cache.accountCsOwners.filter((o) => o.account_id === account.id).map((o) => displayUser(o.cs_user_id)).join(', ') || '-'
  return `
    <div class="card">
      <h3>ข้อมูลระบบ</h3>
      <div class="meta-grid">
        <div class="meta-label">เลข MKT</div><div>${renderRunningNo(account)}</div>
        <div class="meta-label">ประเภท</div><div>${escapeHTML(account.source_type || '-')}</div>
        <div class="meta-label">Sale Owner</div><div>${escapeHTML(displayUser(account.sale_owner_id))}</div>
        <div class="meta-label">CS Owner</div><div>${escapeHTML(csOwners)}</div>
        <div class="meta-label">ช่องทาง</div><div>${escapeHTML(masterName('leadChannels', account.lead_channel_id))}</div>
        <div class="meta-label">แหล่งที่มา</div><div>${escapeHTML(masterName('leadSources', account.lead_source_id))}</div>
        <div class="meta-label">แคมเปญ</div><div>${escapeHTML(masterName('campaigns', account.campaign_id))}</div>
        <div class="meta-label">ธุรกิจ</div><div>${escapeHTML(masterName('businessTypes', account.business_type_id))}</div>
        <div class="meta-label">ผู้ติดต่อ</div><div>${contacts.length}</div>
        <div class="meta-label">สร้างเมื่อ</div><div>${formatDateTime(account.created_at)}</div>
        <div class="meta-label">อัปเดต</div><div>${formatDateTime(account.updated_at)}</div>
      </div>
    </div>
  `
}

function renderCollectionToolbar(key, type, rawTotal, filteredTotal) {
  const filter = getFilter(key)
  const owners = state.cache.profiles.filter((p) => p.is_active || p.role !== ROLES.PENDING)
  return `
    <div class="filter-panel" data-filter-panel="${key}">
      <div class="filter-row">
        <label class="search-field">
          <span>ค้นหา</span>
          <input type="search" value="${escapeAttr(filter.q || '')}" data-filter-control data-filter-key="${key}" data-filter-name="q" placeholder="ค้นหาเลข MKT, บริษัท, ผู้ติดต่อ, เบอร์, อีเมล">
        </label>
        ${type === 'accounts' ? selectFilter(key, 'stage', 'Stage', [['', 'ทั้งหมด'], ['lead', 'ลีด'], ['demo', 'เดโม'], ['customer', 'ลูกค้า'], ['lost', 'ปิดแล้ว']], filter.stage || '') : ''}
        ${type === 'accounts' || type === 'tasks' || type === 'training' ? selectFilter(key, 'status', 'สถานะ', filterOptionsFor(type, key, 'status'), filter.status || '') : ''}
        ${selectFilter(key, 'owner', 'ผู้รับผิดชอบ', [['', 'ทุกคน']].concat(owners.map((p) => [p.id, displayUser(p.id)])), filter.owner || '')}
      </div>
      <div class="filter-row secondary">
        ${type === 'accounts' ? selectFilter(key, 'channel', 'ช่องทาง', [['', 'ทุกช่องทาง']].concat(state.cache.leadChannels.map((r) => [r.id, r.name])), filter.channel || '') : ''}
        ${type === 'accounts' ? selectFilter(key, 'source', 'แหล่งที่มา', [['', 'ทุกแหล่ง']].concat(state.cache.leadSources.map((r) => [r.id, r.name])), filter.source || '') : ''}
        ${type === 'accounts' ? selectFilter(key, 'campaign', 'แคมเปญ', [['', 'ทุกแคมเปญ']].concat(state.cache.campaigns.map((r) => [r.id, r.name])), filter.campaign || '') : ''}
        ${type === 'accounts' ? selectFilter(key, 'businessType', 'ธุรกิจ', [['', 'ทุกธุรกิจ']].concat(state.cache.businessTypes.map((r) => [r.id, r.name])), filter.businessType || '') : ''}
        ${type === 'tasks' ? selectFilter(key, 'priority', 'ความสำคัญ', [['', 'ทั้งหมด'], ['low', 'ต่ำ'], ['medium', 'กลาง'], ['high', 'สูง'], ['urgent', 'ด่วน']], filter.priority || '') : ''}
        ${selectFilter(key, 'sort', 'เรียง', sortOptionsFor(type), filter.sort || '')}
        ${selectFilter(key, 'pageSize', 'แถว', [['10', '10'], ['25', '25'], ['50', '50'], ['100', '100']], String(filter.pageSize || 25))}
        <button class="btn small" type="button" data-action="clear-filters" data-filter-key="${key}">ล้าง</button>
        <span class="result-count">${filteredTotal} / ${rawTotal}</span>
      </div>
    </div>
  `
}

function filterOptionsFor(type, key, name) {
  if (type === 'tasks') return [['', 'ทุกสถานะ'], ['open', 'เปิด'], ['in_progress', 'กำลังทำ'], ['blocked', 'ติดปัญหา'], ['done', 'เสร็จแล้ว'], ['cancelled', 'ยกเลิก']]
  if (type === 'training') return [['', 'ทุกสถานะ'], ['planned', 'วางแผน'], ['done', 'เสร็จแล้ว'], ['cancelled', 'ยกเลิก']]
  return [['', 'ทุกสถานะ'], ['new', 'ใหม่'], ['assigned', 'มอบหมายแล้ว'], ['contacted', 'ติดต่อแล้ว'], ['follow_up', 'ติดตามต่อ'], ['demo_requested', 'ขอเดโม'], ['customer_active', 'ลูกค้าใช้งาน'], ['lost', 'ปิด Lost'], ['churned', 'เลิกใช้งาน']]
}

function sortOptionsFor(type) {
  if (type === 'tasks') return [['due_asc', 'กำหนดใกล้สุด'], ['updated_desc', 'อัปเดตล่าสุด'], ['priority_desc', 'ความสำคัญสูงสุด']]
  if (type === 'training') return [['date_asc', 'วันที่ใกล้สุด'], ['updated_desc', 'อัปเดตล่าสุด']]
  return [['updated_desc', 'อัปเดตล่าสุด'], ['created_desc', 'สร้างล่าสุด'], ['running_asc', 'เลข MKT น้อยไปมาก'], ['name_asc', 'ชื่อ A-Z']]
}

function renderAccountTable(items) {
  if (!items.length) return emptyState('ไม่พบข้อมูล', '')
  const rows = items.map((a) => `
    <tr>
      <td>${renderRunningNo(a)}</td>
      <td><button class="btn small" type="button" data-nav-account="${a.id}">${escapeHTML(accountTitle(a))}</button></td>
      <td>${badge(a.lifecycle_stage)}</td>
      <td>${badge(a.lifecycle_status || '-')}</td>
      <td>${escapeHTML(displayUser(a.sale_owner_id))}</td>
      <td>${escapeHTML(masterName('leadChannels', a.lead_channel_id))}</td>
      <td>${escapeHTML(masterName('campaigns', a.campaign_id))}</td>
      <td>${escapeHTML(masterName('businessTypes', a.business_type_id))}</td>
      <td>${escapeHTML(String(a.cars_estimate || '-'))}</td>
      <td>${formatDateTime(a.updated_at)}</td>
    </tr>
  `).join('')
  return `<div class="table-wrap responsive-table"><table><thead><tr><th>เลข</th><th>บัญชี</th><th>ช่วง</th><th>สถานะ</th><th>Sale</th><th>ช่องทาง</th><th>แคมเปญ</th><th>ธุรกิจ</th><th>รถ</th><th>อัปเดต</th></tr></thead><tbody>${rows}</tbody></table></div>`
}

function renderAccountList(items) {
  if (!items.length) return emptyState('ไม่พบข้อมูล', '')
  return `
    <div class="list-view">
      ${items.map((a) => `
        <div class="list-item">
          <div class="list-title">
            <span>${escapeHTML(accountTitle(a))}</span>
            <span>${badge(a.lifecycle_stage)} ${badge(a.lifecycle_status || '-')}</span>
          </div>
          <div class="list-meta">
            ${renderRunningNo(a)} · Sale: ${escapeHTML(displayUser(a.sale_owner_id))} · รถ: ${escapeHTML(String(a.cars_estimate || '-'))}<br>
            ช่องทาง: ${escapeHTML(masterName('leadChannels', a.lead_channel_id))} · แคมเปญ: ${escapeHTML(masterName('campaigns', a.campaign_id))} · ธุรกิจ: ${escapeHTML(masterName('businessTypes', a.business_type_id))}
          </div>
          <div class="actions"><button class="btn small" type="button" data-nav-account="${a.id}">เปิด</button></div>
        </div>
      `).join('')}
    </div>
  `
}

function renderRunningNo(account) {
  if (!account?.running_no) return '<span class="muted">-</span>'
  return `#${escapeHTML(String(account.running_no))}`
}

function readonlyDisplay(name, label, value) {
  const id = fieldId(name)
  return `
    <div class="field readonly-field" data-field="${escapeAttr(name)}">
      <label for="${escapeAttr(id)}">${escapeHTML(label)}</label>
      <input id="${escapeAttr(id)}" type="text" value="${escapeAttr(value || '-')}" disabled>
    </div>
  `
}

function activeSalesNames() {
  const sales = state.cache.profiles
    .filter((profile) => profile.role === ROLES.SALE && profile.is_active)
    .map((profile) => displayUser(profile.id))
    .filter(Boolean)
  return sales.join(', ')
}

async function createMaster(form) {
  const values = formValues(form)
  const nameField = form.dataset.nameField
  const payload = { [nameField]: values.name, is_active: true }
  const { error } = await state.client.from(form.dataset.table).insert(payload)
  if (error) throw error
  form.reset()
  await refreshData()
  toast('เพิ่มข้อมูลแล้ว', 'success')
}

async function toggleMaster(table, id, active) {
  const { error } = await state.client.from(table).update({ is_active: active }).eq('id', id)
  if (error) throw error
  await refreshData()
  toast('อัปเดตแล้ว', 'success')
}

