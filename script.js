
/*
  Internal CRM Ops
  Version: 1.0.1
  Stack: GitHub Pages + Supabase
  Files: README.md, index.html, script.js, style.css
*/

const APP_VERSION = '1.0.1'

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
  { key: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'mkt', 'sale', 'cs', 'manager'] },
  { key: 'leads', label: 'Leads', icon: '🎯', roles: ['admin', 'mkt', 'sale', 'manager'] },
  { key: 'accounts', label: 'Accounts', icon: '🏢', roles: ['admin', 'mkt', 'sale', 'cs', 'manager'] },
  { key: 'demo', label: 'Demo', icon: '🧪', roles: ['admin', 'sale', 'cs', 'manager'] },
  { key: 'customers', label: 'Customers', icon: '🤝', roles: ['admin', 'sale', 'cs', 'manager'] },
  { key: 'tasks', label: 'Tasks', icon: '✅', roles: ['admin', 'sale', 'cs', 'manager'] },
  { key: 'training', label: 'Training', icon: '🎓', roles: ['admin', 'sale', 'cs', 'manager'] },
  { key: 'reports', label: 'Reports', icon: '📈', roles: ['admin', 'manager'] },
  { key: 'admin', label: 'Admin', icon: '⚙️', roles: ['admin'] }
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
  accountModules: 'account_modules',
  tasks: 'tasks',
  taskComments: 'task_comments',
  assignmentHistory: 'assignment_history',
  statusHistory: 'status_history',
  lostReasons: 'lost_reasons',
  leadSources: 'lead_sources',
  campaigns: 'campaigns',
  contactStatuses: 'contact_statuses',
  accountCsOwners: 'account_cs_owners',
  appSettings: 'app_settings'
}

const MASTER_TABLES = [
  { key: 'leadSources', table: TABLES.leadSources, label: 'Lead Sources', nameField: 'name' },
  { key: 'campaigns', table: TABLES.campaigns, label: 'Campaigns', nameField: 'name' },
  { key: 'modules', table: TABLES.modules, label: 'Modules', nameField: 'module_name' },
  { key: 'contactStatuses', table: TABLES.contactStatuses, label: 'Contact Statuses', nameField: 'name' },
  { key: 'lostReasons', table: TABLES.lostReasons, label: 'Lost Reasons', nameField: 'reason_name' }
]

const STAGE_LABELS = {
  lead: 'Lead',
  demo: 'Demo',
  customer: 'Customer',
  lost: 'Lost'
}

const STATUS_LABELS = {
  new: 'New',
  assigned: 'Assigned',
  contacted: 'Contacted',
  follow_up: 'Follow-up',
  demo_requested: 'Demo Requested',
  demo_active: 'Demo Active',
  customer_active: 'Customer Active',
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
    accountModules: [],
    tasks: [],
    taskComments: [],
    assignmentHistory: [],
    statusHistory: [],
    lostReasons: [],
    leadSources: [],
    campaigns: [],
    contactStatuses: [],
    accountCsOwners: []
  }
}

const app = document.getElementById('app')
const toastRoot = document.getElementById('toast-root')

document.addEventListener('DOMContentLoaded', init)
window.addEventListener('hashchange', () => render())
document.addEventListener('click', onClick)
document.addEventListener('submit', onSubmit)
document.addEventListener('change', onChange)

