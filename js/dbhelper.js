/**
 * Common database helper functions.
 */
var dbPromise;
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
    static get DATABASE_URL() {
        const port = 1337 // Change this to your server port
        return `http://localhost:${port}/`;
    }

   /**
    * Open Database
    */
    static openDB() 
    {
        if (!navigator.serviceWorker) 
        {
            return Promise.resolve()
        }
        return idb.open('restaurants' , 3 , function(upgradeDb) {
            switch(upgradeDb.oldVersion) 
            {
              case 0:
              upgradeDb.createObjectStore('restaurants' ,{keyPath: 'id'});
              case 1:
              upgradeDb.createObjectStore('reviews' ,{keyPath: 'restaurant_id'});
              case 2:
              upgradeDb.createObjectStore('oflineReviews' ,{keyPath: 'restaurant_id'});
            }
        });
    }
   /**
    * Get Restaurants
    */
    static getCachedData() 
    {
        if (!dbPromise) 
        {
            dbPromise = DBHelper.openDB()
        }
        return dbPromise.then(function(db) 
        {
            if (!db) 
            {
                return;
            }
            var tx = db.transaction("restaurants");
            var store = tx.objectStore("restaurants");
            return store.getAll();
        })
    }
   /**
    * Get Reviews
    */
    static getCachedReviews()
    {
        if(!dbPromise)
        {
            dbPromise = DBHelper.openDatabase();
        }
        return dbPromise.then(function(db)
        {
            if(!db) return db;
            var tx = db.transaction('reviews');
            var store = tx.objectStore('reviews');
            return store.getAll();
        });
    }

  /**
   * Fetch all restaurants.
   */
    static fetchRestaurants(callback) 
    {
        DBHelper.getCachedData().then(function(data) 
        {
            if (data.length > 0 && !navigator.onLine) 
            {
              return callback(null, data)
            }
            fetch(DBHelper.DATABASE_URL+`restaurants`, {credentials:"same-origin"}).then(rest => rest.json()).then(data => {
                dbPromise.then(function(db) 
                {
                    if (!db) {return;}

                    var tx = db.transaction('restaurants', 'readwrite');
                    var store = tx.objectStore('restaurants');

                    data.forEach(restaurant => store.put(restaurant));

                    //limit the data for 50
                    store.openCursor(null, 'prev').then(function(cur) 
                    {
                        return cur.advance(50);
                    }).then(function delRest(cur) 
                    {
                        if (!cur) {return;}
                        cur.delete();
                        return cur.continue().then(delRest)
                    });
                });
                return callback(null, data);
            }).catch(err =>{return callback(err, null)});
        });
    }

   /**
    * Fetch reviews by restaurant id
    */
    static fetchReviewsById(id)
    {
        return new Promise((resolve, reject) =>
        {
            DBHelper.getCachedReviews().then(function(data)
            {        
                // if reviews are cached show them otherwide get from server
                if(data.length > 0 && !navigator.onLine)
                {
                  resolve(data[0]);
                }
                //fetch from server         
                fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${id}`).then(response => 
                {
                    if(response.ok)
                    {
                        return response.json();
                    }
                    reject(new Error(`Request failed, status code: ${response.status}`));
                }).then(data =>
                {

                    DBHelper.updateReview(data);
                    resolve(data);
                })
            });
        });
    }

   /**
    * Update single review of restaurant
    */
    static updateReview(reviews)
    {
        if (!dbPromise) 
        {
            dbPromise = DBHelper.openDB()
        }

        dbPromise.then(function(db)
        {

            if(!db) return db;
            var tx = db.transaction('reviews' , 'readwrite');
            var store = tx.objectStore('reviews');
            if(reviews.length > 0)
            {
                reviews.restaurant_id = parseInt(reviews[0].restaurant_id);
                store.put(reviews);
            }
            return tx.complete;
        })
    }

  /**
   * Fetch a restaurant by its ID.
   */
    static fetchRestaurantById(id, callback) 
    {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => 
        {
          if (error) 
          {
            callback(error, null);
          } 
          else 
          {
            const restaurant = restaurants.find(r => r.id == id);
            if (restaurant) 
            { // Got the restaurant
              callback(null, restaurant);
            } 
            else 
            { // Restaurant does not exist in the database
              callback('Restaurant does not exist', null);
            }
          }
        });
    }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
    static fetchRestaurantByCuisine(cuisine, callback) 
    {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => 
        {
            if (error) 
            {
                callback(error, null);
            } 
            else 
            {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
    static fetchRestaurantByNeighborhood(neighborhood, callback) 
    {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => 
        {
            if (error) 
            {
                callback(error, null);
            } 
            else 
            {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) 
            {
                callback(error, null);
            } 
            else 
            {
                let results = restaurants
                if (cuisine != 'all') 
                { 
                    // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all')
                { 
                    // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) =>
        {
            if (error) 
            {
                callback(error, null);
            } 
            else
            {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                callback(null, uniqueNeighborhoods);
            }
        });
    }

   /**
    * Adds of removes favourites
    */
    static addRemFav(restId, fav, rest, tooltip)
    {
        const isFav = rest.is_favorite;
        DBHelper.handleFav(isFav, restId, rest).then(function()
        {
            if (fav.classList.contains('isNotFav')) 
            {
                fav.classList.replace('isNotFav' , 'isFav');
                fav.setAttribute('aria-label', "Remove favourites");
                fav.setAttribute('aria-checked' , "true");
                tooltip.innerHTML = "Remove from favourites"
            }
            else
            {
                fav.classList.replace('isFav' , 'isNotFav');
                fav.setAttribute('aria-label', "Add to favourite");
                fav.setAttribute('aria-checked' , "false");
                tooltip.innerHTML = 'Add to favourites';
            }
        })
    }

   /**
    * Stores review ofline if not online
    */
    static storeOflineReview(restId, name, reviewBody, rating)
    {
        const post = {restaurant_id: restId , name: name , rating: rating , comments: reviewBody };

        if (!dbPromise) 
        {
            dbPromise = DBHelper.openDB()
        }

        dbPromise.then(function(db)
        {
            if(!db) return;
            var tx = db.transaction('oflineReviews' , 'readwrite' );
            var store = tx.objectStore('oflineReviews');
            store.put(post);
            return tx.complete;
        })
    }

   /**
    * Adds favourites to DB and idb
    */
    static handleFav(isFav, restId, rest)
    {
        if(typeof(isFav) == 'string')
        {    
            if (isFav == 'false') 
            {
                isFav = true;
                rest.is_favorite = true;
            }
            else if (isFav == 'true') 
            {
                isFav = false;
                rest.is_favorite = false;
            }
        }
        else
        {
          isFav = !isFav; 
        }

        if (!dbPromise) 
        {
            dbPromise = DBHelper.openDB()
        }

        dbPromise.then(function(db) 
        {
            if (db) 
            {
                return;
            }
            var tx = db.transaction("restaurants", "readwrite");
            var store = tx.objectStore("restaurants");
            store.put(rest);
            return tx.complete;
        })

        return new Promise((resolve , reject) => 
        {
            fetch(`${DBHelper.DATABASE_URL}restaurants/${restId}/?is_favorite=${isFav}`, 
            {
                method: 'PUT'
            }).then((res) => 
            {
                if(res.ok)
                { 
                    return res.json();
                }
                else
                {
                    reject(new Error(`Request is not successful. Status code is :  ${res.status}`));
                }
            }).then((data) => 
            {
                resolve(data);     
            });
        });
    }


    static postReview(restId , name , rating , reviewBody , reviews)
    {
        let post = {};
        if(typeof(rating) == 'string')
        {
            post = {restaurant_id: restId , name: name , rating: reviewBody , comments: rating};
        }
        else
        {
            post = {restaurant_id: restId , name: name , rating: rating , comments: reviewBody};
        }
        return new Promise((resolve , reject) => 
        {
            fetch(`${DBHelper.DATABASE_URL}reviews` , 
            {
                method: 'POST',
                body: JSON.stringify(post)
            }).then(function(response)
            {
                if(response.ok)
                {
                    return response.clone().json();
                }
                reject(new Error(`Request failed with status code : ${response.status}`));
            }).then(data => 
            {
                reviews.push(data);
                DBHelper.updateReview(reviews);
                resolve(data);
            });
        });
    }

    static postOflineReview(restId, reviews)
    {
        return new Promise((resolve,reject) => 
        {
            if(!dbPromise)
            {
                dbPromise = DBHelper.openDB();
            }
            dbPromise.then(function(db)
            {
                if(!db) return;
                var tx = db.transaction('oflineReviews');
                var store = tx.objectStore('oflineReviews');
                return store.get(restId);
            }).then(function(review)
            {
            DBHelper.postReview(review.restaurant_id , review.name , review.rating , review.comments , reviews).then(data => 
            {
                dbPromise.then(function(db)
                {
                    var tx = db.transaction('oflineReviews',  'readwrite');
                    var store = tx.objectStore('oflineReviews');
                    store.delete(restId);
                    return tx.complete;
                });
                resolve(data);
            });
            });
        });
    }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/imgRes/${restaurant.photograph}-`);
  }

  /**
   * Restaurant image alt text.
   */
  static imageAltForRestaurant(restaurant) {
    return (`${restaurant.alt}`);
  }

  /**
   *
   * Aria Label for the buttons
   */
   static buttonLabel(restaurant){
    return restaurant.bLabel;
   }
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
