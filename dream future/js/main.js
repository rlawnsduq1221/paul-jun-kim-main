function handleClick() {
    const result = confirm('편지를 쓰시겠습니까?');
    if(result){
         window.location.href = './timecapsule.html';
    }else{
        alert('취소 되었습니다 ');
    }
}   