// Check if admin is logged in
if (!sessionStorage.getItem('adminLoggedIn') && !window.location.pathname.includes('index.html')) {
    window.location.href = 'index.html';
}

// Global variables
let categories = [];
let groups = [];
let reports = [];
let chart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin panel loaded - FIXED VERSION');
    
    // Check if Firebase is initialized
    if (typeof database === 'undefined') {
        console.error('❌ Firebase database not defined!');
        showNotification('Firebase not connected! Please check configuration.', 'error');
        return;
    }
    
    console.log('✅ Firebase connected successfully');
    showNotification('Firebase connected!', 'success');
    
    // Load data from Firebase
    loadCategories();
    loadGroups();
    loadReports();
    
    // Setup click handlers for all buttons
    setupButtonHandlers();
});

// ============================================
// SETUP BUTTON HANDLERS
// ============================================
function setupButtonHandlers() {
    // Fix for all approve/reject/edit/delete buttons
    document.addEventListener('click', function(e) {
        // Handle approve button
        if (e.target.classList.contains('btn-approve') || e.target.closest('.btn-approve')) {
            const btn = e.target.closest('.btn-approve');
            const groupId = btn.getAttribute('data-id') || btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (groupId) approveGroup(groupId);
        }
        
        // Handle reject button
        if (e.target.classList.contains('btn-reject') || e.target.closest('.btn-reject')) {
            const btn = e.target.closest('.btn-reject');
            const groupId = btn.getAttribute('data-id') || btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (groupId) rejectGroup(groupId);
        }
        
        // Handle edit button
        if (e.target.classList.contains('btn-edit') || e.target.closest('.btn-edit')) {
            const btn = e.target.closest('.btn-edit');
            const groupId = btn.getAttribute('data-id') || btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (groupId) editGroup(groupId);
        }
        
        // Handle delete button
        if (e.target.classList.contains('btn-delete') || e.target.closest('.btn-delete')) {
            const btn = e.target.closest('.btn-delete');
            const groupId = btn.getAttribute('data-id') || btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (groupId) deleteGroup(groupId);
        }
    });
}

// ============================================
// FIREBASE DATA LOADING FUNCTIONS
// ============================================

