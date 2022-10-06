function displayRecentlyAdded() {
    
    var grid = document.querySelector(".grid_container"); 
    for (var i = 0; i < 8; i++) {
        const item = document.createElement('div');
        item.className = 'grid_item';
        item.innerHTML = `<img src="./src/db/${i}.jpg">`;
        grid.appendChild(item);
    }
}

function displayFilterCategory() {
    var grid = document.querySelector(".grid_container"); 
    for (var i = 0; i < 9; i++) {

    }
}