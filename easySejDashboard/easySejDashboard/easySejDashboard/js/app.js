// Palette for groups
const GROUP_COLORS = [
    {bg:'#e8f7f3',text:'#04b087',dot:'#04b087'},
    {bg:'#eff6ff',text:'#3b82f6',dot:'#3b82f6'},
    {bg:'#fef3c7',text:'#d97706',dot:'#d97706'},
    {bg:'#fce7f3',text:'#ec4899',dot:'#ec4899'},
    {bg:'#f3e8ff',text:'#9333ea',dot:'#9333ea'},
    {bg:'#fee2e2',text:'#ef4444',dot:'#ef4444'},
];

// ================= APPLICATION STATE =================
// Store all dashboard data
let state = {
    students: [], filteredStudents: [], searchTerm: '',
    currentView: 'students', lastNavView: 'students',
    selectedStudentUid: null, overallDomainFilter: 'All', overallGroupFilter: 'All',
    chartInstance: null, sortConfig: { key: 'avgMastery', direction: 'desc' },
    selectedForGroup: [], groups: [], studentsGroupFilter: 'All', lastUpdated: null
};

// ================= HELPER FUNCTIONS =================
const calcAvg = (levels) => levels?.length ? levels.reduce((a,c) => a + c.mastery, 0) / levels.length : 0;
const getDomain = (email) => email ? (email.split('@').length > 1 ? `@${email.split('@')[1]}` : '') : '';
const getMasteryColor = (v) => v >= .7 ? 'bg-brand' : v >= .5 ? 'bg-accent-orange' : 'bg-accent-red';
const getMasteryTextColor = (v) => v >= .7 ? 'text-brand' : v >= .5 ? 'text-accent-orange' : 'text-accent-red';
const getGroupColor = (id) => GROUP_COLORS[state.groups.findIndex(g => g.id === id) % GROUP_COLORS.length] || GROUP_COLORS[0];
const getStudentGroups = (uid) => state.groups.filter(g => g.studentUids.includes(uid));

// Return sorting icon for table header
function getSortIcon(key) {
    // Default sort icon
    if (state.sortConfig.key !== key) return '<i data-lucide="chevrons-up-down" class="w-4 h-4 text-slate-300"></i>';
    // Ascending icon
    return state.sortConfig.direction === 'asc'
        ? '<i data-lucide="chevron-up" class="w-4 h-4 text-brand"></i>'
        : '<i data-lucide="chevron-down" class="w-4 h-4 text-brand"></i>';
}

// Generate sync status text
function getSyncUI() {
    // Default message and color
    let timeText = 'Never synced';
    let colorClass = 'text-slate-400';

    // Check if data exists
    if (state.lastUpdated) {
        // Convert to relative time
        const diffMs = Date.now() - state.lastUpdated;
        const hours = diffMs / (1000 * 60 * 60);
        const days = hours / 24;

        // Format time text
        if (diffMs < 60000) timeText = 'Updated just now';
        else if (hours < 1) timeText = `Updated ${Math.floor(diffMs / 60000)} mins ago`;
        else if (hours < 24) timeText = `Updated ${Math.floor(hours)} hrs ago`;
        else timeText = `Updated ${Math.floor(days)} days ago`;

        // Warning colors
        if (days >= 1 && days <= 3) colorClass = 'text-accent-orange font-semibold flex items-center gap-1';
        else if (days > 3) colorClass = 'text-accent-red font-bold flex items-center gap-1';
        else colorClass = 'text-[#6b8994] flex items-center gap-1';
    }

    // Show warning icon if outdated
    const warningIcon = timeText.includes('days') ? `<i data-lucide="clock" class="w-3.5 h-3.5"></i> ` : '';

    // Return sync UI HTML
    return `
        <div class="flex items-center gap-3">
            <span class="text-xs ${colorClass}">${warningIcon}${timeText}</span>
            <button onclick="syncData(this)" class="bg-white border border-slate-200 text-[#113540] px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                <i data-lucide="refresh-cw" class="w-4 h-4 text-[#6b8994]"></i> <span class="hidden sm:inline">Sync</span>
            </button>
        </div>
    `;
}

// ================= MOBILE SIDEBAR =================
// Open or close sidebar
window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const isClosed = sidebar.classList.contains('-translate-x-full');

    // Open sidebar
    if (isClosed) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
        // Close sidebar
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
};

// ================= INITIALIZATION =================
// Start dashboard
async function init() {
    // Search input listener
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Load saved groups from localStorage
    try {
        const savedGroups = localStorage.getItem('mastery_groups');
        if (savedGroups) state.groups = JSON.parse(savedGroups);
    } catch(e) {}

    // Render group sidebar
    renderSidebarGroups();

    // Load cached student data
    const cachedData = localStorage.getItem('mastery_data_cache');
    // Load cache time
    const cachedTime = localStorage.getItem('mastery_data_time');

    // Use cache if available
    if (cachedData && cachedTime) {
        state.lastUpdated = parseInt(cachedTime, 10);
        processRawData(JSON.parse(cachedData));
        showView('students');
    } else {
        // Fetch fresh data
        await loadDataFromAPI();
    }
    // Render Lucide icons
    if (window.lucide) lucide.createIcons();
}

