// content.js
function injectSaveButton() {
  // Remove existing save button if present
  const existingButton = document.querySelector('.zenith-save-button');
  if (existingButton) {
    existingButton.remove();
  }

  const saveButton = document.createElement('button');
  saveButton.className = 'zenith-save-button';
  saveButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  `;

  saveButton.addEventListener('click', handleSave);
  document.body.appendChild(saveButton);
}

function handleSave() {
  chrome.storage.sync.get(['token', 'isLoggedIn'], result => {
    if (!result.token || !result.isLoggedIn) {
      showNotification('Please log in to save links', 'error');
      return;
    }

    // Get meta description if available
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';

    const linkData = {
      url: window.location.href,
      title: document.title,
      description: metaDescription,
      favicon: getFaviconUrl(),
      dateAdded: new Date().toISOString()
    };

    chrome.runtime.sendMessage({
      action: 'save',
      data: linkData
    }, response => {
      if (response && response.success) {
        showNotification(response.message);
      } else {
        showNotification(response.message || 'Error saving link', 'error');
      }
    });
  });
}

function getFaviconUrl() {
  const favicon = document.querySelector('link[rel="icon"]') ||
    document.querySelector('link[rel="shortcut icon"]');
  return favicon ? favicon.href : `${window.location.origin}/favicon.ico`;
}

function showNotification(message, type = 'success') {
  // Remove existing notification if present
  const existingNotification = document.querySelector('.zenith-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'zenith-notification';
  notification.textContent = message;

  const backgroundColor = type === 'success' ? '#10B981' : '#EF4444';

  notification.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: ${backgroundColor};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Initialize save button
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  injectSaveButton();
} else {
  document.addEventListener('DOMContentLoaded', injectSaveButton);
}

// Add these styles to content.css
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
