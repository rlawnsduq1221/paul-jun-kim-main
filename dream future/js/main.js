function handleClick() {
    const result = confirm('타임캡슐을 묻어보시겠습니까?');
    if(result){
         window.location.href = './timecapsule.html';
    }else{
        alert('취소 되었습니다 ');
    }
} 
//