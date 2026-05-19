// Show all students table
function renderAllStudentsView() {
    // Get the main container
    const container = document.getElementById('mainContent');
    // Get currently selected group
    const activeGroup = state.groups.find(g => g.id === state.studentsGroupFilter);

    // Create filter buttons for groups
    let groupChips = `<span class="group-chip ${state.studentsGroupFilter === 'All' ? 'active' : ''}" style="background:${state.studentsGroupFilter==='All'?'#113540':'#f4f3ed'};color:${state.studentsGroupFilter==='All'?'#fff':'#6b8994'};" onclick="setStudentsGroupFilter('All')"><i data-lucide="users" class="w-3 h-3"></i> All</span>`;
    // Create filter buttons for each group
    state.groups.forEach(g => {
        const col = getGroupColor(g.id);
        const isAct = state.studentsGroupFilter === g.id;
        groupChips += `<span class="group-chip ${isAct ? 'active' : ''}" style="background:${isAct ? col.dot : col.bg};color:${isAct ? '#fff' : col.text};" onclick="setStudentsGroupFilter('${g.id}')"><span class="group-chip-dot" style="background:${isAct?'rgba(255,255,255,.7)':col.dot}"></span>${g.name}</span>`;
    });

    let html = `
        <div class="mb-6 fade-in">
            <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                    <h2 class="text-2xl md:text-3xl font-bold text-[#113540] tracking-tight flex items-center gap-3">
                        <i data-lucide="users" class="w-6 h-6 md:w-8 md:h-8 text-brand"></i>
                        ${activeGroup ? activeGroup.name : 'All Students'}
                    </h2>
                    <p class="text-sm text-[#6b8994] mt-1">${state.filteredStudents.length} student(s) shown</p>
                </div>
                <div class="flex gap-4 flex-wrap items-center">
                    ${getSyncUI()}
                    <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>
                    <button onclick="openCreateGroupModal()" class="w-full sm:w-auto justify-center bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2">
                        <i data-lucide="folder-plus" class="w-4 h-4"></i> Create Group
                    </button>
                </div>
            </div>
            ${state.groups.length > 0 ? `<div class="flex flex-wrap gap-2 mb-4">${groupChips}</div>` : ''}
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm fade-in">
            <div class="overflow-x-auto table-container">
                <table class="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr class="bg-[#fdfcf9] border-b border-slate-200 text-sm font-semibold text-[#6b8994] select-none">
                            <th class="p-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors group" onclick="handleSort('email')">
                                <div class="flex items-center gap-1 group-hover:text-[#113540]">Email ${getSortIcon('email')}</div>
                            </th>
                            <th class="p-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors group" onclick="handleSort('domain')">
                                <div class="flex items-center gap-1 group-hover:text-[#113540]">Organisation ${getSortIcon('domain')}</div>
                            </th>
                            <th class="p-4 font-medium">Groups</th>
                            <th class="p-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors group" onclick="handleSort('avgMastery')">
                                <div class="flex items-center gap-1 group-hover:text-[#113540]">Avg Mastery ${getSortIcon('avgMastery')}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
    `;

    // Show message if no students
    if (state.filteredStudents.length === 0) html += `<tr><td colspan="4" class="p-8 text-center text-slate-500">No students found. Try Syncing data.</td></tr>`;

     // Loop through all filtered students
    state.filteredStudents.forEach(s => {
        // Convert mastery score into %
        const pct = (s.avgMastery * 100).toFixed(1);
        // Check if student is at risk
        const isAtRisk = s.avgMastery < 0.5;
        // Get all groups for this student
        const groupTags = getStudentGroups(s.user_uid).map(g => `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style="background:${getGroupColor(g.id).bg};color:${getGroupColor(g.id).text}">${g.name}</span>`).join('');

        html += `
            <tr class="hover:bg-slate-50 cursor-pointer transition-colors group ${isAtRisk ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-transparent'}" onclick="showView('studentDetail','${s.user_uid}')">
                <td class="p-4 align-top">
                    <div class="flex items-center flex-wrap gap-1">
                        <div class="font-medium text-[#113540] group-hover:text-brand transition-colors">${s.user_email}</div>
                        ${isAtRisk ? `<span class="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-red-500 bg-red-50 border border-red-100 text-[10px] font-bold uppercase"><i data-lucide="alert-triangle" class="w-3 h-3"></i> At Risk</span>` : ''}
                    </div>
                    <div class="text-xs text-[#6b8994] font-mono mt-1">${s.user_uid.substring(0,20)}...</div>
                </td>
                <td class="p-4 align-top"><span class="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">${getDomain(s.user_email)}</span></td>
                <td class="p-4 align-top"><div class="flex flex-wrap gap-1">${groupTags || '<span class="text-xs text-slate-300">—</span>'}</div></td>
                <td class="p-4 align-top">
                    <div class="flex items-center gap-3">
                        <div class="w-20 md:w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ${getMasteryColor(s.avgMastery)} rounded-full" style="width:${pct}%"></div></div>
                        <span class="font-mono font-bold text-sm text-[#113540]">${pct}%</span>
                    </div>
                </td>
            </tr>`;
    });

    container.innerHTML = html + `</tbody></table></div></div>`;
}

