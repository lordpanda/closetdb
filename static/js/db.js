const index = [];
var indexCount = 0;
const categoryList = ["top", "dress", "outer", "skirt", "pants", "shoes", "jewerly", "etc."];
const subCategoryList = ["mini", "midi", "long", "short sleeve", "long sleeve", "short", "long", "bag", "socks", "belt", "hat", "etc"];
const sizeRegionList = ["WW", "US", "EU", "FR", "IT", "DE", "UK", "KR", "JP", "Kids", "Ring", "etc"];
const compositionList = ["cotton", "silk", "wool", "cashmere", "alpaca", "leather", "viscose", "polyesther","polyurethane", "polyamide", 
"elastane", "nylon", "lyocell", "acryl", "acetate", "tri-acetate", "cupro", "spandex",  "metallic", "brass", "rubber", "sterling silver", "gold 14K", "gold 18K"];
const tagsList = [
    {value: "occasion wear", label: "occasion wear"},
    {value: "activewear", label: "activewear"}, 
    {value: "basic", label: "basic"},];
var brandList = ["APIECE APART", "Burberry", "Derek Lam 10 Crosby", "HAUSOFPBK", "Juun.J", "KIMHEKIM", "Maison Margiela", "MM6", "MSGM", 
"Opening Ceremony", "Palm Angels", "Sandro", "Stella McCartney", "Tibi", "Tory Burch", "Versace", "ZARA"];
const colorList = [
    {value: "000000", label: "black"},
    {value: "FFFFFF", label: "white"},
    {value: "808080", label: "gray"},
    {value: "FF0000", label: "red"},
    {value: "FFA500", label: "orange"},
    {value: "FFEA00", label: "yellow"},
    {value: "00AE14", label: "green"},
    {value: "0015FF", label: "blue"},
    {value: "000080", label: "navy"},
    {value: "570090", label: "purple"},
    {value: "00CCFF", label: "skyblue"},
    {value: "FFC0CB", label: "pink"},
    {value: "F5F2E8", label: "cream"},
    {value: "D2BF9E", label: "beige"},
    {value: "7D4700", label: "brown"},
    {value: "8F0000", label: "burgundy"},
    {value: "008080", label: "teal"},
    {value: "F1F1F1", label: "silver"},
    {value: "FFD700", label: "gold"},
    {value: "stripe", label: "stripe"},
    {value: "multi", label: "multi"}
];

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
thigh,
legOpening,
hemWidth,
length,
heel,
width,
height,
depth,
circumference = [];

var cotton,
silk,
wool,
cashmere,
leather,
viscose,
polyesther,
polyurethane,
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
glass = [];

var year, season = [];



