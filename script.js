window.onload = function(){



   // 날짜를 한국 식으로 가져오는 방법 
   const date = new Date();
   var Today = date.toLocaleString('ko-kr');
   displayRecentlyAdded();
}

function displayRecentlyAdded() {
    
    var grid = document.querySelector(".grid_container"); 
    for (var i = 0; i < 4; i++) {
        const item = document.createElement('div');
        item.className = 'grid_item';
        item.innerHTML = `<a href="#"><img src="./src/db/${i}.jpg"></a>`;
        grid.appendChild(item);
    }
}