async function init() {
  if (!isConfigured()) {
    renderSetupRequired()
    return
  }

  try {
    state.client = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
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
  if (isActiveUser()) {
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

function isActiveUser() {
  return Boolean(state.profile && state.profile.is_active && state.profile.role !== ROLES.PENDING)
}

function hasRole(roles) {
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
    ['accountModules', TABLES.accountModules, '*', 'created_at'],
    ['tasks', TABLES.tasks, '*', 'due_at'],
    ['taskComments', TABLES.taskComments, '*', 'created_at'],
    ['assignmentHistory', TABLES.assignmentHistory, '*', 'created_at'],
    ['statusHistory', TABLES.statusHistory, '*', 'created_at'],
    ['lostReasons', TABLES.lostReasons, '*', 'reason_name'],
    ['leadSources', TABLES.leadSources, '*', 'name'],
    ['campaigns', TABLES.campaigns, '*', 'name'],
    ['contactStatuses', TABLES.contactStatuses, '*', 'name'],
    ['accountCsOwners', TABLES.accountCsOwners, '*', 'created_at']
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

  if (!isActiveUser()) {
    renderPending()
    return
  }

  const route = getRoute()
  const nav = route.key === 'account'
    ? { key: 'accounts', label: 'Account Detail', roles: ['admin', 'mkt', 'sale', 'cs', 'manager'] }
    : ROUTES.find((item) => item.key === route.key)

  if (!nav || !hasRole(nav.roles)) {
    location.hash = '#/dashboard'
    return
  }

  app.innerHTML = `
    <div class="app-layout">
      ${renderSidebar(nav.key)}
      <main class="main">
        ${renderTopbar(nav.label)}
        <section class="content" id="page-content">
          ${renderRoute(route)}
        </section>
      </main>
    </div>
  `
}

function renderSidebar(activeKey) {
  const links = ROUTES
    .filter((item) => hasRole(item.roles))
    .map((item) => `
      <button class="nav-link ${activeKey === item.key ? 'active' : ''}" data-nav="${item.key}" type="button">
        <span>${item.icon}</span><span>${escapeHTML(item.label)}</span>
      </button>
    `).join('')

  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">CRM</div>
        <div>
          <span class="brand-title">Internal CRM Ops</span>
          <span class="brand-version">v${APP_VERSION}</span>
        </div>
      </div>
      <nav class="nav">${links}</nav>
      <div class="sidebar-footer">
        <div>${escapeHTML(roleLabel(state.profile.role))}</div>
        <div>${escapeHTML(state.profile.display_name || state.profile.email || '')}</div>
      </div>
    </aside>
  `
}

function renderTopbar(title) {
  return `
    <header class="topbar">
      <div>
        <h1>${escapeHTML(title)}</h1>
      </div>
      <div class="user-chip">
        <span>${escapeHTML(state.profile.display_name || state.profile.email || '')}</span>
        <button class="btn small" type="button" data-action="refresh-data">Refresh</button>
        <button class="btn small" type="button" data-action="logout">Logout</button>
      </div>
    </header>
  `
}

function renderRoute(route) {
  if (route.key === 'dashboard') return renderDashboard()
  if (route.key === 'leads') return renderLeads()
  if (route.key === 'accounts') return renderAccounts()
  if (route.key === 'account') return renderAccountDetail(route.id)
  if (route.key === 'demo') return renderDemo()
  if (route.key === 'customers') return renderCustomers()
  if (route.key === 'tasks') return renderTasks()
  if (route.key === 'training') return renderTraining()
  if (route.key === 'reports') return renderReports()
  if (route.key === 'admin') return renderAdmin()
  return renderDashboard()
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
    <div class="center-screen">
      <form class="login-card" data-form="login">
        <h1>Internal CRM Ops</h1>
        <p>เข้าสู่ระบบด้วยบัญชีที่สร้างไว้ใน Supabase Auth</p>
        <div class="form-grid single">
          <div class="field">
            <label>Email</label>
            <input name="email" type="email" required autocomplete="email">
          </div>
          <div class="field">
            <label>Password</label>
            <input name="password" type="password" required autocomplete="current-password">
          </div>
          <button class="btn primary" type="submit">Login</button>
        </div>
      </form>
    </div>
  `
}

function renderPending() {
  app.innerHTML = `
    <div class="center-screen">
      <div class="pending-card">
        <h1>บัญชียังไม่พร้อมใช้งาน</h1>
        <p>Admin ต้องกำหนด role และเปิด <code>is_active</code> ในหน้า Admin หรือในตาราง <code>profiles</code> ก่อน</p>
        <div class="meta-grid">
          <div class="meta-label">Email</div><div>${escapeHTML(state.user.email || '')}</div>
          <div class="meta-label">Role</div><div>${escapeHTML(state.profile?.role || 'pending')}</div>
          <div class="meta-label">Active</div><div>${state.profile?.is_active ? 'Yes' : 'No'}</div>
        </div>
        <hr>
        <button class="btn" type="button" data-action="logout">Logout</button>
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
  const overdue = tasks.filter((t) => t.status !== 'done' && t.due_at && new Date(t.due_at) < startOfToday())
  const todayTrainings = state.cache.trainings.filter((t) => t.training_date === todayISO())

  return `
    <div class="page-header">
      <div>
        <h2>ภาพรวมระบบ</h2>
        <p>สรุป Lead, Demo, Customer, Lost, Task และ Training ตามสิทธิ์ของผู้ใช้</p>
      </div>
      <div class="actions">
        <button class="btn" type="button" data-action="print">Print</button>
      </div>
    </div>

    <div class="grid grid-4">
      ${renderKpi('Lead', leads.length, 'กำลัง qualify')}
      ${renderKpi('Demo', demos.length, 'อยู่ใน demo flow')}
      ${renderKpi('Customer', customers.length, 'ลูกค้าปัจจุบัน')}
      ${renderKpi('Lost/Churn', lost.length, 'ปิดเป็น lost')}
    </div>

    <div class="grid grid-3" style="margin-top:16px">
      ${renderKpi('Open Tasks', tasks.filter((t) => !['done', 'cancelled'].includes(t.status)).length, 'งานที่ยังไม่ปิด')}
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
  const leads = state.cache.accounts.filter((a) => a.lifecycle_stage === 'lead')
  return `
    <div class="page-header">
      <div>
        <h2>Lead Inbox</h2>
        <p>MKT Lead มี Running No. อัตโนมัติ ส่วน Sale-created Lead ไม่มี Running No.</p>
      </div>
    </div>

    ${renderLeadCreatePanel()}

    <div class="card" style="margin-top:16px">
      <div class="page-header">
        <div>
          <h3>Lead List</h3>
          <p>${leads.length} รายการ</p>
        </div>
        ${renderViewSwitcher('leads')}
      </div>
      ${renderAccountsCollection(leads, 'leads')}
    </div>
  `
}

function renderLeadCreatePanel() {
  const canCreateMkt = hasRole([ROLES.ADMIN, ROLES.MKT])
  const canCreateSale = hasRole([ROLES.ADMIN, ROLES.SALE])
  if (!canCreateMkt && !canCreateSale) return ''

  return `
    <div class="grid grid-2">
      ${canCreateMkt ? renderMktLeadForm() : ''}
      ${canCreateSale ? renderSaleLeadForm() : ''}
    </div>
  `
}

function renderMktLeadForm() {
  return `
    <form class="card" data-form="create-mkt-lead">
      <h3>สร้าง MKT Lead</h3>
      <p class="card-subtitle">ชื่อบริษัทไม่บังคับ แต่ต้องมีข้อมูลขั้นต่ำอย่างน้อย 1 อย่าง</p>
      <div class="form-grid">
        ${inputField('company_name', 'ชื่อบริษัท', 'text', false)}
        ${inputField('contact_name', 'ชื่อผู้ติดต่อ', 'text', false)}
        ${inputField('phone', 'เบอร์โทร', 'text', false)}
        ${inputField('email', 'อีเมล', 'email', false)}
        ${selectField('lead_source_id', 'แหล่งที่มา Lead', state.cache.leadSources, 'id', 'name', false)}
        ${selectField('campaign_id', 'แคมเปญ', state.cache.campaigns, 'id', 'name', false)}
        ${inputField('cars_estimate', 'จำนวนรถโดยประมาณ', 'number', false)}
        ${multiSelectField('module_ids', 'Module ที่สนใจ', state.cache.modules, 'id', 'module_name')}
        <div class="field full">
          <label>รายละเอียดเบื้องต้น</label>
          <textarea name="initial_note"></textarea>
        </div>
        <div class="full actions">
          <button class="btn primary" type="submit">Create MKT Lead</button>
        </div>
      </div>
    </form>
  `
}

function renderSaleLeadForm() {
  return `
    <form class="card" data-form="create-sales-lead">
      <h3>Sale สร้าง Lead เอง</h3>
      <p class="card-subtitle">ไม่มี Running No. และ owner คือ Sale ที่สร้าง</p>
      <div class="form-grid">
        ${inputField('company_name', 'ชื่อบริษัท', 'text', false)}
        ${inputField('contact_name', 'ชื่อผู้ติดต่อ', 'text', false)}
        ${inputField('phone', 'เบอร์โทร', 'text', false)}
        ${inputField('email', 'อีเมล', 'email', false)}
        ${selectField('contact_status_id', 'สถานะการติดต่อ', state.cache.contactStatuses, 'id', 'name', false)}
        ${inputField('cars_estimate', 'จำนวนรถโดยประมาณ', 'number', false)}
        ${multiSelectField('module_ids', 'Module ที่สนใจ', state.cache.modules, 'id', 'module_name')}
        <div class="field full">
          <label>รายละเอียด Lead</label>
          <textarea name="initial_note"></textarea>
        </div>
        <div class="full actions">
          <button class="btn primary" type="submit">Create Sale Lead</button>
        </div>
      </div>
    </form>
  `
}

function renderAccounts() {
  const accounts = state.cache.accounts
  return `
    <div class="page-header">
      <div>
        <h2>Accounts</h2>
        <p>ข้อมูลกลางของ Lead / Demo / Customer / Lost</p>
      </div>
      ${renderViewSwitcher('accounts')}
    </div>
    ${renderAccountsCollection(accounts, 'accounts')}
  `
}

function renderDemo() {
  const demoAccounts = state.cache.accounts.filter((a) => a.lifecycle_stage === 'demo')
  return `
    <div class="page-header">
      <div>
        <h2>Demo Queue</h2>
        <p>CS เห็น Demo ร่วมกันทั้งทีม และสามารถเลือก CS owner ได้มากกว่า 1 คน</p>
      </div>
      ${renderViewSwitcher('demo')}
    </div>
    ${renderAccountsCollection(demoAccounts, 'demo')}
  `
}

function renderCustomers() {
  const customers = state.cache.accounts.filter((a) => a.lifecycle_stage === 'customer')
  return `
    <div class="page-header">
      <div>
        <h2>Customers</h2>
        <p>ข้อมูลลูกค้า จำนวนรถ Module Billing Engagement และ Task</p>
      </div>
      ${renderViewSwitcher('customers')}
    </div>
    ${renderAccountsCollection(customers, 'customers')}
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
  const leadSources = state.cache.leadSources.map((source) => {
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
      <div class="actions"><button class="btn" type="button" data-action="print">Print</button></div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <h3>Lead by Source</h3>
        ${simpleRowsTable(['Source', 'Count'], leadSources)}
      </div>
      <div class="card">
        <h3>Sale Performance</h3>
        ${simpleRowsTable(['Sale', 'Accounts', 'Won', 'Lost'], sales)}
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
          <option value="true" ${profile.is_active ? 'selected' : ''}>Active</option>
          <option value="false" ${!profile.is_active ? 'selected' : ''}>Inactive</option>
        </select>
      </td>
      <td><button class="btn small primary" type="button" data-action="save-profile" data-id="${profile.id}">Save</button></td>
    </tr>
  `).join('')

  return `
    <div class="card">
      <h3>Users / Roles</h3>
      <p class="card-subtitle">User ต้องถูกสร้างใน Supabase Auth ก่อน แล้ว Admin มากำหนด role/is_active ที่นี่</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Email</th><th>Display Name</th><th>Role</th><th>Status</th><th></th></tr></thead>
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
      <td>${row.is_active ? 'Active' : 'Inactive'}</td>
      <td>
        <button class="btn small" type="button" data-action="toggle-master" data-table="${config.table}" data-id="${row.id}" data-active="${row.is_active ? 'false' : 'true'}">
          ${row.is_active ? 'Disable' : 'Enable'}
        </button>
      </td>
    </tr>
  `).join('')

  return `
    <div class="card">
      <h3>${escapeHTML(config.label)}</h3>
      <form class="actions" data-form="create-master" data-table="${config.table}" data-name-field="${config.nameField}">
        <input name="name" placeholder="เพิ่มรายการใหม่" required>
        <button class="btn primary" type="submit">Add</button>
      </form>
      <div class="table-wrap" style="margin-top:12px">
        <table>
          <thead><tr><th>Name</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows || '<tr><td colspan="3" class="empty">ยังไม่มี master data</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `
}

function renderAccountDetail(accountId) {
  const account = state.cache.accounts.find((item) => item.id === accountId)
  if (!account) {
    return `
      <div class="card">
        <h2>ไม่พบ Account</h2>
        <p class="muted">อาจไม่มีสิทธิ์เข้าถึง หรือข้อมูลถูกลบ</p>
      </div>
    `
  }

  return `
    <div class="page-header">
      <div>
        <h2>${escapeHTML(accountTitle(account))}</h2>
        <p>${renderRunningNo(account)} ${badge(account.lifecycle_stage)} ${badge(account.lifecycle_status || '-')}</p>
      </div>
      <div class="actions">
        <button class="btn" type="button" data-nav="accounts">Back</button>
        <button class="btn" type="button" data-action="print">Print</button>
      </div>
    </div>

    <div class="detail-layout">
      <div class="stack">
        ${renderAccountOverviewForm(account)}
        ${renderContactsCard(account)}
        ${renderActivitiesCard(account)}
        ${renderDemoCard(account)}
        ${renderTrainingCard(account)}
        ${renderCustomerCard(account)}
        ${renderTasksCard(account)}
      </div>
      <aside class="stack">
        ${renderAccountActions(account)}
        ${renderAccountMeta(account)}
        ${renderHistoryCard(account)}
      </aside>
    </div>
  `
}

function renderAccountOverviewForm(account) {
  const disabled = isReadOnly() ? 'disabled' : ''
  return `
    <form class="card" data-form="account-overview" data-account-id="${account.id}">
      <h3>Account Overview</h3>
      <div class="form-grid">
        ${inputField('company_name', 'ชื่อบริษัท', 'text', false, account.company_name || '', disabled)}
        ${inputField('short_name', 'Short Name', 'text', false, account.short_name || '', disabled)}
        ${inputField('tax_id', 'Tax ID', 'text', false, account.tax_id || '', disabled)}
        ${inputField('cars_estimate', 'จำนวนรถ', 'number', false, account.cars_estimate || '', disabled)}
        ${selectField('lead_source_id', 'แหล่งที่มา Lead', state.cache.leadSources, 'id', 'name', false, account.lead_source_id || '', disabled)}
        ${selectField('campaign_id', 'แคมเปญ', state.cache.campaigns, 'id', 'name', false, account.campaign_id || '', disabled)}
        ${selectField('contact_status_id', 'สถานะการติดต่อ', state.cache.contactStatuses, 'id', 'name', false, account.contact_status_id || '', disabled)}
        ${multiSelectField('module_ids', 'Modules', state.cache.modules, 'id', 'module_name', accountModuleIds(account.id), disabled)}
        <div class="field full">
          <label>รายละเอียด / Product Interest</label>
          <textarea name="product_interest" ${disabled}>${escapeHTML(account.product_interest || account.initial_note || '')}</textarea>
        </div>
        <div class="full actions">
          <button class="btn primary" type="submit" ${disabled}>Save Overview</button>
        </div>
      </div>
    </form>
  `
}

function renderContactsCard(account) {
  const contacts = state.cache.contacts.filter((c) => c.account_id === account.id)
  const rows = contacts.map((c) => `
    <tr>
      <td>${escapeHTML(c.contact_name || '-')}</td>
      <td>${escapeHTML(c.email || '-')}</td>
      <td>${escapeHTML(c.phone || '-')}</td>
      <td>${escapeHTML(c.contact_role || '-')}</td>
    </tr>
  `).join('')

  return `
    <div class="card">
      <h3>Contacts</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ชื่อ</th><th>Email</th><th>Phone</th><th>Role</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4" class="empty">ยังไม่มีผู้ติดต่อ</td></tr>'}</tbody>
        </table>
      </div>
      ${!isReadOnly() ? `
        <form class="form-grid" style="margin-top:14px" data-form="add-contact" data-account-id="${account.id}">
          ${inputField('contact_name', 'ชื่อผู้ติดต่อ', 'text', true)}
          ${inputField('email', 'Email', 'email', false)}
          ${inputField('phone', 'Phone', 'text', false)}
          ${inputField('contact_role', 'Role', 'text', false, 'primary')}
          <div class="full actions"><button class="btn primary" type="submit">Add Contact</button></div>
        </form>
      ` : ''}
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
        <span>${escapeHTML(activity.title || activity.activity_type || 'Note')}</span>
        <span class="muted">${formatDateTime(activity.created_at)}</span>
      </div>
      <div class="list-meta">${escapeHTML(activity.content || '')}</div>
      ${activity.next_follow_up_at ? `<div>${badge('Follow-up: ' + formatDateTime(activity.next_follow_up_at))}</div>` : ''}
    </div>
  `).join('')

  return `
    <div class="card">
      <h3>Activities / Notes</h3>
      <div class="list-view">${items || '<div class="empty">ยังไม่มี activity</div>'}</div>
      ${!isReadOnly() ? `
        <form class="form-grid" style="margin-top:14px" data-form="add-activity" data-account-id="${account.id}">
          ${selectStaticField('activity_type', 'Type', ['note', 'call', 'follow_up', 'mkt_update', 'sale_update', 'cs_update'], false)}
          ${inputField('title', 'Title', 'text', false)}
          <div class="field full"><label>Content</label><textarea name="content" required></textarea></div>
          ${inputField('next_follow_up_at', 'Next Follow-up', 'datetime-local', false)}
          <div class="full actions"><button class="btn primary" type="submit">Add Activity</button></div>
        </form>
      ` : ''}
    </div>
  `
}

