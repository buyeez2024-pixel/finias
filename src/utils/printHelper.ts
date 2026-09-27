/**
 * Cross-browser & Iframe-safe print helper
 * Copies the designated element into an isolated printable context to prevent blank pages
 */
export function printElement(elementId: string, documentTitle: string = 'Print Document') {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    window.print();
    return;
  }

  try {
    // Create an invisible iframe specifically for printing this element
    let printIframe = document.getElementById('ultimate-erp-print-frame') as HTMLIFrameElement | null;
    if (printIframe) {
      document.body.removeChild(printIframe);
    }

    printIframe = document.createElement('iframe');
    printIframe.id = 'ultimate-erp-print-frame';
    printIframe.style.position = 'absolute';
    printIframe.style.left = '-9999px';
    printIframe.style.top = '-9999px';
    printIframe.style.width = '1000px';
    printIframe.style.height = '1000px';
    printIframe.style.border = '0';
    // Do not use visibility: hidden or display: none as some browsers won't print hidden iframes
    document.body.appendChild(printIframe);

    const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (!iframeDoc) {
      window.print();
      return;
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

    // Get all style tags and link stylesheets from current document
    let stylesHtml = '';
    const styleTags = document.querySelectorAll('style, link[rel="stylesheet"]');
    styleTags.forEach((tag) => {
      stylesHtml += tag.outerHTML;
    });

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html data-theme="${currentTheme}" class="${currentTheme === 'dark' ? 'dark' : ''}">
        <head>
          <meta charset="utf-8" />
          <title>${documentTitle}</title>
          ${stylesHtml}
          <style>
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 6px !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #print-root {
              width: 100% !important;
              margin: 0 auto !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            @page {
              margin: 4mm;
              size: auto;
            }
            
            /* High-contrast overrides for print regardless of theme */
            :root[data-theme="dark"] body, 
            :root[data-theme="light"] body {
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            
            /* Hide non-printable elements that might have been captured */
            .no-print, button, nav, aside {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div id="print-root">
            ${targetElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Allow CSS & SVG assets to render in the iframe before triggering print
    // Increased timeout for complex invoices
    setTimeout(() => {
      try {
        printIframe?.contentWindow?.focus();
        printIframe?.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print focus failed, falling back to standard window.print()', e);
        window.print();
      }
    }, 250);
  } catch (err) {
    console.error('Error during isolated print execution:', err);
    window.print();
  }
}
