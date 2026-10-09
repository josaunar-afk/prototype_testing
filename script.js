/* ==========================================================================
   PECAÑA DENTAL CLINIC MANAGEMENT SYSTEM  -  script.js
   --------------------------------------------------------------------------
   TABLE OF CONTENTS  (Ctrl+F the heading text)
    1. STORAGE KEYS & GLOBAL STATE
    2. HELPERS
    3. DATA (patients, appointments, queues, inventory)
    4. INVENTORY (materials per service & deduction)
    5. PUBLIC SITE NAVIGATION
    6. SERVICE DETAILS MODAL
    7. ADMIN LOGIN
    8. ADMIN NAVIGATION
    9. MATERIAL STEPPER
   10. SCHEDULE VALIDATION
   11. ADMIN: CREATE APPOINTMENT
   12. ADMIN: EDIT APPOINTMENT
   13. PATIENTS
   14. APPOINTMENT LIST
   15. PUBLIC BOOKING FORM
   16. APPROVE APPOINTMENT
   17. APPOINTMENT QUEUE
   18. WALK-IN QUEUE
   19. DAILY SCHEDULE
   20. INVENTORY PAGE
   21. RESTOCK FORECAST
   22. PUBLIC QUEUE STATUS
   23. DASHBOARD (+ extras)
   24. REPORTS
   25. CALENDAR
   26. NOTIFICATIONS (admin bell + patient bell)
   27. WELCOME SPLASH
   28. INITIALIZATION
   ========================================================================== */


/* ==========================================================================
   1. STORAGE KEYS & GLOBAL STATE
   ========================================================================== */
const STORAGE = {
    patients: "pecana_patients",
    appointments: "pecana_appointments",
    appointmentQueue: "pecana_appointment_queue",
    walkins: "pecana_walkin_queue",
    inventory: "pecana_inventory"
};

let genderChartInstance = null;
let serviceChartInstance = null;
let inventoryChartInstance = null;

let temporaryMaterialAdjustments = {};
let temporaryWalkinAdjustments = {};
let temporaryApprovalAdjustments = {};
let pendingApprovalId = null;


/* ==========================================================================
   2. HELPERS
   ========================================================================== */
const load = (key, fallback = []) => {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : fallback;
    } catch {
        return fallback;
    }
};

const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const today = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

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
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const statusClass = s => (s || "Waiting").toLowerCase().replaceAll(" ", "-");

const nextId = (prefix, arr) => {
    const nums = arr.map(x => {
        const n = parseInt(String(x.id || "").replace(/\D/g, ""));
        return isNaN(n) ? 0 : n;
    });
    return prefix + String(Math.max(0, ...nums) + 1).padStart(3, "0");
};

const nextQueue = (prefix, arr) => {
    const nums = arr.map(x => parseInt(String(x.number || "").replace(/\D/g, "")))
        .filter(n => !isNaN(n));
    return prefix + String(Math.max(0, ...nums) + 1).padStart(3, "0");
};


/* ==========================================================================
   3. DATA
   ========================================================================== */
let patients = load(STORAGE.patients, [
    { id: "P001", name: "Juan Dela Cruz", contact: "09171234567", email: "", dob: "1985-05-15", address: "Polangui, Albay", gender: "Male", emergency: "Maria Dela Cruz", concern: "Regular dental check-up", status: "Active" },
    { id: "P002", name: "Maria Santos", contact: "09181234567", email: "", dob: "1992-08-22", address: "Oas, Albay", gender: "Female", emergency: "Pedro Santos", concern: "Tooth cleaning", status: "Active" },
    { id: "P003", name: "Carlos Reyes", contact: "09191234567", email: "", dob: "1980-02-10", address: "Ligao City, Albay", gender: "Male", emergency: "Ana Reyes", concern: "Tooth pain", status: "Active" },
    { id: "P004", name: "Antonio Rivera", contact: "09201112233", email: "", dob: "1995-04-12", address: "Guinobatan, Albay", gender: "Male", emergency: "Liza Rivera", concern: "Braces adjustment", status: "Active" },
    { id: "P005", name: "Elena Garcia", contact: "09212223344", email: "", dob: "1988-11-30", address: "Polangui, Albay", gender: "Female", emergency: "Jose Garcia", concern: "Wisdom tooth consultation", status: "Active" },
    { id: "P006", name: "Ricardo Ramos", contact: "09223334455", email: "", dob: "1975-07-08", address: "Camalig, Albay", gender: "Male", emergency: "Celia Ramos", concern: "Gum bleeding", status: "Active" },
    { id: "P007", name: "Josefina Mendoza", contact: "09234445566", email: "", dob: "1960-01-25", address: "Oas, Albay", gender: "Female", emergency: "Mario Mendoza", concern: "Dentures fitting", status: "Active" },
    { id: "P008", name: "Manuel Castro", contact: "09245556677", email: "", dob: "1998-12-05", address: "Ligao City, Albay", gender: "Male", emergency: "Sara Castro", concern: "Teeth whitening", status: "Active" },
    { id: "P009", name: "Remedios Lopez", contact: "09256667788", email: "", dob: "1972-03-18", address: "Polangui, Albay", gender: "Female", emergency: "Danilo Lopez", concern: "Root canal therapy", status: "Active" },
    { id: "P010", name: "Francisco Tan", contact: "09267778899", email: "", dob: "1983-06-21", address: "Guinobatan, Albay", gender: "Male", emergency: "Aimee Tan", concern: "Dental implants", status: "Active" },
    { id: "P011", name: "Pacita Aquino", contact: "09278889900", email: "", dob: "1990-10-10", address: "Oas, Albay", gender: "Female", emergency: "Ben Aquino", concern: "Scaling and polishing", status: "Active" },
    { id: "P012", name: "Ramon Bautista", contact: "09289990011", email: "", dob: "1965-08-05", address: "Camalig, Albay", gender: "Male", emergency: "Vilma Bautista", concern: "Crown replacement", status: "Active" },
    { id: "P013", name: "Luzviminda Villamor", contact: "09290001122", email: "", dob: "1978-02-28", address: "Ligao City, Albay", gender: "Female", emergency: "Oscar Villamor", concern: "Bad breath consultation", status: "Active" },
    { id: "P014", name: "Angelito Gonzales", contact: "09301112233", email: "", dob: "2000-07-22", address: "Polangui, Albay", gender: "Male", emergency: "Grace Gonzales", concern: "Mouth guard fitting", status: "Active" },
    { id: "P015", name: "Corazon Salvador", contact: "09312223344", email: "", dob: "1996-04-09", address: "Oas, Albay", gender: "Female", emergency: "Luis Salvador", concern: "Tooth extraction", status: "Active" },
    { id: "P016", name: "Benigno Dizon", contact: "09323334455", email: "", dob: "1982-01-01", address: "Guinobatan, Albay", gender: "Male", emergency: "Cory Dizon", concern: "Bridge adjustment", status: "Active" },
    { id: "P017", name: "Teresita Roxas", contact: "09334445566", email: "", dob: "2005-09-14", address: "Polangui, Albay", gender: "Female", emergency: "Felipe Roxas", concern: "Cavity filling", status: "Active" },
    { id: "P018", name: "Fidel Pineda", contact: "09345556677", email: "", dob: "1987-12-30", address: "Camalig, Albay", gender: "Male", emergency: "Eva Pineda", concern: "Sensitivity issues", status: "Active" },
    { id: "P019", name: "Gloria de Leon", contact: "09356667788", email: "", dob: "1993-05-04", address: "Ligao City, Albay", gender: "Female", emergency: "Mar de Leon", concern: "Impacted tooth", status: "Active" },
    { id: "P020", name: "Oscar Macapagal", contact: "09367778899", email: "", dob: "1955-11-11", address: "Oas, Albay", gender: "Male", emergency: "Nestor Macapagal", concern: "Jaw pain", status: "Active" }
]);

let appointments = load(STORAGE.appointments, [
    { id: "APT001", patientId: "P001", patientName: "Juan Dela Cruz", date: today(), time: "09:00", service: "Dental Check-up", status: "Approved", queueStatus: "Waiting", customMaterials: { "Dental Floss": 1 } }
]);

let appointmentQueue = load(STORAGE.appointmentQueue, [
    { number: "A001", appointmentId: "APT001", patientId: "P001", patientName: "Juan Dela Cruz", service: "Dental Check-up", time: "09:00", date: today(), status: "Waiting" }
]);

let walkins = load(STORAGE.walkins, []);

const DEFAULT_INVENTORY = [
    { id: "I001", name: "Composite Resin", stock: 12, minimum: 5, leadTime: 5 },
    { id: "I002", name: "Dental Floss", stock: 10, minimum: 5, leadTime: 3 },
    { id: "I003", name: "Bonding Agent", stock: 8, minimum: 5, leadTime: 5 },
    { id: "I004", name: "Suture Material", stock: 15, minimum: 5, leadTime: 4 },
    { id: "I005", name: "Orthodontic Brackets", stock: 20, minimum: 8, leadTime: 7 },
    { id: "I006", name: "Archwire", stock: 10, minimum: 4, leadTime: 7 },
    { id: "I007", name: "Elastic Ligatures", stock: 50, minimum: 20, leadTime: 5 }
];

let inventory = load(STORAGE.inventory, DEFAULT_INVENTORY.map(i => ({ ...i })));

(function ensureInventoryHasAllMaterials() {
    const existingIds = new Set(inventory.map(i => i.id));
    const existingNames = new Set(inventory.map(i => i.name));
    let changed = false;
    DEFAULT_INVENTORY.forEach(item => {
        if (!existingIds.has(item.id) && !existingNames.has(item.name)) {
            inventory.push({ ...item });
            changed = true;
        }
    });
    if (changed) save(STORAGE.inventory, inventory);
})();

/* Keep multiple tabs in sync */
window.addEventListener("storage", e => {
    if (!e.key) return;
    if (!Object.values(STORAGE).includes(e.key)) return;

    patients = load(STORAGE.patients, patients);
    appointments = load(STORAGE.appointments, appointments);
    appointmentQueue = load(STORAGE.appointmentQueue, appointmentQueue);
    walkins = load(STORAGE.walkins, walkins);
    inventory = load(STORAGE.inventory, inventory);

    renderAll();
});


/* ==========================================================================
   4. INVENTORY (materials per service & deduction)
   ========================================================================== */
const BOM = {
    "Dental Check-up": { "Dental Floss": 1 },
    "Dental Cleaning": { "Dental Floss": 2 },
    "Tooth Restoration": { "Composite Resin": 1, "Bonding Agent": 1 },
    "Tooth Extraction": { "Suture Material": 2 },
    "Braces": { "Orthodontic Brackets": 20, "Archwire": 2, "Elastic Ligatures": 20 }
};

function materialsFor(a) {
    return a.customMaterials && Object.keys(a.customMaterials).length
        ? a.customMaterials
        : (BOM[a.service] || {});
}

function consumeInventory(service, appointmentId = null) {
    let materials = BOM[service] || {};

    if (appointmentId) {
        const appt = appointments.find(a => a.id === appointmentId);
        if (appt && appt.customMaterials) materials = appt.customMaterials;
    }

    Object.entries(materials).forEach(([name, qty]) => {
        const item = inventory.find(x => x.name === name);
        if (item) item.stock = Math.max(0, item.stock - qty);
    });
    save(STORAGE.inventory, inventory);
}


/* ==========================================================================
   5. PUBLIC SITE NAVIGATION
   ========================================================================== */
function showPublicPage(page) {
    document.getElementById("publicApp").classList.remove("hidden");
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("adminApp").classList.add("hidden");
    document.querySelectorAll(".public-page").forEach(x => x.classList.remove("active"));

    const target = document.getElementById("public-" + page);
    if (target) target.classList.add("active");

    if (page === "queue-status") renderPublicQueues();
    if (typeof updatePublicStats === "function") updatePublicStats();

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}

function showPublicSite() {
    document.getElementById("publicApp").classList.remove("hidden");
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("adminApp").classList.add("hidden");
    showPublicPage("home");
}

function showLogin() {
    document.getElementById("publicApp").classList.add("hidden");
    document.getElementById("adminApp").classList.add("hidden");
    document.getElementById("loginPage").classList.remove("hidden");
}

