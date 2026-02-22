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

// Check if admin is logged in
if (!sessionStorage.getItem('adminLoggedIn') && !window.location.pathname.includes('index.html')) {
    window.location.href = 'index.html';
}

// Global variables
let categories = [];
let groups = [];
let reports = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel loaded');
    
    // Load categories
    loadCategories();
    
    // Load groups
    loadGroups();
    
    // Load reports
    loadReports();
    
    // Setup real-time updates
    setupRealtimeUpdates();
});

// Toggle sidebar
function toggleSidebar() {
    document.getElementById('adminSidebar').classList.toggle('collapsed');
    document.querySelector('.admin-main').classList.toggle('expanded');
}

// Show section
function showSection(section) {
    // Update menu
    document.querySelectorAll('.admin-sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Show section
    document.querySelectorAll('.admin-section').forEach(s => {
        s.classList.remove('active');
    });
    document.getElementById(section + '-section').classList.add('active');
}

// Load categories
function loadCategories() {
    database.ref('categories').on('value', (snapshot) => {
        categories = [];
        snapshot.forEach((childSnapshot) => {
            categories.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        displayCategories();
        populateCategoryFilters();
        populateEditCategorySelect();
    });
}

// Load groups
function loadGroups() {
    database.ref('groups').on('value', (snapshot) => {
        groups = [];
        snapshot.forEach((childSnapshot) => {
            groups.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        updateStats();
        displayRecentGroups();
        displayPendingGroups();
        displayAllGroups();
    });
}

// Load reports
function loadReports() {
    database.ref('reports').on('value', (snapshot) => {
        reports = [];
        snapshot.forEach((childSnapshot) => {
            reports.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        displayReports();
        document.getElementById('reportsCount').textContent = reports.length;
    });
}

// Update dashboard stats
function updateStats() {
    const totalGroups = groups.length;
    const pendingGroups = groups.filter(g => g.status === 'pending').length;
    const approvedGroups = groups.filter(g => g.status === 'approved').length;
    const featuredGroups = groups.filter(g => g.featured).length;
    const totalViews = groups.reduce((sum, g) => sum + (g.views || 0), 0);
    
    document.getElementById('totalGroups').textContent = totalGroups;
    document.getElementById('pendingGroups').textContent = pendingGroups;
    document.getElementById('approvedGroups').textContent = approvedGroups;
    document.getElementById('featuredGroups').textContent = featuredGroups;
    document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    document.getElementById('pendingCount').textContent = pendingGroups;
}

// Display recent groups
function displayRecentGroups() {
    const tbody = document.getElementById('recentGroupsBody');
    tbody.innerHTML = '';
    
    const recent = groups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No groups found</td></tr>';
        return;
    }
    
    recent.forEach(group => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${group.name}</td>
            <td>${group.category || 'N/A'}</td>
            <td><span class="status-badge status-${group.status}">${group.status}</span></td>
            <td>${new Date(group.createdAt).toLocaleDateString()}</td>
            <td class="admin-actions">
                <button class="btn-edit" onclick="editGroup('${group.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteGroup('${group.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
}

// Display pending groups
function displayPendingGroups() {
    const tbody = document.getElementById('pendingGroupsBody');
    tbody.innerHTML = '';
    
    const pending = groups.filter(g => g.status === 'pending');
    
    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No pending groups</td></tr>';
        return;
    }
    
    pending.forEach(group => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${group.name}</td>
            <td>${group.category || 'N/A'}</td>
            <td><a href="${group.link}" target="_blank">View Link</a></td>
            <td>${new Date(group.createdAt).toLocaleDateString()}</td>
            <td class="admin-actions">
                <button class="btn-approve" onclick="approveGroup('${group.id}')"><i class="fas fa-check"></i> Approve</button>
                <button class="btn-reject" onclick="rejectGroup('${group.id}')"><i class="fas fa-times"></i> Reject</button>
                <button class="btn-edit" onclick="editGroup('${group.id}')"><i class="fas fa-edit"></i></button>
            </td>
        `;
    });
}

// Display all groups
function displayAllGroups() {
    const tbody = document.getElementById('allGroupsBody');
    tbody.innerHTML = '';
    
    if (groups.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No groups found</td></tr>';
        return;
    }
    
    groups.forEach(group => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${group.name}</td>
            <td>${group.category || 'N/A'}</td>
            <td>${group.members || 0}</td>
            <td>${group.views || 0}</td>
            <td><span class="status-badge status-${group.status}">${group.status}</span></td>
            <td>${group.featured ? '⭐ Yes' : 'No'}</td>
            <td class="admin-actions">
                <button class="btn-edit" onclick="editGroup('${group.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteGroup('${group.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
}

// Display categories
function displayCategories() {
    const tbody = document.getElementById('categoriesBody');
    tbody.innerHTML = '';
    
    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No categories found</td></tr>';
        return;
    }
    
    categories.forEach(cat => {
        const groupCount = groups.filter(g => g.categoryId === cat.id).length;
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td style="font-size: 24px;">${cat.icon || '📌'}</td>
            <td>${cat.name}</td>
            <td>${groupCount}</td>
            <td class="admin-actions">
                <button class="btn-edit" onclick="editCategory('${cat.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteCategory('${cat.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
}

// Display reports
function displayReports() {
    const tbody = document.getElementById('reportsBody');
    tbody.innerHTML = '';
    
    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No reports found</td></tr>';
        return;
    }
    
    reports.forEach(report => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${report.groupName || 'Unknown'}</td>
            <td>${report.reason || 'Broken link'}</td>
            <td>${new Date(report.createdAt).toLocaleDateString()}</td>
            <td class="admin-actions">
                <button class="btn-approve" onclick="resolveReport('${report.id}')">Resolve</button>
                <button class="btn-delete" onclick="deleteReport('${report.id}')">Delete</button>
            </td>
        `;
    });
}

// Populate category filters
function populateCategoryFilters() {
    const filterCat = document.getElementById('filterCategory');
    if (filterCat) {
        filterCat.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            filterCat.innerHTML += `<option value="${cat.id}">${cat.icon || '📌'} ${cat.name}</option>`;
        });
    }
}

// Populate edit category select
function populateEditCategorySelect() {
    const editCat = document.getElementById('editGroupCategory');
    if (editCat) {
        editCat.innerHTML = '';
        categories.forEach(cat => {
            editCat.innerHTML += `<option value="${cat.id}">${cat.icon || '📌'} ${cat.name}</option>`;
        });
    }
}

// Apply filters
function applyFilters() {
    const search = document.getElementById('searchGroups').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const status = document.getElementById('filterStatus').value;
    
    const tbody = document.getElementById('allGroupsBody');
    tbody.innerHTML = '';
    
    let filtered = groups;
    
    if (search) {
        filtered = filtered.filter(g => g.name.toLowerCase().includes(search));
    }
    
    if (category) {
        filtered = filtered.filter(g => g.categoryId === category);
    }
    
    if (status) {
        filtered = filtered.filter(g => g.status === status);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No groups match filters</td></tr>';
        return;
    }
    
    filtered.forEach(group => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${group.name}</td>
            <td>${group.category || 'N/A'}</td>
            <td>${group.members || 0}</td>
            <td>${group.views || 0}</td>
            <td><span class="status-badge status-${group.status}">${group.status}</span></td>
            <td>${group.featured ? '⭐ Yes' : 'No'}</td>
            <td class="admin-actions">
                <button class="btn-edit" onclick="editGroup('${group.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-delete" onclick="deleteGroup('${group.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
}

// Approve group
function approveGroup(id) {
    database.ref('groups/' + id).update({ status: 'approved' })
        .then(() => {
            showNotification('Group approved successfully!');
        });
}

// Reject group
function rejectGroup(id) {
    if (confirm('Are you sure you want to reject this group?')) {
        database.ref('groups/' + id).update({ status: 'rejected' })
            .then(() => {
                showNotification('Group rejected');
            });
    }
}

// Delete group
function deleteGroup(id) {
    if (confirm('Are you sure you want to delete this group?')) {
        database.ref('groups/' + id).remove()
            .then(() => {
                showNotification('Group deleted');
            });
    }
}

// Edit group
function editGroup(id) {
    const group = groups.find(g => g.id === id);
    if (group) {
        document.getElementById('editGroupId').value = group.id;
        document.getElementById('editGroupName').value = group.name;
        document.getElementById('editGroupLink').value = group.link;
        document.getElementById('editGroupCategory').value = group.categoryId;
        document.getElementById('editGroupDesc').value = group.description || '';
        document.getElementById('editGroupMembers').value = group.members || 0;
        document.getElementById('editGroupStatus').value = group.status;
        document.getElementById('editGroupFeatured').checked = group.featured || false;
        
        document.getElementById('editModal').classList.add('show');
    }
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
            showNotification('Group updated successfully!');
        });
}

// Close modal
function closeModal() {
    document.getElementById('editModal').classList.remove('show');
}

// Add category
function addCategory() {
    const name = document.getElementById('catName').value;
    const icon = document.getElementById('catIcon').value;
    
    if (!name || !icon) {
        alert('Please fill all fields');
        return;
    }
    
    const newCat = {
        name: name,
        icon: icon
    };
    
    database.ref('categories').push(newCat)
        .then(() => {
            document.getElementById('catName').value = '';
            document.getElementById('catIcon').value = '';
            showNotification('Category added!');
        });
}

// Delete category
function deleteCategory(id) {
    if (confirm('Are you sure? This will not delete groups.')) {
        database.ref('categories/' + id).remove()
            .then(() => {
                showNotification('Category deleted');
            });
    }
}

// Resolve report
function resolveReport(id) {
    database.ref('reports/' + id).remove()
        .then(() => {
            showNotification('Report resolved');
        });
}

// Delete report
function deleteReport(id) {
    database.ref('reports/' + id).remove()
        .then(() => {
            showNotification('Report deleted');
        });
}

// Save settings
function saveSettings() {
    const settings = {
        adminUser: document.getElementById('adminUser').value,
        adminPass: document.getElementById('adminPass').value,
        siteName: document.getElementById('siteName').value,
        adminEmail: document.getElementById('adminEmail').value
    };
    
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    showNotification('Settings saved!');
}

// Clear all data
function clearAllData() {
    if (confirm('⚠️ WARNING: This will delete ALL data! Are you sure?')) {
        if (confirm('Type "DELETE" to confirm')) {
            database.ref().remove()
                .then(() => {
                    showNotification('All data cleared');
                });
        }
    }
}

// Logout
function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.href = 'index.html';
}

// Show notification
function showNotification(message) {
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

// Setup real-time updates
function setupRealtimeUpdates() {
    // Listen for new groups
    database.ref('groups').on('child_added', () => {
        loadGroups();
    });
    
    // Listen for changes
    database.ref('groups').on('child_changed', () => {
        loadGroups();
    });
}

// Add animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .loading {
        text-align: center;
        padding: 40px;
        color: #666;
    }
    .no-groups {
        text-align: center;
        padding: 40px;
        color: #999;
        grid-column: 1/-1;
    }
`;
document.head.appendChild(style);
