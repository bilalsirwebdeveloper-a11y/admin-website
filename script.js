// Check if admin is logged in
if (!sessionStorage.getItem('adminLoggedIn') && !window.location.pathname.includes('index.html')) {
    window.location.href = 'index.html';
}

// Global variables
let categories = [];
let groups = [];
let reports = [];
let chart = null;
let dataLoaded = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin panel loading...');
    
    // Check if Firebase is initialized
    if (typeof database === 'undefined') {
        console.error('❌ Firebase database not defined!');
        showNotification('Firebase not connected! Please check configuration.', 'error');
        return;
    }
    
    console.log('✅ Firebase connected');
    
    // Load data ONE TIME only
    loadAllData();
    
    // Setup simple refresh button
    setupRefreshButton();
});

// Load all data once
function loadAllData() {
    showLoading(true);
    
    Promise.all([
        loadCategoriesOnce(),
        loadGroupsOnce(),
        loadReportsOnce()
    ]).then(() => {
        dataLoaded = true;
        showLoading(false);
        console.log('✅ All data loaded successfully');
    }).catch(error => {
        console.error('Error loading data:', error);
        showNotification('Error loading data', 'error');
        showLoading(false);
    });
}

// Show/hide loading
function showLoading(show) {
    const loader = document.getElementById('loadingOverlay') || createLoadingOverlay();
    loader.style.display = show ? 'flex' : 'none';
}

// Create loading overlay
function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255,255,255,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-size: 18px;
        color: #333;
    `;
    overlay.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i> Loading...';
    document.body.appendChild(overlay);
    return overlay;
}

// Load categories once
function loadCategoriesOnce() {
    return database.ref('categories').once('value').then((snapshot) => {
        categories = [];
        snapshot.forEach((childSnapshot) => {
            categories.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        console.log('📂 Categories loaded:', categories.length);
        displayCategories();
        populateCategoryFilters();
        populateEditCategorySelect();
    });
}

// Load groups once - OPTIMIZED
function loadGroupsOnce() {
    return database.ref('groups').once('value').then((snapshot) => {
        groups = [];
        snapshot.forEach((childSnapshot) => {
            groups.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        console.log('📊 Groups loaded:', groups.length);
        
        // Update UI
        updateStats();
        displayRecentGroups();
        displayPendingGroups();
        displayAllGroups();
        updateCategoryCounts();
        updateChart();
        
        // Update pending count
        const pendingCount = groups.filter(g => g && g.status === 'pending').length;
        document.getElementById('pendingCount').textContent = pendingCount;
    });
}

// Load reports once
function loadReportsOnce() {
    return database.ref('reports').once('value').then((snapshot) => {
        reports = [];
        snapshot.forEach((childSnapshot) => {
            reports.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        displayReports();
        document.getElementById('reportsCount').textContent = reports.length;
        updateStats();
    });
}

// Manual refresh function
function refreshData() {
    showLoading(true);
    Promise.all([
        loadCategoriesOnce(),
        loadGroupsOnce(),
        loadReportsOnce()
    ]).then(() => {
        showLoading(false);
        showNotification('Data refreshed!', 'success');
    }).catch(error => {
        showLoading(false);
        showNotification('Error refreshing data', 'error');
    });
}

// Setup refresh button
function setupRefreshButton() {
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
    refreshBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #25D366;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        font-size: 14px;
    `;
    refreshBtn.onclick = refreshData;
    document.body.appendChild(refreshBtn);
}

// ============================================
// FIXED SHOW SECTION FUNCTION
// ============================================
function showSection(section) {
    console.log('📂 Switching to section:', section);
    
    // Update active menu
    document.querySelectorAll('.admin-sidebar-menu li').forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('onclick')?.includes("'" + section + "'")) {
            li.classList.add('active');
        }
    });

    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => {
        s.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(section + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Refresh section data if needed (without loading)
    if (section === 'pending') displayPendingGroups();
    if (section === 'allgroups') displayAllGroups();
    if (section === 'categories') displayCategories();
    if (section === 'reports') displayReports();
    if (section === 'dashboard') {
        updateStats();
        updateChart();
    }
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

// Update dashboard stats
function updateStats() {
    const totalGroups = groups.length;
    const pendingGroups = groups.filter(g => g && g.status === 'pending').length;
    const approvedGroups = groups.filter(g => g && g.status === 'approved').length;
    const featuredGroups = groups.filter(g => g && g.featured === true).length;
    const totalViews = groups.reduce((sum, g) => sum + (g.views || 0), 0);
    
    document.getElementById('totalGroups').textContent = totalGroups;
    document.getElementById('pendingGroups').textContent = pendingGroups;
    document.getElementById('approvedGroups').textContent = approvedGroups;
    document.getElementById('featuredGroups').textContent = featuredGroups;
    document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    document.getElementById('pendingCount').textContent = pendingGroups;
    document.getElementById('totalReports').textContent = reports.length;
}

// Display recent groups
function displayRecentGroups() {
    const tbody = document.getElementById('recentGroupsBody');
    if (!tbody) return;
    
    const recent = [...groups].filter(g => g).sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }).slice(0, 5);
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No groups found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    recent.forEach(group => {
        const row = tbody.insertRow();
        const date = group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A';
        
        row.innerHTML = `
            <td>${group.name || 'Unnamed'}</td>
            <td>${group.category || 'N/A'}</td>
            <td><span class="status-badge status-${group.status || 'pending'}">${group.status || 'pending'}</span></td>
            <td>${date}</td>
            <td>
                <button class="btn-edit" onclick="editGroup('${group.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteGroup('${group.id}')">Delete</button>
            </td>
        `;
    });
}

