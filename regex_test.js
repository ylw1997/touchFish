const html = `var __PAGE = {0:'/read.php?tid=46171081',1:5,2:5,3:20};commonui.pageBtn(document.getElementById('pageBtnHere').parentNode,__PAGE,true)`;
const match = html.match(/__PAGE\s*=\s*\{.*?\b1\s*:\s*(\d+)/);
console.log(match ? match[1] : "No match");
