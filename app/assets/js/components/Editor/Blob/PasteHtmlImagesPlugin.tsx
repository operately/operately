import { Plugin } from "prosemirror-state";

/**
 * This plugin removes images from HTML content when pasting from websites,
 * while preserving all other formatting like bold text, headings, etc.
 */
export const PasteHtmlImagesPlugin = new Plugin({
  props: {
    handlePaste: (view, event) => {
      const html = event.clipboardData?.getData('text/html');

      // Only process if we have HTML with images
      if (!html || !html.includes('<img')) return false;
      
      // Create a temporary element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Find all img elements and remove them
      const images = tempDiv.querySelectorAll('img');
      if (images.length === 0) return false;
      
      images.forEach(img => img.remove());
      
      // Find and remove empty paragraphs (that might have contained only images)
      const paragraphs = tempDiv.querySelectorAll('p');
      paragraphs.forEach(p => {
        if (p.innerHTML.trim() === '') {
          p.remove();
        }
      });
      
      // Get the modified HTML with images removed but formatting preserved
      const modifiedHtml = tempDiv.innerHTML;
      
      // Create a new clipboard data object
      const clipboardData = new DataTransfer();
      
      // Set the modified HTML
      clipboardData.setData('text/html', modifiedHtml);
      
      // Set plain text as fallback
      clipboardData.setData('text/plain', tempDiv.textContent || '');
      
      // Create a new clipboard event with our modified data
      const clipboardEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: clipboardData
      });
      
      // Stop the original paste event
      event.preventDefault();
      
      // Let TipTap handle the new paste event with images removed
      view.dom.dispatchEvent(clipboardEvent);
      
      // Return true to prevent further handling of the original paste event
      return true;
    }
  }
});