// Change selected student group filter
window.setStudentsGroupFilter = (gid) => { state.studentsGroupFilter = gid; applyFilters(); renderAllStudentsView(); };

// =============== Student Detail View ===============
function renderStudentDetailView(uid) {
    // Find student by uid
    const s = state.students.find(x => x.user_uid === uid);
    // Stop if student not found
    if (!s) return;

     // Sort chapters by mastery score (highest first)
    const sorted = [...s.mastery_levels].sort((a,b) => b.mastery - a.mastery);
    const strongest = sorted.slice(0, Math.ceil(sorted.length / 2));

   // Bottom half = weak chapters
    const needsFocus = sorted.slice(Math.ceil(sorted.length / 2)).reverse();

    let html = `
        <div class="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between md:items-end gap-4 fade-in">
            <div>
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded tracking-wider">STUDENT</span>
                    ${getStudentGroups(uid).map(g => `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style="background:${getGroupColor(g.id).bg};color:${getGroupColor(g.id).text}">${g.name}</span>`).join('')}
                </div>
                <h2 class="text-2xl md:text-3xl font-mono font-bold text-[#113540] tracking-tight break-all">${s.user_email}</h2>
            </div>
            <div class="flex flex-wrap gap-6 md:gap-12 md:text-right items-center">
                ${getSyncUI()}
                <div class="h-10 w-px bg-slate-200 hidden md:block"></div>
                <div>
                    <p class="text-xs text-[#6b8994] font-medium tracking-widest uppercase mb-1">Avg Mastery</p>
                    <p class="text-3xl font-bold ${getMasteryTextColor(s.avgMastery)}">${(s.avgMastery * 100).toFixed(1)}%</p>
                </div>
                <div>
                    <p class="text-xs text-[#6b8994] font-medium tracking-widest uppercase mb-1">Interactions</p>
                    <p class="text-3xl font-bold text-[#113540]">${s.total_interactions}</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 fade-in">
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 class="flex items-center gap-2 font-semibold text-brand mb-4"><i data-lucide="target" class="w-5 h-5"></i> Strongest Areas</h3>
                <div class="space-y-3">${strongest.map(ch => `<div class="flex justify-between text-sm font-medium"><span class="text-[#113540]">ch${ch.chapter}</span><span class="text-[#113540] font-mono">${(ch.mastery*100).toFixed(1)}%</span></div>`).join('')}</div>
            </div>
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 class="flex items-center gap-2 font-semibold text-red-500 mb-4"><i data-lucide="activity" class="w-5 h-5"></i> Needs Focus</h3>
                <div class="space-y-3">${needsFocus.map(ch => `<div class="flex justify-between text-sm font-medium"><span class="text-[#113540]">ch${ch.chapter}</span><span class="text-red-500 font-mono">${(ch.mastery*100).toFixed(1)}%</span></div>`).join('')}</div>
            </div>
        </div>
        
        <h3 class="text-xl font-bold text-[#113540] mb-4">Detailed Mastery Breakdown</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 fade-in">
    `;

    s.mastery_levels.forEach(lv => {
        const pct = (lv.mastery * 100).toFixed(1);
        html += `
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                <div class="flex justify-between items-start mb-2">
                    <span class="font-bold text-lg text-[#113540]">ch${lv.chapter}</span>
                    <div class="w-12 h-4 rounded ${lv.mastery < .5 ? 'bg-red-400' : lv.mastery < .7 ? 'bg-amber-400' : 'bg-brand'}"></div>
                </div>
                <div>
                    <div class="flex justify-between items-end mb-2">
                        <span class="text-[10px] font-bold text-[#6b8994] tracking-widest uppercase">Mastery</span>
                        <span class="font-mono font-bold text-xl ${getMasteryTextColor(lv.mastery)}">${pct}%</span>
                    </div>
                    <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ${getMasteryColor(lv.mastery)} rounded-full" style="width:${pct}%"></div></div>
                </div>
            </div>`;
    });
    document.getElementById('mainContent').innerHTML = html + `</div>`;
}

