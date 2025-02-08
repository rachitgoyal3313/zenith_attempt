chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'save') {
      chrome.storage.local.get(['links'], result => {
          const links = result.links || [];

          // Check if URL already exists
          const urlExists = links.some(link => link.url === request.data.url);

          if (!urlExists) {
              // Add new link to beginning of array
              links.unshift({
                  ...request.data,
                  id: Date.now(),
                  tags: []
              });

              chrome.storage.local.set({ links }, () => {
                  sendResponse({
                      success: true,
                      message: 'Link saved successfully!'
                  });
                  // Notify popup to refresh
                  chrome.runtime.sendMessage({ action: 'refreshLinks' });
              });
          } else {
              sendResponse({
                  success: false,
                  message: 'Link already saved!'
              });
          }
      });
      return true; // Required for async response
  }
});
