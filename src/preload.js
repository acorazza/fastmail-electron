const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    sendNotification: (title, body, icon) => ipcRenderer.invoke('show-notification', title, body, icon),
                                onNotificationClick: (callback) => ipcRenderer.on('notification-clicked', callback)
});

// Monitor for new emails in Fastmail
let lastEmailCount = 0;

function checkForNewEmails() {
    try {
        // Look for unread count in Fastmail's interface
        const unreadElements = document.querySelectorAll('[data-testid="sidebar-folder-unread-count"], .s-unread-count, .unread-count');
        let currentCount = 0;

        unreadElements.forEach(element => {
            const count = parseInt(element.textContent) || 0;
            currentCount += count;
        });

        // Also check for inbox unread count
        const inboxUnread = document.querySelector('.v-MailboxList-item.is-inbox .v-MailboxList-item-unreadCount');
        if (inboxUnread) {
            currentCount = parseInt(inboxUnread.textContent) || 0;
        }

        // If count increased, we have new emails
        if (currentCount > lastEmailCount && lastEmailCount > 0) {
            const newEmails = currentCount - lastEmailCount;
            window.electronAPI.sendNotification(
                'New Email',
                `You have ${newEmails} new email${newEmails > 1 ? 's' : ''}`,
                null
            );
        }

        lastEmailCount = currentCount;
    } catch (error) {
        console.log('Error checking for new emails:', error);
    }
}

// Start monitoring when page is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Initial check after a delay to let the page load
    setTimeout(() => {
        checkForNewEmails();
        // Check every 30 seconds
        setInterval(checkForNewEmails, 30000);
    }, 5000);
});
