

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
        <a href="./index.html"><h1>closetDB</h1></a>
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
        const fileUpload = document.querySelector(".file_uploader");
        const fileUploadButton = document.querySelector(".add_image");
        fileUploadButton.addEventListener('click', () => fileUpload.click());
    }
}


function readImages() {
    var file = document.querySelector('input[class="file_uploader"]').files[0];
    var container = document.querySelector(".container_images");


    /*
    var reader  = new FileReader();

    console.log(reader);
    reader.onloadend = function () {
        var img = document.createElement("img");
        img.src = reader.result;
        if (document.querySelector(".preview_image")){
            document.querySelector(".add_image").before(preview);
        } else {
            container.prepend(preview);
            document.querySelector(".add_image_blank").remove();
        }
        preview.appendChild(img);
    }

    if (file) {
        reader.readAsDataURL(file);
    } else {
        preview.src = "";
    }
    */
    
    var files = document.querySelector('input[class="file_uploader"]').files;
    for (let i = 0; i < files.length; i++) {
        const preview = document.createElement('div');
        preview.className = "preview_image";

        const currentImageUrl = URL.createObjectURL(files[i]);
        var img = document.createElement("img");
        img.src = currentImageUrl;
        
        preview.appendChild(img);
        if (document.querySelector(".preview_image")){
            document.querySelector(".add_image").before(preview);
        } else {
            container.prepend(preview);
            document.querySelector(".add_image_blank").remove();
        }
        preview.appendChild(img);
        preview.addEventListener('click', () => {
            preview.remove();
        });
    
        /*
        var reader  = new FileReader();
        reader.onload = function(event){
            img.setAttribute("src", event.target.result);
        }
        */
    }

//    preview.src = URL.createObjectURL(imgSelected.currentTarget.files[0]); //파일 객체에서 이미지 데이터 가져옴.
    // document.querySelector('.dellink').style.display = 'block'; // 이미지 삭제 링크 표시
  
    /*
    //이미지 로딩 후 객체를 메모리에서 해제
    preview.onload = function() {
      URL.revokeObjectURL(preview.src);
    }
    */
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
function displayFilterCategoryWithoutEventListener() {
    var grid = document.querySelector(".grid_container_category"); 
    for (var i = 0; i < categoryList.length; i++) {
        const item = document.createElement('div');
        item.className = "grid_category";
        item.innerHTML = `<input type="radio" name="category_input" class="category_image" id="category_list_`+i+`" value="`+categoryList[i]+`"/><label for="category_list_`+i+`">`+categoryList[i]+`</label></input>`;
        grid.appendChild(item);
        const temp = categoryList[i];
    }
    
}
function displayFilterLength() {
    var grid = document.querySelector(".grid_container_sub_category");
    var grid2 = document.querySelector(".grid_container_sub_category_2");
    grid.innerHTML = ``;
    grid2.innerHTML = ``;
    for (var i = 3; i < 5; i++) {
        const item = document.createElement('div');
        item.className = "grid_sub_category";
        item.innerHTML = `<input type="radio" name="sub_category_input_sleeve" class="category_image" id="sub_category_list_`+i+`" value="`+subCategoryList[i]+`" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
        grid.appendChild(item);
    } 
    for (var i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.className = "grid_sub_category";
        item.innerHTML = `<input type="radio" name="sub_category_input_length" class="category_image" id="sub_category_list_`+i+`" value="`+subCategoryList[i]+`" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
        grid2.appendChild(item);
    }
    const item = document.createElement('div');
    item.className = "grid_sub_category";
    item.innerHTML = `<input type="radio" name="sub_category_input_length" class="category_image" id="sub_category_list_`+5+`" value="`+subCategoryList[5]+`" /><label for="sub_category_list_`+5+`">`+subCategoryList[5]+`</label></input>`;
    grid2.appendChild(item);
}
function displayFilterSubCategory(cat) {
    var grid = document.querySelector(".grid_container_sub_category");
    grid.innerHTML = ``;

    if (cat == "dress" || cat == "top" || cat == "outer") {
        for (var i = 3; i < 5; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input_sleeve" class="category_image" id="sub_category_list_`+i+`" value="`+subCategoryList[i]+`" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
            grid.appendChild(item);
        } 
    } if (cat == "dress" || cat == "skirt") {
        for (var i = 0; i < 3; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input_length" class="category_image" id="sub_category_list_`+i+`" value="`+subCategoryList[i]+`" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
            grid.appendChild(item);
        } 
    } if (cat == "pants") {
        for (var i = 5; i < 7; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input_length" class="category_image" id="sub_category_list_`+i+`" value="`+subCategoryList[i]+`" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
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
        item.setAttribute("id", "size_region_selected");
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
        accordingSizes.push("One", "XXS", "XXS", "XS", "S", "M", "L", "XL");
    } else if (region == "KR") {
        accordingSizes.push(230, 235, 240);
    } else if (region == "Ring") {
        accordingSizes.push(48, 50, 52, 4, 5, 6, "KR5", "KR6", "KR 7", "KR 8", "KR 9", "KR 10", "KR 11", "I", "J", "IT5");
    }
    var grid = document.querySelector(".size_key_container");
    grid.innerHTML = ``;
    for (var i = 0; i < accordingSizes.length; i++) {
        
        const item = document.createElement('div');
        item.className = "size_key";
        item.innerHTML = `<input type="radio" name="size_key" id="size_key_`+i+`" value="`+accordingSizes[i]+`"/><label for="size_key_`+i+`">`+accordingSizes[i]+`</label></input>`;
        grid.appendChild(item);
    }
    var cont = document.querySelector(".grid_container_size");
    if (accordingSizes.length > 15){
        cont.style.height = "240px";
    } else if (accordingSizes.length > 10){
        cont.style.height = "180px";
    } else if (accordingSizes.length > 5){
        cont.style.height = "120px";
    } else {
        cont.style.height = "80px";
    }
}
function selectedSizeRegion(region){
    var button = document.querySelector(".size_region_selected");
    button.innerHTML = region;
}

function autocomplete (inp, arr) {
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "_autocomplete_list");
        a.setAttribute("class", "brand_autocomplete_items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
          /*check if the item starts with the same letters as the text field value:*/
          if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            /*create a DIV element for each matching element:*/
            b = document.createElement("DIV");
            /*make the matching letters bold:*/
            b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].substr(val.length);
            /*insert a input field that will hold the current array item's value:*/
            b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
            /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function(e) {
                /*insert the value for the autocomplete text field:*/
                inp.value = this.getElementsByTagName("input")[0].value;
                /*close the list of autocompleted values,
                (or any other open lists of autocompleted values:*/
                closeAllLists();
            });
            a.appendChild(b);
            console.log(b);
          }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "_autocomplete_list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
          /*If the arrow DOWN key is pressed,
          increase the currentFocus variable:*/
          currentFocus++;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 38) { //up
          /*If the arrow UP key is pressed,
          decrease the currentFocus variable:*/
          currentFocus--;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 13) {
          /*If the ENTER key is pressed, prevent the form from being submitted,*/
          e.preventDefault();
          if (currentFocus > -1) {
            /*and simulate a click on the "active" item:*/
            if (x) x[currentFocus].click();
          }
        }
    });
    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("brand_autocomplete_active");
      }
      function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
          x[i].classList.remove("brand_autocomplete_active");
        }
      }
      function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("brand_autocomplete_items");
        for (var i = 0; i < x.length; i++) {
          if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode.removeChild(x[i]);
        }
      }
    }
}