function logout() {
    sessionStorage.removeItem("pecana_admin_logged_in");
    sessionStorage.removeItem("pecana_admin_page");
    showPublicSite();
}

function selectService(serviceName) {
    showPublicPage("appointment");
    const select = document.getElementById("bookingService");
    if (select) select.value = serviceName;
    const nameField = document.getElementById("bookingName");
    if (nameField) nameField.focus();
}


/* ==========================================================================
   6. SERVICE DETAILS MODAL
   ========================================================================== */
const SERVICE_INFO = {
    "Dental Check-up": {
        icon: "fa-tooth",
        desc: "A routine examination of the teeth, gums, and mouth to identify cavities, gum problems, and other oral health concerns early.",
        duration: "20–30 minutes",
        idealFor: "Anyone due for a routine oral health review",
        includes: ["Visual and manual oral examination", "Gum and bite assessment", "Personalized oral hygiene advice"]
    },
    "Dental Cleaning": {
        icon: "fa-wand-magic-sparkles",
        desc: "A professional procedure that removes plaque and tartar buildup to help prevent cavities, gum disease, and bad breath.",
        duration: "30–45 minutes",
        idealFor: "Patients wanting to maintain healthy gums and fresh breath",
        includes: ["Plaque and tartar removal", "Teeth polishing", "Fluoride application (if needed)"]
    },
    "Tooth Restoration": {
        icon: "fa-tooth",
        desc: "A treatment that repairs damaged or decayed teeth to restore their structure, function, and natural appearance.",
        duration: "45–60 minutes",
        idealFor: "Teeth affected by cavities, chips, or minor damage",
        includes: ["Removal of decayed material", "Composite or bonding application", "Bite adjustment and polish"]
    },
    "Tooth Extraction": {
        icon: "fa-teeth",
        desc: "A procedure that removes a severely damaged, decayed, or problematic tooth to prevent further dental complications.",
        duration: "30–60 minutes",
        idealFor: "Severely decayed, broken, or impacted teeth",
        includes: ["Local anesthesia", "Safe tooth removal", "Aftercare instructions"]
    },
    "Braces": {
        icon: "fa-teeth-open",
        desc: "An orthodontic treatment that gradually aligns and straightens teeth while helping improve bite and overall dental alignment.",
        duration: "Ongoing treatment (regular adjustment visits)",
        idealFor: "Patients with misaligned teeth or bite issues",
        includes: ["Initial fitting and consultation", "Periodic wire/bracket adjustments", "Progress monitoring"]
    }
};

let pendingServiceSelection = null;

function viewServiceDetails(serviceName) {
    const info = SERVICE_INFO[serviceName];
    if (!info) return;
    pendingServiceSelection = serviceName;

    document.getElementById("serviceDetailsTitle").textContent = serviceName;
    document.getElementById("serviceDetailsIcon").innerHTML = `<i class="fa-solid ${info.icon}"></i>`;
    document.getElementById("serviceDetailsDesc").textContent = info.desc;

    document.getElementById("serviceDetailsMeta").innerHTML = `
        <div class="service-meta-item">
            <i class="fa-solid fa-clock"></i>
            <div><strong>Duration</strong><span>${esc(info.duration)}</span></div>
        </div>
        <div class="service-meta-item">
            <i class="fa-solid fa-user-check"></i>
            <div><strong>Ideal For</strong><span>${esc(info.idealFor)}</span></div>
        </div>
    `;

    document.getElementById("serviceDetailsIncludes").innerHTML = info.includes.map(item =>
        `<li><i class="fa-solid fa-circle-check"></i> ${esc(item)}</li>`
    ).join("");

    document.getElementById("serviceDetailsModal").classList.remove("hidden");
}

function closeServiceDetailsModal() {
    document.getElementById("serviceDetailsModal").classList.add("hidden");
    pendingServiceSelection = null;
}

function proceedToBookService() {
    if (!pendingServiceSelection) { closeServiceDetailsModal(); return; }
    const service = pendingServiceSelection;
    closeServiceDetailsModal();
    selectService(service);
}


/* ==========================================================================
   7. ADMIN LOGIN
   ========================================================================== */
document.getElementById("loginForm").addEventListener("submit", e => {
    e.preventDefault();
    const user = document.getElementById("loginUsername").value.trim();
    const pass = document.getElementById("loginPassword").value.trim();

    if ((user === "admin" || user === "administrator") && pass === "admin123") {
        sessionStorage.setItem("pecana_admin_logged_in", "true");
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("publicApp").classList.add("hidden");
        document.getElementById("adminApp").classList.remove("hidden");
        openAdminPage("dashboard");
    } else {
        alert("Invalid login.");
    }
});


/* ==========================================================================
   8. ADMIN NAVIGATION
   ========================================================================== */
const pageNames = {
    dashboard: "Dashboard",
    appointments: "Appointment Management",
    addAppointment: "Create Appointment",
    appointmentQueue: "Appointment Queue",
    walkinQueue: "Walk-In Queue",
    patients: "Patient Records",
    addPatient: "Add Patient",
    schedule: "Daily Schedule",
    inventory: "Inventory",
    forecast: "Restock Forecast",
    reports: "Reports"
};

const PAGE_RENDERERS = {
    dashboard: () => renderDashboard(),
    appointments: () => renderAppointments(),
    appointmentQueue: () => renderAppointmentQueue(),
    walkinQueue: () => renderWalkinQueue(),
    patients: () => renderPatients(),
    schedule: () => renderSchedule(),
    inventory: () => renderInventory(),
    forecast: () => renderForecast(),
    reports: () => renderReports()
};

let currentAdminPage = "dashboard";

document.querySelectorAll(".side-link[data-page]").forEach(btn => {
    btn.addEventListener("click", () => openAdminPage(btn.dataset.page));
});

function openAdminPage(page) {
    if (page === "addAppointment") return openAppointmentModal();

    const target = document.getElementById(`page-${page}`);
    if (!target) return;

    currentAdminPage = page;
    sessionStorage.setItem("pecana_admin_page", page);

    document.querySelectorAll(".admin-page").forEach(el => el.classList.toggle("active", el === target));
    document.querySelectorAll(".side-link[data-page]").forEach(el => el.classList.toggle("active", el.dataset.page === page));
    document.getElementById("pageTitle").textContent = pageNames[page] || "Dashboard";

    const calBtn = document.getElementById("advanceScheduleBtn");
    if (calBtn) calBtn.classList.toggle("hidden", page !== "schedule");

    renderAll();
}

function renderAll() {
    syncAppointmentQueue();
    PAGE_RENDERERS[currentAdminPage]?.();
    renderAppointmentPatients();
    renderPublicQueues();
    updateAdminNotifications();
    updatePatientNotifications();
    if (currentAdminPage !== "forecast") renderForecastSummary();
}


/* ==========================================================================
   9. MATERIAL STEPPER
   ========================================================================== */
const MATERIAL_SCOPES = {
    appointment: { items: () => temporaryMaterialAdjustments, list: "predictionList", badge: "stockStatusBadge" },
    walkin:      { items: () => temporaryWalkinAdjustments,   list: "walkinPredictionList", badge: "walkinStockStatusBadge" },
    approval:    { items: () => temporaryApprovalAdjustments, list: "approvalPredictionList", badge: "approvalStockStatusBadge" }
};

