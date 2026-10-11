/* ============================================================
   Pecaña Dental Clinic Management System
   ============================================================ */

/* ---------- Config & shared helpers ---------- */
const STORAGE = {
    patients: "pecana_patients",
    appointments: "pecana_appointments",
    appointmentQueue: "pecana_appointment_queue",
    walkins: "pecana_walkin_queue",
    inventory: "pecana_inventory"
};
const NT_KEYS = {
    adminRead: "pecana_admin_notif_read",
    lookup: "pecana_patient_lookup",
    seen: "pecana_patient_seen"
};
const NT_STEPS = ["Requested", "Approved", "Serving", "Done"];

const $ = id => document.getElementById(id);
const openModal = id => $(id).classList.remove("hidden");
const closeModal = id => $(id).classList.add("hidden");

const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
};
const load = (key, fallback = []) => {
    const data = readJSON(key, fallback);
    return Array.isArray(data) ? data : fallback;
};
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const pad3 = n => String(n).padStart(3, "0");
const dateStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => dateStr(new Date());
const addDays = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return dateStr(d); };

const formatDate = d => d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "-";

const formatTime = t => {
    if (!t) return "-";
    const [h, m] = t.split(":");
    const d = new Date();
    d.setHours(+h, +m);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const esc = v => String(v ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const statusClass = s => (s || "Waiting").toLowerCase().replaceAll(" ", "-");

const nextId = (prefix, arr) => {
    const nums = arr.map(x => parseInt(String(x.id || "").replace(/\D/g, "")) || 0);
    return prefix + pad3(Math.max(0, ...nums) + 1);
};
const nextQueue = (prefix, arr) => {
    const nums = arr.map(x => parseInt(String(x.number || "").replace(/\D/g, ""))).filter(n => !isNaN(n));
    return prefix + pad3(Math.max(0, ...nums) + 1);
};

/* Adds a per-day running number (A001, APT001 ...) to a list of rows that have a `date`. */
const withDailyNumbers = (rows, prefix) => {
    const counters = {};
    return rows.map(r => ({ ...r, displayNo: prefix + pad3(counters[r.date] = (counters[r.date] || 0) + 1) }));
};

/* ---------- Seed data ---------- */
const SEED_PATIENTS = [
    ["Juan Dela Cruz", "09171234567", "1985-05-15", "Polangui, Albay", "Male", "Maria Dela Cruz", "Regular dental check-up"],
    ["Maria Santos", "09181234567", "1992-08-22", "Oas, Albay", "Female", "Pedro Santos", "Tooth cleaning"],
    ["Carlos Reyes", "09191234567", "1980-02-10", "Ligao City, Albay", "Male", "Ana Reyes", "Tooth pain"],
    ["Antonio Rivera", "09201112233", "1995-04-12", "Guinobatan, Albay", "Male", "Liza Rivera", "Braces adjustment"],
    ["Elena Garcia", "09212223344", "1988-11-30", "Polangui, Albay", "Female", "Jose Garcia", "Wisdom tooth consultation"],
    ["Ricardo Ramos", "09223334455", "1975-07-08", "Camalig, Albay", "Male", "Celia Ramos", "Gum bleeding"],
    ["Josefina Mendoza", "09234445566", "1960-01-25", "Oas, Albay", "Female", "Mario Mendoza", "Dentures fitting"],
    ["Manuel Castro", "09245556677", "1998-12-05", "Ligao City, Albay", "Male", "Sara Castro", "Teeth whitening"],
    ["Remedios Lopez", "09256667788", "1972-03-18", "Polangui, Albay", "Female", "Danilo Lopez", "Root canal therapy"],
    ["Francisco Tan", "09267778899", "1983-06-21", "Guinobatan, Albay", "Male", "Aimee Tan", "Dental implants"],
    ["Pacita Aquino", "09278889900", "1990-10-10", "Oas, Albay", "Female", "Ben Aquino", "Scaling and polishing"],
    ["Ramon Bautista", "09289990011", "1965-08-05", "Camalig, Albay", "Male", "Vilma Bautista", "Crown replacement"],
    ["Luzviminda Villamor", "09290001122", "1978-02-28", "Ligao City, Albay", "Female", "Oscar Villamor", "Bad breath consultation"],
    ["Angelito Gonzales", "09301112233", "2000-07-22", "Polangui, Albay", "Male", "Grace Gonzales", "Mouth guard fitting"],
    ["Corazon Salvador", "09312223344", "1996-04-09", "Oas, Albay", "Female", "Luis Salvador", "Tooth extraction"],
    ["Benigno Dizon", "09323334455", "1982-01-01", "Guinobatan, Albay", "Male", "Cory Dizon", "Bridge adjustment"],
    ["Teresita Roxas", "09334445566", "2005-09-14", "Polangui, Albay", "Female", "Felipe Roxas", "Cavity filling"],
    ["Fidel Pineda", "09345556677", "1987-12-30", "Camalig, Albay", "Male", "Eva Pineda", "Sensitivity issues"],
    ["Gloria de Leon", "09356667788", "1993-05-04", "Ligao City, Albay", "Female", "Mar de Leon", "Impacted tooth"],
    ["Oscar Macapagal", "09367778899", "1955-11-11", "Oas, Albay", "Male", "Nestor Macapagal", "Jaw pain"]
].map(([name, contact, dob, address, gender, emergency, concern], i) =>
    ({ id: "P" + pad3(i + 1), name, contact, email: "", dob, address, gender, emergency, concern, status: "Active" }));

const DEFAULT_INVENTORY = [
    { id: "I001", name: "Composite Resin", stock: 12, minimum: 5, leadTime: 5 },
    { id: "I002", name: "Dental Floss", stock: 10, minimum: 5, leadTime: 3 },
    { id: "I003", name: "Bonding Agent", stock: 8, minimum: 5, leadTime: 5 },
    { id: "I004", name: "Suture Material", stock: 15, minimum: 5, leadTime: 4 },
    { id: "I005", name: "Orthodontic Brackets", stock: 20, minimum: 8, leadTime: 7 },
    { id: "I006", name: "Archwire", stock: 10, minimum: 4, leadTime: 7 },
    { id: "I007", name: "Elastic Ligatures", stock: 50, minimum: 20, leadTime: 5 }
];

let patients = load(STORAGE.patients, SEED_PATIENTS);
let appointments = load(STORAGE.appointments, [
    { id: "APT001", patientId: "P001", patientName: "Juan Dela Cruz", date: today(), time: "09:00", service: "Dental Check-up", status: "Approved", queueStatus: "Waiting", customMaterials: { "Dental Floss": 1 } }
]);
let appointmentQueue = load(STORAGE.appointmentQueue, [
    { number: "A001", appointmentId: "APT001", patientId: "P001", patientName: "Juan Dela Cruz", service: "Dental Check-up", time: "09:00", date: today(), status: "Waiting" }
]);
let walkins = load(STORAGE.walkins, []);
let inventory = load(STORAGE.inventory, DEFAULT_INVENTORY.map(i => ({ ...i })));

/* Make sure newly added default materials exist in older saved data */
(function ensureInventoryHasAllMaterials() {
    let changed = false;
    DEFAULT_INVENTORY.forEach(item => {
        if (!inventory.some(i => i.id === item.id || i.name === item.name)) {
            inventory.push({ ...item });
            changed = true;
        }
    });
    if (changed) save(STORAGE.inventory, inventory);
})();

/* Keep several open tabs in sync */
window.addEventListener("storage", e => {
    if (!e.key || !Object.values(STORAGE).includes(e.key)) return;
    patients = load(STORAGE.patients, patients);
    appointments = load(STORAGE.appointments, appointments);
    appointmentQueue = load(STORAGE.appointmentQueue, appointmentQueue);
    walkins = load(STORAGE.walkins, walkins);
    inventory = load(STORAGE.inventory, inventory);
    renderAll();
});

/* ---------- Services & materials (BOM) ---------- */
const SERVICE_INFO = {
    "Dental Check-up": {
        icon: "fa-tooth",
        short: "Complete dental examination.",
        desc: "A routine examination of the teeth, gums, and mouth to identify cavities, gum problems, and other oral health concerns early.",
        duration: "20–30 minutes",
        idealFor: "Anyone due for a routine oral health review",
        includes: ["Visual and manual oral examination", "Gum and bite assessment", "Personalized oral hygiene advice"]
    },
    "Dental Cleaning": {
        icon: "fa-wand-magic-sparkles",
        short: "Professional preventive cleaning.",
        desc: "A professional procedure that removes plaque and tartar buildup to help prevent cavities, gum disease, and bad breath.",
        duration: "30–45 minutes",
        idealFor: "Patients wanting to maintain healthy gums and fresh breath",
        includes: ["Plaque and tartar removal", "Teeth polishing", "Fluoride application (if needed)"]
    },
    "Tooth Restoration": {
        icon: "fa-tooth",
        short: "Restoration for damaged teeth.",
        desc: "A treatment that repairs damaged or decayed teeth to restore their structure, function, and natural appearance.",
        duration: "45–60 minutes",
        idealFor: "Teeth affected by cavities, chips, or minor damage",
        includes: ["Removal of decayed material", "Composite or bonding application", "Bite adjustment and polish"]
    },
    "Tooth Extraction": {
        icon: "fa-teeth",
        short: "Professional tooth extraction.",
        desc: "A procedure that removes a severely damaged, decayed, or problematic tooth to prevent further dental complications.",
        duration: "30–60 minutes",
        idealFor: "Severely decayed, broken, or impacted teeth",
        includes: ["Local anesthesia", "Safe tooth removal", "Aftercare instructions"]
    },
    "Braces": {
        icon: "fa-teeth-open",
        short: "Orthodontic treatment to gradually align and straighten teeth.",
        desc: "An orthodontic treatment that gradually aligns and straightens teeth while helping improve bite and overall dental alignment.",
        duration: "Ongoing treatment (regular adjustment visits)",
        idealFor: "Patients with misaligned teeth or bite issues",
        includes: ["Initial fitting and consultation", "Periodic wire/bracket adjustments", "Progress monitoring"]
    }
};
const SERVICES = Object.keys(SERVICE_INFO);

const BOM = {
    "Dental Check-up": { "Dental Floss": 1 },
    "Dental Cleaning": { "Dental Floss": 2 },
    "Tooth Restoration": { "Composite Resin": 1, "Bonding Agent": 1 },
    "Tooth Extraction": { "Suture Material": 2 },
    "Braces": { "Orthodontic Brackets": 20, "Archwire": 2, "Elastic Ligatures": 20 }
};

const materialsFor = a =>
    a.customMaterials && Object.keys(a.customMaterials).length ? a.customMaterials : (BOM[a.service] || {});

function deductMaterials(materials) {
    Object.entries(materials).forEach(([name, qty]) => {
        const item = inventory.find(x => x.name === name);
        if (item) item.stock = Math.max(0, item.stock - qty);
    });
    save(STORAGE.inventory, inventory);
}

/* Service cards (home + services page) and every service <select> are built from SERVICE_INFO */
function renderServiceUI() {
    const card = (name, text, label, action) => `
        <div class="service-card">
            <i class="fa-solid ${SERVICE_INFO[name].icon}"></i>
            <h3>${name}</h3>
            <p>${text}</p>
            <button onclick="${action}('${name}')">${label}</button>
        </div>`;

    $("homeServiceGrid").innerHTML = SERVICES.map(n => card(n, SERVICE_INFO[n].desc, "See More Details", "viewServiceDetails")).join("");
    $("servicesPageGrid").innerHTML = SERVICES.map(n => card(n, SERVICE_INFO[n].short, "Book This Service", "selectService")).join("");

    const options = SERVICES.map(n => `<option>${n}</option>`).join("");
    ["bookingService", "adminAppointmentService", "walkinService"].forEach(id => $(id).insertAdjacentHTML("beforeend", options));
}

/* ---------- Navigation ---------- */
const VIEWS = ["publicApp", "loginPage", "adminApp"];
const showView = name => VIEWS.forEach(v => $(v).classList.toggle("hidden", v !== name));

function showPublicPage(page) {
    showView("publicApp");
    document.querySelectorAll(".public-page").forEach(x => x.classList.remove("active"));
    $("public-" + page)?.classList.add("active");
    if (page === "queue-status") renderPublicQueues();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

const showPublicSite = () => showPublicPage("home");
const showLogin = () => showView("loginPage");

function logout() {
    sessionStorage.removeItem("pecana_admin_logged_in");
    sessionStorage.removeItem("pecana_admin_page");
    showPublicSite();
}

function selectService(serviceName) {
    showPublicPage("appointment");
    $("bookingService").value = serviceName;
    $("bookingName").focus();
}

/* ---------- Service details modal ---------- */
let pendingServiceSelection = null;

function viewServiceDetails(serviceName) {
    const info = SERVICE_INFO[serviceName];
    if (!info) return;
    pendingServiceSelection = serviceName;

    $("serviceDetailsTitle").textContent = serviceName;
    $("serviceDetailsIcon").innerHTML = `<i class="fa-solid ${info.icon}"></i>`;
    $("serviceDetailsDesc").textContent = info.desc;
    $("serviceDetailsMeta").innerHTML = `
        <div class="service-meta-item">
            <i class="fa-solid fa-clock"></i>
            <div><strong>Duration</strong><span>${esc(info.duration)}</span></div>
        </div>
        <div class="service-meta-item">
            <i class="fa-solid fa-user-check"></i>
            <div><strong>Ideal For</strong><span>${esc(info.idealFor)}</span></div>
        </div>`;
    $("serviceDetailsIncludes").innerHTML = info.includes
        .map(item => `<li><i class="fa-solid fa-circle-check"></i> ${esc(item)}</li>`).join("");

    openModal("serviceDetailsModal");
}

function closeServiceDetailsModal() {
    closeModal("serviceDetailsModal");
    pendingServiceSelection = null;
}

function proceedToBookService() {
    const service = pendingServiceSelection;
    closeServiceDetailsModal();
    if (service) selectService(service);
}

/* ---------- Admin login & navigation ---------- */
$("loginForm").addEventListener("submit", e => {
    e.preventDefault();
    const user = $("loginUsername").value.trim();
    const pass = $("loginPassword").value.trim();

    if ((user === "admin" || user === "administrator") && pass === "admin123") {
        sessionStorage.setItem("pecana_admin_logged_in", "true");
        showView("adminApp");
        openAdminPage("dashboard");
    } else {
        alert("Invalid login.");
    }
});

const PAGES = {
    dashboard:        { title: "Dashboard",              render: () => renderDashboard() },
    appointments:     { title: "Appointment Management", render: () => renderAppointments() },
    appointmentQueue: { title: "Appointment Queue",      render: () => renderAppointmentQueue() },
    walkinQueue:      { title: "Walk-In Queue",          render: () => renderWalkinQueue() },
    patients:         { title: "Patient Records",        render: () => renderPatients() },
    schedule:         { title: "Daily Schedule",         render: () => renderSchedule() },
    inventory:        { title: "Inventory",              render: () => renderInventory() },
    forecast:         { title: "Restock Forecast",       render: () => renderForecast() },
    reports:          { title: "Reports",                render: () => renderReports() }
};

let currentAdminPage = "dashboard";

document.querySelectorAll(".side-link[data-page]").forEach(btn =>
    btn.addEventListener("click", () => openAdminPage(btn.dataset.page)));

function openAdminPage(page) {
    const target = $(`page-${page}`);
    if (!target) return;

    currentAdminPage = page;
    sessionStorage.setItem("pecana_admin_page", page);

    document.querySelectorAll(".admin-page").forEach(el => el.classList.toggle("active", el === target));
    document.querySelectorAll(".side-link[data-page]").forEach(el => el.classList.toggle("active", el.dataset.page === page));
    $("pageTitle").textContent = PAGES[page]?.title || "Dashboard";

    renderAll();
}

function renderAll() {
    syncAppointmentQueue();
    PAGES[currentAdminPage]?.render();
    renderAppointmentPatients();
    renderPublicQueues();
    updateAdminNotifications();
    updatePatientNotifications();
    if (currentAdminPage !== "forecast") renderForecastSummary();
}

/* ---------- Material stepper (appointment / walk-in / approval) ---------- */
const adjustments = { appointment: {}, walkin: {}, approval: {} };

const MATERIAL_SCOPES = {
    appointment: { select: "adminAppointmentService", card: "materialInsightCard",       list: "predictionList",         badge: "stockStatusBadge" },
    walkin:      { select: "walkinService",           card: "walkinMaterialInsightCard", list: "walkinPredictionList",   badge: "walkinStockStatusBadge" },
    approval:    {                                                                        list: "approvalPredictionList", badge: "approvalStockStatusBadge" }
};

function renderMaterialScope(scope) {
    const cfg = MATERIAL_SCOPES[scope];
    const list = $(cfg.list);
    if (!list) return;
    let allOk = true;

    list.innerHTML = Object.entries(adjustments[scope]).map(([name, qty]) => {
        const stock = inventory.find(i => i.name === name)?.stock ?? 0;
        const low = stock < qty;
        if (low) allOk = false;
        return `
            <div class="prediction-item-pro">
                <div>
                    <span class="item-name">${esc(name)}</span>
                    ${low ? `<span class="stock-warning"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock: ${stock}</span>` : ""}
                </div>
                <div class="item-controls">
                    <button type="button" class="qty-btn minus" data-scope="${scope}" data-name="${esc(name)}" data-delta="-1">−</button>
                    <span class="qty-value">x${qty}</span>
                    <button type="button" class="qty-btn plus" data-scope="${scope}" data-name="${esc(name)}" data-delta="1">+</button>
                </div>
            </div>`;
    }).join("");

    const badge = $(cfg.badge);
    if (badge) {
        badge.textContent = allOk ? "Stock Verified" : "Shortage Detected";
        badge.className = `insight-badge ${allOk ? "success" : "danger"}`;
    }
}

document.addEventListener("click", e => {
    const btn = e.target.closest(".qty-btn[data-scope]");
    if (!btn) return;
    const { scope, name, delta } = btn.dataset;
    adjustments[scope][name] = Math.max(0, (adjustments[scope][name] || 0) + Number(delta));
    renderMaterialScope(scope);
});

/* Called when the service <select> changes in the appointment / walk-in modal */
function updateMaterialPrediction(scope) {
    const cfg = MATERIAL_SCOPES[scope];
    const card = $(cfg.card);
    if (!card) return;

    const materials = BOM[$(cfg.select).value];
    if (materials && Object.keys(materials).length) {
        card.classList.remove("hidden");
        adjustments[scope] = { ...materials };
        renderMaterialScope(scope);
    } else {
        card.classList.add("hidden");
        adjustments[scope] = {};
    }
}

/* ---------- Schedule validation ---------- */
const CLINIC_OPEN_MIN = 7 * 60;
const CLINIC_CLOSE_MIN = 20 * 60;
const LUNCH_START_MIN = 12 * 60;
const LUNCH_END_MIN = 13 * 60;
const TIME_RANGE_MESSAGE = "Please choose a time between 7:00 AM and 8:00 PM — that's when the clinic is open.";

function validateClinicSchedule(dateValue, timeValue, dateInput, timeInput) {
    dateInput?.setCustomValidity("");
    timeInput?.setCustomValidity("");

    const fail = (el, msg) => {
        if (el) { el.setCustomValidity(msg); el.reportValidity(); }
        return false;
    };

    const now = new Date();
    const [year, month, day] = dateValue.split("-").map(Number);
    const [hour, minute] = timeValue.split(":").map(Number);

    const selected = new Date(year, month - 1, day, hour, minute);
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedMidnight = new Date(year, month - 1, day);

    if (selectedMidnight < todayMidnight)
        return fail(dateInput, "Please choose today's date or a later one — the date you selected has already passed.");

    if (selectedMidnight.getTime() === todayMidnight.getTime() && selected <= now)
        return fail(timeInput, "That time has already passed for today. Please choose a later time.");

    const total = hour * 60 + minute;
    if (total < CLINIC_OPEN_MIN || total >= CLINIC_CLOSE_MIN) return fail(timeInput, TIME_RANGE_MESSAGE);

    if (total >= LUNCH_START_MIN && total < LUNCH_END_MIN)
        return fail(timeInput, "The clinic is closed for lunch break from 12:00 PM to 1:00 PM. Please choose another time.");

    return true;
}

function setupScheduleFields(dateId, timeId) {
    const dateEl = $(dateId);
    const timeEl = $(timeId);

    const clear = () => { dateEl.setCustomValidity(""); timeEl.setCustomValidity(""); };
    [dateEl, timeEl].forEach(el => { el.addEventListener("input", clear); el.addEventListener("change", clear); });

    timeEl.addEventListener("invalid", () => {
        if (timeEl.validity.customError) return;
        if (timeEl.validity.rangeUnderflow || timeEl.validity.rangeOverflow) timeEl.setCustomValidity(TIME_RANGE_MESSAGE);
        else if (timeEl.validity.valueMissing) timeEl.setCustomValidity("Please choose a time.");
    });
}

/* ---------- Admin: create appointment ---------- */
const patientOptions = () =>
    `<option value="">Select patient</option>` +
    patients.map(p => `<option value="${p.id}">${esc(p.name)} (${p.id})</option>`).join("");

function renderAppointmentPatients() {
    const select = $("adminAppointmentPatient");
    if (!select) return;
    const selected = select.value;
    select.innerHTML = patientOptions();
    if (patients.some(p => p.id === selected)) select.value = selected;
}

function openAppointmentModal() {
    renderAppointmentPatients();
    $("adminAppointmentDate").value = today();
    openModal("appointmentModal");
}

function closeAppointmentModal() {
    closeModal("appointmentModal");
    $("adminAppointmentForm").reset();
    $("materialInsightCard").classList.add("hidden");
    adjustments.appointment = {};
}

function createAppointmentFor(id) {
    openAppointmentModal();
    $("adminAppointmentPatient").value = id;
}

$("adminAppointmentForm").addEventListener("submit", e => {
    e.preventDefault();

    const dateEl = $("adminAppointmentDate");
    const timeEl = $("adminAppointmentTime");
    const date = dateEl.value;
    const time = timeEl.value;

    if (!validateClinicSchedule(date, time, dateEl, timeEl)) return;

    const patient = patients.find(p => p.id === $("adminAppointmentPatient").value);
    if (!patient) { alert("Please select a patient."); return; }

    const appointment = {
        id: nextId("APT", appointments),
        patientId: patient.id,
        patientName: patient.name,
        date,
        time,
        service: $("adminAppointmentService").value,
        status: "Pending",
        queueStatus: null,
        customMaterials: { ...adjustments.appointment }
    };

    appointments.push(appointment);
    save(STORAGE.appointments, appointments);

    alert("Appointment created successfully for " + appointment.patientName);
    closeAppointmentModal();
    renderAll();
});

/* ---------- Admin: edit appointment ---------- */
function openEditAppointmentModal(id) {
    const a = appointments.find(x => x.id === id);
    if (!a) return;

    const dateEl = $("editAppointmentDate");
    const timeEl = $("editAppointmentTime");

    $("editAppointmentId").value = a.id;
    $("editAppointmentPatientName").value = a.patientName;
    dateEl.value = a.date;
    dateEl.min = today();
    timeEl.value = a.time;
    dateEl.setCustomValidity("");
    timeEl.setCustomValidity("");

    openModal("editAppointmentModal");
}

function closeEditAppointmentModal() {
    closeModal("editAppointmentModal");
    $("editAppointmentForm").reset();
    $("editAppointmentDate").setCustomValidity("");
    $("editAppointmentTime").setCustomValidity("");
}

$("editAppointmentForm").addEventListener("submit", e => {
    e.preventDefault();

    const dateEl = $("editAppointmentDate");
    const timeEl = $("editAppointmentTime");
    const newDate = dateEl.value;
    const newTime = timeEl.value;

    if (!validateClinicSchedule(newDate, newTime, dateEl, timeEl)) return;

    const id = $("editAppointmentId").value;
    const a = appointments.find(x => x.id === id);
    if (!a) return;

    if (a.date !== newDate || a.time !== newTime) a.rescheduled = true;
    a.date = newDate;
    a.time = newTime;

    const q = appointmentQueue.find(x => x.appointmentId === id);
    if (q) { q.date = newDate; q.time = newTime; }

    save(STORAGE.appointments, appointments);
    save(STORAGE.appointmentQueue, appointmentQueue);

    closeEditAppointmentModal();
    alert("Appointment updated successfully.");
    renderAll();
});

/* ---------- Row selection (bulk delete) ---------- */
const selection = { appointment: new Set(), patient: new Set() };
const lastPicked = { appointment: null, patient: null };

const SELECT_CFG = {
    appointment: { bar: "apptBulkBar",    count: "apptBulkCount",    allBtn: "apptBulkAll",    all: "apptSelectAll",    body: "appointmentTable" },
    patient:     { bar: "patientBulkBar", count: "patientBulkCount", allBtn: "patientBulkAll", all: "patientSelectAll", body: "patientTable" }
};

const rowCheckCell = (type, id) =>
    `<td class="chk-col"><input type="checkbox" class="row-check" data-id="${id}" ${selection[type].has(id) ? "checked" : ""}></td>`;

const pruneSelection = (type, visibleIds) => {
    const visible = new Set(visibleIds);
    selection[type] = new Set([...selection[type]].filter(id => visible.has(id)));
};

function setSelected(type, id, on) {
    if (!id) return;
    on ? selection[type].add(id) : selection[type].delete(id);
}

function syncSelectionUI(type) {
    const cfg = SELECT_CFG[type];
    const set = selection[type];
    const body = $(cfg.body);
    if (!body) return;

    const boxes = body.querySelectorAll(".row-check");
    const total = boxes.length;

    boxes.forEach(b => b.closest("tr")?.classList.toggle("row-selected", b.checked));

    const all = $(cfg.all);
    if (all) {
        all.checked = total > 0 && set.size === total;
        all.indeterminate = set.size > 0 && set.size < total;
    }

    $(cfg.bar)?.classList.toggle("hidden", set.size === 0);
    if ($(cfg.count)) $(cfg.count).textContent = set.size;

    const allBtn = $(cfg.allBtn);
    if (allBtn) {
        allBtn.textContent = `Select all ${total}`;
        allBtn.classList.toggle("hidden", set.size >= total);
    }
}

function toggleSelectAll(type, checked) {
    document.querySelectorAll(`#${SELECT_CFG[type].body} .row-check`).forEach(b => {
        b.checked = checked;
        setSelected(type, b.dataset.id, checked);
    });
    syncSelectionUI(type);
}

function clearSelection(type) {
    selection[type].clear();
    lastPicked[type] = null;
    document.querySelectorAll(`#${SELECT_CFG[type].body} .row-check`).forEach(b => { b.checked = false; });
    syncSelectionUI(type);
}

function pickRow(type, cb, shift) {
    const boxes = [...document.querySelectorAll(`#${SELECT_CFG[type].body} .row-check`)];
    const idx = boxes.indexOf(cb);
    const want = cb.checked;

    if (shift && lastPicked[type] !== null && boxes[lastPicked[type]]) {
        const [from, to] = [lastPicked[type], idx].sort((a, b) => a - b);
        for (let i = from; i <= to; i++) {
            boxes[i].checked = want;
            setSelected(type, boxes[i].dataset.id, want);
        }
    } else {
        setSelected(type, cb.dataset.id, want);
    }

    lastPicked[type] = idx;
    syncSelectionUI(type);
}

Object.entries(SELECT_CFG).forEach(([type, cfg]) => {
    const body = $(cfg.body);
    body.addEventListener("mousedown", e => { if (e.shiftKey) e.preventDefault(); });
    body.addEventListener("click", e => {
        const direct = e.target.closest(".row-check");
        if (direct) { pickRow(type, direct, e.shiftKey); return; }

        if (e.target.closest("button, a, input, label, select")) return;
        if (String(window.getSelection?.() || "").length) return;

        const cb = e.target.closest("tr")?.querySelector(".row-check");
        if (!cb) return;
        cb.checked = !cb.checked;
        pickRow(type, cb, e.shiftKey);
    });
});

/* ---------- Patients ---------- */
$("patientForm").addEventListener("submit", e => {
    e.preventDefault();

    const name = $("patientName").value.trim();
    if (!name) { alert("Please enter the patient's name."); return; }
    if (patients.some(p => p.name.toLowerCase() === name.toLowerCase())) { alert("This patient is already registered."); return; }

    const patient = {
        id: nextId("P", patients),
        name,
        contact: $("patientContact").value.trim(),
        dob: $("patientDOB").value,
        gender: $("patientGender").value,
        address: $("patientAddress").value.trim(),
        status: "Active"
    };

    patients.push(patient);
    save(STORAGE.patients, patients);

    closeAddPatientModal();
    renderAll();
    alert(`${patient.name} was successfully registered.`);
});

function viewPatient(id) {
    const p = patients.find(x => x.id === id);
    if (!p) return;
    const field = (label, value) => `<div><strong>${label}</strong>${value}</div>`;
    $("patientDetails").innerHTML = `
        <div class="patient-detail">
            ${field("Patient ID", esc(p.id))}
            ${field("Full Name", esc(p.name))}
            ${field("Contact", esc(p.contact))}
            ${field("Email Address", esc(p.email || "-"))}
            ${field("Date of Birth", formatDate(p.dob))}
            ${field("Gender", esc(p.gender || "-"))}
            ${field("Address", esc(p.address || "-"))}
            ${field("Emergency Contact", esc(p.emergency || "-"))}
            ${field("Dental Concern", esc(p.concern || "-"))}
        </div>`;
    openModal("patientModal");
}

const openAddPatientModal = () => openModal("addPatientModal");

function closeAddPatientModal() {
    closeModal("addPatientModal");
    $("patientForm").reset();
}

function renderPatients() {
    const table = $("patientTable");
    if (!table) return;

    const filter = ($("patientSearch")?.value || "").toLowerCase();

    if (!patients.length) {
        selection.patient.clear();
        table.innerHTML = `<tr><td colspan="8">No patients registered.</td></tr>`;
        syncSelectionUI("patient");
        return;
    }

    const filtered = patients.filter(p => p.name.toLowerCase().includes(filter) || p.id.toLowerCase().includes(filter));
    pruneSelection("patient", filtered.map(p => p.id));

    if (!filtered.length && filter) {
        table.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#888;">No results found for "${esc(filter)}"</td></tr>`;
        syncSelectionUI("patient");
        return;
    }

    table.innerHTML = filtered.map(p => {
        const concern = p.concern || "-";
        const isLong = concern.length > 40;
        const shortConcern = isLong ? concern.slice(0, 40).trim() + "…" : concern;

        return `
        <tr class="${selection.patient.has(p.id) ? "row-selected" : ""}">
            ${rowCheckCell("patient", p.id)}
            <td>${p.id}</td>
            <td><strong>${esc(p.name)}</strong></td>
            <td>${esc(p.contact)}</td>
            <td>${formatDate(p.dob)}</td>
            <td class="concern-cell">
                <span class="concern-text" title="${esc(concern)}">${esc(shortConcern)}</span>
                ${isLong ? `<button type="button" class="concern-more" onclick="viewPatient('${p.id}')">See more</button>` : ""}
            </td>
            <td><span class="badge approved">${p.status}</span></td>
            <td>
                <button class="action-btn primary" onclick="viewPatient('${p.id}')">View</button>
                <button class="action-btn success" onclick="createAppointmentFor('${p.id}')">Appt</button>
                <button class="action-btn warning" onclick="registerPatientWalkin('${p.id}')">Walk-In</button>
            </td>
        </tr>`;
    }).join("");

    syncSelectionUI("patient");
}

/* ---------- Appointment list ---------- */
function renderAppointments() {
    const table = $("appointmentTable");
    if (!table) return;

    const filter = ($("appointmentSearch")?.value || "").toLowerCase();
    const t = today();

    if (!appointments.length) {
        selection.appointment.clear();
        table.innerHTML = `<tr><td colspan="8">No appointments found.</td></tr>`;
        syncSelectionUI("appointment");
        return;
    }

    const filtered = appointments.filter(a => {
        if (!a.patientName.toLowerCase().includes(filter) && !a.id.toLowerCase().includes(filter)) return false;
        if (a.date < t) return false;
        if (a.status === "Completed" || a.status === "No-show") return a.date === t;
        return true;
    });

    const statusPriority = { "Pending": 0, "Approved": 1, "Completed": 2, "No-show": 2 };
    const sorted = [...filtered].sort((a, b) => {
        const futureDiff = (a.date > t ? 1 : 0) - (b.date > t ? 1 : 0);
        if (futureDiff) return futureDiff;

        const rankDiff = (statusPriority[a.status] ?? 3) - (statusPriority[b.status] ?? 3);
        if (rankDiff) return rankDiff;

        return `${a.date} ${a.time || "00:00"}`.localeCompare(`${b.date} ${b.time || "00:00"}`);
    });

    pruneSelection("appointment", sorted.map(a => a.id));

    table.innerHTML = withDailyNumbers(sorted, "APT").map(a => `
        <tr class="${selection.appointment.has(a.id) ? "row-selected" : ""}">
            ${rowCheckCell("appointment", a.id)}
            <td>${a.displayNo}</td>
            <td><strong>${esc(a.patientName)}</strong></td>
            <td>${formatDate(a.date)}</td>
            <td>${formatTime(a.time)}</td>
            <td>${esc(a.service)}</td>
            <td><span class="badge ${statusClass(a.status)}">${a.status}</span></td>
            <td>
                ${a.status === "Pending" ? `
                    ${a.date <= t
                        ? `<button class="action-btn success" onclick="approveAppointment('${a.id}')">Approve</button>`
                        : `<span style="font-size:.75rem;color:#9aa0a6;">Approvable on ${formatDate(a.date)}</span>`}
                    <button class="action-btn warning" onclick="openEditAppointmentModal('${a.id}')">Edit</button>` : ""}
                ${a.status === "Approved" ? `<button class="action-btn primary" onclick="openAdminPage('appointmentQueue')">Queue</button>` : ""}
            </td>
        </tr>`).join("");

    syncSelectionUI("appointment");
}

/* ---------- Public booking form ---------- */
$("appointmentForm").addEventListener("submit", e => {
    e.preventDefault();

    const dateEl = $("bookingDate");
    const timeEl = $("bookingTime");
    const date = dateEl.value;
    const time = timeEl.value;
    const name = $("bookingName").value.trim();
    const contact = $("bookingContact").value.trim();
    const email = $("bookingEmail").value.trim();
    const address = $("bookingAddress").value.trim();
    const dob = $("bookingDOB").value;
    const service = $("bookingService").value;
    const concern = $("bookingConcern").value.trim();

    if (!validateClinicSchedule(date, time, dateEl, timeEl)) return;

    let patient = patients.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!patient) {
        patient = { id: nextId("P", patients), name, contact, email, dob, address, gender: "", emergency: "", concern, status: "Active" };
        patients.push(patient);
    } else {
        if (contact && !patient.contact) patient.contact = contact;
        if (email && !patient.email) patient.email = email;
        if (address && !patient.address) patient.address = address;
        if (dob && !patient.dob) patient.dob = dob;
    }
    save(STORAGE.patients, patients);

    appointments.push({
        id: nextId("APT", appointments),
        patientId: patient.id,
        patientName: patient.name,
        date, time, service,
        status: "Pending",
        queueStatus: null
    });
    save(STORAGE.appointments, appointments);

    e.target.reset();
    alert("Appointment submitted successfully!");
    showPublicPage("home");
    renderAll();
});

/* ---------- Approve appointment ---------- */
let pendingApprovalId = null;

const approveAppointment = id => openApproveDetailsModal(id);

function openApproveDetailsModal(id) {
    const a = appointments.find(x => x.id === id);
    if (!a) return;
    const p = patients.find(x => x.id === a.patientId);

    pendingApprovalId = id;
    adjustments.approval = { ...materialsFor(a) };

    const field = (label, value) => `<div><strong>${label}</strong>${esc(value)}</div>`;
    const content = $("approveDetailsContent");
    content.innerHTML = [
        field("Patient Name", a.patientName),
        field("Contact Number", p?.contact || "-"),
        field("Email Address", p?.email || "-"),
        field("Address", p?.address || "-"),
        `<div><strong>Date</strong>${formatDate(a.date)}</div>`,
        `<div><strong>Time</strong>${formatTime(a.time)}</div>`,
        field("Dental Service", a.service),
        field("Dental Concern", a.concern || p?.concern || "-")
    ].join("");

    if (Object.keys(adjustments.approval).length) {
        const insight = document.createElement("div");
        insight.style.gridColumn = "1 / -1";
        insight.className = "insight-card";
        insight.innerHTML = `
            <div class="insight-header">
                <div class="insight-title"><i class="fa-solid fa-microchip"></i><span>Clinical Supply Insight</span></div>
                <div class="insight-badge" id="approvalStockStatusBadge">Checking Stock...</div>
            </div>
            <div class="insight-content"><div id="approvalPredictionList" class="prediction-list"></div></div>`;
        content.appendChild(insight);
        renderMaterialScope("approval");
    }

    openModal("approveDetailsModal");
}

function closeApproveDetailsModal() {
    closeModal("approveDetailsModal");
    pendingApprovalId = null;
    adjustments.approval = {};
}

function confirmApproveAppointment() {
    const a = appointments.find(x => x.id === pendingApprovalId);
    if (!a) { closeApproveDetailsModal(); return; }

    if (a.date > today()) {
        alert(`This appointment is scheduled for ${formatDate(a.date)} and can only be approved on that date.`);
        closeApproveDetailsModal();
        return;
    }

    if (Object.keys(adjustments.approval).length) a.customMaterials = { ...adjustments.approval };

    a.status = "Approved";
    a.queueStatus = "Waiting";
    syncAppointmentQueue();
    save(STORAGE.appointments, appointments);

    closeApproveDetailsModal();
    renderAll();
}

/* ---------- Queue helpers ---------- */
const queueActions = (q, kind) =>
    q.status === "Waiting"
        ? `<button class="action-btn primary" onclick="serve${kind}('${q.number}')">Serve</button><button class="action-btn danger" onclick="noShow${kind}('${q.number}')">No-show</button>`
    : q.status === "Serving"
        ? `<button class="action-btn success" onclick="complete${kind}('${q.number}')">Complete</button>`
        : "";

const queueCard = (no, q, { time = false, actions = "" } = {}) => `
    <div class="queue-card">
        <div class="queue-number">${no}</div>
        <div class="queue-details">
            <h3>${esc(q.patientName)}</h3>
            <p>${esc(q.service)}${time ? ` · ${formatTime(q.time)}` : ""}</p>
            <span class="badge ${statusClass(q.status)}">${q.status}</span>
        </div>
        ${actions ? `<div class="queue-actions">${actions}</div>` : ""}
    </div>`;

const isActiveQueue = q => q.status === "Waiting" || q.status === "Serving";

/* ---------- Appointment queue ---------- */
function syncAppointmentQueue() {
    appointments.forEach(a => {
        let q = appointmentQueue.find(x => x.appointmentId === a.id);

        if (a.status === "Approved" && (a.queueStatus === "Waiting" || a.queueStatus === "Serving")) {
            if (!q) {
                q = { number: nextQueue("A", appointmentQueue), appointmentId: a.id };
                appointmentQueue.push(q);
            }
            Object.assign(q, {
                patientId: a.patientId, patientName: a.patientName, service: a.service,
                time: a.time, date: a.date, status: a.queueStatus
            });
        }

        if (q) {
            if (a.status === "Completed") q.status = "Completed";
            if (a.status === "No-show") q.status = "No-show";
        }
    });
    save(STORAGE.appointmentQueue, appointmentQueue);
}

function renderAppointmentQueue() {
    const container = $("appointmentQueueContainer");
    if (!container) return;

    syncAppointmentQueue();
    const queues = appointmentQueue.filter(isActiveQueue);

    if (!queues.length) {
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-calendar-check"></i><strong>No appointment patients waiting.</strong><p>Approved appointments will appear here automatically.</p></div>`;
        return;
    }

    container.innerHTML = withDailyNumbers(queues, "A")
        .map(q => queueCard(q.displayNo, q, { time: true, actions: queueActions(q, "Appointment") })).join("");
}

function setAppointmentQueueStatus(number, status, { guardFuture = false, futureMessage = "" } = {}) {
    const q = appointmentQueue.find(x => x.number === number);
    if (!q) return false;

    if (guardFuture && q.date > today()) { alert(futureMessage); return false; }

    q.status = status;
    const a = appointments.find(x => x.id === q.appointmentId);
    if (a) {
        a.queueStatus = status;
        if (status === "Completed" || status === "No-show") a.status = status;
    }

    save(STORAGE.appointmentQueue, appointmentQueue);
    save(STORAGE.appointments, appointments);
    return true;
}

function serveAppointment(number) {
    const active = appointmentQueue.find(q => q.status === "Serving");
    if (active) { alert(`${active.number} is currently being served.`); return; }

    if (setAppointmentQueueStatus(number, "Serving", {
        guardFuture: true,
        futureMessage: "This appointment is scheduled for a future date and cannot be served yet."
    })) renderAll();
}

function completeAppointment(number) {
    const q = appointmentQueue.find(x => x.number === number);
    if (!q) return;

    if (setAppointmentQueueStatus(number, "Completed", {
        guardFuture: true,
        futureMessage: "This appointment is scheduled for a future date and cannot be completed yet."
    })) {
        const appt = appointments.find(a => a.id === q.appointmentId);
        deductMaterials(appt?.customMaterials || BOM[q.service] || {});
        renderAll();
    }
}

function noShowAppointment(number) {
    if (setAppointmentQueueStatus(number, "No-show")) renderAll();
}

/* ---------- Walk-in queue ---------- */
function openWalkinModal(patientId = "") {
    $("walkinPatient").innerHTML = patientOptions();
    $("walkinPatient").value = patientId;
    $("walkinMaterialInsightCard").classList.add("hidden");
    adjustments.walkin = {};
    openModal("walkinModal");
}

function registerPatientWalkin(id) {
    openAdminPage("walkinQueue");
    openWalkinModal(id);
}

$("walkinForm").addEventListener("submit", e => {
    e.preventDefault();

    const patient = patients.find(p => p.id === $("walkinPatient").value);
    if (!patient) { alert("Please select a patient."); return; }

    const walkin = {
        number: nextQueue("W", walkins),
        patientId: patient.id,
        patientName: patient.name,
        service: $("walkinService").value,
        time: new Date().toTimeString().slice(0, 5),
        date: today(),
        status: "Waiting",
        customMaterials: { ...adjustments.walkin }
    };

    walkins.push(walkin);
    save(STORAGE.walkins, walkins);

    closeModal("walkinModal");
    e.target.reset();
    $("walkinMaterialInsightCard").classList.add("hidden");
    alert(`${patient.name} added as ${walkin.number}.`);
    renderAll();
});

function renderWalkinQueue() {
    const container = $("walkinQueueContainer");
    if (!container) return;

    const queues = walkins.filter(isActiveQueue);

    container.innerHTML = queues.length
        ? queues.map(q => queueCard(q.number, q, { time: true, actions: queueActions(q, "Walkin") })).join("")
        : `<div class="empty-state"><i class="fa-solid fa-person-walking"></i><strong>No walk-in patients.</strong><p>Use Add Walk-In to register a patient.</p></div>`;
}

function setWalkinStatus(number, status) {
    const q = walkins.find(x => x.number === number);
    if (!q) return null;
    q.status = status;
    save(STORAGE.walkins, walkins);
    return q;
}

function serveWalkin(number) {
    const active = walkins.find(q => q.status === "Serving");
    if (active) { alert(`${active.number} is currently being served.`); return; }
    if (setWalkinStatus(number, "Serving")) renderAll();
}

function completeWalkin(number) {
    const q = setWalkinStatus(number, "Completed");
    if (!q) return;
    deductMaterials(q.customMaterials || BOM[q.service] || {});
    renderAll();
}

function noShowWalkin(number) {
    if (setWalkinStatus(number, "No-show")) renderAll();
}

/* ---------- Daily schedule ---------- */
function renderSchedule() {
    const table = $("scheduleTable");
    if (!table) return;
    const t = today();

    const rows = [
        ...appointments.filter(a => a.date === t).map(a => ({ time: a.time, name: a.patientName, type: "Appointment", service: a.service, status: a.status })),
        ...walkins.filter(w => w.date === t).map(w => ({ time: w.time, name: w.patientName, type: "Walk-In", service: w.service, status: w.status }))
    ].sort((a, b) => a.time.localeCompare(b.time));

    table.innerHTML = rows.length ? rows.map(r => `
        <tr>
            <td>${formatTime(r.time)}</td>
            <td><strong>${esc(r.name)}</strong></td>
            <td><span class="badge ${r.type === "Appointment" ? "approved" : "waiting"}">${r.type}</span></td>
            <td>${esc(r.service)}</td>
            <td><span class="badge ${statusClass(r.status)}">${r.status}</span></td>
        </tr>`).join("")
        : `<tr><td colspan="5">No patients scheduled for today.</td></tr>`;
}

/* ---------- Inventory ---------- */
const stockBadge = i =>
    `<span class="badge ${i.stock <= i.minimum ? "no-show" : "approved"}">${i.stock <= i.minimum ? "Restock" : "OK"}</span>`;

function renderInventory() {
    const table = $("inventoryTable");
    if (!table) return;

    table.innerHTML = inventory.map(i => `
        <tr>
            <td><strong>${esc(i.name)}</strong></td>
            <td>${i.stock}</td>
            <td>${i.minimum}</td>
            <td>${stockBadge(i)}</td>
            <td><button class="action-btn success" onclick="openRestockModal('${i.id}')">Edit</button></td>
        </tr>`).join("");
}

function openRestockModal(id) {
    const item = inventory.find(x => x.id === id);
    if (!item) return;
    $("restockId").value = item.id;
    $("restockName").value = item.name;
    $("restockValue").value = item.stock;
    openModal("restockModal");
}

function handleRestockUpdate(e) {
    e.preventDefault();
    const item = inventory.find(x => x.id === $("restockId").value);

    if (item) {
        item.stock = parseInt($("restockValue").value);
        save(STORAGE.inventory, inventory);
        closeModal("restockModal");
        renderAll();
        openAdminPage("inventory");
        alert(`${item.name} stock updated successfully.`);
    }
    return false;
}

/* ---------- Restock forecast ---------- */
function getUpcoming(days = 30) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    return appointments.filter(a => {
        if (a.status !== "Approved" && a.status !== "Pending") return false;
        const date = new Date(a.date + "T00:00:00");
        return date >= start && date <= end;
    });
}

function calculateForecast() {
    const demand = {};
    getUpcoming(30).forEach(a =>
        Object.entries(materialsFor(a)).forEach(([name, qty]) => { demand[name] = (demand[name] || 0) + qty; }));

    return inventory.map(item => {
        const usage = demand[item.name] || 0;
        const projected = item.stock - usage;
        const dailyRate = usage / 30;
        return {
            ...item,
            projectedUsage: usage,
            projectedStock: projected,
            warning: projected <= item.minimum,
            daysUntilStockout: dailyRate > 0 ? Math.floor(item.stock / dailyRate) : null
        };
    });
}

function formatDuration(days) {
    const unit = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
    if (days < 14) return unit(days, "day");
    if (days < 60) return unit(Math.round(days / 7), "week");
    if (days < 365) return unit(Math.round(days / 30), "month");
    return unit(Math.round(days / 365), "year");
}

function stockoutTag(x) {
    if (x.daysUntilStockout === null) return `<span class="stockout-tag ok">No active usage — stock is stable</span>`;
    const time = formatDuration(x.daysUntilStockout);
    if (x.daysUntilStockout <= 0) return `<span class="stockout-tag critical">Out of stock now</span>`;
    if (x.daysUntilStockout <= x.leadTime) return `<span class="stockout-tag critical">Runs out in ~${time} (before restock arrives)</span>`;
    return `<span class="stockout-tag">Runs out in ~${time}</span>`;
}

function renderForecast() {
    const forecast = calculateForecast();

    $("forecastAppointments").textContent = getUpcoming(30).length;
    $("forecastMaterials").textContent = inventory.length;
    $("forecastWarnings").textContent = forecast.filter(x => x.warning).length;

    $("forecastResults").innerHTML = forecast.map(x => `
        <div class="forecast-result ${x.warning ? "warning" : ""}">
            <strong>${esc(x.name)}</strong>
            <span>Current Stock: ${x.stock} · Projected Usage: ${x.projectedUsage} · Remaining: ${x.projectedStock} · Supplier Lead Time: ${x.leadTime} days</span>
            ${stockoutTag(x)}
            ${x.warning
                ? `<button class="action-btn danger" onclick="suggestRestock('${esc(x.name)}',${x.projectedStock},${x.leadTime})">Suggest Restock</button>`
                : `<span>✓ Sufficient stock</span>`}
        </div>`).join("");

    renderForecastSummary();
}

function renderForecastSummary() {
    const el = $("forecastSummary");
    if (!el) return;
    const n = calculateForecast().filter(x => x.warning).length;
    el.textContent = n ? `${n} material(s) require restocking.` : "Inventory is sufficient for projected demand.";
}

function suggestRestock(name, stock, lead) {
    alert(`RESTOCK SUGGESTION\n\nMaterial: ${name}\nProjected Remaining: ${stock}\nSupplier Lead Time: ${lead} days\n\nRecommendation: Add ${name} to the next purchase order.`);
    openAdminPage("inventory");
}

/* ---------- Public queue status ---------- */
function renderPublicQueues() {
    const aBox = $("publicAppointmentQueue");
    const wBox = $("publicWalkinQueue");
    if (!aBox || !wBox) return;

    syncAppointmentQueue();
    const a = withDailyNumbers(appointmentQueue.filter(isActiveQueue), "A");
    const w = walkins.filter(isActiveQueue);

    aBox.innerHTML = a.length ? a.map(q => queueCard(q.displayNo, q)).join("") : `<div class="empty-state">No appointment patients waiting.</div>`;
    wBox.innerHTML = w.length ? w.map(q => queueCard(q.number, q)).join("") : `<div class="empty-state">No walk-in patients waiting.</div>`;
}

/* ---------- Dashboard ---------- */
const charts = {};
function drawChart(key, canvasId, config) {
    const ctx = $(canvasId)?.getContext("2d");
    if (!ctx) return;
    charts[key]?.destroy();
    charts[key] = new Chart(ctx, config);
}

const shortWeekday = s => new Date(s + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
const shortMonthDay = s => new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

const apptsOn = d => appointments.filter(a => a.date === d && a.status !== "Cancelled");
const walkinsOn = d => walkins.filter(w => w.date === d);
const countOn = d => apptsOn(d).length + walkinsOn(d).length;

function renderDashboardCharts() {
    const genderData = {
        Male: patients.filter(p => p.gender === "Male").length,
        Female: patients.filter(p => p.gender === "Female").length,
        Other: patients.filter(p => p.gender === "Other" || !p.gender || p.gender === "Select").length
    };

    const serviceCounts = {};
    appointments.forEach(a => { serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1; });

    drawChart("gender", "genderChart", {
        type: "doughnut",
        data: {
            labels: Object.keys(genderData),
            datasets: [{ data: Object.values(genderData), backgroundColor: ["#5b0b68", "#78138a", "#ead3f0"], borderWidth: 0 }]
        },
        options: { plugins: { legend: { position: "bottom" } }, maintainAspectRatio: false }
    });

    drawChart("service", "serviceChart", {
        type: "bar",
        data: {
            labels: Object.keys(serviceCounts),
            datasets: [{ label: "Appointments", data: Object.values(serviceCounts), backgroundColor: "#78138a", borderRadius: 5 }]
        },
        options: { indexAxis: "y", plugins: { legend: { display: false } }, maintainAspectRatio: false }
    });

    drawChart("inventory", "inventoryChart", {
        type: "bar",
        data: {
            labels: inventory.map(i => i.name),
            datasets: [
                { label: "Current Stock", data: inventory.map(i => i.stock), backgroundColor: "#5b0b68" },
                { label: "Min Required", data: inventory.map(i => i.minimum), backgroundColor: "#d93434" }
            ]
        },
        options: { scales: { y: { beginAtZero: true } }, maintainAspectRatio: false }
    });
}

function renderDailyApptChart() {
    const days = Array.from({ length: 7 }, (_, i) => addDays(today(), i - 6));

    drawChart("daily", "dailyApptChart", {
        type: "bar",
        data: {
            labels: days.map(shortWeekday),
            datasets: [
                { label: "Appointments", data: days.map(d => apptsOn(d).length), backgroundColor: "#5b0b68", borderRadius: 6, borderSkipped: false },
                { label: "Walk-Ins", data: days.map(d => walkinsOn(d).length), backgroundColor: "#d9b8e2", borderRadius: 6, borderSkipped: false }
            ]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
}

function renderApptTrendChart() {
    const t = today();
    const days = Array.from({ length: 15 }, (_, i) => addDays(t, i - 7));

    const namesByDay = days.map(d => [
        ...apptsOn(d).map(a => `${a.patientName} (${a.service})`),
        ...walkinsOn(d).map(w => `${w.patientName} (Walk-In)`)
    ]);

    const hoverLine = {
        id: "hoverLine",
        afterDatasetsDraw(chart) {
            const active = chart.getActiveElements();
            if (!active.length) return;
            const { x } = active[0].element;
            const { top, bottom } = chart.chartArea;
            const c = chart.ctx;
            c.save();
            c.beginPath();
            c.setLineDash([5, 4]);
            c.moveTo(x, top);
            c.lineTo(x, bottom);
            c.lineWidth = 1.5;
            c.strokeStyle = "#78138a";
            c.stroke();
            c.restore();
        }
    };

    drawChart("trend", "apptTrendChart", {
        type: "line",
        data: {
            labels: days.map(shortMonthDay),
            datasets: [{
                label: "Patients",
                data: days.map(countOn),
                borderColor: "#78138a",
                backgroundColor: "rgba(120,19,138,.12)",
                fill: true,
                tension: 0.4,
                borderWidth: 2.5,
                pointRadius: days.map(d => d === t ? 5 : 0),
                pointBackgroundColor: "#fff",
                pointBorderColor: "#5b0b68",
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#17011a",
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false,
                    titleFont: { weight: "700" },
                    callbacks: {
                        title: items => formatDate(days[items[0].dataIndex]),
                        label: item => `${item.parsed.y} patient${item.parsed.y === 1 ? "" : "s"}`,
                        afterBody: items => {
                            const names = namesByDay[items[0].dataIndex];
                            if (!names.length) return ["No appointments"];
                            const shown = names.slice(0, 6);
                            if (names.length > 6) shown.push(`+${names.length - 6} more…`);
                            return ["", ...shown];
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        },
        plugins: [hoverLine]
    });
}

let upcomingWeekStart = null;
let upcomingSelectedDate = null;

function renderUpcomingAppointments() {
    const strip = $("upcomingStrip");
    const list = $("upcomingList");
    const monthLabel = $("upcomingMonth");
    if (!strip || !list || !monthLabel) return;

    upcomingWeekStart ||= today();
    upcomingSelectedDate ||= today();

    const days = Array.from({ length: 7 }, (_, i) => addDays(upcomingWeekStart, i));
    monthLabel.textContent = new Date(days[0] + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });

    strip.innerHTML = days.map(d => `
        <button type="button" class="upcoming-day ${d === upcomingSelectedDate ? "active" : ""}" onclick="selectUpcomingDay('${d}')">
            <strong>${new Date(d + "T00:00:00").getDate()}</strong><span>${shortWeekday(d)}</span>
        </button>`).join("");

    const sel = upcomingSelectedDate;
    const rows = [
        ...apptsOn(sel).map(a => ({ time: a.time, name: a.patientName, service: a.service, status: a.status, type: "Appointment" })),
        ...walkinsOn(sel).map(w => ({ time: w.time, name: w.patientName, service: w.service, status: w.status, type: "Walk-In" }))
    ].sort((a, b) => (a.time || "").localeCompare(b.time || ""));

    if (!rows.length) {
        list.innerHTML = `<div class="upcoming-empty"><i class="fa-regular fa-calendar"></i>No patients on ${esc(formatDate(sel))}.</div>`;
        return;
    }

    list.innerHTML = rows.map(r => {
        const initials = String(r.name || "?").split(" ").filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase();
        return `
        <div class="upcoming-item">
            <div class="upcoming-avatar">${esc(initials)}</div>
            <div class="upcoming-info">
                <strong>${esc(r.name)}</strong>
                <span>${formatTime(r.time)} · ${esc(r.service)} · ${r.type}</span>
            </div>
            <span class="badge ${statusClass(r.status)}">${esc(r.status)}</span>
        </div>`;
    }).join("");
}

function selectUpcomingDay(d) {
    upcomingSelectedDate = d;
    renderUpcomingAppointments();
}

function shiftUpcomingWeek(dir) {
    upcomingWeekStart = addDays(upcomingWeekStart || today(), dir * 7);
    upcomingSelectedDate = upcomingWeekStart;
    renderUpcomingAppointments();
}

function renderDashboard() {
    const t = today();
    const servingNumber = (appointmentQueue.find(q => q.status === "Serving") || walkins.find(q => q.status === "Serving"))?.number;

    $("statAppointments").textContent = apptsOn(t).length;
    $("statWaitingAppointments").textContent = appointmentQueue.filter(q => q.status === "Waiting" && q.date === t).length;
    $("statWaitingWalkins").textContent = walkins.filter(q => q.status === "Waiting" && q.date === t).length;
    $("statServing").textContent = servingNumber || "None";
    $("statPatients").textContent = patients.length;

    renderDashboardCharts();
    try {
        renderDailyApptChart();
        renderApptTrendChart();
        renderUpcomingAppointments();
    } catch (err) {
        console.error("Dashboard extras failed:", err);
    }
}

/* ---------- Reports ---------- */
function inReportDateRange(dateValue) {
    const start = $("reportStartDate").value;
    const end = $("reportEndDate").value;
    if (!start && !end) return true;

    const d = new Date(dateValue + "T00:00:00");
    if (start && d < new Date(start + "T00:00:00")) return false;
    if (end && d > new Date(end + "T23:59:59")) return false;
    return true;
}

function clearReportDateFilter() {
    $("reportStartDate").value = "";
    $("reportEndDate").value = "";
    renderReports();
}

const getAllHistory = () => [
    ...appointments.map(a => ({ date: a.date, time: a.time || "00:00", type: "Appt", name: a.patientName, svc: a.service, stat: a.status })),
    ...walkins.map(w => ({ date: w.date, time: w.time || "00:00", type: "Walkin", name: w.patientName, svc: w.service, stat: w.status }))
];

const byDateTime = (a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
const byId = (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true });

function renderReports() {
    const countStatus = status =>
        appointmentQueue.filter(q => q.status === status).length + walkins.filter(q => q.status === status).length;

    $("reportPatients").textContent = patients.length;
    $("reportAppointments").textContent = appointments.length;
    $("reportCompleted").textContent = countStatus("Completed");
    $("reportNoShow").textContent = countStatus("No-show");

    const filter = $("reportFilter").value;
    const setTable = (title, headers, rowsHtml, emptyMsg) => {
        $("reportTableTitle").textContent = title;
        $("reportTableHeader").innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
        $("reportActivityTable").innerHTML = rowsHtml.length
            ? rowsHtml.join("")
            : `<tr><td colspan="${headers.length}">${emptyMsg}</td></tr>`;
    };

    const historyHeaders = ["Date", "Type", "Patient", "Service", "Status"];
    const historyRow = r => `
        <tr>
            <td>${formatDate(r.date)}</td>
            <td><small>${r.type}</small></td>
            <td><strong>${esc(r.name)}</strong></td>
            <td>${esc(r.svc || "-")}</td>
            <td><span class="badge ${statusClass(r.stat)}">${r.stat}</span></td>
        </tr>`;

    if (filter === "patients") {
        setTable("Full Patient Directory",
            ["ID", "Patient Name", "Contact", "Date of birth", "Gender", "Address"],
            [...patients].sort(byId).map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td><strong>${esc(p.name)}</strong></td>
                    <td>${esc(p.contact)}</td>
                    <td>${formatDate(p.dob)}</td>
                    <td>${esc(p.gender || "Other")}</td>
                    <td>${esc(p.address || "-")}</td>
                </tr>`),
            "No patients found.");

    } else if (["male", "female", "other"].includes(filter)) {
        const gender = { male: "Male", female: "Female", other: "Other" }[filter];
        const list = patients
            .filter(p => gender === "Other" ? (p.gender === "Other" || !p.gender) : p.gender === gender)
            .sort(byId);

        setTable(`${gender} Patient Directory`,
            ["No.", "Patient Name", "Contact", "Date of Birth", "Gender"],
            list.map((p, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${esc(p.name)}</strong></td>
                    <td>${esc(p.contact)}</td>
                    <td>${formatDate(p.dob)}</td>
                    <td>${esc(p.gender || "Other")}</td>
                </tr>`),
            `No ${gender} patients found.`);

    } else if (filter === "completed" || filter === "noshow") {
        const status = filter === "completed" ? "Completed" : "No-show";
        setTable(`Full ${status} History`, historyHeaders,
            getAllHistory().filter(i => i.stat === status && inReportDateRange(i.date)).sort(byDateTime).map(historyRow),
            `No ${status} records found.`);

    } else if (filter === "walkin") {
        setTable("Walk-In Patient Records",
            ["Queue #", "Date", "Time", "Patient", "Service", "Status"],
            walkins.filter(w => inReportDateRange(w.date))
                .sort((a, b) => new Date(`${a.date}T${a.time || "00:00"}`) - new Date(`${b.date}T${b.time || "00:00"}`))
                .map(w => `
                    <tr>
                        <td>${esc(w.number)}</td>
                        <td>${formatDate(w.date)}</td>
                        <td>${formatTime(w.time)}</td>
                        <td><strong>${esc(w.patientName)}</strong></td>
                        <td>${esc(w.service || "-")}</td>
                        <td><span class="badge ${statusClass(w.status)}">${w.status}</span></td>
                    </tr>`),
            "No walk-in records found.");

    } else if (filter === "inventory") {
        setTable("Inventory Stock Report",
            ["Material", "Current Stock", "Minimum Required", "Supplier Lead Time", "Status"],
            [...inventory].sort((a, b) => a.name.localeCompare(b.name)).map(i => `
                <tr>
                    <td><strong>${esc(i.name)}</strong></td>
                    <td>${i.stock}</td>
                    <td>${i.minimum}</td>
                    <td>${i.leadTime} days</td>
                    <td>${stockBadge(i)}</td>
                </tr>`),
            "No inventory records found.");

    } else {
        setTable("Recent Activity Log", historyHeaders,
            getAllHistory().filter(i => inReportDateRange(i.date)).sort(byDateTime).slice(-30).map(historyRow),
            "No activity found.");
    }
}

const PRINT_CSS = `
    @page { size: auto; margin: 0mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 18mm 16mm 22mm; margin: 0; color: #202124; counter-reset: page; }
    .print-letterhead { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #5b0b68; padding-bottom: 14px; margin-bottom: 18px; }
    .print-letterhead img { width: 56px; height: 56px; object-fit: contain; border-radius: 50%; flex-shrink: 0; }
    .print-letterhead .clinic-name { font-size: 22px; font-weight: 800; color: #5b0b68; letter-spacing: .3px; }
    .print-letterhead .clinic-tagline { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .print-meta { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
    .print-meta h2 { font-size: 17px; color: #202124; margin: 0; }
    .print-meta .gen-date { font-size: 11px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; page-break-inside: auto; }
    th, td { border: 1px solid #e5e0e7; padding: 10px; text-align: left; font-size: 12px; }
    th { background: #f6eafa; color: #5b0b68; text-transform: uppercase; letter-spacing: .4px; font-size: 10.5px; }
    tr:nth-child(even) td { background: #fbf8fc; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    .badge { font-weight: bold; }
    .page-footer { position: fixed; bottom: 8mm; left: 16mm; right: 16mm; display: flex; justify-content: space-between; font-size: 10px; color: #9aa0a6; border-top: 1px solid #eee; padding-top: 6px; }
    .page-footer .page-num::after { counter-increment: page; content: "Page " counter(page); }`;

function printFilteredReport() {
    const title = $("reportTableTitle").textContent;
    const tableContent = document.querySelector("#page-reports table").outerHTML;
    const logoSrc = document.querySelector(".sidebar-brand .brand-logo-img")?.src || "";

    const w = window.open("", "_blank");
    w.document.write(`
        <html>
            <head>
                <title>Pecaña Dental Clinic - ${esc(title)}</title>
                <style>${PRINT_CSS}</style>
            </head>
            <body>
                <div class="print-letterhead">
                    ${logoSrc ? `<img src="${logoSrc}" alt="Pecaña Dental Clinic logo">` : ""}
                    <div>
                        <div class="clinic-name">PECAÑA DENTAL CLINIC</div>
                        <div class="clinic-tagline">Dental Clinic Management System · Official Report</div>
                    </div>
                </div>

                <div class="print-meta">
                    <h2>${esc(title)}</h2>
                    <span class="gen-date">Generated: ${new Date().toLocaleString()}</span>
                </div>

                ${tableContent}

                <div class="page-footer"><span></span><span class="page-num"></span></div>

                <script>
                    window.onload = function() { window.print(); window.close(); };
                <\/script>
            </body>
        </html>`);
    w.document.close();
}

/* ---------- Advance calendar ---------- */
let advanceCalendar;

const CAL_DURATION = {
    "Dental Check-up": 45, "Dental Cleaning": 45, "Tooth Restoration": 60, "Tooth Extraction": 45, "Braces": 60
};

const calAddMinutes = (timeStr, mins) => {
    const [h, m] = String(timeStr || "00:00").split(":").map(Number);
    const total = Math.min(h * 60 + m + mins, 23 * 60 + 59);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

function calBuildEvents() {
    const q = ($("calSearch")?.value || "").trim().toLowerCase();

    const events = appointments
        .filter(a => a.date && a.time)
        .filter(a => !q || `${a.patientName} ${a.service}`.toLowerCase().includes(q))
        .map(a => {
            const end = calAddMinutes(a.time, CAL_DURATION[a.service] || 45);
            return {
                id: a.id,
                title: a.patientName,
                start: `${a.date}T${a.time}`,
                end: `${a.date}T${end}`,
                classNames: ["cal-ev", `cal-ev-${statusClass(a.status)}`],
                extendedProps: {
                    service: a.service,
                    status: a.status,
                    startLabel: formatTime(a.time),
                    timeLabel: `${formatTime(a.time)} – ${formatTime(end)}`
                }
            };
        });

    const lunchBreak = {
        title: "Lunch Break",
        startTime: "12:00:00",
        endTime: "13:00:00",
        daysOfWeek: [1, 2, 3, 4, 5, 6],
        display: "background",
        classNames: ["cal-lunch"]
    };

    return [...events, lunchBreak];
}

function calScrollTime() {
    const h = Math.min(Math.max(new Date().getHours() - 1, 7), 17);
    return `${String(h).padStart(2, "0")}:00:00`;
}

function calSyncToolbar() {
    if (!advanceCalendar) return;
    const v = advanceCalendar.view;

    $("calTitle").textContent = v.title;
    document.querySelectorAll(".cal-view-switch button").forEach(b => b.classList.toggle("active", b.dataset.view === v.type));

    const now = new Date();
    $("calToday").classList.toggle("is-current", now >= v.currentStart && now < v.currentEnd);

    const count = advanceCalendar.getEvents()
        .filter(e => e.display !== "background" && e.start >= v.currentStart && e.start < v.currentEnd).length;
    $("calCount").textContent = `${count} appointment${count === 1 ? "" : "s"} in this view`;
}

function calWireToolbar() {
    $("calPrev").onclick = () => advanceCalendar.prev();
    $("calNext").onclick = () => advanceCalendar.next();
    $("calToday").onclick = () => advanceCalendar.today();
    document.querySelectorAll(".cal-view-switch button").forEach(b => {
        b.onclick = () => advanceCalendar.changeView(b.dataset.view);
    });
    $("calSearch").addEventListener("input", () => advanceCalendar.refetchEvents());
}

function openAdvanceCalendar() {
    openModal("calendarModal");

    if (!advanceCalendar) {
        advanceCalendar = new FullCalendar.Calendar($("calendar"), {
            initialView: "timeGridWeek",
            headerToolbar: false,
            height: "100%",
            firstDay: 1,
            nowIndicator: true,
            allDaySlot: false,
            slotMinTime: "07:00:00",
            slotMaxTime: "21:00:00",
            slotDuration: "00:30:00",
            slotLabelInterval: "01:00:00",
            scrollTime: calScrollTime(),
            expandRows: false,
            slotEventOverlap: false,
            eventMinHeight: 44,
            eventDisplay: "block",
            dayMaxEvents: 3,
            fixedWeekCount: false,
            noEventsContent: "No appointments for this week",
            eventTimeFormat: { hour: "numeric", minute: "2-digit", meridiem: "short" },
            businessHours: [
                { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "07:00", endTime: "12:00" },
                { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "13:00", endTime: "20:00" }
            ],
            events: (info, success) => success(calBuildEvents()),

            slotLabelContent: arg => arg.date.toLocaleTimeString("en-US", { hour: "numeric" }),

            dayHeaderContent: arg => {
                if (arg.view.type === "dayGridMonth") return arg.text;
                const name = arg.date.toLocaleDateString("en-US", { weekday: "short" });
                return { html: `<span class="cal-dh-num">${arg.date.getDate()}</span><span class="cal-dh-name">${name}</span>` };
            },

            eventContent: arg => {
                const ev = arg.event;
                if (ev.display === "background") {
                    return { html: `<span class="cal-lunch-label"><i class="fa-solid fa-utensils"></i> Lunch Break</span>` };
                }
                const p = ev.extendedProps;

                if (arg.view.type === "listWeek") {
                    return { html: `
                        <div class="cal-ls">
                            <strong>${esc(ev.title)}</strong>
                            <span>${esc(p.service)}</span>
                            <em class="cal-ls-badge">${esc(p.status)}</em>
                        </div>` };
                }

                if (arg.view.type === "dayGridMonth") {
                    return { html: `<div class="cal-mo"><span class="cal-mo-time">${esc(p.startLabel)}</span><span class="cal-mo-name">${esc(ev.title)}</span></div>` };
                }

                const icon = SERVICE_INFO[p.service]?.icon || "fa-tooth";
                return { html: `
                    <div class="cal-ev-inner">
                        <div class="cal-ev-name"><i class="fa-solid ${icon}"></i><span>${esc(ev.title)}</span></div>
                        <div class="cal-ev-time">${esc(p.timeLabel)}</div>
                        <div class="cal-ev-service">${esc(p.service)}</div>
                    </div>` };
            },

            eventDidMount: info => {
                if (info.event.display === "background") return;
                const p = info.event.extendedProps;
                info.el.title = `${info.event.title} · ${p.service} · ${p.timeLabel} · ${p.status}`;
            },

            eventClick: info => {
                info.jsEvent.preventDefault();
                if (info.event.id) openCalendarEventDetails(info.event.id);
            },

            dateClick: info => {
                if (advanceCalendar.view.type === "dayGridMonth") advanceCalendar.changeView("timeGridWeek", info.date);
            },

            datesSet: calSyncToolbar,
            eventsSet: calSyncToolbar
        });

        calWireToolbar();
        advanceCalendar.render();
    } else {
        advanceCalendar.refetchEvents();
    }

    setTimeout(() => {
        advanceCalendar.updateSize();
        advanceCalendar.scrollToTime(calScrollTime());
        calSyncToolbar();
    }, 60);
}

function openCalendarEventDetails(id) {
    const a = appointments.find(x => x.id === id);
    if (!a) return;

    $("calendarEventContent").innerHTML = `
        <div style="grid-column:1/-1;"><strong>Patient</strong>${esc(a.patientName)}</div>
        <div><strong>Date</strong>${formatDate(a.date)}</div>
        <div><strong>Time</strong>${formatTime(a.time)}</div>
        <div style="grid-column:1/-1;"><strong>Dental Service</strong>${esc(a.service)}</div>
        <div style="grid-column:1/-1;"><strong>Status</strong><span class="badge ${statusClass(a.status)}">${esc(a.status)}</span></div>`;
    openModal("calendarEventModal");
}

/* ---------- Notifications ---------- */
let ntShownQuery = null;

const ntPlural    = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const ntBadgeText = n => (n > 9 ? "9+" : String(n));
const ntDigits    = s => String(s || "").replace(/\D/g, "");
const ntNormName  = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const ntIsNumeric = s => /^[\d\s+()-]+$/.test(s);

const ntEmpty = (icon, title, text) => `
    <div class="nt-empty">
        <div class="nt-empty-ico"><i class="fa-solid ${icon}"></i></div>
        <strong>${esc(title)}</strong>
        <p>${esc(text)}</p>
    </div>`;

const NT_PANELS = {
    adminNotify:   { box: "ntAdminBox",   bell: "adminBell" },
    patientNotify: { box: "ntPatientBox", bell: "patientBell" }
};

function ntClosePanels() {
    Object.values(NT_PANELS).forEach(({ box, bell }) => {
        $(box)?.classList.add("hidden");
        $(bell)?.setAttribute("aria-expanded", "false");
    });
}

function toggleNotifications(type) {
    const { box: boxId, bell: bellId } = NT_PANELS[type];
    const box = $(boxId);
    if (!box) return;

    const willOpen = box.classList.contains("hidden");
    ntClosePanels();
    if (!willOpen) return;

    box.classList.remove("hidden");
    $(bellId)?.setAttribute("aria-expanded", "true");
    ntPositionPanels();

    if (type === "adminNotify") updateAdminNotifications();
    else openPatientPanel();
}

function ntPositionPanels() {
    Object.values(NT_PANELS).forEach(({ box: boxId, bell: bellId }) => {
        const box = $(boxId);
        const bell = $(bellId);
        if (!box || !bell || box.classList.contains("hidden")) return;

        if (window.innerWidth <= 600) {
            const top = Math.round(bell.getBoundingClientRect().bottom + 10);
            box.style.top = top + "px";
            box.style.maxHeight = Math.max(240, window.innerHeight - top - 12) + "px";
        } else {
            box.style.top = "";
            box.style.maxHeight = "";
        }
    });
}

window.addEventListener("resize", ntPositionPanels);
window.addEventListener("scroll", ntPositionPanels, { passive: true });

document.addEventListener("click", e => {
    if (e.target.isConnected && !e.target.closest(".nt-wrap")) ntClosePanels();
});

document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    ntClosePanels();

    const deleteModal = $("deleteConfirmModal");
    if (!deleteModal.classList.contains("hidden")) { closeDeleteConfirm(); return; }
    clearSelection("appointment");
    clearSelection("patient");
});

/* Admin notifications */
function ntBuildAdminNotifications() {
    const t = today();
    const items = [];

    inventory.forEach(i => {
        const lead = `Supplier lead time: ${ntPlural(i.leadTime, "day")}`;
        if (i.stock <= 0) {
            items.push({
                key: `stock:${i.id}:${i.stock}`, group: "inventory", level: "critical", rank: 0,
                icon: "fa-box-open", tag: "Out of stock", sort: i.name,
                title: `${i.name} is out of stock`,
                text: "Procedures that use this material can't be completed until it is restocked.",
                meta: `Minimum level ${i.minimum}. ${lead}`,
                page: "inventory"
            });
        } else if (i.stock <= i.minimum) {
            items.push({
                key: `stock:${i.id}:${i.stock}`, group: "inventory", level: "warning", rank: 1,
                icon: "fa-triangle-exclamation", tag: "Low stock", sort: i.name,
                title: `${i.name} is running low`,
                text: `Only ${i.stock} left, at or below the minimum of ${i.minimum}.`,
                meta: lead,
                page: "inventory"
            });
        }
    });

    calculateForecast().forEach(f => {
        if (!f.warning || f.stock <= f.minimum) return;
        items.push({
            key: `fc:${f.id}:${f.projectedStock}`, group: "inventory", level: "warning", rank: 2,
            icon: "fa-chart-line", tag: "Forecast", sort: f.name,
            title: `${f.name} may run short`,
            text: `Upcoming appointments need ${f.projectedUsage}. Projected stock drops to ${f.projectedStock}, below the minimum of ${f.minimum}.`,
            meta: `Based on the next 30 days. Supplier lead time: ${ntPlural(f.leadTime, "day")}`,
            page: "forecast"
        });
    });

    appointments.filter(a => a.status === "Pending" && a.date >= t).forEach(a => {
        const isToday = a.date === t;
        items.push({
            key: `appt:${a.id}:${a.date}:${a.time}`, group: "appointments",
            level: isToday ? "warning" : "info", rank: isToday ? 1 : 3,
            icon: isToday ? "fa-calendar-check" : "fa-calendar-plus",
            tag: isToday ? "Needs approval" : "New request",
            sort: `${a.date} ${a.time || "00:00"}`,
            title: isToday ? `Approve ${a.patientName}'s visit` : `${a.patientName} requested an appointment`,
            text: isToday
                ? `${a.service} today at ${formatTime(a.time)}. Approving adds the patient to the appointment queue.`
                : `${a.service} on ${formatDate(a.date)} at ${formatTime(a.time)}.`,
            meta: isToday ? "Scheduled for today" : `Can be approved on ${formatDate(a.date)}`,
            page: "appointments"
        });
    });

    return items.sort((a, b) => a.rank - b.rank || a.sort.localeCompare(b.sort));
}

function updateAdminNotifications() {
    const list = $("ntAdminList");
    const badge = $("ntAdminBadge");
    const bell = $("adminBell");
    const sub = $("ntAdminSub");
    if (!list || !badge) return;

    const items = ntBuildAdminNotifications();
    const keys = new Set(items.map(n => n.key));

    let read = new Set(readJSON(NT_KEYS.adminRead, []));
    const kept = [...read].filter(k => keys.has(k));
    if (kept.length !== read.size) {
        read = new Set(kept);
        save(NT_KEYS.adminRead, kept);
    }

    const unread = items.filter(n => !read.has(n.key)).length;

    badge.textContent = ntBadgeText(unread);
    badge.classList.toggle("hidden", unread === 0);
    bell?.classList.toggle("has-unread", unread > 0);
    bell?.setAttribute("aria-label", unread ? `Notifications, ${unread} unread` : "Notifications");
    if (sub) sub.textContent = unread ? `${unread} unread` : "You're all caught up";

    if (!items.length) {
        list.innerHTML = ntEmpty("fa-circle-check", "Nothing needs attention",
            "New appointment requests and stock alerts will show up here.");
        return;
    }

    const groupLabels = { appointments: "Appointments", inventory: "Inventory and supplies" };
    const groups = {};
    items.forEach(n => (groups[n.group] ||= []).push(n));
    const order = Object.keys(groups).sort((a, b) => groups[a][0].rank - groups[b][0].rank);

    list.innerHTML = order.map(g => `
        <div class="nt-section">${groupLabels[g] || g}<span>${groups[g].length}</span></div>
        ${groups[g].map(n => `
            <div class="nt-item nt-${n.level} ${read.has(n.key) ? "" : "unread"}"
                 role="button" tabindex="0" data-key="${esc(n.key)}" data-page="${esc(n.page)}">
                <div class="nt-ico"><i class="fa-solid ${n.icon}"></i></div>
                <div class="nt-main">
                    <span class="nt-tag">${esc(n.tag)}</span>
                    <strong class="nt-title">${esc(n.title)}</strong>
                    <p>${esc(n.text)}</p>
                    <small>${esc(n.meta)}</small>
                </div>
                <span class="nt-dot"></span>
            </div>`).join("")}`).join("");
}

function ntOpenAdminItem(el) {
    const read = new Set(readJSON(NT_KEYS.adminRead, []));
    read.add(el.dataset.key);
    save(NT_KEYS.adminRead, [...read]);
    ntClosePanels();
    updateAdminNotifications();
    if (el.dataset.page) openAdminPage(el.dataset.page);
}

function markAllAdminNotificationsRead() {
    save(NT_KEYS.adminRead, ntBuildAdminNotifications().map(n => n.key));
    updateAdminNotifications();
}

$("ntAdminList").addEventListener("click", e => {
    const item = e.target.closest(".nt-item");
    if (item) ntOpenAdminItem(item);
});
$("ntAdminList").addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const item = e.target.closest(".nt-item");
    if (item) { e.preventDefault(); ntOpenAdminItem(item); }
});

/* Patient (public) notifications */
function ntFindAppointments(query) {
    const q = String(query || "").trim();
    if (!q) return [];

    let matched;
    if (ntIsNumeric(q)) {
        const d = ntDigits(q).slice(-10);
        if (d.length < 10) return [];
        matched = patients.filter(p => ntDigits(p.contact).slice(-10) === d);
    } else {
        const n = ntNormName(q);
        matched = patients.filter(p => ntNormName(p.name) === n);
    }

    const ids = new Set(matched.map(p => p.id));
    return appointments.filter(a => ids.has(a.patientId));
}

function ntQueueInfo(a) {
    const q = appointmentQueue.find(x => x.appointmentId === a.id);
    if (!q) return null;
    const active = appointmentQueue.filter(x => x.date === q.date && isActiveQueue(x));
    const idx = active.findIndex(x => x.appointmentId === a.id);
    if (idx < 0) return null;
    return { number: "A" + pad3(idx + 1), ahead: idx, serving: q.status === "Serving" };
}

function ntSignature(a) {
    const qi = a.status === "Approved" ? ntQueueInfo(a) : null;
    return [a.status, a.queueStatus || "", a.date, a.time, qi ? qi.ahead : ""].join("|");
}

function ntDescribe(a) {
    const t = today();
    const when = `${formatDate(a.date)} at ${formatTime(a.time)}`;

    if (a.status === "Pending") {
        if (a.date < t) return {
            tone: "muted", label: "Expired", step: -1,
            text: "This request was not confirmed and its date has passed. Please book a new schedule."
        };
        if (a.date === t) return {
            tone: "warning", label: "Pending", step: 0,
            text: `Your request for today at ${formatTime(a.time)} is waiting for the clinic to confirm it.`
        };
        return {
            tone: "warning", label: "Pending", step: 0,
            text: `Request received. The clinic confirms appointments on the day of your visit (${formatDate(a.date)}).`
        };
    }

    if (a.status === "Approved") {
        const queue = ntQueueInfo(a);
        if (queue?.serving) return {
            tone: "serving", label: "Now serving", step: 2, queue,
            text: "It's your turn. Please proceed to the dental chair."
        };
        if (queue) return {
            tone: "success", label: "Approved", step: 1, queue,
            text: "Your appointment is confirmed. Please stay nearby and wait for your number."
        };
        return {
            tone: "success", label: "Approved", step: 1,
            text: `Your appointment is confirmed for ${when}. Please arrive on time.`
        };
    }

    if (a.status === "Completed") return {
        tone: "success", label: "Completed", step: 4,
        text: `Your visit on ${formatDate(a.date)} is complete. Thank you for choosing Pecaña Dental Clinic.`
    };

    if (a.status === "No-show") return {
        tone: "danger", label: "Missed", step: -1,
        text: "This appointment was marked as missed. Please book a new schedule if you still need care."
    };

    return { tone: "muted", label: esc(a.status || "Unknown"), step: -1, text: `Scheduled for ${when}.` };
}

function ntPatientCard(a, updated) {
    const d = ntDescribe(a);
    const isActive = a.status === "Pending" || a.status === "Approved";

    const queue = d.queue ? `
        <div class="nt-queue">
            <div class="nt-qnum">${d.queue.number}</div>
            <div class="nt-qtext">
                <strong>${d.queue.serving ? "Now serving" : d.queue.ahead === 0 ? "You're next" : `${ntPlural(d.queue.ahead, "patient")} ahead of you`}</strong>
                <span>Appointment queue for ${esc(formatDate(a.date))}</span>
            </div>
        </div>` : "";

    const resched = a.rescheduled && isActive ? `
        <div class="reschedule-alert">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>The clinic updated your schedule. Your appointment is now on ${esc(formatDate(a.date))} at ${esc(formatTime(a.time))}.</span>
        </div>` : "";

    const steps = d.step >= 0 ? `
        <ol class="nt-steps">
            ${NT_STEPS.map((s, i) => `<li class="${i < d.step ? "done" : i === d.step ? "current" : ""}">${s}</li>`).join("")}
        </ol>` : "";

    return `
        <article class="nt-card nt-t-${d.tone}">
            <div class="nt-card-top">
                <span class="nt-pill nt-t-${d.tone}">${d.label}</span>
                ${updated ? `<span class="nt-new">Updated</span>` : ""}
            </div>
            <h4>${esc(a.service)}</h4>
            <div class="nt-when">
                <span><i class="fa-regular fa-calendar"></i> ${esc(formatDate(a.date))}</span>
                <span><i class="fa-regular fa-clock"></i> ${esc(formatTime(a.time))}</span>
            </div>
            <p class="nt-msg">${esc(d.text)}</p>
            ${queue}
            ${resched}
            ${steps}
            <small class="nt-for">Booked for ${esc(a.patientName)}</small>
        </article>`;
}

function ntRenderPatientResults(query) {
    const list = $("ntPatientList");
    if (!list) return 0;

    ntShownQuery = query;
    const appts = ntFindAppointments(query);

    if (!appts.length) {
        list.innerHTML = ntEmpty("fa-folder-open", "No appointment found",
            "Enter your complete contact number or your full name exactly as you gave it when booking.");
        return 0;
    }

    const isActive = a => a.status === "Pending" || a.status === "Approved";
    const key = a => `${a.date} ${a.time || "00:00"}`;
    const sorted = [...appts].sort((a, b) => {
        if (isActive(a) !== isActive(b)) return isActive(a) ? -1 : 1;
        return isActive(a) ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a));
    });

    const LIMIT = 6;
    const seen = readJSON(NT_KEYS.seen, {});

    list.innerHTML = `
        <div class="nt-results-head">
            <span>${ntPlural(appts.length, "appointment")} found</span>
            <button type="button" class="nt-clear" onclick="ntClearLookup()">Clear</button>
        </div>
        ${sorted.slice(0, LIMIT).map(a => ntPatientCard(a, seen[a.id] !== undefined && seen[a.id] !== ntSignature(a))).join("")}
        ${appts.length > LIMIT ? `<div class="nt-more">Showing the latest ${LIMIT}. Contact the clinic for older records.</div>` : ""}`;

    appts.forEach(a => { seen[a.id] = ntSignature(a); });
    save(NT_KEYS.seen, seen);
    return appts.length;
}

const NT_DEFAULT_HINT = ["Check your appointment",
    "Enter the contact number or full name you booked with to see your status and queue position."];

function ntShowPatientHint(title, text, icon = "fa-calendar-check") {
    ntShownQuery = null;
    const list = $("ntPatientList");
    if (list) list.innerHTML = ntEmpty(icon, title, text);
}

function openPatientPanel() {
    const input = $("ntPatientSearch");
    const saved = localStorage.getItem(NT_KEYS.lookup);

    if (saved) {
        if (input && !input.value) input.value = saved;
        ntRenderPatientResults(saved);
    } else {
        ntShowPatientHint(...NT_DEFAULT_HINT);
    }
    updatePatientNotifications();
    setTimeout(() => input?.focus(), 60);
}

function checkPatientNotifications() {
    const input = $("ntPatientSearch");
    const q = (input?.value || "").trim();

    if (!q) {
        ntShowPatientHint("Enter your details",
            "Type your complete contact number or your full name to look up your appointment.", "fa-keyboard");
        input?.focus();
        return;
    }

    if (ntIsNumeric(q) && ntDigits(q).length < 10) {
        ntShowPatientHint("Contact number is incomplete",
            "Please enter your complete contact number, for example 09171234567.", "fa-mobile-screen");
        return;
    }

    if (ntRenderPatientResults(q)) localStorage.setItem(NT_KEYS.lookup, q);
    updatePatientNotifications();
}

function ntClearLookup() {
    localStorage.removeItem(NT_KEYS.lookup);
    localStorage.removeItem(NT_KEYS.seen);
    $("ntPatientSearch").value = "";
    ntShowPatientHint(...NT_DEFAULT_HINT);
    updatePatientNotifications();
}

function updatePatientNotifications() {
    const badge = $("ntPatientBadge");
    const bell = $("patientBell");
    if (!badge) return;

    const saved = localStorage.getItem(NT_KEYS.lookup);
    const isOpen = !$("ntPatientBox").classList.contains("hidden");

    if (isOpen && ntShownQuery) ntRenderPatientResults(ntShownQuery);

    let changed = 0;
    if (saved && !isOpen) {
        const seen = readJSON(NT_KEYS.seen, {});
        changed = ntFindAppointments(saved).filter(a => seen[a.id] !== ntSignature(a)).length;
    }

    badge.textContent = ntBadgeText(changed);
    badge.classList.toggle("hidden", changed === 0);
    bell?.classList.toggle("has-unread", changed > 0);
    bell?.setAttribute("aria-label", changed ? `Appointment updates, ${changed} new` : "Appointment status");
}

/* ---------- Welcome / loading splash ---------- */
function closeWelcomeSplash() {
    sessionStorage.setItem("pecana_entered", "true");
    $("welcomeSplash")?.classList.add("hidden");
}

/* The inline script in index.html already chose which splash is visible. */
(function fadeOutLogoSplash() {
    const logo = $("logoOnlySplash");
    if (!logo || logo.classList.contains("hidden")) return;
    setTimeout(() => {
        logo.classList.add("fade-out");
        setTimeout(() => logo.classList.add("hidden"), 300);
    }, 600);
})();

/* ---------- Delete (bulk) with undo ---------- */
let pendingDelete = null;
let undoSnapshot = null;
let undoTimer = null;

function requestBulkDelete(type) {
    const ids = [...selection[type]];
    if (!ids.length) return;

    pendingDelete = { type, ids };
    const idSet = new Set(ids);
    const n = ids.length;
    const undoNote = `<span class="delete-note muted">You can undo this right after deleting.</span>`;
    const listItem = (main, sub) => `<li><span class="delete-li-main">${esc(main)}</span><span class="delete-li-sub">${esc(sub)}</span></li>`;

    if (type === "patient") {
        const rows = patients.filter(p => idSet.has(p.id));
        const active = appointments.filter(a => idSet.has(a.patientId) && (a.status === "Pending" || a.status === "Approved")).length;

        $("deleteConfirmTitle").textContent = n === 1 ? "Delete this patient?" : `Delete ${n} patients?`;
        $("deleteConfirmBtnLabel").textContent = n === 1 ? "Delete patient" : `Delete ${n} patients`;
        $("deleteConfirmText").innerHTML =
            `This will remove ${n === 1 ? "the patient" : `<strong>${n} patients</strong>`} from the clinic records.` +
            (active ? `<span class="delete-note">Their ${active} pending/approved appointment${active === 1 ? "" : "s"} and queue entries will also be removed.</span>` : "") +
            `<span class="delete-note">Completed and no-show history is kept for reports.</span>` + undoNote;
        $("deleteConfirmList").innerHTML = rows.map(p => listItem(p.name, p.id)).join("");
    } else {
        const rows = appointments.filter(a => idSet.has(a.id));

        $("deleteConfirmTitle").textContent = n === 1 ? "Delete this appointment?" : `Delete ${n} appointments?`;
        $("deleteConfirmBtnLabel").textContent = n === 1 ? "Delete appointment" : `Delete ${n} appointments`;
        $("deleteConfirmText").innerHTML =
            `This will remove ${n === 1 ? "the appointment" : `<strong>${n} appointments</strong>`} and take ${n === 1 ? "it" : "them"} out of the queue.` + undoNote;
        $("deleteConfirmList").innerHTML = rows.map(a =>
            listItem(a.patientName, `${formatDate(a.date)} · ${formatTime(a.time)} · ${a.service}`)).join("");
    }

    openModal("deleteConfirmModal");
    setTimeout(() => document.querySelector("#deleteConfirmModal .btn-outline")?.focus(), 30);
}

function closeDeleteConfirm() {
    closeModal("deleteConfirmModal");
    pendingDelete = null;
}

$("deleteConfirmModal").addEventListener("click", e => {
    if (e.target.id === "deleteConfirmModal") closeDeleteConfirm();
});

const saveAllData = () => {
    save(STORAGE.patients, patients);
    save(STORAGE.appointments, appointments);
    save(STORAGE.appointmentQueue, appointmentQueue);
    save(STORAGE.walkins, walkins);
};

function confirmDelete() {
    if (!pendingDelete) { closeDeleteConfirm(); return; }
    const { type, ids } = pendingDelete;
    const idSet = new Set(ids);
    const n = ids.length;

    undoSnapshot = JSON.parse(JSON.stringify({ patients, appointments, appointmentQueue, walkins }));

    if (type === "patient") {
        const removedApptIds = new Set(
            appointments.filter(a => idSet.has(a.patientId) && (a.status === "Pending" || a.status === "Approved")).map(a => a.id));

        patients = patients.filter(p => !idSet.has(p.id));
        appointments = appointments.filter(a => !removedApptIds.has(a.id));
        appointmentQueue = appointmentQueue.filter(q => !removedApptIds.has(q.appointmentId));
        walkins = walkins.filter(w => !(idSet.has(w.patientId) && isActiveQueue(w)));
    } else {
        appointments = appointments.filter(a => !idSet.has(a.id));
        appointmentQueue = appointmentQueue.filter(q => !idSet.has(q.appointmentId));
    }
    saveAllData();

    selection[type].clear();
    lastPicked[type] = null;
    closeDeleteConfirm();
    renderAll();

    showUndoToast(`${n} ${type}${n === 1 ? "" : "s"} deleted`);
}

function showUndoToast(message) {
    let t = $("undoToast");
    if (!t) {
        t = document.createElement("div");
        t.id = "undoToast";
        t.className = "undo-toast";
        document.body.appendChild(t);
    }
    t.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <span>${esc(message)}</span>
        <button type="button" class="undo-btn" onclick="undoDelete()">Undo</button>
        <button type="button" class="undo-x" aria-label="Dismiss" onclick="hideUndoToast()"><i class="fa-solid fa-xmark"></i></button>`;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(undoTimer);
    undoTimer = setTimeout(hideUndoToast, 8000);
}

function hideUndoToast() {
    $("undoToast")?.classList.remove("show");
    clearTimeout(undoTimer);
    undoSnapshot = null;
}

function undoDelete() {
    const snap = undoSnapshot;
    if (!snap) return;

    ({ patients, appointments, appointmentQueue, walkins } = snap);
    saveAllData();

    hideUndoToast();
    renderAll();
}

/* ---------- Initialization ---------- */
document.addEventListener("DOMContentLoaded", () => {
    renderServiceUI();
    renderAll();

    const t = today();
    $("bookingDate").min = t;
    $("adminAppointmentDate").min = t;
    $("editAppointmentDate").min = t;
    $("bookingDOB").max = t;

    [["bookingDate", "bookingTime"],
     ["adminAppointmentDate", "adminAppointmentTime"],
     ["editAppointmentDate", "editAppointmentTime"]].forEach(([d, tm]) => setupScheduleFields(d, tm));

    if (sessionStorage.getItem("pecana_admin_logged_in") === "true") {
        showView("adminApp");
        const savedPage = sessionStorage.getItem("pecana_admin_page");
        openAdminPage(savedPage && $("page-" + savedPage) ? savedPage : "dashboard");
    }
});