function renderDemoCard(account) {
  const demos = state.cache.demos.filter((d) => d.account_id === account.id)
  const demoRows = demos.map((demo) => `
    <tr>
      <td>${badge(demo.demo_status || '-')}</td>
      <td>${formatDate(demo.start_date)}</td>
      <td>${formatDate(demo.end_date)}</td>
      <td>${escapeHTML(demo.demo_result || '-')}</td>
    </tr>
  `).join('')

  return `
    <div class="card">
      <h3>Demo</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Status</th><th>Start</th><th>End</th><th>Result</th></tr></thead>
          <tbody>${demoRows || '<tr><td colspan="4" class="empty">ยังไม่มี Demo</td></tr>'}</tbody>
        </table>
      </div>
      ${demos.map(renderDemoDetail).join('')}
      ${!isReadOnly() ? renderRequestDemoForm(account) : ''}
    </div>
  `
}

function renderDemoDetail(demo) {
  const users = state.cache.demoUsers.filter((u) => u.demo_session_id === demo.id)
  const logs = state.cache.demoLogs.filter((l) => l.demo_session_id === demo.id).slice(0, 6)
  const disabled = isReadOnly() ? 'disabled' : ''

  return `
    <div class="card compact" style="margin-top:12px">
      <h3>Demo Detail: ${formatDate(demo.start_date)} - ${formatDate(demo.end_date)}</h3>
      <form class="form-grid" data-form="update-demo" data-demo-id="${demo.id}">
        ${selectStaticField('demo_status', 'Demo Status', ['requested', 'active', 'extended', 'ended', 'cancelled', 'converted', 'lost'], true, demo.demo_status || 'requested', disabled)}
        ${inputField('start_date', 'วันที่เริ่ม', 'date', false, demo.start_date || '', disabled)}
        ${inputField('end_date', 'วันที่สิ้นสุด', 'date', false, demo.end_date || '', disabled)}
        <div class="field full"><label>ผลการ Demo</label><textarea name="demo_result" ${disabled}>${escapeHTML(demo.demo_result || '')}</textarea></div>
        <div class="field full"><label>Requirement</label><textarea name="requirement_note" ${disabled}>${escapeHTML(demo.requirement_note || '')}</textarea></div>
        <div class="field full"><label>Follow-up Note</label><textarea name="follow_up_note" ${disabled}>${escapeHTML(demo.follow_up_note || '')}</textarea></div>
        <div class="full actions"><button class="btn primary" type="submit" ${disabled}>Save Demo</button></div>
      </form>

      <h3 style="margin-top:14px">Demo Users</h3>
      ${simpleRowsTable(['Email', 'Name', 'Password'], users.map((u) => [u.user_email || '-', u.user_name || '-', u.demo_password || '-']))}
      ${!isReadOnly() ? `
        <form class="form-grid" style="margin-top:12px" data-form="add-demo-user" data-demo-id="${demo.id}" data-account-id="${demo.account_id}">
          ${inputField('user_email', 'อีเมลผู้ใช้งาน', 'email', true)}
          ${inputField('user_name', 'ชื่อผู้ใช้งาน', 'text', false)}
          ${inputField('demo_password', 'รหัสผ่าน Demo', 'text', false)}
          <div class="full actions"><button class="btn primary" type="submit">Add Demo User</button></div>
        </form>
      ` : ''}

      <h3 style="margin-top:14px">Demo Logs</h3>
      <div class="list-view">${logs.map((log) => `<div class="list-item"><div class="list-title">${escapeHTML(log.log_type || 'log')}<span class="muted">${formatDateTime(log.created_at)}</span></div><div class="list-meta">${escapeHTML(log.message || '')}</div></div>`).join('') || '<div class="empty">ยังไม่มี log</div>'}</div>
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
      ${multiSelectField('cs_owner_ids', 'CS Owners', csProfiles, 'id', 'display_name')}
      <div class="field full"><label>Demo Note</label><textarea name="requirement_note"></textarea></div>
      <div class="full actions"><button class="btn primary" type="submit">Request Demo</button></div>
    </form>
  `
}

