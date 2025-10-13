document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById("toggleSidebar");
  const closeBtn = document.getElementById("closeSidebar");
  const rightSidebar = document.getElementById("rightSidebar");

  if (toggleBtn && rightSidebar)
    toggleBtn.addEventListener("click", () => rightSidebar.classList.add("active"));
  if (closeBtn && rightSidebar)
    closeBtn.addEventListener("click", () => rightSidebar.classList.remove("active"));

  // ===== 커뮤니티 피드 =====
  const feedList = document.getElementById('feedList');
  const feedBtn = document.getElementById('feedBtn');
  const feedInput = document.getElementById('feedInput');
  let feeds = JSON.parse(localStorage.getItem('feeds')) || [];

  const renderFeeds = () => {
    feedList.innerHTML = '';
    feeds.forEach((t, i) => {
      const div = document.createElement('div');
      div.className = 'feed-item';
      div.innerHTML = `<span><b>익명</b>: ${t}</span><button class="delete-btn" data-i="${i}">✖</button>`;
      feedList.appendChild(div);
    });
    document.querySelectorAll('.feed-item .delete-btn').forEach(btn => {
      btn.onclick = () => {
        feeds.splice(btn.dataset.i, 1);
        localStorage.setItem('feeds', JSON.stringify(feeds));
        renderFeeds();
      };
    });
  };
  renderFeeds();

  feedBtn.onclick = () => {
    const text = feedInput.value.trim();
    if (!text) return;
    feeds.unshift(text);
    localStorage.setItem('feeds', JSON.stringify(feeds));
    feedInput.value = '';
    renderFeeds();
  };

  feedInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') feedBtn.click();
  });

  // ===== 목표 / 챌린지 =====
  const sections = [
    { key: 'shortTerm', listId: 'shortTermList', inputId: 'shortTermInput', btnId: 'shortTermBtn', color: 'blue' },
    { key: 'completed', listId: 'completedList', inputId: 'completedInput', btnId: 'completedBtn', color: 'green' },
    { key: 'longTerm', listId: 'longTermList', inputId: 'longTermInput', btnId: 'longTermBtn', color: 'purple' },
    { key: 'weekly', listId: 'weeklyList', inputId: 'weeklyInput', btnId: 'weeklyBtn', color: 'orange' }
  ];

  sections.forEach(s => {
    const list = document.getElementById(s.listId);
    const input = document.getElementById(s.inputId);
    const btn = document.getElementById(s.btnId);
    let items = JSON.parse(localStorage.getItem(s.key)) || [];

    const render = () => {
      list.innerHTML = '';
      items.forEach((t, i) => {
        const d = document.createElement('div');
        d.className = `goal ${s.color}`;
        d.innerHTML = `${t}<button class="delete-btn" data-i="${i}">✖</button>`;
        list.appendChild(d);
      });
      list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = () => {
          items.splice(btn.dataset.i, 1);
          localStorage.setItem(s.key, JSON.stringify(items));
          render();
        };
      });
    };

    btn.onclick = () => {
      const text = input.value.trim();
      if (!text) return;
      items.unshift(text);
      localStorage.setItem(s.key, JSON.stringify(items));
      input.value = '';
      render();
    };

    input.addEventListener('keypress', e => {
      if (e.key === 'Enter') btn.click();
    });

    render();
  });
});
