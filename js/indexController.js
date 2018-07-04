if ('serviceWorker' in navigator) 
{
  window.addEventListener('load', function() 
  {
    navigator.serviceWorker.register('/sw.js').then(function(reg) 
    {
      	// Registration was successful
      	console.log('ServiceWorker registration successful with scope: ', reg.scope);
		if (!navigator.serviceWorker.controller) 
		{
			return;
		}

		if (reg.waiting) 
		{
			_updateReady(reg.waiting);
			return;
		}

		if (reg.installing) 
		{
	    	_trackInstalling(reg.installing);
			return;
		}

  		reg.addEventListener('updatefound', function() 
  		{
	  		_trackInstalling(reg.installing);
		});
		// Ensure refresh is only called once.
		// This works around a bug in "force update on reload".
		var refreshing;
		navigator.serviceWorker.addEventListener('controllerchange', function() 
		{
			if (refreshing) return;
			window.location.reload();
			refreshing = true;
		});
    }, function(err) 
    {
      	// registration failed :(
      	console.log('ServiceWorker registration failed: ', err);
    });
  });
}

function _trackInstalling(worker) 
{
	var indexController = this;
	worker.addEventListener('statechange', function() {
		if (worker.state == 'installed') {
			indexController._updateReady(worker);
		}
	});
}

function _updateReady(worker) 
{
	//I need to add the update stuff in here
	//Then do this:
	worker.postMessage({action: 'skipWaiting'});
}