// ============== Overall Performance View ==============
// Change domain filter
window.handleDomainFilterChange = (v) => { state.overallDomainFilter = v; renderOverallPerformanceView(); };
// Change group filter
window.handleOverallGroupChange = (v) => { state.overallGroupFilter = v; renderOverallPerformanceView(); };

function renderOverallPerformanceView() {
    // Filter students by selected group
    let base = state.overallGroupFilter !== 'All' ? state.students.filter(s => state.groups.find(x => x.id === state.overallGroupFilter)?.studentUids.includes(s.user_uid)) : state.students;

    // Filter students by selected email domain
    const filtered = state.overallDomainFilter === 'All' ? base : base.filter(s => getDomain(s.user_email) === state.overallDomainFilter);

    // Store chapter statistics
    const chapterStats = {};

    // Calculate chapter averages
    filtered.forEach(s => s.mastery_levels.forEach(l => {
        // Create chapter object if missing
        if (!chapterStats[l.chapter]) chapterStats[l.chapter] = { sum:0, count:0 };
        chapterStats[l.chapter].sum += l.mastery; chapterStats[l.chapter].count++;
    }));

    // Convert chapter stats into averages
    const chapterAverages = Object.keys(chapterStats).map(ch => ({ chapter: ch, avg: chapterStats[ch].sum / chapterStats[ch].count })).sort((a,b) => parseInt(a.chapter) - parseInt(b.chapter));
    // Calculate overall mastery average
    const overallAvg = filtered.length ? filtered.reduce((a,s) => a + s.avgMastery, 0) / filtered.length : 0;

    let html = `
        <div class="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between md:items-end gap-4 fade-in">
            <div>
                <h2 class="text-2xl md:text-3xl font-bold text-[#113540] tracking-tight">Overall Performance</h2>
                <p class="text-sm text-[#6b8994] mt-1">Average mastery across selected students.</p>
            </div>
            <div class="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                ${getSyncUI()}
                <div class="h-6 w-px bg-slate-200 hidden md:block"></div>
                <div class="flex flex-wrap gap-2 w-full md:w-auto">
                    ${state.groups.length > 0 ? `<select onchange="handleOverallGroupChange(this.value)" class="py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-[#113540] shadow-sm"><option value="All" ${state.overallGroupFilter==='All'?'selected':''}>All Groups</option>${state.groups.map(g => `<option value="${g.id}" ${state.overallGroupFilter===g.id?'selected':''}>${g.name}</option>`).join('')}</select>` : ''}
                    <select onchange="handleDomainFilterChange(this.value)" class="py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-[#113540] shadow-sm flex-1 md:flex-none"><option value="All">All Domains</option>${Array.from(new Set(state.students.map(s => getDomain(s.user_email)).filter(Boolean))).map(d => `<option value="${d}" ${d===state.overallDomainFilter?'selected':''}>${d}</option>`).join('')}</select>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 fade-in">
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div class="flex items-center gap-2 mb-2 text-[#6b8994]"><i data-lucide="users" class="w-5 h-5"></i><p class="text-sm font-medium uppercase">Total Students</p></div><p class="text-4xl font-bold text-[#113540]">${filtered.length}</p></div>
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div class="flex items-center gap-2 mb-2 text-[#6b8994]"><i data-lucide="trending-up" class="w-5 h-5"></i><p class="text-sm font-medium uppercase">Avg Mastery</p></div><p class="text-4xl font-bold ${getMasteryTextColor(overallAvg)}">${(overallAvg*100).toFixed(1)}%</p></div>
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div class="flex items-center gap-2 mb-2 text-[#6b8994]"><i data-lucide="alert-triangle" class="w-5 h-5"></i><p class="text-sm font-medium uppercase">At Risk</p></div><p class="text-4xl font-bold ${filtered.filter(s => s.avgMastery < 0.5).length > 0 ? 'text-red-500' : 'text-brand'}">${filtered.filter(s => s.avgMastery < 0.5).length}</p></div>
        </div>

        <h3 class="text-xl font-bold text-[#113540] mb-4">Average Mastery per Chapter</h3>
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm fade-in w-full overflow-x-auto">
    `;

    if (chapterAverages.length === 0) {
        document.getElementById('mainContent').innerHTML = html + `<div class="p-8 text-center text-slate-500">No data for this selection.</div></div>`;
    } else {
        document.getElementById('mainContent').innerHTML = html + `<div class="w-full h-80 min-w-[500px]"><canvas id="overallChart"></canvas></div></div>`;
        if (state.chartInstance) state.chartInstance.destroy();
        state.chartInstance = new Chart(document.getElementById('overallChart'), {
            type: 'bar',
            data: {
                labels: chapterAverages.map(c => `Chapter ${c.chapter}`),
                datasets: [{ label: 'Average Mastery (%)', data: chapterAverages.map(c => (c.avg * 100).toFixed(1)), backgroundColor: chapterAverages.map(c => c.avg >= .7 ? '#04b087' : c.avg >= .5 ? '#f59e0b' : '#ef4444'), borderRadius: 6 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero:true, max:100 } }, plugins: { legend: { display:false } } }
        });
    }
}