// ============================================
// PENDING GROUPS FUNCTIONS
// ============================================

// Display pending groups
function displayPendingGroups() {
    const tbody = document.getElementById('pendingGroupsBody');
    if (!tbody) return;
    
    const pending = groups.filter(g => g && g.status === 'pending');
    
    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">⏳ No pending groups</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    pending.forEach(group => {
        const row = tbody.insertRow();
        const date = group.createdAt ? new Date(group.createdAt).toLocaleString() : 'N/A';
        
        row.innerHTML = `
            <td><strong>${group.name || 'Unnamed'}</strong></td>
            <td>${group.category || 'N/A'}</td>
            <td><a href="${group.link || '#'}" target="_blank">View Link</a></td>
            <td>${date}</td>
            <td>
                <button class="btn-approve" onclick="approveGroup('${group.id}')">✅ Approve</button>
                <button class="btn-reject" onclick="rejectGroup('${group.id}')">❌ Reject</button>
                <button class="btn-edit" onclick="editGroup('${group.id}')">✏️ Edit</button>
            </td>
        `;
    });
}

// Force refresh
function forceRefreshPending() {
    refreshData();
}

// Check Firebase directly
function checkFirebaseDirectly() {
    database.ref('groups').orderByChild('status').equalTo('pending').once('value', (snapshot) => {
        let msg = "🔥 PENDING GROUPS IN FIREBASE:\n\n";
        let count = 0;
        
        snapshot.forEach(child => {
            const g = child.val();
            msg += `📌 ${g.name || 'Unnamed'} (${g.category || 'No Category'})\n`;
            msg += `🔗 ${g.link || 'No Link'}\n\n`;
            count++;
        });
        
        if (count === 0) {
            alert("❌ No pending groups in Firebase");
        } else {
            alert(msg + `Total: ${count} groups`);
        }
    });
}

// Approve group
function approveGroup(id) {
    if (confirm('✅ Approve this group?')) {
        database.ref('groups/' + id).update({ status: 'approved' })
            .then(() => {
                showNotification('Group approved!', 'success');
                refreshData();
            })
            .catch(error => showNotification('Error: ' + error.message, 'error'));
    }
}

// Reject group
function rejectGroup(id) {
    if (confirm('❌ Reject this group?')) {
        database.ref('groups/' + id).update({ status: 'rejected' })
            .then(() => {
                showNotification('Group rejected', 'info');
                refreshData();
            })
            .catch(error => showNotification('Error: ' + error.message, 'error'));
    }
}

// ============================================
// ALL GROUPS FUNCTIONS
// ============================================

