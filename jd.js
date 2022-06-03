let js=`<script src="https://unpkg.com/vconsole@latest/dist/vconsole.min.js"></script><script>var vConsole = new window.VConsole();</script>`

let html = $response.body
html=html.replace('</body></html>', js + '</body></html>')
console.log(html)
$done({body :html})
