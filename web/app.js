
// Theme & year
const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') document.body.classList.add('light');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
}

(async () => {
  try {
    const res = await fetch('/api/token', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to mint Direct Line token');
    const { token } = await res.json();

    window.WebChat.renderWebChat(
      {
        directLine: window.WebChat.createDirectLine({ 
          token,
          domain: 'https://europe.directline.botframework.com/v3/directline'
        }),
        styleOptions: { accent: '#60a5fa', hideUploadButton: true, botAvatarInitials: 'AI', userAvatarInitials: 'You' }
      },
      document.getElementById('webchat')
    );
    document.getElementById('webchat').focus();
  } catch (err) {
    console.error(err);
    const warning = document.createElement('div');
    warning.style.padding = '12px';
    warning.style.background = '#f59e0b';
    warning.style.color = '#0b0f17';
    warning.textContent = 'Unable to obtain Direct Line token. Check /api/token and DIRECT_LINE_SECRET.';
    document.querySelector('.chat-card').prepend(warning);
  }
})();