// Display all groups
function displayAllGroups() {
    const tbody = document.getElementById('allGroupsBody');
    if (!tbody) return;
    
    const search = document.getElementById('searchGroups')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('filterCategory')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    
    let filtered = groups.filter(g => g);
    
    if (search) {
        filtered = filtered.filter(g => 
            (g.name && g.name.toLowerCase().includes(search)) || 
            (g.description && g.description.toLowerCase().includes(search))
        );
    }
    
    if (categoryFilter) {
        filtered = filtered.filter(g => g.categoryId === categoryFilter);
    }
    
    if (statusFilter) {
        filtered = filtered.filter(g => g.status === statusFilter);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No groups match filters</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    filtered.forEach(group => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${group.name || 'Unnamed'}</td>
            <td>${group.category || 'N/A'}</td>
            <td>${group.members || 0}</td>
            <td>${group.views || 0}</td>
            <td><span class="status-badge status-${group.status || 'pending'}">${group.status || 'pending'}</span></td>
            <td>${group.featured ? '⭐ Yes' : 'No'}</td>
            <td>
                <button class="btn-edit" onclick="editGroup('${group.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteGroup('${group.id}')">Delete</button>
                ${!group.featured ? 
                    '<button class="btn-approve" onclick="makeFeatured(\'' + group.id + '\')">Make Featured</button>' : 
                    '<button class="btn-reject" onclick="removeFeatured(\'' + group.id + '\')">Remove Featured</button>'
                }
            </td>
        `;
    });
}

// Apply filters
function applyFilters() {
    displayAllGroups();
}

// Delete group
function deleteGroup(id) {
    if (confirm('⚠️ Delete this group?')) {
        database.ref('groups/' + id).remove()
            .then(() => {
                showNotification('Group deleted', 'info');
                refreshData();
            })
            .catch(error => showNotification('Error: ' + error.message, 'error'));
    }
}

// Make featured
function makeFeatured(id) {
    database.ref('groups/' + id).update({ featured: true })
        .then(() => {
            showNotification('Group featured!', 'success');
            refreshData();
        })
        .catch(error => showNotification('Error: ' + error.message, 'error'));
}

// Remove featured
function removeFeatured(id) {
    database.ref('groups/' + id).update({ featured: false })
        .then(() => {
            showNotification('Featured removed', 'info');
            refreshData();
        })
        .catch(error => showNotification('Error: ' + error.message, 'error'));
}

// ============================================
// EDIT GROUP MODAL
// ============================================

// Edit group
function editGroup(id) {
    const group = groups.find(g => g.id === id);
    if (!group) return;
    
    document.getElementById('editGroupId').value = group.id;
    document.getElementById('editGroupName').value = group.name || '';
    document.getElementById('editGroupLink').value = group.link || '';
    document.getElementById('editGroupCategory').value = group.categoryId || '';
    document.getElementById('editGroupDesc').value = group.description || '';
    document.getElementById('editGroupMembers').value = group.members || 0;
    document.getElementById('editGroupStatus').value = group.status || 'pending';
    document.getElementById('editGroupFeatured').checked = group.featured || false;
    
    document.getElementById('editModal').classList.add('show');
}

// Update group
function updateGroup(event) {
    event.preventDefault();
    
    const groupId = document.getElementById('editGroupId').value;
    const categoryId = document.getElementById('editGroupCategory').value;
    const category = categories.find(c => c.id === categoryId);
    
    const updatedData = {
        name: document.getElementById('editGroupName').value,
        link: document.getElementById('editGroupLink').value,
        categoryId: categoryId,
        category: category ? category.name : 'Other',
        description: document.getElementById('editGroupDesc').value,
        members: parseInt(document.getElementById('editGroupMembers').value) || 0,
        status: document.getElementById('editGroupStatus').value,
        featured: document.getElementById('editGroupFeatured').checked
    };
    
    database.ref('groups/' + groupId).update(updatedData)
        .then(() => {
            closeModal();
            showNotification('Group updated!', 'success');
            refreshData();
        })
        .catch(error => showNotification('Error: ' + error.message, 'error'));
}

// Close modal
function closeModal() {
    document.getElementById('editModal').classList.remove('show');
}

// ============================================
// CATEGORIES FUNCTIONS
// ============================================

// Display categories
function displayCategories() {
    const tbody = document.getElementById('categoriesBody');
    if (!tbody) return;
    
    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No categories</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    categories.forEach(cat => {
        const groupCount = groups.filter(g => g && g.categoryId === cat.id).length;
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${cat.icon || '📌'}</td>
            <td>${cat.name}</td>
            <td>${groupCount}</td>
            <td>
                <button class="btn-delete" onclick="deleteCategory('${cat.id}')">Delete</button>
            </td>
        `;
    });
}

// Add category
function addCategory() {
    const name = document.getElementById('catName').value.trim();
    const icon = document.getElementById('catIcon').value.trim();
    
    if (!name || !icon) {
        showNotification('Enter both name and icon', 'error');
        return;
    }
    
    database.ref('categories').push({ name, icon })
        .then(() => {
            document.getElementById('catName').value = '';
            document.getElementById('catIcon').value = '';
            showNotification('Category added!', 'success');
            refreshData();
        })
        .catch(error => showNotification('Error: ' + error.message, 'error'));
}

// Delete category
function deleteCategory(id) {
    if (confirm('Delete this category?')) {
        database.ref('categories/' + id).remove()
            .then(() => {
                showNotification('Category deleted', 'info');
                refreshData();
            })
            .catch(error => showNotification('Error: ' + error.message, 'error'));
    }
}

// Update category counts
function updateCategoryCounts() {
    displayCategories();
}