// ======== At-Risk View ========
function renderAtRiskView() {
    // Get students below 50%
    const atRisk = state.filteredStudents.filter(s => s.avgMastery < 0.5);
    let html = `
        <div class="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4 fade-in">
            <div>
                <h2 class="text-2xl md:text-3xl font-bold text-[#113540] tracking-tight flex items-center gap-3">
                    <i data-lucide="alert-circle" class="w-6 h-6 md:w-8 md:h-8 text-red-500"></i> At-Risk Students
                </h2>
                <p class="text-sm text-[#6b8994] mt-1">Students with average mastery below 50%.</p>
            </div>
            <div class="flex gap-4 items-center flex-wrap">
                ${getSyncUI()}
                <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <div class="flex gap-2 w-full sm:w-auto">
                    <button onclick="handleAtRiskCreateGroup()" class="flex-1 sm:flex-none justify-center bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2"><i data-lucide="folder-plus" class="w-4 h-4"></i> Save Group</button>
                    <button onclick="handleContactSelected()" class="flex-1 sm:flex-none justify-center bg-white border border-slate-200 text-[#113540] px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"><i data-lucide="mail" class="w-4 h-4 text-[#6b8994]"></i> Contact</button>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm fade-in">
            <div class="overflow-x-auto table-container">
                <table class="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr class="bg-[#fdfcf9] border-b border-slate-200 text-sm font-semibold text-[#6b8994]">
                            <th class="p-4 w-12 text-center"><input type="checkbox" onchange="toggleAllSelection(this.checked)" class="w-4 h-4 rounded cursor-pointer text-brand" ${atRisk.length > 0 && state.selectedForGroup.length === atRisk.length ? 'checked' : ''}></th>
                            <th class="p-4 font-medium">Student</th>
                            <th class="p-4 font-medium">Organisation</th>
                            <th class="p-4 font-medium">Avg Mastery</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
    `;

    // Show message if no at-risk students
    if (atRisk.length === 0) html += `<tr><td colspan="4" class="p-8 text-center text-slate-500">No at-risk students found. Great job!</td></tr>`;

    atRisk.forEach(s => {
        const isChecked = state.selectedForGroup.includes(s.user_uid);
        html += `
            <tr class="hover:bg-slate-50 transition-colors group ${isChecked ? 'bg-[#f0f9f6]' : ''}">
                <td class="p-4 text-center align-middle"><input type="checkbox" onchange="toggleStudentSelection('${s.user_uid}')" class="w-4 h-4 rounded cursor-pointer text-brand" ${isChecked ? 'checked' : ''}></td>
                <td class="p-4 align-top cursor-pointer" onclick="showView('studentDetail','${s.user_uid}')">
                    <div class="font-medium text-[#113540] group-hover:text-brand">${s.user_email}</div>
                    <div class="text-xs text-[#6b8994] font-mono mt-1">${s.user_uid.substring(0,25)}...</div>
                </td>
                <td class="p-4 align-top"><span class="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">${getDomain(s.user_email)}</span></td>
                <td class="p-4 align-top">
                    <div class="flex items-center gap-3">
                        <div class="w-20 md:w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ${getMasteryColor(s.avgMastery)} rounded-full" style="width:${(s.avgMastery*100).toFixed(1)}%"></div></div>
                        <span class="font-mono font-bold text-sm text-[#113540]">${(s.avgMastery*100).toFixed(1)}%</span>
                    </div>
                </td>
            </tr>`;
    });
    document.getElementById('mainContent').innerHTML = html + `</tbody></table></div></div>`;
}

