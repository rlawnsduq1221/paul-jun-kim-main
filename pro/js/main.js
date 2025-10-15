const openBtn = document.getElementById('openWrite');
  const modalBack = document.getElementById('modalBack');
  const closeModal = document.getElementById('closeModal');
  const saveBtn = document.getElementById('saveLetter');
  const paper = document.getElementById('paperPreview');

  function openModal(){
    modalBack.classList.add('open');
    // focus textarea
    setTimeout(()=>document.getElementById('body').focus(),180);
  }
  function closeModalFn(){
    modalBack.classList.remove('open');
  }

  openBtn.addEventListener('click', openModal);
  paper.addEventListener('click', openModal);
  closeModal.addEventListener('click', closeModalFn);
  modalBack.addEventListener('click', (e)=>{
    if(e.target === modalBack) closeModalFn();
  });

  saveBtn.addEventListener('click', ()=>{
    const title = document.getElementById('title').value || '무제';
    const body = document.getElementById('body').value || '(내용 없음)';
    const date = document.getElementById('openDate').value || '미지정';
    // 여기선 저장 로직이 없으니 일단 미리보기만 띄움
    closeModalFn();
    alert('저장되었습니다. (시안)\\n제목: ' + title + '\\n개봉일: ' + date);
  });