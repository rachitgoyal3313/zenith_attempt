chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'save') {
      chrome.storage.local.get(['links'], result => {
        const links = result.links || [];
        links.push(request.data);
        
        chrome.storage.local.set({ links }, () => {
          sendResponse({ success: true });
        });
      });
      
      return true; // Required for async response
    }
  });