// ================= SYNC DATA FUNCTION =================
// Sync latest student data from API
window.syncData = async (btn) => {
    // Save original button HTML
    const origHTML = btn.innerHTML;
    // Show loading animation
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 text-brand animate-spin"></i> <span class="hidden sm:inline">Syncing...</span>`;

    btn.disabled = true; // Disable button while syncing
    await loadDataFromAPI(); // Fetch latest data

     // Restore button if still exists
    if (document.body.contains(btn)) {
        btn.innerHTML = origHTML;
        btn.disabled = false;
    }
};

// ================= LOAD DATA FROM API =================
// Fetch student mastery data
async function loadDataFromAPI() {
    try {
        const response = await fetch('https://xyz123lzy-sej-quiz-model.hf.space/allStudent/quiz/mastery');
        if (!response.ok) throw new Error('API Response not OK');

        // Convert response to JSON
        const data = await response.json();
        // Extract student data
        const students = data.student_masteries;

        // Save latest update time
        state.lastUpdated = Date.now();
         // Cache student data and timestamp locally
        localStorage.setItem('mastery_data_cache', JSON.stringify(students));
        localStorage.setItem('mastery_data_time', state.lastUpdated.toString());

        // Process student data
        processRawData(students);

        // Refresh current page
        showView(state.currentView, state.selectedStudentUid);
        showToast('Student data successfully synced.');
    } catch(error) {
        showToast('Failed to fetch from API. Using local cache.');
    }
}

// ================= PROCESS RAW DATA =================
// Convert raw API data into dashboard format
function processRawData(rawDataArray) {
    // Add average mastery to each student
    state.students = rawDataArray.map(s => ({ ...s, avgMastery: calcAvg(s.mastery_levels) }));
    // Sort students
    sortInternalData();
    // Apply search/group filters
    applyFilters();
}

// ================= SAVE GROUPS =================
// Save groups into local storage
function saveGroups() {
    try { localStorage.setItem('mastery_groups', JSON.stringify(state.groups)); } catch(e) {}
}

// ================= SEARCH FUNCTION =================
function handleSearch(e) {
    // Save lowercase search term
    state.searchTerm = e.target.value.toLowerCase();
    applyFilters();

    // Re-render current view
    if (state.currentView === 'students') renderAllStudentsView();
    else if (state.currentView === 'atrisk') renderAtRiskView();
    renderSidebarList();
}

// ================= FILTER FUNCTION =================
// Apply search and group filters
function applyFilters() {
    // Filter by email search
    let base = state.students.filter(s => s.user_email.toLowerCase().includes(state.searchTerm));

    // Filter by selected group
    if (state.studentsGroupFilter !== 'All') {
        const grp = state.groups.find(g => g.id === state.studentsGroupFilter);
        // Keep only students in selected group
        if (grp) base = base.filter(s => grp.studentUids.includes(s.user_uid));
    }
    // Save filtered result
    state.filteredStudents = base;
}

// ================= SORT FUNCTION =================
function sortInternalData() {
    const { key, direction: dir } = state.sortConfig;
    state.students.sort((a,b) => {
        let va = key === 'email' ? a.user_email.toLowerCase() : key === 'domain' ? getDomain(a.user_email).toLowerCase() : a.avgMastery;
        let vb = key === 'email' ? b.user_email.toLowerCase() : key === 'domain' ? getDomain(b.user_email).toLowerCase() : b.avgMastery;

        // Ascending and descending logic
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
    });
}

// ================= HANDLE TABLE SORT =================
// Sort when table header clicked
window.handleSort = (key) => {
    // Toggle sort direction
    state.sortConfig.direction = (state.sortConfig.key === key && state.sortConfig.direction === 'desc') ? 'asc' : 'desc';
    // Save selected sort key
    state.sortConfig.key = key;

    sortInternalData(); applyFilters(); renderAllStudentsView();
    if (window.lucide) lucide.createIcons();
};

// ================= VIEW SWITCHING =================
function showView(viewName, uid = null) {
    // Save last non-detail page
    if (viewName !== 'studentDetail') state.lastNavView = viewName;
    state.currentView = viewName;

    // Auto-close sidebar on mobile after clicking a link
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar.classList.contains('-translate-x-full')) toggleSidebar();
    }

    // Update navigation menu styles
    ['overall','students','atrisk'].forEach(nav => {
        const el = document.getElementById(`nav-${nav}`);
        if (!el) return;
         // Navigation icon
        const icon = el.querySelector('i, svg');

        // Active navigation style
        if (nav === viewName || (viewName === 'studentDetail' && nav === state.lastNavView)) {
            el.className = "flex items-center gap-3 px-4 py-2.5 rounded-lg bg-brand text-white font-medium transition-colors shadow-sm";
            if (icon) icon.classList.remove('text-[#6b8994]');
        } else {
            el.className = "flex items-center gap-3 px-4 py-2.5 rounded-lg text-[#113540] hover:bg-slate-50 font-medium transition-colors";
            if (icon) icon.classList.add('text-[#6b8994]');
        }
    });

     // Clear main content
    document.getElementById('mainContent').innerHTML = '';
    // Render selected page
    switch(viewName) {
        case 'students': applyFilters(); renderAllStudentsView(); state.selectedStudentUid = null; break;
        case 'atrisk': applyFilters(); renderAtRiskView(); state.selectedStudentUid = null; break;
        case 'studentDetail': state.selectedStudentUid = uid; renderStudentDetailView(uid); break;
        case 'overall': state.selectedStudentUid = null; renderOverallPerformanceView(); break;
    }
    renderSidebarList();
    if (window.lucide) lucide.createIcons();
}