// ============================================
// REPORTS FUNCTIONS
// ============================================

// Display reports
function displayReports() {
    const tbody = document.getElementById('reportsBody');
    if (!tbody) return;
    
    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No reports</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    reports.forEach(report => {
        const row = tbody.insertRow();
        const date = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A';
        
        row.innerHTML = `
            <td>${report.groupName || 'Unknown'}</td>
            <td>${report.reason || 'Broken link'}</td>
            <td>${date}</td>
            <td>
                <button class="btn-approve" onclick="resolveReport('${report.id}')">Resolve</button>
                <button class="btn-delete" onclick="deleteReport('${report.id}')">Delete</button>
            </td>
        `;
    });
}

// Resolve report
function resolveReport(id) {
    database.ref('reports/' + id).remove()
        .then(() => {
            showNotification('Report resolved', 'success');
            refreshData();
        })
        .catch(error => showNotification('Error: ' + error.message, 'error'));
}

// Delete report
function deleteReport(id) {
    database.ref('reports/' + id).remove()
        .then(() => {
            showNotification('Report deleted', 'info');
            refreshData();
        })
        .catch(error => showNotification('Error: ' + error.message, 'error'));
}

// ============================================
// FILTER FUNCTIONS
// ============================================

// Populate category filters
function populateCategoryFilters() {
    const filterCat = document.getElementById('filterCategory');
    if (!filterCat) return;
    
    filterCat.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        filterCat.innerHTML += `<option value="${cat.id}">${cat.icon || '📌'} ${cat.name}</option>`;
    });
}

// Populate edit category select
function populateEditCategorySelect() {
    const editCat = document.getElementById('editGroupCategory');
    if (!editCat) return;
    
    editCat.innerHTML = '';
    categories.forEach(cat => {
        editCat.innerHTML += `<option value="${cat.id}">${cat.icon || '📌'} ${cat.name}</option>`;
    });
}

// ============================================
// CHART FUNCTIONS
// ============================================

// Update chart
function updateChart() {
    const ctx = document.getElementById('activityChart')?.getContext('2d');
    if (!ctx) return;
    
    const dates = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dayGroups = groups.filter(g => {
            if (!g || !g.createdAt) return false;
            const groupDate = new Date(g.createdAt);
            return groupDate >= date && groupDate < new Date(date.getTime() + 86400000);
        }).length;
        
        counts.push(dayGroups);
    }
    
    if (chart) chart.destroy();
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Groups Added',
                data: counts,
                borderColor: '#25D366',
                backgroundColor: 'rgba(37, 211, 102, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// ============================================
// SETTINGS FUNCTIONS
// ============================================

// Save settings
function saveSettings() {
    const settings = {
        adminUser: document.getElementById('adminUser').value,
        adminPass: document.getElementById('adminPass').value,
        siteName: document.getElementById('siteName').value,
        adminEmail: document.getElementById('adminEmail').value
    };
    
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    showNotification('Settings saved!', 'success');
}

// Clear all data
function clearAllData() {
    if (confirm('⚠️ DELETE ALL DATA?')) {
        if (prompt('Type "DELETE" to confirm') === 'DELETE') {
            database.ref().remove()
                .then(() => {
                    showNotification('All data cleared!', 'warning');
                    setTimeout(() => location.reload(), 2000);
                })
                .catch(error => showNotification('Error: ' + error.message, 'error'));
        }
    }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

// Show notification
function showNotification(message, type = 'success') {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: ${type === 'warning' ? '#333' : 'white'};
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ============================================
// UI FUNCTIONS
// ============================================

// Toggle sidebar
function toggleSidebar() {
    document.getElementById('adminSidebar').classList.toggle('collapsed');
    document.querySelector('.admin-main').classList.toggle('expanded');
}

// Logout
function logout() {
    if (confirm('Logout?')) {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.href = 'index.html';
    }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .btn-approve, .btn-reject, .btn-edit, .btn-delete {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin: 0 2px;
        transition: all 0.3s;
    }
    
    .btn-approve {
        background: #28a745;
        color: white;
    }
    
    .btn-reject {
        background: #dc3545;
        color: white;
    }
    
    .btn-edit {
        background: #ffc107;
        color: #333;
    }
    
    .btn-delete {
        background: #dc3545;
        color: white;
    }
    
    .status-badge {
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
    }
    
    .status-approved {
        background: #d4edda;
        color: #155724;
    }
    
    .status-pending {
        background: #fff3cd;
        color: #856404;
    }
    
    .status-rejected {
        background: #f8d7da;
        color: #721c24;
    }
`;
document.head.appendChild(style);
.chart-wrapper {
    height: 300px;
    position: relative;
}
