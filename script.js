// Check if admin is logged in
if (!sessionStorage.getItem('adminLoggedIn') && !window.location.pathname.includes('index.html')) {
    window.location.href = 'index.html';
}

// Sample data (in real website, this would come from backend)
let categories = JSON.parse(localStorage.getItem('categories')) || [
    { id: 1, name: 'Study Group', icon: '📚', count: 0 },
    { id: 2, name: 'Business', icon: '💼', count: 0 },
    { id: 3, name: 'Cricket', icon: '🏏', count: 0 },
    { id: 4, name: 'Technology', icon: '💻', count: 0 },
    { id: 5, name: 'Entertainment', icon: '🎬', count: 0 },
    { id: 6, name: 'Jobs Alert', icon: '🔔', count: 0 }
];

let groups = JSON.parse(localStorage.getItem('groups')) || [
    {
        id: 1,
        name: 'UPSC 2026 Aspirants',
        category: 'Study Group',
        categoryId: 1,
        description: 'Daily current affairs, notes sharing',
        members: 1250,
        views: 5400,
        link: 'https://chat.whatsapp.com/example1',
        featured: true,
        status: 'approved',
        date: '2026-02-20'
    },
    {
        id: 2,
        name: 'Digital India Business',
        category: 'Business',
        categoryId: 2,
        description: 'Business ideas and networking',
        members: 890,
        views: 3200,
        link: 'https://chat.whatsapp.com/example2',
        featured: false,
        status: 'approved',
        date: '2026-02-21'
    },
    {
        id: 3,
        name: 'Test Group Pending',
        category: 'Technology',
        categoryId: 4,
        description: 'Pending approval group',
        members: 0,
        views: 0,
        link: 'https://chat.whatsapp.com/example3',
        featured: false,
        status: 'pending',
        date: '2026-02-22'
    }
];

let reports = JSON.parse(localStorage.getItem('reports')) || [
    {
        id: 1,
        groupId: 2,
        groupName: 'Digital India Business',
        reason: 'Link expired',
        reporter: 'user@example.com',
        date: '2026-02-21'
    }
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    loadRecentGroups();
    loadPendingGroups();
    loadAllGroups();
    loadCategories();
    loadReports();
    loadCategoryOptions();
    loadCategorySelects();
    initChart();
});

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const main = document.querySelector('.admin-main');
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('expanded');
}

