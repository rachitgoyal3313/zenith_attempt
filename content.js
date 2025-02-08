function injectSaveImage(postElement, link) {
  // Check if save button already exists
  if (postElement.querySelector('.zenith-inline-save')) {
    return;
  }

  const saveImage = document.createElement('img');
  saveImage.src = chrome.runtime.getURL('assets/save-logo.png');
  saveImage.classList.add('zenith-inline-save');

  saveImage.addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();

    const linkData = {
      url: link,
      title: getTitle(postElement),
      description: getDescription(postElement),
      favicon: getFaviconUrl(),
      dateAdded: new Date().toISOString()
    };

    chrome.runtime.sendMessage({action: 'save', data: linkData}, (response) => {
      if (response.success) {
        console.log('Link saved:', link);
        showNotification('Link saved to Zenith!');
      } else {
        console.error('Failed to save link:', response.message);
        showNotification(response?.message || 'Failed to save link.', 'error');
      }
    });
  });

  postElement.appendChild(saveImage);
}



// In content.js, update the getTitle function:

function getTitle(postElement) {
  // YouTube specific title detection
  if (window.location.hostname.includes('youtube.com')) {
    // For main video page
    const mainVideoTitle = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
    if (mainVideoTitle) {
      return mainVideoTitle.textContent.trim();
    }
    
    // Check for video title in search results or recommendations
    const videoTitle = postElement.querySelector('#video-title');
    if (videoTitle) {
      return videoTitle.textContent.trim();
    }
  }

  // Existing title detection logic for other platforms
  // LinkedIn specific title detection
  if (postElement.matches('.feed-shared-update-v2')) {
    const textElement = postElement.querySelector('.feed-shared-text-view span');
    if (textElement) {
      return textElement.textContent.trim();
    }
    
    // Fallback for shared articles
    const articleTitle = postElement.querySelector('.feed-shared-article__title');
    if (articleTitle) {
      return articleTitle.textContent.trim();
    }
  }

  // General title detection
  let titleElement = postElement.querySelector([
    'h1',
    'h2',
    'h3',
    '.title',
    '.headline',
    '[data-testid="tweetText"]'
  ].join(', '));

  if (titleElement) {
    return titleElement.textContent.trim();
  }

  return document.title;
}


function getDescription(postElement) {
    // YouTube specific description
  if (window.location.hostname.includes('youtube.com')) {
    const description = document.querySelector('#description-inner');
    if (description) {
      return description.textContent.trim();
    }
    
    // For video cards/thumbnails
    if (postElement.matches('#video-title')) {
      const videoDescription = postElement.closest('ytd-video-renderer')?.querySelector('#description-text');
      return videoDescription ? videoDescription.textContent.trim() : '';
    }
  }




  // LinkedIn specific description
  if (postElement.matches('.feed-shared-update-v2')) {
    const textElement = postElement.querySelector('.feed-shared-text-view span');
    if (textElement) {
      return textElement.textContent.trim();
    }
    
    // Fallback for shared articles
    const articleDesc = postElement.querySelector('.feed-shared-article__description');
    if (articleDesc) {
      return articleDesc.textContent.trim();
    }
  }

  // General description detection
  let descElement = postElement.querySelector([
    '[data-testid="tweetText"]',
    '.feed-shared-text-view',
    '.post-description',
    '.content'
  ].join(', '));

  if (descElement) {
    return descElement.textContent.trim();
  }

  // YouTube specific
  descElement = document.querySelector('span.content.style-scope.ytd-video-secondary-info-renderer');
  if (descElement) {
    return descElement.textContent.trim();
  }

  return '';
}

function getFaviconUrl() {
  const favicon = document.querySelector('link[rel="icon"]') ||
    document.querySelector('link[rel="shortcut icon"]');
  return favicon ? favicon.href : `${window.location.origin}/favicon.ico`;
}

