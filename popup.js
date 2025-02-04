document.addEventListener('DOMContentLoaded', () => {
  loadLinks();
  
  // Set up search functionality
  document.querySelector('.search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterLinks(searchTerm);
  });
});

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
  
  links.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  
  links.forEach(link => {
    const linkElement = createLinkElement(link);
    container.appendChild(linkElement);
  });
}

function createLinkElement(link) {
  const div = document.createElement('div');
  div.className = 'link-item';
  
  div.innerHTML = `
    <button class="delete-btn" data-url="${link.url}">×</button>
    <div class="link-title">${link.title}</div>
    <div class="link-url">${link.url}</div>
    <div class="link-date">${new Date(link.dateAdded).toLocaleString()}</div>
  `;
  
  div.querySelector('.delete-btn').addEventListener('click', () => deleteLink(link.url));
  
  return div;
}

function deleteLink(url) {
  chrome.storage.local.get(['links'], (result) => {
    const links = result.links || [];
    const updatedLinks = links.filter(link => link.url !== url);
    
    chrome.storage.local.set({ links: updatedLinks }, () => {
      loadLinks();
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
  