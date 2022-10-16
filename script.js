
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
        item.setAttribute("onClick", "location.href='./item.html?id="+i+"'");
        item.className += ' clickable';
        item.innerHTML = `<img src="./src/db/${i}.jpg">`;
        grid.appendChild(item);
    }
}


/* add */

window.onload = function() {
    const input = document.querySelector('input[class="file_uploader"]');
    if (input){
        console.log("there it is");
        const fileUpload = document.querySelector(".file_uploader");
        const fileUploadButton = document.querySelector(".add_image");
        fileUploadButton.addEventListener('click', () => fileUpload.click());
    }
}


function showSub() {
    
    document.querySelector(".sub_category").classList.add("show_sub");
}
function hideSub() {
    document.querySelector(".sub_category").classList.remove("show_sub");
}
function displayFilterCategory() {
    var grid = document.querySelector(".grid_container_category"); 
    for (var i = 0; i < categoryList.length; i++) {
        const item = document.createElement('div');
        item.className = "grid_category";
        item.innerHTML = `<input type="radio" name="category_input" class="category_image" id="category_list_`+i+`" value="`+categoryList[i]+`"/><label for="category_list_`+i+`">`+categoryList[i]+`</label></input>`;
        grid.appendChild(item);
        const temp = categoryList[i];
        if (temp == "dress" || temp == "top" || temp == "outer" || temp == "skirt" || temp == "pants") {
            item.addEventListener('click', showSub);
            console.log(temp);
        } else {
            item.addEventListener('click', hideSub);
        }
        //     
        // } else {
        //     document.querySelector(".sub_category").style.display = "none";
        // }
        item.addEventListener('click', function() {
            displayFilterSubCategory(temp);}, false);
        item.addEventListener('click', function() {
            displayMeasurementInput(temp);}, false);
        
        }
    
}

function displayFilterSubCategory(cat) {
    var grid = document.querySelector(".grid_container_sub_category");
    grid.innerHTML = ``;

    if (cat == "dress" || cat == "top" || cat == "outer") {
        for (var i = 3; i < 5; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input_sleeve" class="category_image" id="sub_category_list_`+i+`" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
            grid.appendChild(item);
        } 
    } if (cat == "dress" || cat == "skirt") {
        for (var i = 0; i < 3; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input_length" class="category_image" id="sub_category_list_`+i+`" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
            grid.appendChild(item);
        } 
    } if (cat == "pants") {
        for (var i = 5; i < 7; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input_length" class="category_image" id="sub_category_list_`+i+`" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
            grid.appendChild(item);
        } 
    }
}

/* myFunction toggles between adding and removing the show class, which is used to hide and show the dropdown content */
function show() {
    document.querySelector(".size_region_dropdown").classList.toggle("show");
}


function displaySizeRegionDropdown() {
    var drop = document.querySelector(".size_region_dropdown"); 
    for (var i = 0; i < sizeRegionList.length; i++) {
        
        const item = document.createElement('button');
        item.className = "size_region";
        item.innerHTML = sizeRegionList[i]+`</button>`;
        item.value = sizeRegionList[i];
        drop.appendChild(item);
        item.addEventListener('click', function() {
            displaySizesByRegion(this.value);}, false);
        item.addEventListener('click', show);
        item.addEventListener('click', function() {
            selectedSizeRegion(this.value);}, false);
    }
}

function displaySizesByRegion(region) {

    var accordingSizes = [];
    if (region == "US") {
        accordingSizes.push("00", 0, 2);
    } else if (region == "UK") {
        accordingSizes.push(4, 6, 8, 10);
    } else if (region == "EU") {
        accordingSizes.push(35, 35.5, 36, 36.5, 37);
    } else if (region == "FR") {
        accordingSizes.push(32, 34, 36);
    }else if (region == "DE") {
        accordingSizes.push(32, 34, 36);
    } else if (region == "IT") {
        accordingSizes.push(34, 36, 38);
    } else if (region == "WW") {
        accordingSizes.push("one size", "XXS", "XXS", "XS", "S", "M", "L", "XL");
    } else if (region == "KR") {
        accordingSizes.push(230, 235, 240);
    } else if (region == "Ring") {
        accordingSizes.push(48, 50, 52, 4, 5, 6, "KR 7", "KR 8", "KR 9", "KR 10", "KR 11", "I", "J");
    }
    var grid = document.querySelector(".size_key_container");
    grid.innerHTML = ``;
    for (var i = 0; i < accordingSizes.length; i++) {
        
        const item = document.createElement('div');
        item.className = "size_key";
        item.innerHTML = `<input type="radio" name="size_key" id="size_key_`+i+`"/><label for="size_key_`+i+`">`+accordingSizes[i]+`</label></input>`;
        grid.appendChild(item);
    }
    var cont = document.querySelector(".grid_container_size");
    if (accordingSizes.length > 5){
        cont.style.height = "120px";
    } else if (accordingSizes.length > 10){
        cont.style.height = "180px";
    } else {
        cont.style.height = "80px";
    }
}
function selectedSizeRegion(region){
    var button = document.querySelector(".size_region_selected");
    button.innerHTML = region;
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
    } else if (selected == "jewerly" || selected == ".etc") {
        accordingSizes = ["가로", "세로", "길이", "높이", "둘레"];
    }
    
    var grid = document.querySelector(".grid_container_measurement"); 
    grid.innerHTML = ``;
    for (var i = 0; i < accordingSizes.length; i++) {
        const item = document.createElement('div');
        item.className = "label_with_input";
        item.innerHTML = `<div class="part">`+accordingSizes[i]+`</div> <input type="number" id="measurementInput`+i+`" class="measurement_input"></div>`;
        grid.appendChild(item);
    }
}

function displayCompositionInput() {
    var grid = document.querySelector(".grid_container_composition");
    for (var i = 0; i < compositionList.length; i++) {
        const item = document.createElement('div');
        item.className = "label_with_input";
        item.innerHTML = `<div class="part">`+compositionList[i]+`</div> <input type="number" id="compositionInput`+i+`" class="composition_input"></div>`;
        grid.appendChild(item);
    }
}


function displayItemImage() {
    let query = window.location.search;
    let param = new URLSearchParams(query);
    let id = param.get('id');

    var placeHolder = document.querySelector(".view_item_image");

    const item = document.createElement('img');
    item.src = `./src/db/`+id+`.jpg`;
    placeHolder.appendChild(item);
}

function input(){
    // var pic = document.getElementById('myFile').files[0].name;
    var category =document.querySelector('input[name="category_input"]:checked').value;
    var name = document.getElementById('myName').value;
    var age = document.getElementById('myAge').value;
    window.prompt("아래 내용을 복사 하세요", 'addItem("'+name+'","'+age+'","./img/'+pic+'");');
}

function addItem(thumbnail, img, imgs, category, subcategory, sizeRegion, sizeKey, brand, ){

}