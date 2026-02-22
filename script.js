<!-- Pending Groups Section -->
<div id="pending-section" class="admin-section">
    <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center;">
        <h1 class="admin-page-title" style="margin-bottom: 0;">Pending Groups</h1>
        <button onclick="forceRefreshPending()" 
                style="background: #25D366; color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer;">
            <i class="fas fa-sync-alt"></i> Force Refresh
        </button>
        <button onclick="loadGroups()" 
                style="background: #ffc107; color: black; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer;">
            <i class="fas fa-database"></i> Reload Data
        </button>
    </div>
    
    <div class="admin-table-container">
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Group Name</th>
                    <th>Category</th>
                    <th>Link</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="pendingGroupsBody">
                <tr><td colspan="5">Loading...</td></tr>
            </tbody>
        </table>
    </div>
</div>
