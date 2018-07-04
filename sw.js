var urlsToCache = [
'/',
'js/idb.js',
'js/indexController.js',
'js/dbhelper.js',
'js/restaurant_info.js',
'css/index.css',
'css/restaurant.css',
'/index.html'
];
var staticCache = "rReviews-static-v5";
var imgCache = "rReviews-image";
var allCacheNames = [
    staticCache,
    imgCache
];
self.addEventListener('install', function(event) 
{
  event.waitUntil
  (
    caches.open(staticCache).then(function(cache) 
    {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('active', function(event) 
{
  event.waitUntil
  (
    caches.keys().then(function(cacheNames) 
    {
      return Promise.all
      (
        cacheNames.filter(function(cName) 
        {
          return cName.startsWith('rReviews-') && !allCacheNames.includes(cacheNames);
        }).map(function(cName) 
        {
          return cache.delete(cName);
        })
      )
    })
  );
});

self.addEventListener('fetch', function(event)
{
    let requestURL = new URL(event.request.url);
    if (requestURL.origin === location.origin) 
    {
        if (requestURL.pathname.startsWith('/imgRes/')) 
        {
            event.respondWith(servePhoto(event.request));
            return;
        }
    }
    event.respondWith
    (
        caches.open(staticCache).then(function(cache) 
        {
            return cache.match(event.request).then(function (response) 
            {
                return response || fetch(event.request).then(function(response) 
            {
              cache.put(event.request, response.clone());
              if (response.status == 404) 
              {
                return new Response(`<div style="position:absolute;top:50%;left:50%;width:200px;height:200px;margin:-100px 0 0 -100px;font-size:1.5em;"><strong>Page not found 404</strong></div>`, {
                  headers: {"Content-Type": "text/html"}
                });
              }
              return response;
            }).catch(function() 
            {
              return new Response(`<div style="position:absolute;top:50%;left:50%;width:200px;height:200px;margin:-100px 0 0 -100px;font-size:1.5em;"><strong>Page not found, you appear to be offline</strong></div>`, {
                  headers: {"Content-Type": "text/html"}
                });
            });
        });
    })
    );
});

function servePhoto(request)
{
    return caches.open(imgCache).then(cache => 
    {
        return cache.match(request.url).then(response =>
        {
            if (response) return response;
            return fetch(request).then(networkResponse =>
            {
                cache.put(request.url, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}

self.addEventListener('message', function(event) 
{
    if (event.data.action === 'skipWaiting') 
    {
        self.skipWaiting();
    }
});