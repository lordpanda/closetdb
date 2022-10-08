const category = ["top", "dress", "outer", "skirt", "pants", "shoes", "jewerly", "underwear", "etc."];


function displayGlobalMenu(parm1) {
    var activeItem = [];
    for(var i = 0; i < 3; i++){
        if(i == parm1){
            activeItem[parm1] = "menu_selected";
        } else {
            activeItem[i] = "menu_unselected";
        }
    }
    document.write(`
    <div class="logo">
        <a href="./index.html"><h1>DressRoom</h1></a>
    </div>
    <input type="checkbox" class="toggler">
    <div class="hamburger"><div></div></div>
    <ul class="menu">
        <li><a class="`+activeItem[0]+`" href="./all.html">View all</a></li>
        <li><a class="`+activeItem[1]+`" href="./filter.html">Filter items</a></li>
        <li><a class="`+activeItem[2]+`" href="./add.html">Add new</a></li>
    </ul>
    `);
}

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
    var grid = document.querySelector(".grid_container_category"); 
    for (var i = 0; i < 9; i++) {
        const item = document.createElement('div');
        item.className = "grid_item grid_category";
        item.innerHTML = `<button class="category_image"><span>`+category[i]+`</span></button>`;
        grid.appendChild(item);
    }
}


/* myFunction toggles between adding and removing the show class, which is used to hide and show the dropdown content */
function show() {
    console.log("ok");
  document.querySelector(".size_region_dropdown").classList.toggle("show");
}


function displayMeasurementInput(selectedCategory) {
    var selected = selectedCategory;
    var accordingSizes = [];

    
    if (selected == "top" || selected == "dress" || selected == "outer") {
        accordingSizes.push("가슴너비", "어깨너비", "소매길이", "소매통", "암홀", "허리너비", "총장");
    } else if (selected == "pants") {
        accordingSizes = ["허리둘레", "엉덩이둘레", "밑위", "밑단", "총장"];
    } else if (selected == "skirt") {
        accordingSizes = ["허리둘레", "엉덩이둘레", "총장"];
    } else if (selected == "shoes") {
        accordingSizes = ["굽높이"];
    } else if (selected == "jewerly") {
        accordingSizes = ["가로", "세로", "길이", "높이", "둘레"];
    }
    
    var grid = document.querySelector(".grid_container_measurement"); 
    for (var i = 0; i < accordingSizes.length; i++) {
        const item = document.createElement('div');
        item.className = "label_with_input";
        item.innerHTML = `<div class="part">`+accordingSizes[i]+`</div> <input type="number" id="measurementInput`+i+`" class="measurement_input"></div>`;
        grid.appendChild(item);
    }
}