// Load categories from Firebase
function loadCategories() {
    database.ref('categories').on('value', (snapshot) => {
        categories = [];
        snapshot.forEach((childSnapshot) => {
            categories.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        console.log('📂 Categories loaded:', categories.length);
        
        // Update UI
        displayCategories();
        populateCategoryFilters();
        populateEditCategorySelect();
        updateStats();
    }, (error) => {
        console.error('Error loading categories:', error);
        showNotification('Error loading categories', 'error');
    });
}

// Load groups from Firebase - FIXED VERSION
function loadGroups() {
    console.log('📥 Loading groups from Firebase...');
    
    database.ref('groups').once('value', (snapshot) => {
        groups = [];
        snapshot.forEach((childSnapshot) => {
            groups.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        console.log('📊 Groups loaded:', groups.length);
        
        // Log status counts
        const pendingCount = groups.filter(g => g && g.status === 'pending').length;
        const approvedCount = groups.filter(g => g && g.status === 'approved').length;
        console.log(`📊 Status: Pending: ${pendingCount}, Approved: ${approvedCount}`);
        
        // Update all UI sections
        updateStats();
        displayRecentGroups();
        displayPendingGroups();
        displayAllGroups();
        updateCategoryCounts();
        updateChart();
        
        // Update pending count badge
        document.getElementById('pendingCount').textContent = pendingCount;
        
        showNotification(`Loaded ${groups.length} groups`, 'success');
    }, (error) => {
        console.error('Error loading groups:', error);
        showNotification('Error loading groups', 'error');
    });
    
    // Also set up listener for real-time updates
    database.ref('groups').on('child_changed', () => {
        console.log('🔄 Group changed, reloading...');
        loadGroups();
    });
    
    database.ref('groups').on('child_added', () => {
        console.log('🔄 New group added, reloading...');
        loadGroups();
    });
    
    database.ref('groups').on('child_removed', () => {
        console.log('🔄 Group removed, reloading...');
        loadGroups();
    });
}

// Load reports from Firebase
function loadReports() {
    database.ref('reports').once('value', (snapshot) => {
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
    }, (error) => {
        console.error('Error loading reports:', error);
    });
    
    // Real-time updates for reports
    database.ref('reports').on('child_added', () => loadReports());
    database.ref('reports').on('child_removed', () => loadReports());
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
                <button class="btn-edit" data-id="${group.id}" onclick="editGroup('${group.id}')">Edit</button>
                <button class="btn-delete" data-id="${group.id}" onclick="deleteGroup('${group.id}')">Delete</button>
            </td>
        `;
    });
}

// ============================================
// PENDING GROUPS FUNCTIONS - FIXED
// ============================================

// Display pending groups
function displayPendingGroups() {
    console.log('🔍 Displaying pending groups...');
    
    const tbody = document.getElementById('pendingGroupsBody');
    if (!tbody) {
        console.error('❌ pendingGroupsBody not found!');
        return;
    }
    
    const pending = groups.filter(g => g && g.status === 'pending');
    
    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">⏳ No pending groups found</td></tr>';
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
                <button class="btn-approve" data-id="${group.id}" onclick="approveGroup('${group.id}')">✅ Approve</button>
                <button class="btn-reject" data-id="${group.id}" onclick="rejectGroup('${group.id}')">❌ Reject</button>
                <button class="btn-edit" data-id="${group.id}" onclick="editGroup('${group.id}')">✏️ Edit</button>
            </td>
        `;
    });
    
    console.log(`✅ Displayed ${pending.length} pending groups`);
}

// Force refresh pending groups
function forceRefreshPending() {
    console.log('🔄 Force refreshing pending groups...');
    loadGroups();
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
    if (confirm('✅ Approve this group? It will be visible on the website.')) {
        database.ref('groups/' + id).update({ status: 'approved' })
            .then(() => {
                showNotification('Group approved successfully!', 'success');
                loadGroups();
            })
            .catch(error => showNotification('Error: ' + error.message, 'error'));
    }
}

// Reject group
function rejectGroup(id) {
    if (confirm('❌ Reject this group? It will not be shown.')) {
        database.ref('groups/' + id).update({ status: 'rejected' })
            .then(() => {
                showNotification('Group rejected', 'info');
                loadGroups();
            })
            .catch(error => showNotification('Error: ' + error.message, 'error'));
    }
}

// ============================================
// ALL GROUPS FUNCTIONS
// ============================================

// Display all groups with filters
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
                <button class="btn-edit" data-id="${group.id}" onclick="editGroup('${group.id}')">Edit</button>
                <button class="btn-delete" data-id="${group.id}" onclick="deleteGroup('${group.id}')">Delete</button>
                ${!group.featured ? 
                    '<button class="btn-approve" data-id="' + group.id + '" onclick="makeFeatured(\'' + group.id + '\')">Make Featured</button>' : 
                    '<button class="btn-reject" data-id="' + group.id + '" onclick="removeFeatured(\'' + group.id + '\')">Remove Featured</button>'
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
    if (confirm('⚠️ Delete this group? This cannot be undone!')) {
        database.ref('groups/' + id).remove()
            .then(() => {
                showNotification('Group deleted', 'info');
                loadGroups();
            })
            .catch(error => showNotification('Error: ' + error.message, 'error'));
    }
}

// Make featured
function makeFeatured(id) {
    database.ref('groups/' + id).update({ featured: true })
        .then(() => {
            showNotification('Group marked as featured!', 'success');
            loadGroups();
        })
        .catch(error => showNotification('Error: ' + error.message, 'error'));
}

// Remove featured
function removeFeatured(id) {
    database.ref('groups/' + id).update({ featured: false })
        .then(() => {
            showNotification('Featured removed', 'info');
            loadGroups();
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
            showNotification('Group updated successfully!', 'success');
            loadGroups();
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
        tbody.innerHTML = '<tr><td colspan="4">No categories found</td></tr>';
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
        })
        .catch(error => showNotification('Error: ' + error.message, 'error'));
}

// Delete category
function deleteCategory(id) {
    if (confirm('Delete this category?')) {
        database.ref('categories/' + id).remove()
            .then(() => showNotification('Category deleted', 'info'))
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
        tbody.innerHTML = '<tr><td colspan="4">No reports found</td></tr>';
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
        .then(() => showNotification('Report resolved', 'success'))
        .catch(error => showNotification('Error: ' + error.message, 'error'));
}

// Delete report
function deleteReport(id) {
    database.ref('reports/' + id).remove()
        .then(() => showNotification('Report deleted', 'info'))
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
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dayGroups = groups.filter(g => {
            if (!g || !g.createdAt) return false;
            const groupDate = new Date(g.createdAt);
            return groupDate >= date && groupDate < nextDate;
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
    if (confirm('⚠️ WARNING: This will DELETE ALL data! Are you sure?')) {
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

// Show section
function showSection(section) {
    document.querySelectorAll('.admin-sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    document.querySelectorAll('.admin-section').forEach(s => {
        s.classList.remove('active');
    });
    document.getElementById(section + '-section').classList.add('active');
    
    if (section === 'pending') displayPendingGroups();
    if (section === 'allgroups') displayAllGroups();
    if (section === 'categories') displayCategories();
    if (section === 'reports') displayReports();
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.href = 'index.html';
    }
}

// Add animation styles
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
    
    .btn-approve:hover {
        background: #218838;
    }
    
    .btn-reject {
        background: #dc3545;
        color: white;
    }
    
    .btn-reject:hover {
        background: #c82333;
    }
    
    .btn-edit {
        background: #ffc107;
        color: #333;
    }
    
    .btn-edit:hover {
        background: #e0a800;
    }
    
    .btn-delete {
        background: #dc3545;
        color: white;
    }
    
    .btn-delete:hover {
        background: #c82333;
    }
    
    .status-badge {
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
        display: inline-block;
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
