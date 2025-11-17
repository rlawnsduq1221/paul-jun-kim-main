document.addEventListener('DOMContentLoaded', () => {
  (function(){
    const form = document.getElementById('capsuleForm');
    const listEl = document.getElementById('capsuleList');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const searchInput = document.getElementById('search');
    const filterSelect = document.getElementById('filter');

    const STORAGE_KEY = 'dearme.timecapsules.v1';
    
    function loadAll(){
      try{
        const raw = localStorage.getItem(STORAGE_KEY) || '[]';
        return JSON.parse(raw);
      }catch(e){
        console.error(e);
        return [];
      }
    }

    function saveAll(list){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function uid(){
      return 'c_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
    }

    function addCapsule(data){
      const list = loadAll();
      list.unshift(data);
      saveAll(list);
      renderList();
    }

    function deleteCapsule(id){
      const list = loadAll().filter(i => i.id !== id);
      saveAll(list);
      renderList();
    }

    function updateCapsule(id, patch){
      const list = loadAll().map(i => i.id === id ? {...i, ...patch} : i);
      saveAll(list);
      renderList();
    }

    function isOpenable(item){
      const now = new Date();
      const openAt = new Date(item.openAt);
      return now >= openAt;
    }

    function renderList(){
      const list = loadAll();
      const q = searchInput.value.trim().toLowerCase();
      const filter = filterSelect.value;
      listEl.innerHTML = ''; // 초기화
      
      list.forEach(item => {
        if(q){
          const found = (item.title + ' ' + item.content).toLowerCase().includes(q);
          if(!found) return;
        }
        
        const openable = isOpenable(item);
        if(filter === 'locked' && openable) return;
        if(filter === 'open' && !openable) return;

        const div = document.createElement('div');
        div.className = 'capsule ' + (openable ? 'open' : 'locked');

        const info = document.createElement('div');
        info.className = 'info';
        const h3 = document.createElement('h3');
        h3.textContent = item.title || '(제목 없음)';
        const sm = document.createElement('div');
        sm.className = 'small';
        sm.textContent = `개봉일: ${new Date(item.openAt).toLocaleString()} · ${item.visibility === 'public' ? '공개' : '비공개'}`;
        info.appendChild(h3);
        info.appendChild(sm);

        const actions = document.createElement('div');
        actions.className = 'actions';
        actions.style.display = 'flex';  
        actions.style.flex = '0.8'     // 버튼 크기 균일하게
        actions.style.gap = '5px';             // 버튼 간격 일정하게
        actions.style.alignItems = 'center';   // 버튼 정렬

        // 공개 캡슐: 개봉일 이후 바로 열기
        if(openable && item.visibility === 'public'){
          const openBtn = document.createElement('button');
          openBtn.className = 'btn_second';
          openBtn.textContent = '열기';
          openBtn.style.flex = '1';            // 균일한 버튼 크기
          openBtn.onclick = () => tryOpen(item);
          actions.appendChild(openBtn);
        }

        // 비공개 캡슐: 개봉일 이후 비밀번호 입력 버튼
        if(openable && item.visibility === 'private'){
          const pwBtn = document.createElement('button');
          pwBtn.className = 'btn_second';
          pwBtn.textContent = '비밀번호 입력';
          pwBtn.style.flex = '1';             // 균일한 버튼 크기
          pwBtn.onclick = () => tryOpen(item);
          actions.appendChild(pwBtn);
        }

        // 삭제 버튼: 항상 표시, 크기 비슷하게
        const delBtn = document.createElement('button');
        delBtn.className = 'btn_second';
        delBtn.textContent = '삭제';
        delBtn.style.flex = '1'; 
        delBtn.onclick = () => {
          if(confirm('정말 삭제할까요?')) deleteCapsule(item.id);
        };
        actions.appendChild(delBtn);

        div.append(info, actions);
        listEl.append(div);
      });

      if(list.length === 0){
        listEl.innerHTML = '<div class="meta">아직 저장된 캡슐이 없습니다. 왼쪽에서 작성해보세요.</div>';
      }
    }

    function tryOpen(item){
      if(!isOpenable(item)){
        alert('아직 개봉일이 되지 않았습니다.');
        return;
      }

      if(item.visibility === 'private'){
        const pw = prompt('비밀번호를 입력하세요:');
        if(pw === null) return; // 취소
        if(pw !== item.password){
          alert('비밀번호가 틀렸습니다.');
          return;
        }
      }

      showModal(item);
    }

    function showModal(item){
      const tpl = document.getElementById('modalTpl');
      const clone = tpl.content.cloneNode(true);
      const backdrop = clone.querySelector('.modal-backdrop');
      const modal = backdrop.querySelector('.modal');
      modal.querySelector('h2').textContent = item.title || '(제목 없음)';
      modal.querySelector('#modalMeta').textContent =
        `작성일: ${new Date(item.createdAt).toLocaleString()} · 개봉일: ${new Date(item.openAt).toLocaleString()}`;
      modal.querySelector('#modalContent').textContent = item.content || '';

      modal.querySelector('#closeModal').onclick = () => {
        backdrop.remove();
        if(!item.opened){
          updateCapsule(item.id, { opened: true, openedAt: new Date().toISOString() });
        }
      };
      document.body.appendChild(backdrop);
    }

    // 캡슐 작성 (편집 기능 제거)
    form.addEventListener('submit', e => {
      e.preventDefault();
      const id = uid(); // 항상 새 캡슐 생성
      const data = {
        id,
        title: document.getElementById('title').value.trim(),
        content: document.getElementById('content').value.trim(),
        openAt: document.getElementById('openAt').value,
        visibility: document.getElementById('visibility').value,
        password: document.getElementById('password').value || '',
        createdAt: new Date().toISOString(),
        opened: false,
      };
      addCapsule(data);
      form.reset();
    });

    // 내보내기
    exportBtn.addEventListener('click', () => {
      const data = loadAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Dearme.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    // 가져오기
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = e => {
          const f = e.target.files[0];
          if(!f) return;
          const r = new FileReader();
          r.onload = ev => {
            try{
              const parsed = JSON.parse(ev.target.result);
              if(!Array.isArray(parsed)) throw new Error('잘못된 형식');
              const current = loadAll();
              const map = new Map(current.map(i => [i.id, i]));
              parsed.forEach(i => map.set(i.id, i));
              const merged = Array.from(map.values());
              saveAll(merged);
              renderList();
              alert('가져오기 완료');
            }catch(err){
              alert('가져오기 실패: ' + err.message);
            }
          };
          r.readAsText(f, 'utf-8');
        };
        input.click();
      });
    }

    searchInput.addEventListener('input', renderList);
    filterSelect.addEventListener('change', renderList);

    renderList(); 
  })();
});
