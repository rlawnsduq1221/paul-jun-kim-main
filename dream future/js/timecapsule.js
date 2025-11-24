document.addEventListener('DOMContentLoaded', () => {
  (function(){
    const form = document.getElementById('capsuleForm');
    const listEl = document.getElementById('capsuleList');
    const exportBtn = document.getElementById('exportBtn');
    const searchInput = document.getElementById('search');
    const filterSelect = document.getElementById('filter');
    const mediaInput = document.getElementById('mediaUpload');

    const STORAGE_KEY = 'dearme.timecapsules.v1';
    
    function loadAll(){
      try{
        const raw = localStorage.getItem(STORAGE_KEY) || '[]';
        return JSON.parse(raw);
      }catch(e){
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
      return new Date() >= new Date(item.openAt);
    }

    function renderList(){
      const list = loadAll();
      const q = searchInput.value.trim().toLowerCase();
      const filter = filterSelect.value;
      listEl.innerHTML = '';
      
      if(list.length === 0){
        listEl.innerHTML = '<div class="meta">저장된 캡슐이 없습니다.</div>';
        return;
      }

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
        sm.textContent = `개봉일: ${new Date(item.openAt).toLocaleString()}`;

        info.appendChild(h3);
        info.appendChild(sm);

        const actions = document.createElement('div');
        actions.className = 'actions';
        actions.style.display = 'flex';
        actions.style.flex = '1';
        actions.style.gap = '5px';

        const openBtn = document.createElement('button');
        openBtn.className = 'btn_second';
        openBtn.style.flex = '1';
        openBtn.textContent = openable ? '열기' : '잠김';
        openBtn.onclick = () => tryOpen(item);
        actions.appendChild(openBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'btn_second';
        delBtn.style.flex = '1';
        delBtn.textContent = '삭제';
        delBtn.onclick = () => {
          if(confirm('정말 삭제할까요?')) deleteCapsule(item.id);
        };
        actions.appendChild(delBtn);

        div.append(info, actions);
        listEl.append(div);
      });
    }

    function tryOpen(item){
      if(!isOpenable(item)){
        alert('아직 개봉일이 되지 않았습니다.');
        return;
      }

      if(item.visibility === 'private' && item.password){
        const pw = prompt('비밀번호를 입력하세요:');
        if(!pw || pw !== item.password){
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

      const contentBox = modal.querySelector('#modalContent');
      contentBox.innerHTML = '';

      // 내용 텍스트 추가
      const p = document.createElement('p');
      p.textContent = item.content;
      contentBox.appendChild(p);

      // 이미지/영상 표시
      if(item.media && item.media.type){
        if(item.media.type.startsWith('image')){
          const img = document.createElement('img');
          img.src = item.media.data;
          img.style.maxWidth = '100%';
          img.style.borderRadius = '10px';
          img.style.marginTop = '10px';
          contentBox.appendChild(img);
        }
        else if(item.media.type.startsWith('video')){
          const video = document.createElement('video');
          video.src = item.media.data;
          video.controls = true;
          video.style.maxWidth = '100%';
          video.style.marginTop = '10px';
          contentBox.appendChild(video);
        }
      }

      modal.querySelector('#closeModal').onclick = () => {
        backdrop.remove();
        if(!item.opened){
          updateCapsule(item.id, { opened: true, openedAt: new Date().toISOString() });
        }
      };

      document.body.appendChild(backdrop);
    }

    // Base64 변환 함수
    function fileToBase64(file){
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // 캡슐 저장
    form.addEventListener('submit', async e => {
      e.preventDefault();

      let media = null;

      if(mediaInput.files.length > 0){
        const file = mediaInput.files[0];

        if(file.size > 100 * 1024 * 1024){ // 100MB
          alert('파일이 100MB를 초과합니다.');
          return;
        }

        const base64 = await fileToBase64(file);
        media = {
          name: file.name,
          type: file.type,
          data: base64
        };
      }

      const data = {
        id: uid(),
        title: document.getElementById('title').value.trim(),
        content: document.getElementById('content').value.trim(),
        openAt: document.getElementById('openAt').value,
        visibility: document.getElementById('visibility').value,
        password: document.getElementById('password').value || '',
        media,
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

    searchInput.addEventListener('input', renderList);
    filterSelect.addEventListener('change', renderList);

    renderList(); 
  })();
});
const mediaInput = document.getElementById("mediaUpload");
const fileLabel = document.getElementById("selectedFiles");

mediaInput.addEventListener("change", () => {
  if (mediaInput.files.length === 0) {
    fileLabel.textContent = "";
    return;
  }

  const files = Array.from(mediaInput.files).map(f => `${f.name} (${Math.round(f.size/1024/1024)}MB)`);
  fileLabel.textContent = "선택된 파일:  " + files.join(", ");
}); 