// Select or unselect all at-risk students
window.toggleStudentSelection = (uid) => { state.selectedForGroup.includes(uid) ? state.selectedForGroup.splice(state.selectedForGroup.indexOf(uid), 1) : state.selectedForGroup.push(uid); renderAtRiskView(); };
window.toggleAllSelection = (c) => { state.selectedForGroup = c ? state.filteredStudents.filter(s => s.avgMastery < 0.5).map(s => s.user_uid) : []; renderAtRiskView(); };

// ============ Group Modal Logic ============
// Open popup to create a new group
window.openCreateGroupModal = () => {
     // Create checkbox list for all students
    const opts = state.students.map(s => `<label class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"><input type="checkbox" value="${s.user_uid}" class="w-4 h-4 rounded text-brand create-group-check"><div class="flex-1 min-w-0"><div class="text-sm font-medium text-[#113540] truncate">${s.user_email}</div></div><span class="text-xs font-mono text-[#6b8994]">${(s.avgMastery*100).toFixed(0)}%</span></label>`).join('');
     // Show create group popup
    showModal('Create Group', `<div><input id="newGroupName" type="text" placeholder="Group Name..." class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-brand focus:outline-none mb-4"><div class="max-h-52 overflow-y-auto border border-slate-100 rounded-lg p-1">${opts}</div><div class="flex justify-end mt-4"><button onclick="confirmCreateGroup()" class="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium">Save Group</button></div></div>`);
};

// Save new group
window.confirmCreateGroup = () => {
    const name = document.getElementById('newGroupName')?.value.trim();
    const checked = [...document.querySelectorAll('.create-group-check:checked')].map(cb => cb.value);
    if (!name || checked.length === 0) return showToast('Name and students required.');
    // Add new group
    state.groups.push({ id: 'grp_'+Date.now(), name, studentUids: checked }); saveGroups(); closeModal(); filterByGroup('All'); showToast('Group saved.');
};

// Open popup to rename group
window.editGroupName = (gid) => { showModal('Rename Group', `<input id="editGroupName" type="text" value="${state.groups.find(x=>x.id===gid).name}" class="w-full px-3 py-2.5 border border-slate-200 rounded-lg mb-4 text-sm"><button onclick="confirmRenameGroup('${gid}')" class="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium">Save</button>`); };
// Save new group name
window.confirmRenameGroup = (gid) => { const n = document.getElementById('editGroupName')?.value.trim(); if(n) { state.groups.find(x=>x.id===gid).name = n; saveGroups(); closeModal(); filterByGroup('All'); showToast('Renamed.'); }};

// Open delete confirmation popup
window.deleteGroup = (gid) => { showModal('Delete Group', `<p class="mb-4 text-sm">Are you sure?</p><button onclick="confirmDeleteGroup('${gid}')" class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">Delete</button>`); };
// Delete group
window.confirmDeleteGroup = (gid) => { state.groups = state.groups.filter(g => g.id !== gid); saveGroups(); closeModal(); filterByGroup('All'); showToast('Deleted.'); };

