
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('puggy-v1').then(c=>c.addAll([
    './','./index.html','./styles.css','./app.js',
    './images/level0_potato.png','./images/level1_adult.png','./images/level2_younger.png','./images/level3_rosy.png','./images/level4_bows.png','./images/level5_friends.png'
  ])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(res=>res || fetch(e.request)));
});
