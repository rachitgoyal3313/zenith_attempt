chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshLinks') {
    loadLinks();
  }
});

// Constants for API endpoints
const API_URL = 'http://localhost:3000/api'; // Change this to your backend URL

// Check authentication status when popup opens
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();

  // Set up login functionality
  document.getElementById('loginBtn').addEventListener('click', handleLogin);

  // Set up logout functionality
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Set up search functionality
  document.querySelector('.search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterLinks(searchTerm);
  });
});

async function checkAuthStatus() {
  try {
    const { token } = await chrome.storage.sync.get(['token']);
    if (!token) {
      showLoginContainer();
      return;
    }

    // Verify token with backend
    const response = await fetch(`${API_URL}/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      showMainContainer();
      loadLinks();
    } else {
      handleLogout();
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    showLoginContainer();
  }
}

function showLoginContainer() {
  document.getElementById('loginContainer').style.display = 'block';
  document.getElementById('mainContainer').style.display = 'none';
}

function showMainContainer() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('mainContainer').style.display = 'block';
}
// Modify popup.js - Update the login and logout handlers
function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Basic validation
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Please enter a valid email');
    return;
  }

  // Generate JWT token
  const token = generateJWT(email);

  // Store auth data and token
  const authData = {
    email,
    password: hashPassword(password),
    isLoggedIn: true,
    loginTime: new Date().toISOString()
  };

  // Using chrome.storage.sync to sync across devices
  chrome.storage.sync.set({
    authData: authData,
    token: token,
    isLoggedIn: true
  }, () => {
    if (chrome.runtime.lastError) {
      showError('Error saving credentials. Please try again.');
      return;
    }

    showMainContainer();
    loadLinks();
  });
}

function handleLogout() {
  chrome.storage.sync.set({ isLoggedIn: false }, () => {
    chrome.storage.sync.remove(['authData', 'token'], () => {
      showLoginContainer();
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
    });
  });
}




function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 3000);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Rest of the code remains the same...

// Simple JWT token generator
function generateJWT(email) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    email: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiration
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(encodedHeader + '.' + encodedPayload + 'SECRET_KEY'); // In production, use a proper secret key

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Check if token is expired
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp < Math.floor(Date.now() / 1000);
  } catch (e) {
    return true;
  }
}

// Check authentication status when popup opens
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();

  // Set up login functionality
  document.getElementById('loginBtn').addEventListener('click', handleLogin);

  // Set up logout functionality
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Set up search functionality
  document.querySelector('.search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterLinks(searchTerm);
  });
});

function checkAuthStatus() {
  chrome.storage.sync.get(['authData', 'token'], (result) => {
    const { authData, token } = result;

    if (token && !isTokenExpired(token) && authData) {
      showMainContainer();
      loadLinks();
    } else {
      // Clear expired tokens and auth data
      if (token || authData) {
        handleLogout();
      } else {
        showLoginContainer();
      }
    }
  });
}

function showLoginContainer() {
  document.getElementById('loginContainer').style.display = 'block';
  document.getElementById('mainContainer').style.display = 'none';
}

function showMainContainer() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('mainContainer').style.display = 'block';
}

function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Basic validation
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Please enter a valid email');
    return;
  }

  // Generate JWT token
  const token = generateJWT(email);

  // Store auth data and token
  const authData = {
    email,
    password: hashPassword(password), // In a real app, use proper encryption
    isLoggedIn: true,
    loginTime: new Date().toISOString()
  };

  // Using chrome.storage.sync to sync across devices
  chrome.storage.sync.set({
    authData: authData,
    token: token
  }, () => {
    if (chrome.runtime.lastError) {
      showError('Error saving credentials. Please try again.');
      return;
    }

    // Also store in browser's localStorage for faster access
    try {
      localStorage.setItem('zenithToken', token);
      localStorage.setItem('zenithAuth', JSON.stringify(authData));
    } catch (e) {
      console.warn('Could not store in localStorage:', e);
    }

    showMainContainer();
    loadLinks();
  });
}

function handleLogout() {
  // Clear from chrome.storage.sync
  chrome.storage.sync.remove(['authData', 'token'], () => {
    // Clear from localStorage
    try {
      localStorage.removeItem('zenithToken');
      localStorage.removeItem('zenithAuth');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }

    showLoginContainer();
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
  });
}

function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 3000);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function hashPassword(password) {
  // This is a simple hash function for demonstration
  // In a real app, use proper encryption like bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function loadLinks() {
  chrome.storage.local.get(['links'], (result) => {
    const links = result.links || [];
    displayLinks(links);
  });
}

function displayLinks(links) {
  const container = document.getElementById('linksContainer');
  container.innerHTML = '';

  if (links.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6b7280;">No saved links yet</p>';
    return;
  }

  links.forEach(link => {
    const linkElement = createLinkElement(link);
    container.appendChild(linkElement);
  });
}

function createLinkElement(link) {
  const div = document.createElement('div');
  div.className = 'link-item';

  const favicon = link.favicon ?
    `<img src="${link.favicon}" alt="" style="width: 16px; height: 16px; margin-right: 8px;">` : '';

  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div style="display: flex; align-items: flex-start; flex: 1;">
        ${favicon}
        <div style="flex: 1;">
          <div class="link-title">${link.title}</div>
          <div class="link-url">${link.url}</div>
          <div class="link-date">${new Date(link.dateAdded).toLocaleString()}</div>
        </div>
      </div>
      <button class="delete-btn" data-url="${link.url}" aria-label="Delete link">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  // Make the entire link item clickable
  div.addEventListener('click', (e) => {
    if (!e.target.closest('.delete-btn')) {
      chrome.tabs.create({ url: link.url });
    }
  });

  // Add delete button handler
  div.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteLink(link.url);
  });

  return div;
}

function deleteLink(url) {
    chrome.storage.local.get(['links'], (result) => {
        let links = result.links || [];
        links = links.filter(link => link.url !== url);  // Filter out the link to be deleted

        chrome.storage.local.set({ links: links }, () => { // Set the updated links to the storage
            loadLinks(); // Refresh the display
        });
    });
}

function filterLinks(searchTerm) {
  chrome.storage.local.get(['links'], (result) => {
    const links = result.links || [];
    const filteredLinks = links.filter(link =>
      link.title.toLowerCase().includes(searchTerm) ||
      link.url.toLowerCase().includes(searchTerm)
    );
    displayLinks(filteredLinks);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadLinks();

  // Listen for refresh messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'refreshLinks') {
      loadLinks();
    }
  });
});