function renderTrainingCard(account) {
  const trainings = state.cache.trainings.filter((t) => t.account_id === account.id)
  const rows = trainings.map((t) => [
    `#${t.session_no || '-'}`,
    t.training_phase || '-',
    formatDate(t.training_date),
    displayUser(t.trainer_id),
    t.status || '-',
    `<button class="btn small" type="button" data-nav="training">View</button>`
  ])

  return `
    <div class="card">
      <h3>Training</h3>
      ${simpleRowsTable(['ครั้งที่', 'Phase', 'Date', 'Trainer', 'Status', ''], rows)}
      ${trainings.map((training) => renderTrainingSessionDetail(account, training)).join('')}
      ${!isReadOnly() ? renderTrainingForm(account) : ''}
    </div>
  `
}

function renderTrainingSessionDetail(account, training) {
  const participants = state.cache.trainingParticipants.filter((p) => p.training_session_id === training.id)
  const contacts = state.cache.contacts.filter((c) => c.account_id === account.id)
  const participantRows = participants.map((p) => [
    p.participant_type || '-',
    p.participant_type === 'internal' ? displayUser(p.profile_id) : (p.name_snapshot || contactName(p.contact_id)),
    p.email_snapshot || contactEmail(p.contact_id) || '-',
    p.role_note || '-'
  ])

  return `
    <div class="card compact" style="margin-top:12px">
      <h3>Training #${escapeHTML(training.session_no || '-')} Participants</h3>
      ${simpleRowsTable(['Type', 'Name', 'Email', 'Role/Note'], participantRows)}
      ${!isReadOnly() ? `
        <form class="form-grid" style="margin-top:12px" data-form="add-training-participant" data-training-id="${training.id}">
          ${selectStaticField('participant_type', 'Participant Type', ['internal', 'customer'], true, 'customer')}
          ${selectField('profile_id', 'ทีมเรา', state.cache.profiles.filter((p) => p.is_active), 'id', 'display_name', false)}
          ${selectField('contact_id', 'ฝั่งลูกค้า', contacts, 'id', 'contact_name', false)}
          ${inputField('name_snapshot', 'ชื่อ Snapshot', 'text', false)}
          ${inputField('email_snapshot', 'Email Snapshot', 'email', false)}
          <div class="field full"><label>Role / Note</label><textarea name="role_note"></textarea></div>
          <div class="full actions"><button class="btn primary" type="submit">Add Participant</button></div>
        </form>
      ` : ''}
    </div>
  `
}