function detectAndInjectButtons() {
  if (window.location.hostname.includes('youtube.com')) {
    // For main video page
    const mainVideoContainer = document.querySelector('h1.style-scope.ytd-watch-metadata');
    if (mainVideoContainer && !mainVideoContainer.querySelector('.zenith-inline-save')) {
      const videoId = new URLSearchParams(window.location.search).get('v');
      if (videoId) {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const videoData = {
          url: videoUrl,
          title: mainVideoContainer.textContent.trim(),
          description: document.querySelector('#description-inline-expander')?.textContent.trim() || '',
          favicon: getFaviconUrl()
        };
        injectSaveImage(mainVideoContainer, videoUrl, videoData);
      }
    }

    // For videos in search/recommendations
    const videoContainers = document.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer');
    videoContainers.forEach(container => {
      if (!container.querySelector('.zenith-inline-save')) {
        const titleElement = container.querySelector('#video-title');
        if (titleElement && titleElement.href) {
          const videoData = {
            url: titleElement.href,
            title: titleElement.textContent.trim(),
            description: container.querySelector('#description-text')?.textContent.trim() || '',
            favicon: getFaviconUrl()
          };
          injectSaveImage(container, titleElement.href, videoData);
        }
      }
    });
  }
    // LinkedIn feed posts
  const linkedInPosts = document.querySelectorAll('.feed-shared-update-v2');
  linkedInPosts.forEach((post) => {
    if (!post.querySelector('.zenith-inline-save')) {
      let postLink = '';
      
      // First try to get the post permalink
      const permalinkElement = post.querySelector('time[datetime]').closest('a');
      if (permalinkElement) {
        postLink = permalinkElement.href;
      }
      
      // Fallback to article link if it's a shared article
      if (!postLink) {
        const articleElement = post.querySelector('.feed-shared-article__meta-link');
        if (articleElement) {
          postLink = articleElement.href;
        }
      }

      if (postLink) {
        injectSaveImage(post, postLink);
      }
    }
  });

  // Other platform posts
  const otherPosts = document.querySelectorAll([
    'article',
    '[data-testid="tweet"]',
    '[data-test-id="pin"]',
    '#video-title'
  ].join(', '));

  otherPosts.forEach((post) => {
    if (!post.querySelector('.zenith-inline-save')) {
      let postLink = '';

      if (post.matches('[data-testid="tweet"]')) { // Twitter/X
        const tweetLinkElement = post.querySelector('a[href*="/status/"]');
        if (tweetLinkElement) {
          postLink = new URL(tweetLinkElement.href, window.location.origin).href;
        }
      } else if (post.matches('[data-test-id="pin"]')) { // Pinterest
        const pinLinkElement = post.querySelector('a[href*="/pin/"]');
        if (pinLinkElement) {
          postLink = new URL(pinLinkElement.href, window.location.origin).href;
        }
      } else if (post.matches('#video-title')) { // YouTube
        const videoLink = post.closest('a')?.href || '';
        if (videoLink) postLink = videoLink;
      } else if (post.matches('article')) { // Instagram
        const postLinkElement = post.querySelector('a[href*="/p/"]');
        if (postLinkElement) {
          postLink = new URL(postLinkElement.href, window.location.origin).href;
        }
      }

      if (postLink) {
        injectSaveImage(post, postLink);
      }
    }
  });
}

function showNotification(message, type = 'success') {
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

function injectGeneralSaveButton() {
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
      showNotification('Link saved successfully!');
    } else {
      showNotification(response?.message || 'Error saving link', 'error');
    }
  });
}

// Initialize
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  injectGeneralSaveButton();
  detectAndInjectButtons();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    injectGeneralSaveButton();
    detectAndInjectButtons();
  });
}

// Use MutationObserver for dynamic content
const observer = new MutationObserver(detectAndInjectButtons);
observer.observe(document.body, {
  childList: true,
  subtree: true
});



function injectSaveImage(postElement, link, videoData = null) {
  // Check if save button already exists
  if (postElement.querySelector('.zenith-inline-save')) {
    return;
  }

  const saveImage = document.createElement('img');
  saveImage.src = chrome.runtime.getURL('assets/save-logo.png');
  saveImage.classList.add('zenith-inline-save');

  saveImage.addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();

    const linkData = videoData || {
      url: link,
      title: getTitle(postElement),
      description: getDescription(postElement),
      favicon: getFaviconUrl(),
      dateAdded: new Date().toISOString()
    };

    chrome.runtime.sendMessage({action: 'save', data: linkData}, (response) => {
      if (response.success) {
        showNotification('Link saved to Zenith!');
      } else {
        showNotification(response?.message || 'Failed to save link.', 'error');
      }
    });
  });

  // For YouTube main video page, append to a specific location
  if (window.location.hostname.includes('youtube.com') && postElement.matches('h1.style-scope.ytd-watch-metadata')) {
    const container = document.createElement('div');
    container.style.cssText = 'position: relative; display: inline-block; margin-left: 12px; vertical-align: middle;';
    container.appendChild(saveImage);
    postElement.appendChild(container);
  } else {
    postElement.appendChild(saveImage);
  }
} 