// Show Section
function showSection(section) {
    // Update menu active state
    document.querySelectorAll('.admin-sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Show section
    document.querySelectorAll('.admin-section').forEach(s => {
        s.classList.remove('active');
    });
    document.getElementById(section + '-section').classList.add('active');
    
    // Refresh data if needed
    if (section === 'pending') loadPendingGroups();
    if (section === 'allgroups') loadAllGroups();
    if (section === 'categories') loadCategories();
    if (section === 'reports') loadReports();
}

// Update Stats
function updateStats() {
    const totalGroups = groups.length;
    const pendingGroups = groups.filter(g => g.status === 'pending').length;
    const approvedGroups = groups.filter(g => g.status === 'approved').length;
    const featuredGroups = groups.filter(g => g.featured).length;
    const totalViews = groups.reduce((sum, g) => sum + g.views, 0);
    
    document.getElementById('totalGroups').textContent = totalGroups;
    document.getElementById('pendingGroups').textContent = pendingGroups;
    document.getElementById('approvedGroups').textContent = approvedGroups;
    document.getElementById('featuredGroups').textContent = featuredGroups;
    document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    document.getElementById('pendingCount').textContent = pendingGroups;
    document.getElementById('reportsCount').textContent = reports.length;
    document.getElementById('totalReports').textContent = reports.length;
}

// Load Recent Groups
function loadRecentGroups() {
    const tbody = document.getElementById('recentGroupsBody');
    tbody.innerHTML = '';
    
    groups.slice(0, 5).forEach(group => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>#${group.id}</td>
            <td>${group.name}</td>
            <td>${group.category}</td>
            <td><span class="status-badge status-${group.status}">${group.status}</span></td>
            <td>${group.date}</td>
            <td class="admin-actions">
                <button class="btn-edit" onclick="editGroup(${group.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteGroup(${group.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
}

// Load Pending Groups
function loadPendingGroups() {
    const tbody = document.getElementById('pendingGroupsBody');
    tbody.innerHTML = '';
    
    const pending = groups.filter(g => g.status === 'pending');
    
    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No pending groups</td></tr>';
        return;
    }
    
    pending.forEach(group => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>#${group.id}</td>
            <td>${group.name}</td>
            <td>${group.category}</td>
            <td><a href="${group.link}" target="_blank">View Link</a></td>
            <td>${group.date}</td>
            <td class="admin-actions">
                <button class="btn-approve" onclick="approveGroup(${group.id})"><i class="fas fa-check"></i> Approve</button>
                <button class="btn-reject" onclick="rejectGroup(${group.id})"><i class="fas fa-times"></i> Reject</button>
                <button class="btn-edit" onclick="editGroup(${group.id})"><i class="fas fa-edit"></i></button>
            </td>
        `;
    });
}

// Load All Groups
function loadAllGroups() {
    const tbody = document.getElementById('allGroupsBody');
    tbody.innerHTML = '';
    
    const search = document.getElementById('searchGroups')?.value.toLowerCase() || '';
    const category = document.getElementById('filterCategory')?.value;
    const status = document.getElementById('filterStatus')?.value;
    
    let filtered = groups;
    
    if (search) {
        filtered = filtered.filter(g => 
            g.name.toLowerCase().includes(search) || 
            g.description.toLowerCase().includes(search)
        );
    }
    
    if (category) {
        filtered = filtered.filter(g => g.categoryId == category);
    }
    
    if (status) {
        filtered = filtered.filter(g => g.status === status);
    }
    
    filtered.forEach(group => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>#${group.id}</td>
            <td>${group.name}</td>
            <td>${group.category}</td>
            <td>${group.members}</td>
            <td>${group.views}</td>
            <td><span class="status-badge status-${group.status}">${group.status}</span></td>
            <td>${group.featured ? '⭐ Yes' : 'No'}</td>
            <td class="admin-actions">
                <button class="btn-edit" onclick="editGroup(${group.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteGroup(${group.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
}

// Load Categories
function loadCategories() {
    const tbody = document.getElementById('categoriesBody');
    tbody.innerHTML = '';
    
    categories.forEach(cat => {
        const groupCount = groups.filter(g => g.categoryId === cat.id).length;
        cat.count = groupCount;
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>#${cat.id}</td>
            <td style="font-size: 24px;">${cat.icon}</td>
            <td>${cat.name}</td>
            <td>${groupCount}</td>
            <td class="admin-actions">
                <button class="btn-edit" onclick="editCategory(${cat.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteCategory(${cat.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
    
    localStorage.setItem('categories', JSON.stringify(categories));
}

// Load Reports
function loadReports() {
    const tbody = document.getElementById('reportsBody');
    tbody.innerHTML = '';
    
    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No reports</td></tr>';
        return;
    }
    
    reports.forEach(report => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${report.groupName}</td>
            <td>${report.reporter}</td>
            <td>${report.reason}</td>
            <td>${report.date}</td>
            <td class="admin-actions">
                <button class="btn-approve" onclick="resolveReport(${report.id})">Resolve</button>
                <button class="btn-delete" onclick="deleteReport(${report.id})">Delete</button>
            </td>
        `;
    });
}