function renderTrainingForm(account) {
  const demos = state.cache.demos.filter((d) => d.account_id === account.id)
  const customer = state.cache.customers.find((c) => c.account_id === account.id)
  return `
    <form class="form-grid" style="margin-top:14px" data-form="add-training" data-account-id="${account.id}">
      ${selectStaticField('training_phase', 'Phase', ['demo', 'customer'], true, account.lifecycle_stage === 'customer' ? 'customer' : 'demo')}
      ${inputField('session_no', 'ครั้งที่', 'number', false, '')}
      ${inputField('training_date', 'วันที่สอน', 'date', true, todayISO())}
      ${selectField('trainer_id', 'ผู้สอนฝั่งเรา', state.cache.profiles.filter((p) => p.role === ROLES.CS || p.role === ROLES.ADMIN), 'id', 'display_name', false, state.user.id)}
      ${selectField('demo_session_id', 'Demo Session', demos, 'id', 'start_date', false)}
      <input type="hidden" name="customer_profile_id" value="${customer?.id || ''}">
      ${selectStaticField('status', 'Status', ['planned', 'done', 'cancelled'], true, 'planned')}
      <div class="field full"><label>รายละเอียดที่สอน</label><textarea name="training_detail" required></textarea></div>
      <div class="field full"><label>ปัญหา/คำถาม</label><textarea name="issue_note"></textarea></div>
      <div class="field full"><label>Next Action</label><textarea name="next_action"></textarea></div>
      <div class="full actions"><button class="btn primary" type="submit">Add Training</button></div>
    </form>
  `
}

function renderCustomerCard(account) {
  const customer = state.cache.customers.find((c) => c.account_id === account.id)
  const disabled = isReadOnly() ? 'disabled' : ''

  return `
    <form class="card" data-form="customer-profile" data-account-id="${account.id}" data-customer-id="${customer?.id || ''}">
      <h3>Customer Profile</h3>
      <div class="form-grid">
        ${inputField('customer_code', 'Customer Code', 'text', false, customer?.customer_code || '', disabled)}
        ${selectField('owner_id', 'Owner', state.cache.profiles.filter((p) => ['cs', 'admin'].includes(p.role)), 'id', 'display_name', false, customer?.owner_id || '', disabled)}
        ${inputField('cars', 'Cars / จำนวนรถ', 'number', false, customer?.cars || account.cars_estimate || '', disabled)}
        ${inputField('functions', 'Function / Use Case', 'text', false, customer?.functions || '', disabled)}
        ${inputField('start_date', 'Start Date', 'date', false, customer?.start_date || '', disabled)}
        ${inputField('billing_date', 'Billing Date', 'date', false, customer?.billing_date || '', disabled)}
        ${selectStaticField('engagement_level', 'Engagement Level', ['low', 'medium', 'high', 'risk'], false, customer?.engagement_level || 'medium', disabled)}
        ${selectStaticField('customer_status', 'Status', ['onboarding', 'active', 'inactive', 'churned'], false, customer?.customer_status || 'onboarding', disabled)}
        <div class="field full"><label>Customer Note</label><textarea name="note" ${disabled}>${escapeHTML(customer?.note || '')}</textarea></div>
        <div class="full actions">
          <button class="btn primary" type="submit" ${disabled}>Save Customer Profile</button>
        </div>
      </div>
    </form>
  `
}

function renderTasksCard(account) {
  const tasks = state.cache.tasks.filter((t) => t.account_id === account.id)
  return `
    <div class="card">
      <h3>Tasks</h3>
      ${renderTaskList(tasks, false)}
      ${!isReadOnly() ? renderTaskForm(account) : ''}
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
      ${selectStaticField('priority', 'Priority', ['low', 'medium', 'high', 'urgent'], true, 'medium')}
      ${selectField('assigned_to', 'ผู้รับผิดชอบ', state.cache.profiles.filter((p) => p.is_active), 'id', 'display_name', true, state.user.id)}
      ${inputField('due_at', 'Due Date', 'datetime-local', false)}
      <div class="field full"><label>รายละเอียด</label><textarea name="description"></textarea></div>
      <div class="full actions"><button class="btn primary" type="submit">Add Task</button></div>
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
        Account: ${escapeHTML(accountTitle(findAccount(task.account_id)))}<br>
        Owner: ${escapeHTML(displayUser(task.assigned_to))} · Due: ${formatDateTime(task.due_at)}
      </div>
      ${compact ? '' : `<div class="actions"><button class="btn small" type="button" data-action="mark-task-done" data-id="${task.id}">Done</button><button class="btn small" type="button" data-nav-account="${task.account_id}">Open Account</button></div>`}
    </div>
  `).join('')
  return `<div class="list-view">${rows}</div>`
}

function renderAccountActions(account) {
  if (isReadOnly()) return ''
  const canConvert = account.lifecycle_stage !== 'customer' && account.lifecycle_stage !== 'lost'
  const canLost = account.lifecycle_stage !== 'lost'
  return `
    <div class="card">
      <h3>Actions</h3>
      <div class="actions">
        ${canConvert ? `<button class="btn primary" type="button" data-action="convert-customer" data-id="${account.id}">Convert to Customer</button>` : ''}
        ${canLost ? `<button class="btn danger" type="button" data-action="show-lost-form" data-id="${account.id}">Mark Lost</button>` : ''}
      </div>
      ${canLost ? renderLostForm(account) : ''}
    </div>
  `
}

function renderLostForm(account) {
  return `
    <form class="form-grid single" style="margin-top:14px; display:none" data-form="mark-lost" data-account-id="${account.id}" id="lost-form-${account.id}">
      ${selectField('lost_reason_id', 'Lost Reason', state.cache.lostReasons, 'id', 'reason_name', true)}
      <div class="field"><label>Lost Note</label><textarea name="lost_note" required></textarea></div>
      <button class="btn danger" type="submit">Confirm Lost</button>
    </form>
  `
}

function renderAccountMeta(account) {
  const contacts = state.cache.contacts.filter((c) => c.account_id === account.id)
  const csOwners = state.cache.accountCsOwners.filter((o) => o.account_id === account.id).map((o) => displayUser(o.cs_user_id)).join(', ') || '-'
  return `
    <div class="card">
      <h3>Meta</h3>
      <div class="meta-grid">
        <div class="meta-label">Running No.</div><div>${renderRunningNo(account)}</div>
        <div class="meta-label">Source</div><div>${escapeHTML(account.source_type || '-')}</div>
        <div class="meta-label">Sale Owner</div><div>${escapeHTML(displayUser(account.sale_owner_id))}</div>
        <div class="meta-label">CS Owners</div><div>${escapeHTML(csOwners)}</div>
        <div class="meta-label">Lead Source</div><div>${escapeHTML(masterName('leadSources', account.lead_source_id))}</div>
        <div class="meta-label">Campaign</div><div>${escapeHTML(masterName('campaigns', account.campaign_id))}</div>
        <div class="meta-label">Contacts</div><div>${contacts.length}</div>
        <div class="meta-label">Created</div><div>${formatDateTime(account.created_at)}</div>
        <div class="meta-label">Updated</div><div>${formatDateTime(account.updated_at)}</div>
      </div>
    </div>
  `
}