// ================= SIDEBAR GROUP LIST =================
function renderSidebarGroups() {
    // Sidebar container
    const container = document.getElementById('sidebarGroupsList');

    // Show empty message if no groups
    container.innerHTML = state.groups.length === 0 ? `<p class="text-xs text-slate-400 px-1 py-1">No groups yet</p>` : '';

    // Loop through groups
    state.groups.forEach(g => {
         // Get group color
        const col = getGroupColor(g.id);
         // Create group item
        const div = document.createElement('div');
        div.className = `flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${state.studentsGroupFilter === g.id ? 'bg-slate-50' : ''}`;
        div.innerHTML = `
            <div class="flex items-center gap-2 flex-1 min-w-0" onclick="filterByGroup('${g.id}')">
                <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${col.dot}"></span>
                <span class="text-xs font-medium text-[#113540] truncate">${g.name}</span>
            </div>
            <div class="flex gap-1 flex-shrink-0">
                <button onclick="editGroupName('${g.id}')" class="p-1 rounded text-slate-400 hover:text-slate-600"><i data-lucide="pencil" class="w-3 h-3"></i></button>
                <button onclick="deleteGroup('${g.id}')" class="p-1 rounded text-slate-400 hover:text-red-500"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
            </div>
        `;
        container.appendChild(div);
    });
    if (window.lucide) lucide.createIcons();
}

// ================= FILTER STUDENTS BY GROUP =================
window.filterByGroup = (groupId) => {
    // Filter student list based on selected group
    state.studentsGroupFilter = state.studentsGroupFilter === groupId ? 'All' : groupId;
    applyFilters(); showView('students'); renderSidebarGroups();
};

// ================= SIDEBAR STUDENT LIST =================
function renderSidebarList() {
    // Sidebar container
    const container = document.getElementById('sidebarStudentList');
    // Clear old content
    container.innerHTML = '';
     // Loop through filtered students
    state.filteredStudents.forEach(s => {

        // Check active student
        const isActive = s.user_uid === state.selectedStudentUid;

        // Create student item
        const item = document.createElement('div');

         // Student card style
        item.className = `p-3 rounded-lg cursor-pointer mb-1 transition-colors ${isActive ? 'bg-[#f0f9f6] border border-brand/20' : 'hover:bg-slate-50 border border-transparent'}`;
        item.onclick = () => showView('studentDetail', s.user_uid);
        item.innerHTML = `
            <div class="text-sm font-medium ${isActive ? 'text-brand' : 'text-[#113540]'} truncate">${s.user_email}</div>
            <div class="text-xs text-[#6b8994] font-mono mt-0.5 truncate">${s.user_uid.substring(0,15)}...</div>
        `;
        container.appendChild(item);
    });
}

// ================= GROUP MANAGEMENT FUNCTIONS =================
// Global Modals and Utility Functions
// popup window that appears on top of the page
window.showModal = (title, contentHTML) => {
    let modal = document.getElementById('customModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'customModal';
        modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm opacity-0 transition-opacity duration-300 hidden p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform scale-95 transition-transform duration-300" id="customModalContent">
                <div class="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 class="text-lg md:text-xl font-bold text-[#113540]" id="customModalTitle"></h3>
                    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div class="p-4 md:p-6" id="customModalBody"></div>
            </div>`;
        document.body.appendChild(modal);
    }
    document.getElementById('customModalTitle').innerText = title;
    document.getElementById('customModalBody').innerHTML = contentHTML;
    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    document.getElementById('customModalContent').classList.remove('scale-95');
    document.getElementById('customModalContent').classList.add('scale-100');
    if (window.lucide) lucide.createIcons();
};

window.closeModal = () => {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.classList.add('opacity-0');
        document.getElementById('customModalContent').classList.remove('scale-100');
        document.getElementById('customModalContent').classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};

// Temporary notification message
window.showToast = (msg) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 left-6 md:left-auto bg-[#113540] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium z-[70] flex items-center justify-between gap-3 transition-all';
    toast.innerHTML = `<div class="flex items-center gap-3"><i data-lucide="check-circle" class="w-5 h-5 text-brand flex-shrink-0"></i> <span>${msg}</span></div>`;
    document.body.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(8px)'; setTimeout(() => toast.remove(), 300); }, 3000);
};

window.copyToClipboard = (text, btn) => {
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Copied!`;
        if (window.lucide) lucide.createIcons();
        setTimeout(() => { btn.innerHTML = orig; if (window.lucide) lucide.createIcons(); }, 2000);
    });
};

window.onload = init;