// Save selected at-risk students into a group
window.handleAtRiskCreateGroup = () => {
    window._pendingAtRiskUids = state.selectedForGroup.length > 0 ? state.selectedForGroup : state.filteredStudents.filter(s => s.avgMastery < 0.5).map(s => s.user_uid);
    if (window._pendingAtRiskUids.length === 0) return showToast('No students.');
    showModal('Save At-Risk Group', `<input id="atRiskGroupName" type="text" placeholder="Group Name..." class="w-full px-3 py-2.5 border border-slate-200 rounded-lg mb-4 text-sm"><button onclick="confirmAtRiskGroup()" class="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium">Save Group</button>`);
};
// Save at-risk group
window.confirmAtRiskGroup = () => { const n = document.getElementById('atRiskGroupName')?.value.trim(); if(n) { state.groups.push({id:'grp_'+Date.now(), name:n, studentUids:window._pendingAtRiskUids}); state.selectedForGroup=[]; saveGroups(); closeModal(); filterByGroup('All'); showToast('Group saved.'); }};

// Open contact popup for selected students
// Open contact popup for selected students
window.handleContactSelected = () => {
    if (state.selectedForGroup.length === 0) return showToast('Select students first.');

    // Get full student objects for the selected ones
    const selectedStudents = state.students.filter(s => state.selectedForGroup.includes(s.user_uid));
    const emails = selectedStudents.map(s => s.user_email).join(', ');

    // Only show the AI Draft button if exactly ONE student is selected
    let aiDraftBtn = '';
    if (selectedStudents.length === 1) {
        aiDraftBtn = `<button onclick="draftAIEmail('${selectedStudents[0].user_uid}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white rounded-lg text-sm font-medium flex items-center gap-2"><i data-lucide="sparkles" class="w-4 h-4"></i> AI Draft</button>`;
    }

    showModal('Contact Students', `
        <div id="emailContainer" class="bg-slate-50 p-4 rounded border text-sm font-mono break-all mb-4 max-h-60 overflow-y-auto select-all whitespace-pre-wrap">${emails}</div>
        <div class="flex gap-2 justify-end flex-wrap">
            ${aiDraftBtn}
            <a id="openMailBtn" href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emails)}" target="_blank" class="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium">Open Mail</a>
            <button onclick="copyToClipboard(document.getElementById('emailContainer').innerText, this)" class="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium">Copy</button>
        </div>
    `);
};

// Handle the call to the Gemini API
window.draftAIEmail = async (uid) => {
    const student = state.students.find(s => s.user_uid === uid);
    if (!student) return;

    // Find their 3 weakest chapters to give Gemini some context
    const sortedChapters = [...student.mastery_levels].sort((a,b) => a.mastery - b.mastery);
    const weakAreas = sortedChapters.slice(0, 3).map(ch => ch.chapter);

    const emailContainer = document.getElementById('emailContainer');

    // Show a loading state
    emailContainer.innerHTML = '<div class="flex items-center gap-2 text-slate-500 font-sans"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Gemini is drafting your email...</div>';
    if (window.lucide) lucide.createIcons();

    try {
        const response = await fetch('https://easy-learn-be.vercel.app/draft_email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: student.user_email,
                mastery: (student.avgMastery * 100).toFixed(1),
                weak_areas: weakAreas
            })
        });

        if (!response.ok) throw new Error('API Response not OK');

        const data = await response.json();

        // Inject the generated text back into the modal
        emailContainer.innerText = data.draft_email;

        // Update the Gmail link to include the drafted body
        const mailLink = document.getElementById('openMailBtn');
        mailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(student.user_email)}&su=${encodeURIComponent("Guidance for Improving Your Course Performance")}&body=${encodeURIComponent(data.draft_email)}`;

        showToast('Draft generated successfully!');

    } catch (error) {
        emailContainer.innerHTML = '<span class="text-red-500 font-sans">Error generating email draft. Please ensure your backend is running.</span>';
        showToast('Failed to generate draft.');
    }
};