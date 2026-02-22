// For Firebase JS SDK v7.20.0 and later
const firebaseConfig = {
  apiKey: "AIzaSyD1C1mHbmGaBxfdsQ34Cosgoned1Cg5cWQ",
  authDomain: "groupmela.firebaseapp.com",
  databaseURL: "https://groupmela-default-rtdb.firebaseio.com",
  projectId: "groupmela",
  storageBucket: "groupmela.firebasestorage.app",
  messagingSenderId: "608978556223",
  appId: "1:608978556223:web:905c071ee45c2b010d6f8a",
  measurementId: "G-CPTNDSGTYE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database reference
const database = firebase.database();

// Global helper functions jo dono jagah kaam ayengi

// Format date to time ago
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

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
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s;
        font-family: Arial, sans-serif;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add animation style if not exists
if (!document.getElementById('notification-style')) {
    const style = document.createElement('style');
    style.id = 'notification-style';
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
}

// Validate WhatsApp link
function isValidWhatsAppLink(link) {
    return link && link.includes('chat.whatsapp.com');
}

// Get category icon
function getCategoryIcon(categoryId, categories) {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.icon : '📌';
}

// Increment view count
function incrementViewCount(groupId) {
    const groupRef = database.ref('groups/' + groupId);
    groupRef.transaction((group) => {
        if (group) {
            group.views = (group.views || 0) + 1;
        }
        return group;
    });
}

console.log('🔥 Firebase initialized successfully for GroupMela');