function renderHistoryCard(account) {
  const rows = state.cache.statusHistory
    .filter((h) => h.account_id === account.id)
    .slice(0, 12)
    .map((h) => [formatDateTime(h.created_at), `${h.from_stage || '-'} → ${h.to_stage || '-'}`, displayUser(h.changed_by), h.reason || '-'])
  return `
    <div class="card">
      <h3>Status History</h3>
      ${simpleRowsTable(['Date', 'Stage', 'By', 'Reason'], rows)}
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

function renderAccountsCollection(items, key) {
  const mode = state.viewModes[key] || 'table'
  if (mode === 'board') return renderAccountBoard(items, key)
  if (mode === 'calendar') return renderAccountCalendar(items)
  if (mode === 'list') return renderAccountList(items)
  if (mode === 'timeline') return renderAccountTimeline(items)
  return renderAccountTable(items)
}

function renderAccountTable(items) {
  if (!items.length) return '<div class="empty">ไม่มีข้อมูล</div>'
  const rows = items.map((a) => `
    <tr>
      <td>${renderRunningNo(a)}</td>
      <td><button class="btn small" type="button" data-nav-account="${a.id}">${escapeHTML(accountTitle(a))}</button></td>
      <td>${badge(a.lifecycle_stage)}</td>
      <td>${badge(a.lifecycle_status || '-')}</td>
      <td>${escapeHTML(displayUser(a.sale_owner_id))}</td>
      <td>${escapeHTML(masterName('leadSources', a.lead_source_id))}</td>
      <td>${escapeHTML(masterName('campaigns', a.campaign_id))}</td>
      <td>${escapeHTML(String(a.cars_estimate || '-'))}</td>
      <td>${formatDateTime(a.updated_at)}</td>
    </tr>
  `).join('')

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>No.</th><th>Account</th><th>Stage</th><th>Status</th><th>Sale</th><th>Source</th><th>Campaign</th><th>Cars</th><th>Updated</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

function renderAccountList(items) {
  if (!items.length) return '<div class="empty">ไม่มีข้อมูล</div>'
  return `
    <div class="list-view">
      ${items.map((a) => `
        <div class="list-item">
          <div class="list-title">
            <span>${escapeHTML(accountTitle(a))}</span>
            <span>${badge(a.lifecycle_stage)} ${badge(a.lifecycle_status || '-')}</span>
          </div>
          <div class="list-meta">
            ${renderRunningNo(a)} · Sale: ${escapeHTML(displayUser(a.sale_owner_id))} · Cars: ${escapeHTML(String(a.cars_estimate || '-'))}<br>
            Source: ${escapeHTML(masterName('leadSources', a.lead_source_id))} · Campaign: ${escapeHTML(masterName('campaigns', a.campaign_id))}
          </div>
          <div class="actions"><button class="btn small" type="button" data-nav-account="${a.id}">Open</button></div>
        </div>
      `).join('')}
    </div>
  `
}

function renderAccountBoard(items, key) {
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
              <div class="actions" style="margin-top:10px"><button class="btn small" type="button" data-nav-account="${a.id}">Open</button></div>
            </div>
          `).join('') || '<div class="empty">ว่าง</div>'}
        </div>
      `).join('')}
    </div>
  `
}

function renderAccountCalendar(items) {
  const events = []
  items.forEach((account) => {
    state.cache.demos.filter((d) => d.account_id === account.id).forEach((demo) => {
      events.push({ date: demo.start_date, title: `Demo Start: ${accountTitle(account)}`, accountId: account.id })
      events.push({ date: demo.end_date, title: `Demo End: ${accountTitle(account)}`, accountId: account.id })
    })
    const customer = state.cache.customers.find((c) => c.account_id === account.id)
    if (customer?.billing_date) events.push({ date: customer.billing_date, title: `Billing: ${accountTitle(account)}`, accountId: account.id })
  })
  return renderCalendarEvents(events)
}

function renderAccountTimeline(items) {
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

function renderTaskCollection(items, key) {
  const mode = state.viewModes[key] || 'board'
  if (mode === 'board') return renderTaskBoard(items)
  if (mode === 'calendar') return renderCalendarEvents(items.map((task) => ({ date: datePart(task.due_at), title: `Task: ${task.title}`, accountId: task.account_id })))
  if (mode === 'timeline') return renderTimelineEvents(items.map((task) => ({ title: task.title, start: datePart(task.created_at), end: datePart(task.due_at), accountId: task.account_id })))
  if (mode === 'list') return renderTaskList(items, false)
  return renderTaskTable(items)
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
              <div class="list-meta">${escapeHTML(accountTitle(findAccount(task.account_id)))}<br>Due: ${formatDateTime(task.due_at)}</div>
              <div style="margin-top:8px">${badge(task.priority || 'medium')}</div>
              <div class="actions" style="margin-top:10px"><button class="btn small" type="button" data-nav-account="${task.account_id}">Open</button></div>
            </div>
          `).join('') || '<div class="empty">ว่าง</div>'}
        </div>
      `).join('')}
    </div>
  `
}

function renderTaskTable(items) {
  if (!items.length) return '<div class="empty">ไม่มี task</div>'
  const rows = items.map((task) => `
    <tr>
      <td>${escapeHTML(task.title || '-')}</td>
      <td>${escapeHTML(accountTitle(findAccount(task.account_id)))}</td>
      <td>${badge(task.status || 'open')}</td>
      <td>${badge(task.priority || 'medium')}</td>
      <td>${escapeHTML(displayUser(task.assigned_to))}</td>
      <td>${formatDateTime(task.due_at)}</td>
      <td><button class="btn small" type="button" data-nav-account="${task.account_id}">Open</button></td>
    </tr>
  `).join('')
  return `<div class="table-wrap"><table><thead><tr><th>Task</th><th>Account</th><th>Status</th><th>Priority</th><th>Owner</th><th>Due</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
}

function renderTrainingCollection(items, key) {
  const mode = state.viewModes[key] || 'calendar'
  if (mode === 'calendar') return renderCalendarEvents(items.map((t) => ({ date: t.training_date, title: `Training #${t.session_no}: ${accountTitle(findAccount(t.account_id))}`, accountId: t.account_id })))
  if (mode === 'timeline') return renderTimelineEvents(items.map((t) => ({ title: `Training #${t.session_no}: ${accountTitle(findAccount(t.account_id))}`, start: t.training_date, end: t.training_date, accountId: t.account_id })))
  if (mode === 'board') return renderTrainingBoard(items)
  if (mode === 'list') return renderTrainingList(items)
  return renderTrainingTable(items)
}

function renderTrainingBoard(items) {
  const groups = groupRows(items, 'status')
  const keys = ['planned', 'done', 'cancelled']
  return `<div class="board">${keys.map((key) => `<div class="board-column"><div class="board-title"><span>${key}</span><span>${groups[key]?.length || 0}</span></div>${(groups[key] || []).map(renderTrainingCardItem).join('') || '<div class="empty">ว่าง</div>'}</div>`).join('')}</div>`
}

function renderTrainingList(items) {
  if (!items.length) return '<div class="empty">ไม่มี training</div>'
  return `<div class="list-view">${items.map(renderTrainingCardItem).join('')}</div>`
}

function renderTrainingCardItem(t) {
  return `
    <div class="board-card">
      <strong>#${t.session_no || '-'} ${escapeHTML(accountTitle(findAccount(t.account_id)))}</strong>
      <div class="list-meta">${escapeHTML(t.training_phase || '-')} · ${formatDate(t.training_date)} · Trainer: ${escapeHTML(displayUser(t.trainer_id))}</div>
      <div style="margin-top:8px">${badge(t.status || '-')}</div>
      <div class="actions" style="margin-top:10px"><button class="btn small" type="button" data-nav-account="${t.account_id}">Open</button></div>
    </div>
  `
}

