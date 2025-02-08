chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'save') {
    chrome.storage.local.get(['links'], result => {
      const links = result.links || [];

      // Check if URL already exists
      const urlExists = links.some(link => link.url === request.data.url);

      if (!urlExists) {
        links.push({
          ...request.data,
          id: Date.now(), // Add unique ID for each link
          tags: [], // Initialize empty tags array
        });

        chrome.storage.local.set({ links }, () => {
          sendResponse({
            success: true,
            message: 'Link saved successfully!'
          });
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
