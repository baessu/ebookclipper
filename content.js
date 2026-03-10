// 밀리의 서재 하이라이트 추출 Content Script

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractHighlights') {
    const result = extractHighlightTexts();
    sendResponse(result);
  }
  return true;
});

function extractHighlightTexts() {
  // data-section-type이 highlight_detail인 div의 자식 p 태그 선택
  const highlightElements = document.querySelectorAll(
    'div[data-section-type="highlight_detail"] p[class^="styled__HighlightContent"]'
  );

  const highlightTexts = [];

  highlightElements.forEach(element => {
    const text = element.textContent.trim();
    if (text) {
      highlightTexts.push(text);
    }
  });

  if (highlightTexts.length === 0) {
    return { success: false, count: 0, text: '' };
  }

  const formattedText = highlightTexts.join('\n\n');

  return { success: true, count: highlightTexts.length, text: formattedText };
}