function renderTrainingTable(items) {
  if (!items.length) return '<div class="empty">ไม่มี training</div>'
  const rows = items.map((t) => `
    <tr>
      <td>#${t.session_no || '-'}</td>
      <td>${escapeHTML(accountTitle(findAccount(t.account_id)))}</td>
      <td>${escapeHTML(t.training_phase || '-')}</td>
      <td>${formatDate(t.training_date)}</td>
      <td>${escapeHTML(displayUser(t.trainer_id))}</td>
      <td>${badge(t.status || '-')}</td>
      <td><button class="btn small" type="button" data-nav-account="${t.account_id}">Open</button></td>
    </tr>
  `).join('')
  return `<div class="table-wrap"><table><thead><tr><th>ครั้งที่</th><th>Account</th><th>Phase</th><th>Date</th><th>Trainer</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
}

function renderCalendarEvents(events) {
  const validEvents = events.filter((event) => event.date).sort((a, b) => String(a.date).localeCompare(String(b.date)))
  if (!validEvents.length) return '<div class="empty">ไม่มี event ใน calendar</div>'
  const groups = groupRows(validEvents, 'date')
  return `
    <div class="calendar">
      ${Object.keys(groups).sort().map((date) => `
        <div class="calendar-day">
          <div class="calendar-date">${formatDate(date)}</div>
          <div class="list-view">
            ${groups[date].map((event) => `<div class="list-item"><div class="list-title">${escapeHTML(event.title || '-')}</div><div class="actions"><button class="btn small" type="button" data-nav-account="${event.accountId}">Open</button></div></div>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `
}

function renderTimelineEvents(rows) {
  const validRows = rows.filter((row) => row.start || row.end)
  if (!validRows.length) return '<div class="empty">ไม่มีข้อมูล timeline</div>'
  return `
    <div class="timeline">
      ${validRows.map((row) => `
        <div class="timeline-row">
          <div class="list-title">
            <span>${escapeHTML(row.title || '-')}</span>
            <span class="muted">${formatDate(row.start)} → ${formatDate(row.end)}</span>
          </div>
          <div class="timeline-track"><div class="timeline-bar" style="width:${timelineWidth(row.start, row.end)}%"></div></div>
          <div class="actions" style="margin-top:10px"><button class="btn small" type="button" data-nav-account="${row.accountId}">Open</button></div>
        </div>
      `).join('')}
    </div>
  `
}

async function onClick(event) {
  const nav = event.target.closest('[data-nav]')
  if (nav) {
    location.hash = `#/${nav.dataset.nav}`
    return
  }

  const navAccount = event.target.closest('[data-nav-account]')
  if (navAccount) {
    location.hash = `#/account/${navAccount.dataset.navAccount}`
    return
  }

  const viewBtn = event.target.closest('[data-view-key]')
  if (viewBtn) {
    state.viewModes[viewBtn.dataset.viewKey] = viewBtn.dataset.viewMode
    render()
    return
  }

  const action = event.target.closest('[data-action]')
  if (!action) return

  const type = action.dataset.action
  if (type === 'logout') return logout()
  if (type === 'refresh-data') return refreshData()
  if (type === 'print') return window.print()
  if (type === 'show-lost-form') return showLostForm(action.dataset.id)
  if (type === 'convert-customer') return convertCustomer(action.dataset.id)
  if (type === 'mark-task-done') return markTaskDone(action.dataset.id)
  if (type === 'save-profile') return saveProfile(action.dataset.id)
  if (type === 'toggle-master') return toggleMaster(action.dataset.table, action.dataset.id, action.dataset.active === 'true')
}

async function onSubmit(event) {
  const form = event.target.closest('form[data-form]')
  if (!form) return
  event.preventDefault()

  const type = form.dataset.form
  try {
    setFormBusy(form, true)

    if (type === 'login') await login(form)
    if (type === 'create-mkt-lead') await createMktLead(form)
    if (type === 'create-sales-lead') await createSalesLead(form)
    if (type === 'account-overview') await saveAccountOverview(form)
    if (type === 'add-contact') await addContact(form)
    if (type === 'add-activity') await addActivity(form)
    if (type === 'request-demo') await requestDemo(form)
    if (type === 'update-demo') await updateDemo(form)
    if (type === 'add-demo-user') await addDemoUser(form)
    if (type === 'add-training') await addTraining(form)
    if (type === 'add-training-participant') await addTrainingParticipant(form)
    if (type === 'customer-profile') await saveCustomerProfile(form)
    if (type === 'add-task') await addTask(form)
    if (type === 'mark-lost') await markLost(form)
    if (type === 'create-master') await createMaster(form)
  } catch (error) {
    toast(error.message || String(error), 'error')
  } finally {
    setFormBusy(form, false)
  }
}

function onChange(event) {
  const target = event.target
  if (target.matches('[data-profile-field]')) {
    target.dataset.dirty = 'true'
  }
}

async function login(form) {
  const values = formValues(form)
  const { error } = await state.client.auth.signInWithPassword({
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
    toast('Refresh สำเร็จ', 'success')
  } catch (error) {
    toast(error.message || String(error), 'error')
  }
}

async function createMktLead(form) {
  const values = formValues(form)
  ensureLeadMinimum(values)
  const { error } = await state.client.rpc('create_mkt_lead', {
    p_company_name: nullIfBlank(values.company_name),
    p_contact_name: nullIfBlank(values.contact_name),
    p_phone: nullIfBlank(values.phone),
    p_email: nullIfBlank(values.email),
    p_lead_source_id: nullIfBlank(values.lead_source_id),
    p_campaign_id: nullIfBlank(values.campaign_id),
    p_initial_note: nullIfBlank(values.initial_note),
    p_cars_estimate: numberOrNull(values.cars_estimate),
    p_module_ids: values.module_ids || []
  })
  if (error) throw error
  form.reset()
  await refreshData()
  toast('สร้าง MKT Lead สำเร็จ', 'success')
}

async function createSalesLead(form) {
  const values = formValues(form)
  ensureLeadMinimum(values)
  const { error } = await state.client.rpc('create_sales_lead', {
    p_company_name: nullIfBlank(values.company_name),
    p_contact_name: nullIfBlank(values.contact_name),
    p_phone: nullIfBlank(values.phone),
    p_email: nullIfBlank(values.email),
    p_contact_status_id: nullIfBlank(values.contact_status_id),
    p_initial_note: nullIfBlank(values.initial_note),
    p_cars_estimate: numberOrNull(values.cars_estimate),
    p_module_ids: values.module_ids || []
  })
  if (error) throw error
  form.reset()
  await refreshData()
  toast('สร้าง Sale Lead สำเร็จ', 'success')
}

function ensureLeadMinimum(values) {
  const hasMinimum = [values.company_name, values.contact_name, values.phone, values.email, values.initial_note]
    .some((value) => String(value || '').trim())
  if (!hasMinimum) {
    throw new Error('ต้องกรอกข้อมูลขั้นต่ำอย่างน้อย 1 อย่าง เช่น ผู้ติดต่อ เบอร์ อีเมล รายละเอียด หรือชื่อบริษัท')
  }
}

async function saveAccountOverview(form) {
  const accountId = form.dataset.accountId
  const values = formValues(form)
  const payload = {
    company_name: nullIfBlank(values.company_name),
    short_name: nullIfBlank(values.short_name),
    tax_id: nullIfBlank(values.tax_id),
    cars_estimate: numberOrNull(values.cars_estimate),
    lead_source_id: nullIfBlank(values.lead_source_id),
    campaign_id: nullIfBlank(values.campaign_id),
    contact_status_id: nullIfBlank(values.contact_status_id),
    product_interest: nullIfBlank(values.product_interest)
  }

  const { error } = await state.client.from(TABLES.accounts).update(payload).eq('id', accountId)
  if (error) throw error

  await replaceAccountModules(accountId, values.module_ids || [], 'interested')
  await refreshData()
  toast('บันทึก Account สำเร็จ', 'success')
}

async function replaceAccountModules(accountId, moduleIds, moduleType) {
  const existing = state.cache.accountModules.filter((row) => row.account_id === accountId && row.module_type === moduleType)
  if (existing.length) {
    const { error } = await state.client
      .from(TABLES.accountModules)
      .delete()
      .in('id', existing.map((row) => row.id))
    if (error) throw error
  }

  if (moduleIds.length) {
    const rows = moduleIds.map((moduleId) => ({ account_id: accountId, module_id: moduleId, module_type: moduleType }))
    const { error } = await state.client.from(TABLES.accountModules).insert(rows)
    if (error) throw error
  }
}

async function addContact(form) {
  const values = formValues(form)
  const payload = {
    account_id: form.dataset.accountId,
    contact_name: values.contact_name,
    email: nullIfBlank(values.email),
    phone: nullIfBlank(values.phone),
    contact_role: nullIfBlank(values.contact_role),
    created_by: state.user.id
  }

  const { error } = await state.client.from(TABLES.contacts).insert(payload)
  if (error) throw error
  form.reset()
  await refreshData()
  toast('เพิ่ม Contact สำเร็จ', 'success')
}

async function addActivity(form) {
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
  toast('เพิ่ม Activity สำเร็จ', 'success')
}

async function requestDemo(form) {
  const values = formValues(form)
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
  toast('บันทึก Customer Profile สำเร็จ', 'success')
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
    const account = findAccount(accountId)
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
  const { error } = await state.client.from(TABLES.tasks).update({
    status: 'done',
    completed_at: new Date().toISOString()
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

function findAccount(accountId) {
  return state.cache.accounts.find((a) => a.id === accountId) || null
}

function accountTitle(account) {
  if (!account) return '-'
  const primary = state.cache.contacts.find((c) => c.account_id === account.id && c.is_primary) ||
    state.cache.contacts.find((c) => c.account_id === account.id)
  return account.company_name || account.short_name || primary?.contact_name || primary?.phone || primary?.email || `Account ${String(account.id).slice(0, 8)}`
}

function renderRunningNo(account) {
  if (!account?.running_no) return '<span class="muted">No Running No.</span>'
  return `#${escapeHTML(String(account.running_no))}`
}

function accountModuleIds(accountId) {
  return state.cache.accountModules
    .filter((row) => row.account_id === accountId && ['interested', 'demo', 'subscribed'].includes(row.module_type))
    .map((row) => row.module_id)
}

function masterName(cacheKey, id) {
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

function contactName(contactId) {
  if (!contactId) return '-'
  const contact = state.cache.contacts.find((c) => c.id === contactId)
  return contact?.contact_name || '-'
}

function contactEmail(contactId) {
  if (!contactId) return ''
  const contact = state.cache.contacts.find((c) => c.id === contactId)
  return contact?.email || ''
}

function roleLabel(role) {
  const labels = {
    pending: 'Pending',
    admin: 'Admin',
    mkt: 'MKT',
    sale: 'Sale',
    cs: 'CS',
    manager: 'Manager'
  }
  return labels[role] || role || '-'
}

function inputField(name, label, type, required, value = '', disabled = '') {
  return `
    <div class="field">
      <label>${escapeHTML(label)}${required ? ' *' : ''}</label>
      <input name="${escapeAttr(name)}" type="${escapeAttr(type)}" value="${escapeAttr(value)}" ${required ? 'required' : ''} ${disabled}>
    </div>
  `
}

function selectField(name, label, rows, valueField, labelField, required, selected = '', disabled = '') {
  const options = [`<option value="">- เลือก -</option>`].concat((rows || []).map((row) => {
    const labelValue = row[labelField] || row.name || row.email || row.id
    return `<option value="${escapeAttr(row[valueField])}" ${String(selected) === String(row[valueField]) ? 'selected' : ''}>${escapeHTML(labelValue)}</option>`
  })).join('')
  return `
    <div class="field">
      <label>${escapeHTML(label)}${required ? ' *' : ''}</label>
      <select name="${escapeAttr(name)}" ${required ? 'required' : ''} ${disabled}>${options}</select>
    </div>
  `
}

function selectStaticField(name, label, values, required, selected = '', disabled = '') {
  const options = [`<option value="">- เลือก -</option>`].concat(values.map((value) => `<option value="${escapeAttr(value)}" ${selected === value ? 'selected' : ''}>${escapeHTML(value)}</option>`)).join('')
  return `
    <div class="field">
      <label>${escapeHTML(label)}${required ? ' *' : ''}</label>
      <select name="${escapeAttr(name)}" ${required ? 'required' : ''} ${disabled}>${options}</select>
    </div>
  `
}

function multiSelectField(name, label, rows, valueField, labelField, selected = [], disabled = '') {
  const selectedSet = new Set(Array.isArray(selected) ? selected.map(String) : [])
  const options = (rows || []).map((row) => {
    const labelValue = row[labelField] || row.name || row.email || row.id
    return `<option value="${escapeAttr(row[valueField])}" ${selectedSet.has(String(row[valueField])) ? 'selected' : ''}>${escapeHTML(labelValue)}</option>`
  }).join('')
  return `
    <div class="field">
      <label>${escapeHTML(label)}</label>
      <select name="${escapeAttr(name)}" multiple ${disabled}>${options}</select>
      <div class="help">กด Ctrl/Command เพื่อเลือกมากกว่า 1 รายการ</div>
    </div>
  `
}

function badge(text) {
  const safe = String(text || '-')
  const key = safe.toLowerCase().replace(/\s+/g, '_')
  return `<span class="badge ${escapeAttr(key)}">${escapeHTML(STAGE_LABELS[key] || STATUS_LABELS[key] || safe)}</span>`
}

function simpleRowsTable(headers, rows) {
  if (!rows.length) return '<div class="empty">ไม่มีข้อมูล</div>'
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

  return values
}

function setFormBusy(form, busy) {
  form.querySelectorAll('button, input, select, textarea').forEach((el) => {
    if (busy) {
      el.dataset.wasDisabled = el.disabled ? 'true' : 'false'
      el.disabled = true
    } else {
      el.disabled = el.dataset.wasDisabled === 'true'
      delete el.dataset.wasDisabled
    }
  })
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

function formatDate(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(value))
  } catch (_error) {
    return String(value)
  }
}

function formatDateTime(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch (_error) {
    return String(value)
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function datePart(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function timelineWidth(start, end) {
  if (!start || !end) return 20
  const s = new Date(start)
  const e = new Date(end)
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
  item.className = `toast ${type}`
  item.innerHTML = `<span>${escapeHTML(message)}</span><button type="button" aria-label="close">×</button>`
  item.querySelector('button').addEventListener('click', () => item.remove())
  toastRoot.appendChild(item)
  window.setTimeout(() => item.remove(), 6000)
}
