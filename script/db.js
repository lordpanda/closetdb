const index = [];
var indexCount = 0;
const categoryList = ["top", "dress", "outer", "skirt", "pants", "shoes", "jewerly", "etc."];
const subCategoryList = ["mini", "midi", "long", "short sleeve", "long sleeve", "short", "long"];
const sizeRegionList = ["WW", "US", "EU", "FR", "IT", "DE", "UK", "KR", "JP", "Ring"];
const compositionList = ["cotton", "silk", "wool", "cashmere", "leather", "viscose", "polyesther", "polyamide", 
"elastane", "acryl", "acetate", "spandex", "metallic", "brass", "rubber", "sterling silver", "gold 14K", "gold 18K"];
var brandList = ["APIECE APART", "Burberry", "Derek Lam 10 Crosby", "HAUS OF PBK", "Juun.J", "KIMHEKIM", "Maison Margiela", "MM6", "MSGM", 
"Opening Ceremony", "Palm Angels", "Sandro", "Stella McCartney", "Tibi", "Tory Burch", "Versace", "ZARA"];
const measurementList = ["chest", "shoulder", "sleeve", "sleeveOpening", "armhole", "waist", "hip", "rise", "inseam", "legOpening", "length", "heel", "width", "height",
"depth", "circumference"];

const measurementPerCategory = [];

var category = [];
var subCategory = [];
var brand = [];
var sizeRegion = [];
var sizeValue = [];

var chest,
shoulder,
sleeve,
sleeveOpening,
armhole,
waist,
hip,
rise,
inseam,
legOpening,
length,
heel,
width,
height,
depth,
circumference;

var cotton,
silk,
wool,
cashmere,
leather,
viscose,
polyesther,
polyamide,
elastane,
acryl,
acetate,
spandex,
metallic,
brass,
sterlingSilver,
metal,
gold14K,
gold18K,
glass;

var year, season;