// Load Category Options for Selects
function loadCategoryOptions() {
    const select = document.getElementById('filterCategory');
    if (select) {
        select.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`;
        });
    }
}

function loadCategorySelects() {
    const editSelect = document.getElementById('editGroupCategory');
    if (editSelect) {
        editSelect.innerHTML = '';
        categories.forEach(cat => {
            editSelect.innerHTML += `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`;
        });
    }
}

// Approve Group
function approveGroup(id) {
    const group = groups.find(g => g.id === id);
    if (group) {
        group.status = 'approved';
        localStorage.setItem('groups', JSON.stringify(groups));
        loadPendingGroups();
        loadAllGroups();
        updateStats();
        showNotification('Group approved successfully!');
    }
}

// Reject Group
function rejectGroup(id) {
    if (confirm('Are you sure you want to reject this group?')) {
        groups = groups.filter(g => g.id !== id);
        localStorage.setItem('groups', JSON.stringify(groups));
        loadPendingGroups();
        loadAllGroups();
        updateStats();
    }
}

// Delete Group
function deleteGroup(id) {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
        groups = groups.filter(g => g.id !== id);
        localStorage.setItem('groups', JSON.stringify(groups));
        loadRecentGroups();
        loadPendingGroups();
        loadAllGroups();
        updateStats();
        showNotification('Group deleted successfully!');
    }
}

// Edit Group
function editGroup(id) {
    const group = groups.find(g => g.id === id);
    if (group) {
        document.getElementById('editGroupId').value = group.id;
        document.getElementById('editGroupName').value = group.name;
        document.getElementById('editGroupLink').value = group.link;
        document.getElementById('editGroupCategory').value = group.categoryId;
        document.getElementById('editGroupDesc').value = group.description;
        document.getElementById('editGroupMembers').value = group.members;
        document.getElementById('editGroupStatus').value = group.status;
        document.getElementById('editGroupFeatured').checked = group.featured;
        
        document.getElementById('editModal').classList.add('show');
    }
}

// Save Edit Group
document.getElementById('editGroupForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('editGroupId').value);
    const group = groups.find(g => g.id === id);
    
    if (group) {
        group.name = document.getElementById('editGroupName').value;
        group.link = document.getElementById('editGroupLink').value;
        group.categoryId = parseInt(document.getElementById('editGroupCategory').value);
        group.category = categories.find(c => c.id === group.categoryId).name;
        group.description = document.getElementById('editGroupDesc').value;
        group.members = parseInt(document.getElementById('editGroupMembers').value) || 0;
        group.status = document.getElementById('editGroupStatus').value;
        group.featured = document.getElementById('editGroupFeatured').checked;
        
        localStorage.setItem('groups', JSON.stringify(groups));
        closeModal();
        loadAllGroups();
        loadRecentGroups();
        showNotification('Group updated successfully!');
    }
});

// Close Modal
function closeModal() {
    document.getElementById('editModal').classList.remove('show');
}

// Add Category
function addCategory() {
    const name = document.getElementById('catName').value;
    const icon = document.getElementById('catIcon').value;
    
    if (!name || !icon) {
        alert('Please fill all fields');
        return;
    }
    
    const newCat = {
        id: categories.length + 1,
        name: name,
        icon: icon,
        count: 0
    };
    
    categories.push(newCat);
    localStorage.setItem('categories', JSON.stringify(categories));
    
    document.getElementById('catName').value = '';
    document.getElementById('catIcon').value = '';
    
    loadCategories();
    loadCategoryOptions();
    loadCategorySelects();
    showNotification('Category added successfully!');
}

// Delete Category
function deleteCategory(id) {
    if (confirm('Are you sure? This will not delete groups in this category.')) {
        categories = categories.filter(c => c.id !== id);
        localStorage.setItem('categories', JSON.stringify(categories));
        loadCategories();
        loadCategoryOptions();
        loadCategorySelects();
    }
}

// Resolve Report
function resolveReport(id) {
    reports = reports.filter(r => r.id !== id);
    localStorage.setItem('reports', JSON.stringify(reports));
    loadReports();
    updateStats();
}

// Delete Report
function deleteReport(id) {
    reports = reports.filter(r => r.id !== id);
    localStorage.setItem('reports', JSON.stringify(reports));
    loadReports();
    updateStats();
}

// Save Settings
function saveSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value,
        adminEmail: document.getElementById('adminEmail').value,
        groupsPerPage: document.getElementById('groupsPerPage').value,
        autoApprove: document.getElementById('autoApprove').value
    };
    
    localStorage.setItem('settings', JSON.stringify(settings));
    showNotification('Settings saved successfully!');
}

// Clear All Data
function clearAllData() {
    if (confirm('⚠️ WARNING: This will delete ALL groups, categories, and reports! Are you absolutely sure?')) {
        if (confirm('Type "DELETE" to confirm')) {
            groups = [];
            reports = [];
            localStorage.clear();
            location.reload();
        }
    }
}

// Logout
function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.href = 'index.html';
}

// Show Notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize Chart
function initChart() {
    const ctx = document.getElementById('activityChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get last 7 days data
    const dates = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dayGroups = groups.filter(g => {
            const groupDate = new Date(g.date);
            return groupDate.toDateString() === date.toDateString();
        }).length;
        
        counts.push(dayGroups);
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Groups Added',
                data: counts,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102,126,234,0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);