function displayMeasurementInput(selectedCategory) {
    var selected = selectedCategory;
    var accordingSizes = [];

    
    if (selected == "top" || selected == "dress" || selected == "outer") {
        accordingSizes.push("chest", "shoulder", "sleeve", "sleeve opening", "armhole", "waist", "length");
    } else if (selected == "pants") {
        accordingSizes = ["waist", "hip", "rise", "legOpening", "length"];
    } else if (selected == "skirt") {
        accordingSizes = ["waist", "hip", "length"];
    } else if (selected == "shoes") {
        accordingSizes = ["heel"];
    } else if (selected == "jewerly" || selected == ".etc") {
        accordingSizes = ["width", "세로", "길이", "높이", "circumference"];
    }
    
    var grid = document.querySelector(".grid_container_measurement"); 
    grid.innerHTML = ``;
    for (var i = 0; i < accordingSizes.length; i++) {
        const item = document.createElement('div');
        item.className = "label_with_input";
        item.innerHTML = `<div class="part">`+accordingSizes[i]+`</div> <input type="number" id="measurementInput`+i+`" class="measurement_input" name="`+accordingSizes[i]+`"></div>`;
        grid.appendChild(item);
    }
}

function displayMeasurementFilter() {
    var grid = document.querySelector(".filter_measurement_container");
    for (var i = 0; i < measurementList.length; i++) {
        const item = document.createElement('div');
        item.className = "filter_measurement";
        item.innerHTML = `<input type="checkbox" onClick="displayMeasurementFilterValue(`+i+`);" name="measurement_filter" id="measurement_`+i+`"/><label for="measurement_`+i+`">`+measurementList[i]+`</label></input>`;
        grid.appendChild(item);
    }
}

