"use strict";

/* ---------------- TRANSLITERATION ---------------- */

function transliterate(text){

const map={
а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",
к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",
ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ы:"y",э:"e",ю:"yu",я:"ya"
};

return text
.toLowerCase()
.split("")
.map(c=>map[c]||c)
.join("");

}

/* ---------------- SLUG ---------------- */

function slugify(text){

return transliterate(text)
.replace(/[^a-z0-9]+/g,"-")
.replace(/-+/g,"-")
.replace(/^-|-$/g,"");

}

/* ---------------- CLEAN DESCRIPTION ---------------- */

function cleanDescription(text){

if(!text) return "";

const blacklist=[
"Покупатель НЕ ПЛАТИТ",
"Работаем со всеми видами кредитов",
"Консультации по покупке",
"Лицензия",
"ООО",
"УНП",
"обращайтесь по адресу"
];

let cleaned=text;

blacklist.forEach(word=>{
const reg=new RegExp(word+".*","gi");
cleaned=cleaned.replace(reg,"");
});

return cleaned
.replace(/\n+/g," ")
.replace(/\s+/g," ")
.trim();

}

/* ---------------- EXTRACT HELPERS ---------------- */

function extractNumber(regex,text){

const m=text.match(regex);

if(!m) return null;

return parseFloat(m[1].replace(",","."));

}

function extractInt(regex,text){

const m=text.match(regex);

if(!m) return null;

return parseInt(m[1]);

}

/* ---------------- CITY ---------------- */

function parseCity(text){

if(!text) return null;

const cities=[
"Лида",
"Кобрин",
"Щучин",
"Волковыск",
"Гродно",
"Брест",
"Минск"
];

for(const city of cities){

if(text.toLowerCase().includes(city.toLowerCase())){
return city;
}

}

return null;

}

/* ---------------- STREET ---------------- */

function parseStreet(text){

if(!text) return null;

const m=text.match(/ул\.?\s?[А-Яа-яA-Za-z\-]+/);

if(!m) return null;

return m[0].replace("ул","ул.");

}

/* ---------------- ROOMS ---------------- */

function parseRooms(text){

if(!text) return null;

if(text.toLowerCase().includes("однокомнат")) return 1;
if(text.toLowerCase().includes("двухкомнат")) return 2;
if(text.toLowerCase().includes("трехкомнат")) return 3;
if(text.toLowerCase().includes("трёхкомнат")) return 3;

const patterns=[
/(\d)[-\s]?комнат/i,
/(\d)\s*комн/i,
/Количество комнат\s*(\d)/i
];

for(const p of patterns){

const m=text.match(p);

if(m) return parseInt(m[1]);

}

return null;

}

/* ---------------- PRICE ---------------- */

function parsePrice(text){

const m=text.match(/([\d\s]+)\$/);

if(!m) return null;

return parseInt(m[1].replace(/\s/g,""));

}

/* ---------------- COORDINATES ---------------- */

function parseCoordinates(text){

const m=text.match(/(\d+\.\d+)\s*,\s*(\d+\.\d+)/);

if(!m) return {lat:null,lng:null};

return{
lat:parseFloat(m[1]),
lng:parseFloat(m[2])
};

}

/* ---------------- MAIN GENERATOR ---------------- */

function generateObject(raw){

if(!raw) raw="";

const city=parseCity(raw);

const address=parseStreet(raw);

const rooms=parseRooms(raw);

const areaTotal=
extractNumber(/(\d+[.,]?\d*)\s*м²\s*Общ/i,raw) ||
extractNumber(/(\d+[.,]?\d*)\s*м²/,raw);

const areaLiving=
extractNumber(/Жилая\s*(\d+[.,]?\d*)/i,raw);

const areaKitchen=
extractNumber(/Кухн[ия]\s*(\d+[.,]?\d*)/i,raw);

const floor=
extractInt(/(\d+)\s*(?:из|от)\s*\d+/,raw);

const floorsTotal=
extractInt(/\d+\s*(?:из|от)\s*(\d+)/,raw);

const yearBuilt=
extractInt(/(\d{4})\s*г/,raw);

const priceUSD=parsePrice(raw);

const coords=parseCoordinates(raw);

const title=
`${rooms}-комнатная квартира в г. ${city} на ${address}`;

const slug=slugify(title);

const cardDescription=
`${rooms}-комнатная квартира ${areaTotal} м²`;

const idNumber=Math.floor(Math.random()*900+100);

const object={

id:`obj-${idNumber}`,

slug,

title,

type:"Квартира",

dealType:"Продажа",

city,

address,

priceBYN:null,

priceUSD,

cardDescription,

rooms,

roomsSeparate:rooms,

areaTotal,

areaLiving,

areaKitchen,

floor,

floorsTotal,

yearBuilt,

houseType:null,

balcony:null,

renovation:null,

bathroom:null,

location:coords,

description:cleanDescription(raw),

images:[

`/images/objects/pic${idNumber}-1.webp`,
`/images/objects/pic${idNumber}-2.webp`,
`/images/objects/pic${idNumber}-3.webp`,
`/images/objects/pic${idNumber}-4.webp`

]

};

return object;

}

/* ---------------- BUTTON HANDLER ---------------- */

function generate(){

const textarea=document.getElementById("input");

if(!textarea){
alert("textarea не найден");
return;
}

const raw=textarea.value;

if(!raw){
alert("Введите текст объявления");
return;
}

const obj=generateObject(raw);

const output=document.getElementById("output");

if(output){
output.textContent=JSON.stringify(obj,null,2);
}

}