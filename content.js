function injectSaveIcon() {
    const saveIcon = document.createElement('div');
    saveIcon.className = 'zenith-save-icon';
    saveIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
    `;
  
    saveIcon.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;
  
    saveIcon.addEventListener('click', handleSaveClick);
    document.body.appendChild(saveIcon);
  }
  
  function handleSaveClick() {
    // Send message to background script to handle saving
    chrome.runtime.sendMessage({
      action: 'save',
      data: {
        url: window.location.href,
        title: document.title,
        dateAdded: new Date().toISOString()
      }
    }, response => {
      if (response && response.success) {
        showNotification('Link saved successfully!');
      } else {
        showNotification('Error saving link. Please try again.', 'error');
      }
    });
  }
  
  function showNotification(message, type = 'success') {
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
    `;
  
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
  
  // Initialize save icon
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    injectSaveIcon();
  } else {
    document.addEventListener('DOMContentLoaded', injectSaveIcon);
  }