function displayMeasurementFilterValue(i) {
    var index = i;
    var container = document.createElement('div');
    container.className = "filter_measurement_value";
    container.innerHTML = `
    <input type="number" name="measurement_filter_value_min_`+index+`" placeholder="min" min="0" max="200">
    <input type="number" name="measurement_filter_value_max_`+index+`" placeholder="max" min="0" max="200">
    `;
    var item = document.getElementById('measurement_'+index);
    var item_label = item.nextElementSibling;
    if (item.checked){
        item.parentNode.setAttribute('style', 'display: block');
        item_label.setAttribute('style', 'width: auto');
        item_label.insertAdjacentElement('afterend', container);
    } else {
        item.parentNode.setAttribute('style', 'display: inline-block');
        item_label.setAttribute('style', 'width: 100%');
        var valueContainer = item.parentNode.querySelector('.filter_measurement_value');
        valueContainer.remove();
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

function displayCompositionFilter() {
    var grid = document.querySelector(".filter_composition_container");
    for (var i = 0; i < compositionList.length; i++) {
        const item = document.createElement('div');
        item.className = "filter_composition";
        item.innerHTML = `<input type="checkbox" name="composition_filter" id="composition_`+i+`"/><label for="composition_`+i+`">`+compositionList[i]+`</label></input>`;
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

function displayCustomSelect() {
    const select = document.querySelector('select');
    const customSelect = document.querySelector('.custom_select');
    const selectedOption = customSelect.querySelector('.selected_option');
    const options = customSelect.querySelectorAll('.option');

    // Populate custom dropdown with options
    for (let i = 0; i < select.options.length; i++) {
        const option = document.createElement('div');
        option.classList.add('option');
        option.setAttribute('data_value', select.options[i].value);
        option.innerText = select.options[i].innerText;
        customSelect.querySelector('.options').appendChild(option);
    }

    // Update selected option
    function updateSelectedOption() {
        selectedOption.innerText = select.options[select.selectedIndex].innerText;
    }

    // Handle user interactions
    selectedOption.addEventListener('click', () => {
        customSelect.classList.toggle('open');
    });

    for (const option of options) {
        option.addEventListener('click', () => {
            select.value = option.getAttribute('data_value');
            updateSelectedOption();
            customSelect.classList.remove('open');
        });
    }

    document.addEventListener('click', (event) => {
        if (!customSelect.contains(event.target)) {
            customSelect.classList.remove('open');
        }
    });

    // Set initial selected option
    updateSelectedOption();
}

// ADD =========================================================================================

function input(){
//    var file = document.querySelector('input[name="images"]').files[0].name;
    var category = document.querySelector('input[name="category_input"]:checked').value;
    var sub_category_length;
    if (document.querySelector('input[name="sub_category_input_length"]')) {
        sub_category_length = document.querySelector('input[name="sub_category_input_length"]:checked').value;
    }
    var sub_category_input_sleeve;
    if (document.querySelector('input[name="sub_category_input_sleeve"]')) {
        sub_category_sleeve = document.querySelector('input[name="sub_category_input_sleeve"]:checked').value; 
    }

    var size_region = document.querySelector(".size_region").textContent;
    var size_key = document.querySelector('input[name="size_key"]:checked').value;
    var brand = document.querySelector('input[name="brand"]').value;
    var name = document.querySelector('input[name="name"]').value;
    var year = document.querySelector('input[name="year"]').value;;
    var season = document.querySelector('select[name="seasons"]').value;
    var purchase_year = document.querySelector('input[name="purchase_year"]').value;;

    for (var i=0 ; i < measurementList.length; i++){
        if (document.querySelector('input[name="'+measurementList[i]+'"]')) {
            measurementDict[measurementList[i]] = document.querySelector('input[name="'+measurementList[i]+'"]').value;   
            console.log(document.querySelector('input[name="'+measurementList[i]+'"]').value);
        }

    }
    console.log(measurementDict);

    alert(category+` `+sub_category_length+` `+sub_category_sleeve+` `+size_region+` `+size_key+` `+brand+` `+name+` `+year+season+` `+purchase_year+` `+measurementDict[length]);
}

function addItem(thumbnail, img, imgs, category, subcategory, sizeRegion, sizeKey, brand, ){

}