function renderMaterialScope(scope) {
    const cfg = MATERIAL_SCOPES[scope];
    const list = document.getElementById(cfg.list);
    if (!list) return;
    let allOk = true;

    list.innerHTML = Object.entries(cfg.items()).map(([name, qty]) => {
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

    const badge = document.getElementById(cfg.badge);
    if (badge) {
        badge.textContent = allOk ? "Stock Verified" : "Shortage Detected";
        badge.className = `insight-badge ${allOk ? "success" : "danger"}`;
        badge.removeAttribute("style");
    }
}

document.addEventListener("click", e => {
    const btn = e.target.closest(".qty-btn[data-scope]");
    if (!btn) return;
    const { scope, name, delta } = btn.dataset;
    const items = MATERIAL_SCOPES[scope].items();
    items[name] = Math.max(0, (items[name] || 0) + Number(delta));
    renderMaterialScope(scope);
});

function renderAdjustmentList()         { renderMaterialScope("appointment"); }
function renderWalkinAdjustmentList()   { renderMaterialScope("walkin"); }
function renderApprovalAdjustmentList() { renderMaterialScope("approval"); }

function updateMaterialPrediction() {
    const service = document.getElementById("adminAppointmentService").value;
    const card = document.getElementById("materialInsightCard");
    if (!card) return;

    const materials = BOM[service];
    if (materials && Object.keys(materials).length > 0) {
        card.classList.remove("hidden");
        temporaryMaterialAdjustments = { ...materials };
        renderAdjustmentList();
    } else {
        card.classList.add("hidden");
        temporaryMaterialAdjustments = {};
    }
}

function updateWalkinMaterialPrediction() {
    const service = document.getElementById("walkinService").value;
    const card = document.getElementById("walkinMaterialInsightCard");
    if (!card) return;

    const materials = BOM[service];
    if (materials && Object.keys(materials).length > 0) {
        card.classList.remove("hidden");
        temporaryWalkinAdjustments = { ...materials };
        renderWalkinAdjustmentList();
    } else {
        card.classList.add("hidden");
        temporaryWalkinAdjustments = {};
    }
}


/* ==========================================================================
   10. SCHEDULE VALIDATION
   ========================================================================== */
const CLINIC_OPEN_MIN = 7 * 60;
const CLINIC_CLOSE_MIN = 20 * 60;
const LUNCH_START_MIN = 12 * 60;
const LUNCH_END_MIN = 13 * 60;

const TIME_RANGE_MESSAGE = "Please choose a time between 7:00 AM and 8:00 PM — that's when the clinic is open.";

const validateClinicSchedule = (dateStr, timeStr, dateInput, timeInput) => {
    if (dateInput) dateInput.setCustomValidity("");
    if (timeInput) timeInput.setCustomValidity("");

    const now = new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);

    const selectedDate = new Date(year, month - 1, day, hour, minute);
    const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedAtMidnight = new Date(year, month - 1, day);

    if (selectedAtMidnight < todayAtMidnight) {
        if (dateInput) {
            dateInput.setCustomValidity("Please choose today's date or a later one — the date you selected has already passed.");
            dateInput.reportValidity();
        }
        return false;
    }

    if (selectedAtMidnight.getTime() === todayAtMidnight.getTime() && selectedDate <= now) {
        if (timeInput) {
            timeInput.setCustomValidity("That time has already passed for today. Please choose a later time.");
            timeInput.reportValidity();
        }
        return false;
    }

    const totalMinutes = hour * 60 + minute;
    if (totalMinutes < CLINIC_OPEN_MIN || totalMinutes >= CLINIC_CLOSE_MIN) {
        if (timeInput) {
            timeInput.setCustomValidity(TIME_RANGE_MESSAGE);
            timeInput.reportValidity();
        }
        return false;
    }

    if (totalMinutes >= LUNCH_START_MIN && totalMinutes < LUNCH_END_MIN) {
        if (timeInput) {
            timeInput.setCustomValidity("The clinic is closed for lunch break from 12:00 PM to 1:00 PM. Please choose another time.");
            timeInput.reportValidity();
        }
        return false;
    }

    return true;
};

function attachTimeFieldMessage(id) {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("invalid", () => {
        if (el.validity.customError) return;
        if (el.validity.rangeUnderflow || el.validity.rangeOverflow) {
            el.setCustomValidity(TIME_RANGE_MESSAGE);
        } else if (el.validity.valueMissing) {
            el.setCustomValidity("Please choose a time.");
        }
    });
}

function linkScheduleFields(dateId, timeId) {
    const dateEl = document.getElementById(dateId);
    const timeEl = document.getElementById(timeId);
    const clear = () => {
        if (dateEl) dateEl.setCustomValidity("");
        if (timeEl) timeEl.setCustomValidity("");
    };
    [dateEl, timeEl].forEach(el => {
        if (!el) return;
        el.addEventListener("input", clear);
        el.addEventListener("change", clear);
    });
}


/* ==========================================================================
   11. ADMIN: CREATE APPOINTMENT
   ========================================================================== */
function openAppointmentModal() {
    renderAppointmentPatients();
    document.getElementById("adminAppointmentDate").value = today();
    document.getElementById("appointmentModal").classList.remove("hidden");
}

function closeAppointmentModal() {
    document.getElementById("appointmentModal").classList.add("hidden");
    document.getElementById("adminAppointmentForm").reset();
    document.getElementById("materialInsightCard").classList.add("hidden");
    temporaryMaterialAdjustments = {};
}

function createAppointmentFor(id) {
    openAppointmentModal();
    const patientDropdown = document.getElementById("adminAppointmentPatient");
    if (patientDropdown) patientDropdown.value = id;
}

function renderAppointmentPatients() {
    const select = document.getElementById("adminAppointmentPatient");
    if (!select) return;
    const selected = select.value;
    select.innerHTML = `<option value="">Select patient</option>` +
        patients.map(p => `<option value="${p.id}">${esc(p.name)} (${p.id})</option>`).join("");
    if (patients.some(p => p.id === selected)) select.value = selected;
}

const adminForm = document.getElementById("adminAppointmentForm");
if (adminForm) {
    adminForm.addEventListener("submit", e => {
        e.preventDefault();

        const dateEl = document.getElementById("adminAppointmentDate");
        const timeEl = document.getElementById("adminAppointmentTime");
        const date = dateEl.value;
        const time = timeEl.value;
        const patientId = document.getElementById("adminAppointmentPatient").value;
        const service = document.getElementById("adminAppointmentService").value;

        if (!validateClinicSchedule(date, time, dateEl, timeEl)) return;

        const patient = patients.find(p => p.id === patientId);
        if (!patient) { alert("Please select a patient."); return; }

        const appointment = {
            id: nextId("APT", appointments),
            patientId: patient.id,
            patientName: patient.name,
            date,
            time,
            service,
            status: "Pending",
            queueStatus: null,
            customMaterials: { ...temporaryMaterialAdjustments }
        };

        appointments.push(appointment);
        save(STORAGE.appointments, appointments);

        alert("Appointment created successfully for " + appointment.patientName);
        closeAppointmentModal();
        renderAll();
    });
}


/* ==========================================================================
   12. ADMIN: EDIT APPOINTMENT
   ========================================================================== */
function openEditAppointmentModal(id) {
    const a = appointments.find(x => x.id === id);
    if (!a) return;

    const dateEl = document.getElementById("editAppointmentDate");
    const timeEl = document.getElementById("editAppointmentTime");

    document.getElementById("editAppointmentId").value = a.id;
    document.getElementById("editAppointmentPatientName").value = a.patientName;
    dateEl.value = a.date;
    dateEl.min = today();
    timeEl.value = a.time;

    dateEl.setCustomValidity("");
    timeEl.setCustomValidity("");

    document.getElementById("editAppointmentModal").classList.remove("hidden");
}

function closeEditAppointmentModal() {
    document.getElementById("editAppointmentModal").classList.add("hidden");
    document.getElementById("editAppointmentForm").reset();
    document.getElementById("editAppointmentDate").setCustomValidity("");
    document.getElementById("editAppointmentTime").setCustomValidity("");
}

const editAppointmentForm = document.getElementById("editAppointmentForm");
if (editAppointmentForm) {
    editAppointmentForm.addEventListener("submit", e => {
        e.preventDefault();

        const id = document.getElementById("editAppointmentId").value;
        const dateEl = document.getElementById("editAppointmentDate");
        const timeEl = document.getElementById("editAppointmentTime");
        const newDate = dateEl.value;
        const newTime = timeEl.value;

        if (!validateClinicSchedule(newDate, newTime, dateEl, timeEl)) return;

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
}


/* ==========================================================================
   13. PATIENTS
   ========================================================================== */
document.getElementById("patientForm").addEventListener("submit", e => {
    e.preventDefault();

    const name = document.getElementById("patientName").value.trim();
    if (!name) { alert("Please enter the patient's name."); return; }

    const duplicate = patients.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (duplicate) { alert("This patient is already registered."); return; }

    const patient = {
        id: nextId("P", patients),
        name,
        contact: document.getElementById("patientContact").value.trim(),
        dob: document.getElementById("patientDOB").value,
        gender: document.getElementById("patientGender").value,
        address: document.getElementById("patientAddress").value.trim(),
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
    document.getElementById("patientDetails").innerHTML = `
        <div class="patient-detail">
            <div><strong>Patient ID</strong>${esc(p.id)}</div>
            <div><strong>Full Name</strong>${esc(p.name)}</div>
            <div><strong>Contact</strong>${esc(p.contact)}</div>
            <div><strong>Email Address</strong>${esc(p.email || "-")}</div>
            <div><strong>Date of Birth</strong>${formatDate(p.dob)}</div>
            <div><strong>Gender</strong>${esc(p.gender || "-")}</div>
            <div><strong>Address</strong>${esc(p.address || "-")}</div>
            <div><strong>Emergency Contact</strong>${esc(p.emergency || "-")}</div>
            <div><strong>Dental Concern</strong>${esc(p.concern || "-")}</div>
        </div>
    `;
    document.getElementById("patientModal").classList.remove("hidden");
}

function openAddPatientModal() {
    document.getElementById("addPatientModal").classList.remove("hidden");
}

function closeAddPatientModal() {
    document.getElementById("addPatientModal").classList.add("hidden");
    document.getElementById("patientForm").reset();
}

function closePatientModal() {
    document.getElementById("patientModal").classList.add("hidden");
}

function renderPatients() {
    const table = document.getElementById("patientTable");
    if (!table) return;

    const searchInput = document.getElementById("patientSearch");
    const filter = searchInput ? searchInput.value.toLowerCase() : "";

    if (!patients.length) {
        selection.patient.clear();
        table.innerHTML = `<tr><td colspan="8">No patients registered.</td></tr>`;
        syncSelectionUI("patient");
        return;
    }

    const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(filter) || p.id.toLowerCase().includes(filter)
    );

    // keep only selections that are still visible
    selection.patient = new Set([...selection.patient].filter(id => filtered.some(p => p.id === id)));

    if (filtered.length === 0 && filter !== "") {
        table.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#888;">No results found for "${esc(filter)}"</td></tr>`;
        syncSelectionUI("patient");
        return;
    }

    table.innerHTML = filtered.map(p => {
        const concern = p.concern || "-";
        const isLong = concern.length > 40;
        const shortConcern = isLong ? concern.slice(0, 40).trim() + "…" : concern;
        const checked = selection.patient.has(p.id);

        return `
        <tr class="${checked ? "row-selected" : ""}">
            <td class="chk-col">
                <input type="checkbox" class="row-check" ${checked ? "checked" : ""}
                       onchange="toggleRowSelect('patient','${p.id}',this.checked)">
            </td>
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


/* ==========================================================================
   14. APPOINTMENT LIST
   ========================================================================== */
function renderAppointments() {
    const table = document.getElementById("appointmentTable");
    if (!table) return;

    const searchInput = document.getElementById("appointmentSearch");
    const filter = searchInput ? searchInput.value.toLowerCase() : "";

    if (!appointments.length) {
        selection.appointment.clear();
        table.innerHTML = `<tr><td colspan="8">No appointments found.</td></tr>`;
        syncSelectionUI("appointment");
        return;
    }

    const filtered = appointments.filter(a => {
        const matchesSearch = a.patientName.toLowerCase().includes(filter) ||
                              a.id.toLowerCase().includes(filter);
        if (!matchesSearch) return false;
        if (a.date < today()) return false;
        if (a.status === "Completed" || a.status === "No-show") return a.date === today();
        return true;
    });

    const statusPriority = { "Pending": 0, "Approved": 1, "Completed": 2, "No-show": 2 };

    const sorted = [...filtered].sort((a, b) => {
        const aIsFuture = a.date > today() ? 1 : 0;
        const bIsFuture = b.date > today() ? 1 : 0;
        if (aIsFuture !== bIsFuture) return aIsFuture - bIsFuture;

        const rankA = statusPriority[a.status] ?? 3;
        const rankB = statusPriority[b.status] ?? 3;
        if (rankA !== rankB) return rankA - rankB;

        const keyA = `${a.date} ${a.time || "00:00"}`;
        const keyB = `${b.date} ${b.time || "00:00"}`;
        return keyA.localeCompare(keyB);
    });

    // keep only selections that are still visible
    selection.appointment = new Set([...selection.appointment].filter(id => sorted.some(a => a.id === id)));

    const dailyCounters = {};
    table.innerHTML = sorted.map(a => {
        dailyCounters[a.date] = (dailyCounters[a.date] || 0) + 1;
        const displayNo = "APT" + String(dailyCounters[a.date]).padStart(3, "0");
        const checked = selection.appointment.has(a.id);

        return `
        <tr class="${checked ? "row-selected" : ""}">
            <td class="chk-col">
                <input type="checkbox" class="row-check" ${checked ? "checked" : ""}
                       onchange="toggleRowSelect('appointment','${a.id}',this.checked)">
            </td>
            <td>${displayNo}</td>
            <td><strong>${esc(a.patientName)}</strong></td>
            <td>${formatDate(a.date)}</td>
            <td>${formatTime(a.time)}</td>
            <td>${esc(a.service)}</td>
            <td><span class="badge ${statusClass(a.status)}">${a.status}</span></td>
            <td>
                ${a.status === "Pending" ? `
                    ${a.date <= today()
                        ? `<button class="action-btn success" onclick="approveAppointment('${a.id}')">Approve</button>`
                        : `<span style="font-size:.75rem;color:#9aa0a6;">Approvable on ${formatDate(a.date)}</span>`
                    }
                    <button class="action-btn warning" onclick="openEditAppointmentModal('${a.id}')">Edit</button>
                ` : ""}

                ${a.status === "Approved" ? `<button class="action-btn primary" onclick="openAdminPage('appointmentQueue')">Queue</button>` : ""}
            </td>
        </tr>`;
    }).join("");

    syncSelectionUI("appointment");
}


/* ==========================================================================
   15. PUBLIC BOOKING FORM
   ========================================================================== */
const publicForm = document.getElementById("appointmentForm");
if (publicForm) {
    publicForm.addEventListener("submit", e => {
        e.preventDefault();

        const dateEl = document.getElementById("bookingDate");
        const timeEl = document.getElementById("bookingTime");
        const date = dateEl.value;
        const time = timeEl.value;
        const name = document.getElementById("bookingName").value.trim();
        const contact = document.getElementById("bookingContact").value.trim();
        const email = document.getElementById("bookingEmail") ? document.getElementById("bookingEmail").value.trim() : "";
        const address = document.getElementById("bookingAddress") ? document.getElementById("bookingAddress").value.trim() : "";
        const dob = document.getElementById("bookingDOB") ? document.getElementById("bookingDOB").value : "";
        const service = document.getElementById("bookingService").value;
        const concern = document.getElementById("bookingConcern").value.trim();

        if (!validateClinicSchedule(date, time, dateEl, timeEl)) return;

        let patient = patients.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (!patient) {
            patient = {
                id: nextId("P", patients),
                name, contact, email, dob, address, gender: "", emergency: "", concern, status: "Active"
            };
            patients.push(patient);
        } else {
            if (contact && !patient.contact) patient.contact = contact;
            if (email && !patient.email) patient.email = email;
            if (address && !patient.address) patient.address = address;
            if (dob && !patient.dob) patient.dob = dob;
        }
        save(STORAGE.patients, patients);

        const appointment = {
            id: nextId("APT", appointments),
            patientId: patient.id,
            patientName: patient.name,
            date, time, service, status: "Pending", queueStatus: null
        };

        appointments.push(appointment);
        save(STORAGE.appointments, appointments);

        e.target.reset();
        alert("Appointment submitted successfully!");
        showPublicPage("home");
        renderAll();
    });
}


/* ==========================================================================
   16. APPROVE APPOINTMENT
   ========================================================================== */
function approveAppointment(id) {
    openApproveDetailsModal(id);
}

function openApproveDetailsModal(id) {
    const a = appointments.find(x => x.id === id);
    if (!a) return;
    const p = patients.find(x => x.id === a.patientId);

    pendingApprovalId = id;
    temporaryApprovalAdjustments = { ...materialsFor(a) };

    document.getElementById("approveDetailsContent").innerHTML = `
        <div><strong>Patient Name</strong>${esc(a.patientName)}</div>
        <div><strong>Contact Number</strong>${esc(p && p.contact ? p.contact : "-")}</div>
        <div><strong>Email Address</strong>${esc(p && p.email ? p.email : "-")}</div>
        <div><strong>Address</strong>${esc(p && p.address ? p.address : "-")}</div>
        <div><strong>Date</strong>${formatDate(a.date)}</div>
        <div><strong>Time</strong>${formatTime(a.time)}</div>
        <div><strong>Dental Service</strong>${esc(a.service)}</div>
        <div><strong>Dental Concern</strong>${esc(a.concern || (p ? p.concern : "") || "-")}</div>
    `;

    if (Object.keys(temporaryApprovalAdjustments).length) {
        const insightWrap = document.createElement("div");
        insightWrap.style.gridColumn = "1 / -1";
        insightWrap.className = "insight-card";
        insightWrap.innerHTML = `
            <div class="insight-header">
                <div class="insight-title">
                    <i class="fa-solid fa-microchip"></i>
                    <span>Clinical Supply Insight</span>
                </div>
                <div class="insight-badge" id="approvalStockStatusBadge">Checking Stock...</div>
            </div>
            <div class="insight-content">
                <div id="approvalPredictionList" class="prediction-list"></div>
            </div>
        `;
        document.getElementById("approveDetailsContent").appendChild(insightWrap);
        renderApprovalAdjustmentList();
    }

    document.getElementById("approveDetailsModal").classList.remove("hidden");
}

function closeApproveDetailsModal() {
    document.getElementById("approveDetailsModal").classList.add("hidden");
    pendingApprovalId = null;
    temporaryApprovalAdjustments = {};
}

function confirmApproveAppointment() {
    const id = pendingApprovalId;
    if (!id) { closeApproveDetailsModal(); return; }

    const a = appointments.find(x => x.id === id);
    if (!a) { closeApproveDetailsModal(); return; }

    if (a.date > today()) {
        alert(`This appointment is scheduled for ${formatDate(a.date)} and can only be approved on that date.`);
        closeApproveDetailsModal();
        return;
    }

    if (Object.keys(temporaryApprovalAdjustments).length) {
        a.customMaterials = { ...temporaryApprovalAdjustments };
    }

    a.status = "Approved";
    a.queueStatus = "Waiting";
    syncAppointmentQueue();
    save(STORAGE.appointments, appointments);

    closeApproveDetailsModal();
    renderAll();
}


/* ==========================================================================
   17. APPOINTMENT QUEUE
   ========================================================================== */
function syncAppointmentQueue() {
    appointments.forEach(a => {
        let q = appointmentQueue.find(x => x.appointmentId === a.id);

        if (a.status === "Approved" && (a.queueStatus === "Waiting" || a.queueStatus === "Serving")) {
            if (!q) {
                q = {
                    number: nextQueue("A", appointmentQueue),
                    appointmentId: a.id,
                    patientId: a.patientId,
                    patientName: a.patientName,
                    service: a.service,
                    time: a.time,
                    date: a.date,
                    status: a.queueStatus
                };
                appointmentQueue.push(q);
            } else {
                q.patientId = a.patientId;
                q.patientName = a.patientName;
                q.service = a.service;
                q.time = a.time;
                q.date = a.date;
                q.status = a.queueStatus;
            }
        }

        if (q) {
            if (a.status === "Completed") q.status = "Completed";
            if (a.status === "No-show") q.status = "No-show";
        }
    });
    save(STORAGE.appointmentQueue, appointmentQueue);
}

function renderAppointmentQueue() {
    const container = document.getElementById("appointmentQueueContainer");
    if (!container) return;

    syncAppointmentQueue();
    const queues = appointmentQueue.filter(q => q.status === "Waiting" || q.status === "Serving");

    if (!queues.length) {
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-calendar-check"></i><strong>No appointment patients waiting.</strong><p>Approved appointments will appear here automatically.</p></div>`;
        return;
    }

    const dailyCounters = {};
    container.innerHTML = queues.map(q => {
        dailyCounters[q.date] = (dailyCounters[q.date] || 0) + 1;
        const displayNo = "A" + String(dailyCounters[q.date]).padStart(3, "0");
        return `
        <div class="queue-card">
            <div class="queue-number">${displayNo}</div>
            <div class="queue-details">
                <h3>${esc(q.patientName)}</h3>
                <p>${esc(q.service)} · ${formatTime(q.time)}</p>
                <span class="badge ${statusClass(q.status)}">${q.status}</span>
            </div>
            <div class="queue-actions">
                ${q.status === "Waiting" ? `<button class="action-btn primary" onclick="serveAppointment('${q.number}')">Serve</button><button class="action-btn danger" onclick="noShowAppointment('${q.number}')">No-show</button>` : ""}
                ${q.status === "Serving" ? `<button class="action-btn success" onclick="completeAppointment('${q.number}')">Complete</button>` : ""}
            </div>
        </div>`;
    }).join("");
}

function serveAppointment(number) {
    const active = appointmentQueue.find(q => q.status === "Serving");
    if (active) { alert(`${active.number} is currently being served.`); return; }

    const q = appointmentQueue.find(x => x.number === number);
    if (!q) return;

    if (q.date > today()) {
        alert("This appointment is scheduled for a future date and cannot be served yet.");
        return;
    }

    q.status = "Serving";
    const a = appointments.find(x => x.id === q.appointmentId);
    if (a) a.queueStatus = "Serving";

    save(STORAGE.appointmentQueue, appointmentQueue);
    save(STORAGE.appointments, appointments);
    renderAll();
}

function completeAppointment(number) {
    const q = appointmentQueue.find(x => x.number === number);
    if (!q) return;

    if (q.date > today()) {
        alert("This appointment is scheduled for a future date and cannot be completed yet.");
        return;
    }

    q.status = "Completed";
    const a = appointments.find(x => x.id === q.appointmentId);
    if (a) { a.queueStatus = "Completed"; a.status = "Completed"; }

    consumeInventory(q.service, q.appointmentId);

    save(STORAGE.appointmentQueue, appointmentQueue);
    save(STORAGE.appointments, appointments);
    renderAll();
}

function noShowAppointment(number) {
    const q = appointmentQueue.find(x => x.number === number);
    if (!q) return;

    q.status = "No-show";
    const a = appointments.find(x => x.id === q.appointmentId);
    if (a) { a.queueStatus = "No-show"; a.status = "No-show"; }

    save(STORAGE.appointmentQueue, appointmentQueue);
    save(STORAGE.appointments, appointments);
    renderAll();
}


/* ==========================================================================
   18. WALK-IN QUEUE
   ========================================================================== */
function renderWalkinPatients() {
    const select = document.getElementById("walkinPatient");
    if (!select) return;
    select.innerHTML = `<option value="">Select patient</option>` +
        patients.map(p => `<option value="${p.id}">${esc(p.name)} (${p.id})</option>`).join("");
}

function openWalkinModal(patientId = "") {
    renderWalkinPatients();
    document.getElementById("walkinPatient").value = patientId;

    const card = document.getElementById("walkinMaterialInsightCard");
    if (card) card.classList.add("hidden");
    temporaryWalkinAdjustments = {};

    document.getElementById("walkinModal").classList.remove("hidden");
}

function closeWalkinModal() {
    document.getElementById("walkinModal").classList.add("hidden");
}

function registerPatientWalkin(id) {
    openAdminPage("walkinQueue");
    openWalkinModal(id);
}

document.getElementById("walkinForm").addEventListener("submit", e => {
    e.preventDefault();

    const patientId = document.getElementById("walkinPatient").value;
    const patient = patients.find(p => p.id === patientId);
    if (!patient) { alert("Please select a patient."); return; }

    const service = document.getElementById("walkinService").value;
    const walkin = {
        number: nextQueue("W", walkins),
        patientId: patient.id,
        patientName: patient.name,
        service,
        time: new Date().toTimeString().slice(0, 5),
        date: today(),
        status: "Waiting",
        customMaterials: { ...temporaryWalkinAdjustments }
    };

    walkins.push(walkin);
    save(STORAGE.walkins, walkins);

    closeWalkinModal();
    e.target.reset();
    document.getElementById("walkinMaterialInsightCard").classList.add("hidden");
    alert(`${patient.name} added as ${walkin.number}.`);
    renderAll();
});

function renderWalkinQueue() {
    const container = document.getElementById("walkinQueueContainer");
    if (!container) return;

    const queues = walkins.filter(q => q.status === "Waiting" || q.status === "Serving");

    if (!queues.length) {
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-person-walking"></i><strong>No walk-in patients.</strong><p>Use Add Walk-In to register a patient.</p></div>`;
        return;
    }

    container.innerHTML = queues.map(q => `
        <div class="queue-card">
            <div class="queue-number">${q.number}</div>
            <div class="queue-details">
                <h3>${esc(q.patientName)}</h3>
                <p>${esc(q.service)} · ${formatTime(q.time)}</p>
                <span class="badge ${statusClass(q.status)}">${q.status}</span>
            </div>
            <div class="queue-actions">
                ${q.status === "Waiting" ? `<button class="action-btn primary" onclick="serveWalkin('${q.number}')">Serve</button><button class="action-btn danger" onclick="noShowWalkin('${q.number}')">No-show</button>` : ""}
                ${q.status === "Serving" ? `<button class="action-btn success" onclick="completeWalkin('${q.number}')">Complete</button>` : ""}
            </div>
        </div>
    `).join("");
}

function serveWalkin(number) {
    const active = walkins.find(q => q.status === "Serving");
    if (active) { alert(`${active.number} is currently being served.`); return; }

    const q = walkins.find(x => x.number === number);
    if (!q) return;

    q.status = "Serving";
    save(STORAGE.walkins, walkins);
    renderAll();
}

function completeWalkin(number) {
    const q = walkins.find(x => x.number === number);
    if (!q) return;

    q.status = "Completed";

    const materialsToDeduct = q.customMaterials || BOM[q.service] || {};
    Object.entries(materialsToDeduct).forEach(([name, qty]) => {
        const item = inventory.find(x => x.name === name);
        if (item) item.stock = Math.max(0, item.stock - qty);
    });

    save(STORAGE.inventory, inventory);
    save(STORAGE.walkins, walkins);
    renderAll();
}

function noShowWalkin(number) {
    const q = walkins.find(x => x.number === number);
    if (!q) return;

    q.status = "No-show";
    save(STORAGE.walkins, walkins);
    renderAll();
}


/* ==========================================================================
   19. DAILY SCHEDULE
   ========================================================================== */
function renderSchedule() {
    const table = document.getElementById("scheduleTable");
    if (!table) return;

    const appointmentsToday = appointments
        .filter(a => a.date === today())
        .map(a => ({ time: a.time, name: a.patientName, type: "Appointment", service: a.service, status: a.status }));

    const walkinsToday = walkins
        .filter(w => w.date === today())
        .map(w => ({ time: w.time, name: w.patientName, type: "Walk-In", service: w.service, status: w.status }));

    const rows = [...appointmentsToday, ...walkinsToday].sort((a, b) => a.time.localeCompare(b.time));

    if (!rows.length) {
        table.innerHTML = `<tr><td colspan="5">No patients scheduled for today.</td></tr>`;
        return;
    }

    table.innerHTML = rows.map(r => `
        <tr>
            <td>${formatTime(r.time)}</td>
            <td><strong>${esc(r.name)}</strong></td>
            <td><span class="badge ${r.type === "Appointment" ? "approved" : "waiting"}">${r.type}</span></td>
            <td>${esc(r.service)}</td>
            <td><span class="badge ${statusClass(r.status)}">${r.status}</span></td>
        </tr>
    `).join("");
}


/* ==========================================================================
   20. INVENTORY PAGE
   ========================================================================== */
function renderInventory() {
    const table = document.getElementById("inventoryTable");
    if (!table) return;

    table.innerHTML = inventory.map(i => `
        <tr>
            <td><strong>${esc(i.name)}</strong></td>
            <td>${i.stock}</td>
            <td>${i.minimum}</td>
            <td><span class="badge ${i.stock <= i.minimum ? "no-show" : "approved"}">${i.stock <= i.minimum ? "Restock" : "OK"}</span></td>
            <td><button class="action-btn success" onclick="openRestockModal('${i.id}')">Edit</button></td>
        </tr>
    `).join("");
}

function openRestockModal(id) {
    const item = inventory.find(x => x.id === id);
    if (!item) return;
    document.getElementById("restockId").value = item.id;
    document.getElementById("restockName").value = item.name;
    document.getElementById("restockValue").value = item.stock;
    document.getElementById("restockModal").classList.remove("hidden");
}

function closeRestockModal() {
    document.getElementById("restockModal").classList.add("hidden");
}

function handleRestockUpdate(e) {
    e.preventDefault();
    const id = document.getElementById("restockId").value;
    const newVal = parseInt(document.getElementById("restockValue").value);
    const item = inventory.find(x => x.id === id);

    if (item) {
        item.stock = newVal;
        save(STORAGE.inventory, inventory);
        closeRestockModal();
        renderAll();
        openAdminPage("inventory");
        alert(`${item.name} stock updated successfully.`);
    }
    return false;
}


/* ==========================================================================
   21. RESTOCK FORECAST
   ========================================================================== */
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
        Object.entries(materialsFor(a)).forEach(([name, qty]) => {
            demand[name] = (demand[name] || 0) + qty;
        })
    );

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
    if (days < 14) return `${days} day${days === 1 ? "" : "s"}`;
    if (days < 60) {
        const weeks = Math.round(days / 7);
        return `${weeks} week${weeks === 1 ? "" : "s"}`;
    }
    if (days < 365) {
        const months = Math.round(days / 30);
        return `${months} month${months === 1 ? "" : "s"}`;
    }
    const years = Math.round(days / 365);
    return `${years} year${years === 1 ? "" : "s"}`;
}

function renderForecast() {
    const forecast = calculateForecast();
    const warnings = forecast.filter(x => x.warning);
    const upcoming = getUpcoming(30);

    document.getElementById("forecastAppointments").textContent = upcoming.length;
    document.getElementById("forecastMaterials").textContent = inventory.length;
    document.getElementById("forecastWarnings").textContent = warnings.length;

    document.getElementById("forecastResults").innerHTML = forecast.map(x => {
        let daysLabel = "";
        if (x.daysUntilStockout !== null) {
            const timeText = formatDuration(x.daysUntilStockout);
            if (x.daysUntilStockout <= 0) {
                daysLabel = `<span class="stockout-tag critical">Out of stock now</span>`;
            } else if (x.daysUntilStockout <= x.leadTime) {
                daysLabel = `<span class="stockout-tag critical">Runs out in ~${timeText} (before restock arrives)</span>`;
            } else {
                daysLabel = `<span class="stockout-tag">Runs out in ~${timeText}</span>`;
            }
        } else {
            daysLabel = `<span class="stockout-tag ok">No active usage — stock is stable</span>`;
        }

        return `
        <div class="forecast-result ${x.warning ? "warning" : ""}">
            <strong>${esc(x.name)}</strong>
            <span>Current Stock: ${x.stock} · Projected Usage: ${x.projectedUsage} · Remaining: ${x.projectedStock} · Supplier Lead Time: ${x.leadTime} days</span>
            ${daysLabel}
            ${x.warning
                ? `<button class="action-btn danger" onclick="suggestRestock('${esc(x.name)}',${x.projectedStock},${x.leadTime})">Suggest Restock</button>`
                : `<span>✓ Sufficient stock</span>`}
        </div>`;
    }).join("");

    renderForecastSummary();
}

function renderForecastSummary() {
    const el = document.getElementById("forecastSummary");
    if (!el) return;
    const n = calculateForecast().filter(x => x.warning).length;
    el.textContent = n ? `${n} material(s) require restocking.` : "Inventory is sufficient for projected demand.";
}

function suggestRestock(name, stock, lead) {
    alert(`RESTOCK SUGGESTION\n\nMaterial: ${name}\nProjected Remaining: ${stock}\nSupplier Lead Time: ${lead} days\n\nRecommendation: Add ${name} to the next purchase order.`);
    openAdminPage("inventory");
}


/* ==========================================================================
   22. PUBLIC QUEUE STATUS
   ========================================================================== */
function renderPublicQueues() {
    const aBox = document.getElementById("publicAppointmentQueue");
    const wBox = document.getElementById("publicWalkinQueue");
    if (!aBox || !wBox) return;

    syncAppointmentQueue();
    const a = appointmentQueue.filter(q => q.status === "Waiting" || q.status === "Serving");
    const w = walkins.filter(q => q.status === "Waiting" || q.status === "Serving");

    const dailyCounters = {};
    aBox.innerHTML = a.length ? a.map(q => {
        dailyCounters[q.date] = (dailyCounters[q.date] || 0) + 1;
        const displayNo = "A" + String(dailyCounters[q.date]).padStart(3, "0");
        return `<div class="queue-card"><div class="queue-number">${displayNo}</div><div class="queue-details"><h3>${esc(q.patientName)}</h3><p>${esc(q.service)}</p><span class="badge ${statusClass(q.status)}">${q.status}</span></div></div>`;
    }).join("") : `<div class="empty-state">No appointment patients waiting.</div>`;

    wBox.innerHTML = w.length ? w.map(q =>
        `<div class="queue-card"><div class="queue-number">${q.number}</div><div class="queue-details"><h3>${esc(q.patientName)}</h3><p>${esc(q.service)}</p><span class="badge ${statusClass(q.status)}">${q.status}</span></div></div>`
    ).join("") : `<div class="empty-state">No walk-in patients waiting.</div>`;
}


/* ==========================================================================
   23. DASHBOARD
   ========================================================================== */
function renderDashboardCharts() {
    const genderData = {
        Male: patients.filter(p => p.gender === "Male").length,
        Female: patients.filter(p => p.gender === "Female").length,
        Other: patients.filter(p => p.gender === "Other" || !p.gender || p.gender === "Select").length
    };

    const serviceCounts = {};
    appointments.forEach(a => { serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1; });

    const invLabels = inventory.map(i => i.name);
    const invStock = inventory.map(i => i.stock);
    const invMin = inventory.map(i => i.minimum);

    const ctxGender = document.getElementById("genderChart")?.getContext("2d");
    if (ctxGender) {
        if (genderChartInstance) genderChartInstance.destroy();
        genderChartInstance = new Chart(ctxGender, {
            type: "doughnut",
            data: {
                labels: Object.keys(genderData),
                datasets: [{ data: Object.values(genderData), backgroundColor: ["#5b0b68", "#78138a", "#ead3f0"], borderWidth: 0 }]
            },
            options: { plugins: { legend: { position: "bottom" } }, maintainAspectRatio: false }
        });
    }

    const ctxService = document.getElementById("serviceChart")?.getContext("2d");
    if (ctxService) {
        if (serviceChartInstance) serviceChartInstance.destroy();
        serviceChartInstance = new Chart(ctxService, {
            type: "bar",
            data: {
                labels: Object.keys(serviceCounts),
                datasets: [{ label: "Appointments", data: Object.values(serviceCounts), backgroundColor: "#78138a", borderRadius: 5 }]
            },
            options: { indexAxis: "y", plugins: { legend: { display: false } }, maintainAspectRatio: false }
        });
    }

    const ctxInv = document.getElementById("inventoryChart")?.getContext("2d");
    if (ctxInv) {
        if (inventoryChartInstance) inventoryChartInstance.destroy();
        inventoryChartInstance = new Chart(ctxInv, {
            type: "bar",
            data: {
                labels: invLabels,
                datasets: [
                    { label: "Current Stock", data: invStock, backgroundColor: "#5b0b68" },
                    { label: "Min Required", data: invMin, backgroundColor: "#d93434" }
                ]
            },
            options: { scales: { y: { beginAtZero: true } }, maintainAspectRatio: false }
        });
    }
}

function renderDashboard() {
    const todayDate = today();

    const todayAppointments = appointments.filter(a => a.date === todayDate && a.status !== "Cancelled");
    const waitingAppointments = appointmentQueue.filter(q => q.status === "Waiting" && q.date === todayDate);
    const waitingWalkins = walkins.filter(q => q.status === "Waiting" && q.date === todayDate);

    const servingA = appointmentQueue.find(q => q.status === "Serving");
    const servingW = walkins.find(q => q.status === "Serving");

    let serving = "None";
    if (servingA) serving = servingA.number;
    else if (servingW) serving = servingW.number;

    document.getElementById("statAppointments").textContent = todayAppointments.length;
    document.getElementById("statWaitingAppointments").textContent = waitingAppointments.length;
    document.getElementById("statWaitingWalkins").textContent = waitingWalkins.length;
    document.getElementById("statServing").textContent = serving;
    document.getElementById("statPatients").textContent = patients.length;

    renderDashboardCharts();
    renderDashboardExtras();
}

/* ---------- Dashboard extras (daily stats, trend line, upcoming list) ---------- */
let dailyApptChartInstance = null;
let apptTrendChartInstance = null;
let upcomingWeekStart = null;
let upcomingSelectedDate = null;

const addDays = (dateStr, n) => {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const shortWeekday = s => new Date(s + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
const shortMonthDay = s => new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

const countOn = d =>
    appointments.filter(a => a.date === d && a.status !== "Cancelled").length +
    walkins.filter(w => w.date === d).length;

function renderDailyApptChart() {
    const ctx = document.getElementById("dailyApptChart")?.getContext("2d");
    if (!ctx) return;

    const days = Array.from({ length: 7 }, (_, i) => addDays(today(), i - 6));
    const apptData = days.map(d => appointments.filter(a => a.date === d && a.status !== "Cancelled").length);
    const walkinData = days.map(d => walkins.filter(w => w.date === d).length);

    if (dailyApptChartInstance) dailyApptChartInstance.destroy();
    dailyApptChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: days.map(shortWeekday),
            datasets: [
                { label: "Appointments", data: apptData, backgroundColor: "#5b0b68", borderRadius: 6, borderSkipped: false },
                { label: "Walk-Ins", data: walkinData, backgroundColor: "#d9b8e2", borderRadius: 6, borderSkipped: false }
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
    const ctx = document.getElementById("apptTrendChart")?.getContext("2d");
    if (!ctx) return;

    const t = today();
    const days = Array.from({ length: 15 }, (_, i) => addDays(t, i - 7));

    const namesByDay = days.map(d => [
        ...appointments.filter(a => a.date === d && a.status !== "Cancelled")
            .map(a => `${a.patientName} (${a.service})`),
        ...walkins.filter(w => w.date === d)
            .map(w => `${w.patientName} (Walk-In)`)
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

    if (apptTrendChartInstance) apptTrendChartInstance.destroy();
    apptTrendChartInstance = new Chart(ctx, {
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

function renderUpcomingAppointments() {
    const strip = document.getElementById("upcomingStrip");
    const list = document.getElementById("upcomingList");
    const monthLabel = document.getElementById("upcomingMonth");
    if (!strip || !list || !monthLabel) return;

    if (!upcomingWeekStart) upcomingWeekStart = today();
    if (!upcomingSelectedDate) upcomingSelectedDate = today();

    const days = Array.from({ length: 7 }, (_, i) => addDays(upcomingWeekStart, i));
    monthLabel.textContent = new Date(days[0] + "T00:00:00")
        .toLocaleDateString("en-US", { month: "long", year: "numeric" });

    strip.innerHTML = days.map(d => {
        const dt = new Date(d + "T00:00:00");
        return `<button type="button" class="upcoming-day ${d === upcomingSelectedDate ? "active" : ""}" onclick="selectUpcomingDay('${d}')">
                    <strong>${dt.getDate()}</strong><span>${shortWeekday(d)}</span>
                </button>`;
    }).join("");

    const sel = upcomingSelectedDate;
    const rows = [
        ...appointments.filter(a => a.date === sel && a.status !== "Cancelled")
            .map(a => ({ time: a.time, name: a.patientName, service: a.service, status: a.status, type: "Appointment" })),
        ...walkins.filter(w => w.date === sel)
            .map(w => ({ time: w.time, name: w.patientName, service: w.service, status: w.status, type: "Walk-In" }))
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
    if (!upcomingWeekStart) upcomingWeekStart = today();
    upcomingWeekStart = addDays(upcomingWeekStart, dir * 7);
    upcomingSelectedDate = upcomingWeekStart;
    renderUpcomingAppointments();
}

function renderDashboardExtras() {
    try {
        renderDailyApptChart();
        renderApptTrendChart();
        renderUpcomingAppointments();
    } catch (err) {
        console.error("Dashboard extras failed:", err);
    }
}


/* ==========================================================================
   24. REPORTS
   ========================================================================== */
function inReportDateRange(dateStr) {
    const startEl = document.getElementById("reportStartDate");
    const endEl = document.getElementById("reportEndDate");
    const startVal = startEl ? startEl.value : "";
    const endVal = endEl ? endEl.value : "";
    if (!startVal && !endVal) return true;

    const d = new Date(dateStr + "T00:00:00");
    if (startVal && d < new Date(startVal + "T00:00:00")) return false;
    if (endVal && d > new Date(endVal + "T23:59:59")) return false;
    return true;
}

function clearReportDateFilter() {
    document.getElementById("reportStartDate").value = "";
    document.getElementById("reportEndDate").value = "";
    renderReports();
}

function getAllHistory() {
    return [
        ...appointments.map(a => ({ date: a.date, time: a.time || "00:00", type: "Appt", name: a.patientName, svc: a.service, stat: a.status })),
        ...walkins.map(w => ({ date: w.date, time: w.time || "00:00", type: "Walkin", name: w.patientName, svc: w.service, stat: w.status }))
    ];
}

const byDateTime = (a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);

function renderReports() {
    const totalCompleted = appointmentQueue.filter(q => q.status === "Completed").length + walkins.filter(q => q.status === "Completed").length;
    const totalNoShow = appointmentQueue.filter(q => q.status === "No-show").length + walkins.filter(q => q.status === "No-show").length;

    document.getElementById("reportPatients").textContent = patients.length;
    document.getElementById("reportAppointments").textContent = appointments.length;
    document.getElementById("reportCompleted").textContent = totalCompleted;
    document.getElementById("reportNoShow").textContent = totalNoShow;

    const filter = document.getElementById("reportFilter").value;
    const tableTitle = document.getElementById("reportTableTitle");
    const tableHeader = document.getElementById("reportTableHeader");
    const tableBody = document.getElementById("reportActivityTable");

    const historyRow = r => `
        <tr>
            <td>${formatDate(r.date)}</td>
            <td><small>${r.type}</small></td>
            <td><strong>${esc(r.name)}</strong></td>
            <td>${esc(r.svc || "-")}</td>
            <td><span class="badge ${statusClass(r.stat)}">${r.stat}</span></td>
        </tr>`;
    const historyHeader = `<tr><th>Date</th><th>Type</th><th>Patient</th><th>Service</th><th>Status</th></tr>`;

    if (filter === "patients") {
        tableTitle.textContent = "Full Patient Directory";
        tableHeader.innerHTML = `<tr><th>ID</th><th>Patient Name</th><th>Contact</th><th>Date of birth</th><th>Gender</th><th>Address</th></tr>`;

        const list = [...patients].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        tableBody.innerHTML = list.length ? list.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><strong>${esc(p.name)}</strong></td>
                <td>${esc(p.contact)}</td>
                <td>${formatDate(p.dob)}</td>
                <td>${esc(p.gender || "Other")}</td>
                <td>${esc(p.address || "-")}</td>
            </tr>`).join("") : `<tr><td colspan="6">No patients found.</td></tr>`;

    } else if (filter === "male" || filter === "female" || filter === "other") {
        const genderMap = { male: "Male", female: "Female", other: "Other" };
        const gender = genderMap[filter];
        tableTitle.textContent = `${gender} Patient Directory`;
        tableHeader.innerHTML = `<tr><th>No.</th><th>Patient Name</th><th>Contact</th><th>Date of Birth</th><th>Gender</th></tr>`;

        const list = patients.filter(p => {
            if (gender === "Other") return p.gender === "Other" || !p.gender;
            return p.gender === gender;
        }).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

        tableBody.innerHTML = list.length ? list.map((p, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${esc(p.name)}</strong></td>
                <td>${esc(p.contact)}</td>
                <td>${formatDate(p.dob)}</td>
                <td>${esc(p.gender || "Other")}</td>
            </tr>`).join("") : `<tr><td colspan="5">No ${gender} patients found.</td></tr>`;

    } else if (filter === "completed" || filter === "noshow") {
        const status = filter === "completed" ? "Completed" : "No-show";
        tableTitle.textContent = `Full ${status} History`;
        tableHeader.innerHTML = historyHeader;

        const rows = getAllHistory()
            .filter(item => item.stat === status && inReportDateRange(item.date))
            .sort(byDateTime);

        tableBody.innerHTML = rows.length ? rows.map(historyRow).join("") : `<tr><td colspan="5">No ${status} records found.</td></tr>`;

    } else if (filter === "walkin") {
        tableTitle.textContent = "Walk-In Patient Records";
        tableHeader.innerHTML = `<tr><th>Queue #</th><th>Date</th><th>Time</th><th>Patient</th><th>Service</th><th>Status</th></tr>`;

        const sortedWalkins = walkins
            .filter(w => inReportDateRange(w.date))
            .sort((a, b) => new Date(`${a.date}T${a.time || "00:00"}`) - new Date(`${b.date}T${b.time || "00:00"}`));

        tableBody.innerHTML = sortedWalkins.length ? sortedWalkins.map(w => `
            <tr>
                <td>${esc(w.number)}</td>
                <td>${formatDate(w.date)}</td>
                <td>${formatTime(w.time)}</td>
                <td><strong>${esc(w.patientName)}</strong></td>
                <td>${esc(w.service || "-")}</td>
                <td><span class="badge ${statusClass(w.status)}">${w.status}</span></td>
            </tr>`).join("") : `<tr><td colspan="6">No walk-in records found.</td></tr>`;

    } else if (filter === "inventory") {
        tableTitle.textContent = "Inventory Stock Report";
        tableHeader.innerHTML = `<tr><th>Material</th><th>Current Stock</th><th>Minimum Required</th><th>Supplier Lead Time</th><th>Status</th></tr>`;

        const sortedInventory = [...inventory].sort((a, b) => a.name.localeCompare(b.name));
        tableBody.innerHTML = sortedInventory.length ? sortedInventory.map(i => `
            <tr>
                <td><strong>${esc(i.name)}</strong></td>
                <td>${i.stock}</td>
                <td>${i.minimum}</td>
                <td>${i.leadTime} days</td>
                <td><span class="badge ${i.stock <= i.minimum ? "no-show" : "approved"}">${i.stock <= i.minimum ? "Restock" : "OK"}</span></td>
            </tr>`).join("") : `<tr><td colspan="5">No inventory records found.</td></tr>`;

    } else {
        tableTitle.textContent = "Recent Activity Log";
        tableHeader.innerHTML = historyHeader;

        const rows = getAllHistory()
            .filter(item => inReportDateRange(item.date))
            .sort(byDateTime)
            .slice(-30);

        tableBody.innerHTML = rows.map(historyRow).join("");
    }
}

function printFilteredReport() {
    const title = document.getElementById("reportTableTitle").textContent;
    const tableContent = document.querySelector("#page-reports table").outerHTML;

    const logoEl = document.querySelector(".sidebar-brand .brand-logo-img");
    const logoSrc = logoEl ? logoEl.src : "";

    const w = window.open("", "_blank");
    w.document.write(`
        <html>
            <head>
                <title>Pecaña Dental Clinic - ${esc(title)}</title>
                <style>
                    @page { size: auto; margin: 0mm; }
                    * { box-sizing: border-box; }

                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        padding: 18mm 16mm 22mm;
                        margin: 0;
                        color: #202124;
                        counter-reset: page;
                    }

                    .print-letterhead {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        border-bottom: 3px solid #5b0b68;
                        padding-bottom: 14px;
                        margin-bottom: 18px;
                    }

                    .print-letterhead img {
                        width: 56px;
                        height: 56px;
                        object-fit: contain;
                        border-radius: 50%;
                        flex-shrink: 0;
                    }

                    .print-letterhead .clinic-name {
                        font-size: 22px;
                        font-weight: 800;
                        color: #5b0b68;
                        letter-spacing: .3px;
                    }

                    .print-letterhead .clinic-tagline {
                        font-size: 11px;
                        color: #6b7280;
                        margin-top: 2px;
                    }

                    .print-meta {
                        display: flex;
                        justify-content: space-between;
                        align-items: baseline;
                        margin-bottom: 16px;
                    }

                    .print-meta h2 { font-size: 17px; color: #202124; margin: 0; }
                    .print-meta .gen-date { font-size: 11px; color: #6b7280; }

                    table { width: 100%; border-collapse: collapse; margin-top: 6px; page-break-inside: auto; }
                    th, td { border: 1px solid #e5e0e7; padding: 10px; text-align: left; font-size: 12px; }
                    th { background: #f6eafa; color: #5b0b68; text-transform: uppercase; letter-spacing: .4px; font-size: 10.5px; }
                    tr:nth-child(even) td { background: #fbf8fc; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    .badge { font-weight: bold; }

                    .page-footer {
                        position: fixed;
                        bottom: 8mm;
                        left: 16mm;
                        right: 16mm;
                        display: flex;
                        justify-content: space-between;
                        font-size: 10px;
                        color: #9aa0a6;
                        border-top: 1px solid #eee;
                        padding-top: 6px;
                    }

                    .page-footer .page-num::after {
                        counter-increment: page;
                        content: "Page " counter(page);
                    }
                </style>
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

                <div class="page-footer">
                    <span></span>
                    <span class="page-num"></span>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    };
                <\/script>
            </body>
        </html>
    `);
    w.document.close();
}


/* ==========================================================================
   25. CALENDAR
   ========================================================================== */
let advanceCalendar;

function openAdvanceCalendar() {
    document.getElementById("calendarModal").classList.remove("hidden");
    const calendarEl = document.getElementById("calendar");

    const getApptEvents = () => appointments.map(app => ({
        id: app.id,
        title: `${app.patientName} (${app.service})`,
        start: `${app.date}T${app.time}`,
        backgroundColor: app.status === "Completed" ? "#16834b" : "#5b0b68",
        borderColor: "transparent"
    }));

    const lunchBreak = {
        title: "Lunch Break",
        startTime: "12:00:00",
        endTime: "13:00:00",
        daysOfWeek: [1, 2, 3, 4, 5, 6],
        display: "background",
        color: "#ffeded"
    };

    if (!advanceCalendar) {
        advanceCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: "timeGridWeek",
            headerToolbar: {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek"
            },
            slotMinTime: "07:00:00",
            slotMaxTime: "21:00:00",
            contentHeight: "auto",
            allDaySlot: false,
            expandRows: true,
            handleWindowResize: true,
            businessHours: [
                { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "07:00", endTime: "12:00" },
                { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "13:00", endTime: "20:00" }
            ],
            events: [...getApptEvents(), lunchBreak],
            eventClick: info => {
                info.jsEvent.preventDefault();
                if (info.event.id) openCalendarEventDetails(info.event.id);
            }
        });
    } else {
        advanceCalendar.removeAllEvents();
        advanceCalendar.addEventSource([...getApptEvents(), lunchBreak]);
    }

    advanceCalendar.render();
    setTimeout(() => advanceCalendar.updateSize(), 100);
}

function openCalendarEventDetails(id) {
    const a = appointments.find(x => x.id === id);
    if (!a) return;

    document.getElementById("calendarEventContent").innerHTML = `
        <div style="grid-column:1/-1;"><strong>Patient</strong>${esc(a.patientName)}</div>
        <div><strong>Date</strong>${formatDate(a.date)}</div>
        <div><strong>Time</strong>${formatTime(a.time)}</div>
        <div style="grid-column:1/-1;"><strong>Dental Service</strong>${esc(a.service)}</div>
        <div style="grid-column:1/-1;"><strong>Status</strong><span class="badge ${statusClass(a.status)}">${esc(a.status)}</span></div>
    `;
    document.getElementById("calendarEventModal").classList.remove("hidden");
}

function closeCalendarEventModal() {
    document.getElementById("calendarEventModal").classList.add("hidden");
}

function closeCalendarModal() {
    document.getElementById("calendarModal").classList.add("hidden");
}



/* ==========================================================================
   26. NOTIFICATIONS  (public bell + admin bell)
   --------------------------------------------------------------------------
   Sections in this block:
     1. Config & helpers
     2. Panel open / close
     3. Admin notifications
     4. Patient (public) notifications
   Markup for both bells lives in index.html (.nt-wrap).
   Styles live in style.css under "NOTIFICATIONS".
   ========================================================================== */

/* ---------- 1. Config & helpers ---------- */
const NT_ADMIN_READ_KEY = "pecana_admin_notif_read";
const NT_LOOKUP_KEY     = "pecana_patient_lookup";
const NT_SEEN_KEY       = "pecana_patient_seen";
const NT_STEPS          = ["Requested", "Approved", "Serving", "Done"];

let ntShownQuery = null; // query currently displayed in the patient panel

const ntRead = (key, fallback) => {
    try {
        const v = JSON.parse(localStorage.getItem(key));
        return v ?? fallback;
    } catch {
        return fallback;
    }
};
const ntWrite      = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const ntPlural     = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const ntBadgeText  = n => (n > 9 ? "9+" : String(n));
const ntDigits     = s => String(s || "").replace(/\D/g, "");
const ntNormName   = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const ntIsNumeric  = s => /^[\d\s+()-]+$/.test(s);

function ntEmpty(icon, title, text) {
    return `
        <div class="nt-empty">
            <div class="nt-empty-ico"><i class="fa-solid ${icon}"></i></div>
            <strong>${esc(title)}</strong>
            <p>${esc(text)}</p>
        </div>`;
}

/* ---------- 2. Panel open / close ---------- */
function ntClosePanels() {
    ["ntAdminBox", "ntPatientBox"].forEach(id =>
        document.getElementById(id)?.classList.add("hidden"));
    ["adminBell", "patientBell"].forEach(id =>
        document.getElementById(id)?.setAttribute("aria-expanded", "false"));
}

function toggleNotifications(type) {
    const isAdmin = type === "adminNotify";
    const box  = document.getElementById(isAdmin ? "ntAdminBox" : "ntPatientBox");
    const bell = document.getElementById(isAdmin ? "adminBell" : "patientBell");
    if (!box) return;

    const willOpen = box.classList.contains("hidden");
    ntClosePanels();
    if (!willOpen) return;

    box.classList.remove("hidden");
    bell?.setAttribute("aria-expanded", "true");
    ntPositionPanels();

    if (isAdmin) updateAdminNotifications();
    else openPatientPanel();
}

/* On phones the panel is fixed to the screen; place it just under the bell
   so it never covers the header or nav buttons, and cap its height. */
function ntPositionPanels() {
    [["ntAdminBox", "adminBell"], ["ntPatientBox", "patientBell"]].forEach(([boxId, bellId]) => {
        const box  = document.getElementById(boxId);
        const bell = document.getElementById(bellId);
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
    if (!e.target.isConnected) return; // element was re-rendered during this click
    if (!e.target.closest(".nt-wrap")) ntClosePanels();
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") ntClosePanels();
});

/* ---------- 3. Admin notifications ---------- */
function ntBuildAdminNotifications() {
    const t = today();
    const items = [];

    /* Inventory: out of stock / low stock */
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

    /* Inventory: projected shortage from upcoming appointments */
    calculateForecast().forEach(f => {
        if (!f.warning || f.stock <= f.minimum) return; // already covered above
        items.push({
            key: `fc:${f.id}:${f.projectedStock}`, group: "inventory", level: "warning", rank: 2,
            icon: "fa-chart-line", tag: "Forecast", sort: f.name,
            title: `${f.name} may run short`,
            text: `Upcoming appointments need ${f.projectedUsage}. Projected stock drops to ${f.projectedStock}, below the minimum of ${f.minimum}.`,
            meta: `Based on the next 30 days. Supplier lead time: ${ntPlural(f.leadTime, "day")}`,
            page: "forecast"
        });
    });

    /* Appointments waiting for approval */
    appointments
        .filter(a => a.status === "Pending" && a.date >= t) // past-dated requests no longer show in the list
        .forEach(a => {
            const isToday = a.date === t;
            items.push({
                key: `appt:${a.id}:${a.date}:${a.time}`, group: "appointments",
                level: isToday ? "warning" : "info", rank: isToday ? 1 : 3,
                icon: isToday ? "fa-calendar-check" : "fa-calendar-plus",
                tag: isToday ? "Needs approval" : "New request",
                sort: `${a.date} ${a.time || "00:00"}`,
                title: isToday
                    ? `Approve ${a.patientName}'s visit`
                    : `${a.patientName} requested an appointment`,
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
    const list  = document.getElementById("ntAdminList");
    const badge = document.getElementById("ntAdminBadge");
    const bell  = document.getElementById("adminBell");
    const sub   = document.getElementById("ntAdminSub");
    if (!list || !badge) return;

    const items = ntBuildAdminNotifications();
    const keys  = new Set(items.map(n => n.key));

    // forget read marks for notifications that no longer exist
    let read = new Set(ntRead(NT_ADMIN_READ_KEY, []));
    const kept = [...read].filter(k => keys.has(k));
    if (kept.length !== read.size) {
        read = new Set(kept);
        ntWrite(NT_ADMIN_READ_KEY, kept);
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
                 role="button" tabindex="0"
                 data-key="${esc(n.key)}" data-page="${esc(n.page)}">
                <div class="nt-ico"><i class="fa-solid ${n.icon}"></i></div>
                <div class="nt-main">
                    <span class="nt-tag">${esc(n.tag)}</span>
                    <strong class="nt-title">${esc(n.title)}</strong>
                    <p>${esc(n.text)}</p>
                    <small>${esc(n.meta)}</small>
                </div>
                <span class="nt-dot"></span>
            </div>`).join("")}
    `).join("");
}

function ntOpenAdminItem(el) {
    const read = new Set(ntRead(NT_ADMIN_READ_KEY, []));
    read.add(el.dataset.key);
    ntWrite(NT_ADMIN_READ_KEY, [...read]);
    ntClosePanels();
    updateAdminNotifications();
    if (el.dataset.page) openAdminPage(el.dataset.page);
}

function markAllAdminNotificationsRead() {
    ntWrite(NT_ADMIN_READ_KEY, ntBuildAdminNotifications().map(n => n.key));
    updateAdminNotifications();
}

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("ntAdminList");
    if (!list) return;
    list.addEventListener("click", e => {
        const item = e.target.closest(".nt-item");
        if (item) ntOpenAdminItem(item);
    });
    list.addEventListener("keydown", e => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const item = e.target.closest(".nt-item");
        if (item) { e.preventDefault(); ntOpenAdminItem(item); }
    });
});

/* ---------- 4. Patient (public) notifications ---------- */

/* Privacy: only an exact full contact number or exact full name matches. */
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

/* Position in the same list the public Queue Status page shows (A001, A002...) */
function ntQueueInfo(a) {
    const q = appointmentQueue.find(x => x.appointmentId === a.id);
    if (!q) return null;
    const active = appointmentQueue.filter(x =>
        x.date === q.date && (x.status === "Waiting" || x.status === "Serving"));
    const idx = active.findIndex(x => x.appointmentId === a.id);
    if (idx < 0) return null;
    return {
        number: "A" + String(idx + 1).padStart(3, "0"),
        ahead: idx,
        serving: q.status === "Serving"
    };
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
        if (queue && queue.serving) return {
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

/* Renders results and marks them as seen. Returns how many were found. */
function ntRenderPatientResults(query) {
    const list = document.getElementById("ntPatientList");
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
    const shown = sorted.slice(0, LIMIT);
    const seen = ntRead(NT_SEEN_KEY, {});

    list.innerHTML = `
        <div class="nt-results-head">
            <span>${ntPlural(appts.length, "appointment")} found</span>
            <button type="button" class="nt-clear" onclick="ntClearLookup()">Clear</button>
        </div>
        ${shown.map(a => ntPatientCard(a, seen[a.id] !== undefined && seen[a.id] !== ntSignature(a))).join("")}
        ${appts.length > LIMIT ? `<div class="nt-more">Showing the latest ${LIMIT}. Contact the clinic for older records.</div>` : ""}`;

    appts.forEach(a => { seen[a.id] = ntSignature(a); });
    ntWrite(NT_SEEN_KEY, seen);
    return appts.length;
}

function ntShowPatientHint(title, text, icon = "fa-calendar-check") {
    ntShownQuery = null;
    const list = document.getElementById("ntPatientList");
    if (list) list.innerHTML = ntEmpty(icon, title, text);
}

function openPatientPanel() {
    const input = document.getElementById("ntPatientSearch");
    const saved = localStorage.getItem(NT_LOOKUP_KEY);

    if (saved) {
        if (input && !input.value) input.value = saved;
        ntRenderPatientResults(saved);
    } else {
        ntShowPatientHint("Check your appointment",
            "Enter the contact number or full name you booked with to see your status and queue position.");
    }
    updatePatientNotifications();
    setTimeout(() => input?.focus(), 60);
}

function checkPatientNotifications() {
    const input = document.getElementById("ntPatientSearch");
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

    const count = ntRenderPatientResults(q);
    if (count) localStorage.setItem(NT_LOOKUP_KEY, q);
    updatePatientNotifications();
}

function ntClearLookup() {
    localStorage.removeItem(NT_LOOKUP_KEY);
    localStorage.removeItem(NT_SEEN_KEY);
    const input = document.getElementById("ntPatientSearch");
    if (input) input.value = "";
    ntShowPatientHint("Check your appointment",
        "Enter the contact number or full name you booked with to see your status and queue position.");
    updatePatientNotifications();
}

/* Called from renderAll(): keeps the badge and an open panel in sync. */
function updatePatientNotifications() {
    const badge = document.getElementById("ntPatientBadge");
    const bell  = document.getElementById("patientBell");
    const box   = document.getElementById("ntPatientBox");
    if (!badge) return;

    const saved = localStorage.getItem(NT_LOOKUP_KEY);
    const isOpen = box && !box.classList.contains("hidden");

    // live refresh while the panel is open
    if (isOpen && ntShownQuery) ntRenderPatientResults(ntShownQuery);

    let changed = 0;
    if (saved && !isOpen) {
        const seen = ntRead(NT_SEEN_KEY, {});
        changed = ntFindAppointments(saved).filter(a => seen[a.id] !== ntSignature(a)).length;
    }

    badge.textContent = ntBadgeText(changed);
    badge.classList.toggle("hidden", changed === 0);
    bell?.classList.toggle("has-unread", changed > 0);
    bell?.setAttribute("aria-label", changed ? `Appointment updates, ${changed} new` : "Appointment status");
}


/* ==========================================================================
   27. WELCOME SPLASH
   ========================================================================== */
window.closeWelcomeSplash = function () {
    sessionStorage.setItem("pecana_entered", "true");
    const welcomeSplash = document.getElementById("welcomeSplash");
    if (welcomeSplash) {
        welcomeSplash.classList.add("hidden");
        setTimeout(() => { welcomeSplash.style.display = "none"; }, 300);
    }
};

(function handleInitialSplashState() {
    const isAdminLoggedIn = sessionStorage.getItem("pecana_admin_logged_in") === "true" || window.location.pathname.includes("admin");
    const alreadyEntered = sessionStorage.getItem("pecana_entered") === "true";

    document.addEventListener("DOMContentLoaded", () => {
        const welcomeSplash = document.getElementById("welcomeSplash");
        const logoOnlySplash = document.getElementById("logoOnlySplash");

        if (isAdminLoggedIn || alreadyEntered) {
            if (welcomeSplash) {
                welcomeSplash.style.display = "none";
                welcomeSplash.classList.add("hidden");
            }
            if (logoOnlySplash) {
                logoOnlySplash.style.display = "flex";
                logoOnlySplash.classList.remove("hidden");

                setTimeout(() => {
                    logoOnlySplash.classList.add("fade-out");
                    setTimeout(() => {
                        logoOnlySplash.style.display = "none";
                        logoOnlySplash.classList.add("hidden");
                    }, 300);
                }, 600);
            }
        } else {
            if (logoOnlySplash) {
                logoOnlySplash.style.display = "none";
                logoOnlySplash.classList.add("hidden");
            }
            if (welcomeSplash) {
                welcomeSplash.style.display = "flex";
                welcomeSplash.classList.remove("hidden");
            }
        }
    });
})();
/* ==========================================================================
   MULTI-SELECT + DELETE FEATURE
   Checkbox / row-click / shift-click selection, floating action bar,
   confirm dialog and Undo. Used by Appointment Management + Patient Records.
   ========================================================================== */

const selection  = { appointment: new Set(), patient: new Set() };
const lastPicked = { appointment: null, patient: null };

const SELECT_CFG = {
    appointment: { bar: "apptBulkBar",    count: "apptBulkCount",    allBtn: "apptBulkAll",    all: "apptSelectAll",    body: "appointmentTable" },
    patient:     { bar: "patientBulkBar", count: "patientBulkCount", allBtn: "patientBulkAll", all: "patientSelectAll", body: "patientTable" }
};

/* The row id lives in the checkbox's onchange attribute */
const rowIdOf = cb => (cb.getAttribute("onchange") || "").match(/'[^']+'\s*,\s*'([^']+)'/)?.[1] || null;

function setSelected(type, id, on) {
    if (!id) return;
    if (on) selection[type].add(id);
    else selection[type].delete(id);
}

/* Refresh floating bar, header checkbox and row highlights */
function syncSelectionUI(type) {
    const cfg  = SELECT_CFG[type];
    const set  = selection[type];
    const body = document.getElementById(cfg.body);
    if (!body) return;

    const boxes = body.querySelectorAll(".row-check");
    const total = boxes.length;

    boxes.forEach(b => b.closest("tr")?.classList.toggle("row-selected", b.checked));

    const all = document.getElementById(cfg.all);
    if (all) {
        all.checked = total > 0 && set.size === total;
        all.indeterminate = set.size > 0 && set.size < total;
    }

    document.getElementById(cfg.bar)?.classList.toggle("hidden", set.size === 0);

    const count = document.getElementById(cfg.count);
    if (count) count.textContent = set.size;

    const allBtn = document.getElementById(cfg.allBtn);
    if (allBtn) {
        allBtn.textContent = `Select all ${total}`;
        allBtn.classList.toggle("hidden", set.size >= total);
    }
}

function toggleRowSelect(type, id, checked) {
    setSelected(type, id, checked);
    syncSelectionUI(type);
}

function toggleSelectAll(type, checked) {
    document.querySelectorAll(`#${SELECT_CFG[type].body} .row-check`).forEach(b => {
        b.checked = checked;
        setSelected(type, rowIdOf(b), checked);
    });
    syncSelectionUI(type);
}

function clearSelection(type) {
    selection[type].clear();
    lastPicked[type] = null;
    document.querySelectorAll(`#${SELECT_CFG[type].body} .row-check`).forEach(b => { b.checked = false; });
    syncSelectionUI(type);
}

/* Select one row, or a whole range when Shift is held */
function pickRow(type, cb, shift) {
    const boxes = [...document.querySelectorAll(`#${SELECT_CFG[type].body} .row-check`)];
    const idx   = boxes.indexOf(cb);
    const want  = cb.checked;

    if (shift && lastPicked[type] !== null && boxes[lastPicked[type]]) {
        const [from, to] = [lastPicked[type], idx].sort((a, b) => a - b);
        for (let i = from; i <= to; i++) {
            boxes[i].checked = want;
            setSelected(type, rowIdOf(boxes[i]), want);
        }
    } else {
        setSelected(type, rowIdOf(cb), want);
    }

    lastPicked[type] = idx;
    syncSelectionUI(type);
}

/* Click a checkbox, or anywhere on a row (except buttons/links), to select */
Object.entries(SELECT_CFG).forEach(([type, cfg]) => {
    const body = document.getElementById(cfg.body);
    if (!body) return;

    body.addEventListener("mousedown", e => { if (e.shiftKey) e.preventDefault(); }); // no text highlight on shift+click

    body.addEventListener("click", e => {
        const direct = e.target.closest(".row-check");
        if (direct) { pickRow(type, direct, e.shiftKey); return; }

        if (e.target.closest("button, a, input, label, select")) return;
        if (String(window.getSelection?.() || "").length) return; // user is highlighting text

        const cb = e.target.closest("tr")?.querySelector(".row-check");
        if (!cb) return;
        cb.checked = !cb.checked;
        pickRow(type, cb, e.shiftKey);
    });
});

/* Esc: close the dialog first, otherwise clear the selection */
document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const modal = document.getElementById("deleteConfirmModal");
    if (modal && !modal.classList.contains("hidden")) { closeDeleteConfirm(); return; }
    clearSelection("appointment");
    clearSelection("patient");
});

/* ---------- Confirm dialog ---------- */
let pendingDelete = null; // { type: "patient" | "appointment", ids: [...] }

function requestBulkDelete(type) {
    const ids = [...selection[type]];
    if (!ids.length) return;

    pendingDelete = { type, ids };
    const idSet = new Set(ids);
    const n = ids.length;

    const title = document.getElementById("deleteConfirmTitle");
    const text  = document.getElementById("deleteConfirmText");
    const list  = document.getElementById("deleteConfirmList");
    const label = document.getElementById("deleteConfirmBtnLabel");
    const undoNote = `<span class="delete-note muted">You can undo this right after deleting.</span>`;

    if (type === "patient") {
        const rows = patients.filter(p => idSet.has(p.id));
        const active = appointments.filter(a =>
            idSet.has(a.patientId) && (a.status === "Pending" || a.status === "Approved")).length;

        title.textContent = n === 1 ? "Delete this patient?" : `Delete ${n} patients?`;
        label.textContent = n === 1 ? "Delete patient" : `Delete ${n} patients`;
        text.innerHTML =
            `This will remove ${n === 1 ? "the patient" : `<strong>${n} patients</strong>`} from the clinic records.` +
            (active ? `<span class="delete-note">Their ${active} pending/approved appointment${active === 1 ? "" : "s"} and queue entries will also be removed.</span>` : "") +
            `<span class="delete-note">Completed and no-show history is kept for reports.</span>` + undoNote;
        list.innerHTML = rows.map(p =>
            `<li><span class="delete-li-main">${esc(p.name)}</span><span class="delete-li-sub">${esc(p.id)}</span></li>`).join("");
    } else {
        const rows = appointments.filter(a => idSet.has(a.id));

        title.textContent = n === 1 ? "Delete this appointment?" : `Delete ${n} appointments?`;
        label.textContent = n === 1 ? "Delete appointment" : `Delete ${n} appointments`;
        text.innerHTML =
            `This will remove ${n === 1 ? "the appointment" : `<strong>${n} appointments</strong>`} and take ${n === 1 ? "it" : "them"} out of the queue.` +
            undoNote;
        list.innerHTML = rows.map(a =>
            `<li><span class="delete-li-main">${esc(a.patientName)}</span>` +
            `<span class="delete-li-sub">${esc(formatDate(a.date))} · ${esc(formatTime(a.time))} · ${esc(a.service)}</span></li>`).join("");
    }

    document.getElementById("deleteConfirmModal").classList.remove("hidden");
    // safe default: focus Cancel so a stray Enter never deletes
    setTimeout(() => document.querySelector("#deleteConfirmModal .btn-outline")?.focus(), 30);
}

function closeDeleteConfirm() {
    document.getElementById("deleteConfirmModal").classList.add("hidden");
    pendingDelete = null;
}

/* click on the dark backdrop closes the dialog */
document.getElementById("deleteConfirmModal")?.addEventListener("click", e => {
    if (e.target.id === "deleteConfirmModal") closeDeleteConfirm();
});

function confirmDelete() {
    if (!pendingDelete) { closeDeleteConfirm(); return; }
    const { type, ids } = pendingDelete;
    const idSet = new Set(ids);
    const n = ids.length;

    // snapshot for Undo
    undoSnapshot = {
        patients:         JSON.parse(JSON.stringify(patients)),
        appointments:     JSON.parse(JSON.stringify(appointments)),
        appointmentQueue: JSON.parse(JSON.stringify(appointmentQueue)),
        walkins:          JSON.parse(JSON.stringify(walkins))
    };

    if (type === "patient") {
        const isActiveAppt = a => idSet.has(a.patientId) && (a.status === "Pending" || a.status === "Approved");
        const removedApptIds = new Set(appointments.filter(isActiveAppt).map(a => a.id));

        patients         = patients.filter(p => !idSet.has(p.id));
        appointments     = appointments.filter(a => !removedApptIds.has(a.id));
        appointmentQueue = appointmentQueue.filter(q => !removedApptIds.has(q.appointmentId));
        walkins          = walkins.filter(w => !(idSet.has(w.patientId) && (w.status === "Waiting" || w.status === "Serving")));

        save(STORAGE.patients, patients);
        save(STORAGE.appointments, appointments);
        save(STORAGE.appointmentQueue, appointmentQueue);
        save(STORAGE.walkins, walkins);
    }

    if (type === "appointment") {
        appointments     = appointments.filter(a => !idSet.has(a.id));
        appointmentQueue = appointmentQueue.filter(q => !idSet.has(q.appointmentId));

        save(STORAGE.appointments, appointments);
        save(STORAGE.appointmentQueue, appointmentQueue);
    }

    selection[type].clear();
    lastPicked[type] = null;
    closeDeleteConfirm();
    renderAll();

    const noun = type === "patient" ? "patient" : "appointment";
    showUndoToast(`${n} ${noun}${n === 1 ? "" : "s"} deleted`);
}

/* ---------- Undo toast ---------- */
let undoSnapshot = null;
let undoTimer = null;

function showUndoToast(message) {
    let t = document.getElementById("undoToast");
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
    document.getElementById("undoToast")?.classList.remove("show");
    clearTimeout(undoTimer);
    undoSnapshot = null;
}

function undoDelete() {
    const snap = undoSnapshot;
    if (!snap) return;

    patients         = snap.patients;
    appointments     = snap.appointments;
    appointmentQueue = snap.appointmentQueue;
    walkins          = snap.walkins;

    save(STORAGE.patients, patients);
    save(STORAGE.appointments, appointments);
    save(STORAGE.appointmentQueue, appointmentQueue);
    save(STORAGE.walkins, walkins);

    hideUndoToast();
    renderAll();
}

/* ==========================================================================
   28. INITIALIZATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    syncAppointmentQueue();
    renderAll();

    const t = today();
    const setAttr = (id, attr) => {
        const el = document.getElementById(id);
        if (el) el[attr] = t;
    };
    setAttr("bookingDate", "min");
    setAttr("adminAppointmentDate", "min");
    setAttr("editAppointmentDate", "min");
    setAttr("bookingDOB", "max");

    linkScheduleFields("bookingDate", "bookingTime");
    linkScheduleFields("adminAppointmentDate", "adminAppointmentTime");
    linkScheduleFields("editAppointmentDate", "editAppointmentTime");

    attachTimeFieldMessage("bookingTime");
    attachTimeFieldMessage("adminAppointmentTime");
    attachTimeFieldMessage("editAppointmentTime");

    if (sessionStorage.getItem("pecana_admin_logged_in") === "true") {
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("publicApp").classList.add("hidden");
        document.getElementById("adminApp").classList.remove("hidden");
        const savedPage = sessionStorage.getItem("pecana_admin_page");
        openAdminPage(savedPage && document.getElementById("page-" + savedPage) ? savedPage : "dashboard");
    }
});