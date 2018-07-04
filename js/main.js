let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => 
{
    fetchNeighborhoods();
    fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => 
{
    DBHelper.fetchNeighborhoods((error, neighborhoods) => 
    {
        if (error) 
        {
          // Got an error
          console.error(error);
        }
        else 
        {
          self.neighborhoods = neighborhoods;
          fillNeighborhoodsHTML();
        }
    });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => 
{
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => 
    {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => 
{
    DBHelper.fetchCuisines((error, cuisines) => 
    {
        if (error) 
        { 
          // Got an error!
          console.error(error);
        } 
        else 
        {
          self.cuisines = cuisines;
          fillCuisinesHTML();
        }
    });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => 
{
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => 
    {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => 
{
    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), 
    {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });
    updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => 
{
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => 
    {
        if (error) 
        { // Got an error!
          console.error(error);
        }
        else 
        {
          resetRestaurants(restaurants);
          fillRestaurantsHTML();
        }
    })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => 
{
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    self.markers.forEach(m => m.setMap(null));
    self.markers = [];
    self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => 
{
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => 
{
    var li = document.createElement('li');

    var name = document.createElement('h2');
    name.innerHTML = restaurant.name;

    var aLazy = document.createElement('a');
    aLazy.className = 'progressive replace';
    aLazy.href = DBHelper.imageUrlForRestaurant(restaurant) + '400.webp';
    //aLazy.href = '/imgRes/lazy.webp';

    var image = document.createElement('img');
    image.className = 'restaurant-img preview';
    image.src = `/imgRes/lazy.webp`;
    image.alt = 'Loading image';

    if (restaurant.name == "Mission Chinese Food") 
    {
        image.alt = "People sitting inside Mission Chinese Food";
        image.arialabel = "People sitting inside Mission Chinese Food";
    }
    else if (restaurant.name == "Kang Ho Dong Baekjeong") 
    {
        image.alt = "Empty restaurant with orange looking tables and chairs angled more towards the left";
        image.arialabel = "Empty restaurant with orange looking tables and chairs angled more towards the left";
    }
    else if (restaurant.name == "Katz's Delicatessen") 
    {
        image.alt = "Outside night photo of the restaurant";
        image.arialabel = "Outside night photo of the restaurant";
    } 
    else if (restaurant.name == "Roberta's Pizza") 
    {
        image.alt = "People sitting inside Roberta's Pizza";
        image.arialabel = "People sitting inside Roberta's Pizza";
    } 
    else if (restaurant.name == "Hometown BBQ") 
    {
        image.alt = "American themed restaurant with people sitting inside";
        image.arialabel = "American themed restaurant with people sitting inside";
    } 
    else if (restaurant.name == "Superiority Burger") 
    {
        image.alt = "Black and white photo of the outside of the Superiority Burger restaurant and with people inside";
        image.arialabel = "Black and white photo of the outside of the Superiority Burger restaurant and with people inside";
    } 
    else if (restaurant.name == "The Dutch") 
    {
        image.alt = "Close up view of the outside of the restaurant";
        image.arialabel = "Close up view of the outside of the restaurant";
    }
    else if (restaurant.name == "Mu Ramen") 
    {
        image.alt = "Slightly blured black and white photo of people sitting and eating";
        image.arialabel = "Slightly blured black and white photo of people sitting and eating";
    } 
    else if (restaurant.name == "Casa Enrique") 
    {
        aLazy.href = "/imgRes/10-400.webp";
        image.alt = "Empty restaurant with tables and chairs angled towards the left";
        image.arialabel = "Empty restaurant with tables and chairs angled towards the left";
    }

    aLazy.append(image);
    li.append(aLazy);
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.className = "restaurant";
    more.setAttribute('aria-label', `View Details for ${restaurant.name}`);
    const fav = document.createElement('a');
    fav.innerHTML = '&#9733;';
    //fav.id = "addToFav";
    if (restaurant.is_favorite == "true")
    {
        fav.className = "tooltip isFav";
    }
    else
    {
        fav.className = "tooltip isNotFav";
    }
    fav.setAttribute('aria-label', "Add to favourite");
    fav.style.cssFloat = "right";
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltiptext';
    tooltip.innerHTML = 'Add to favourites';
    tooltip.setAttribute('role', "alertdialog")
    fav.setAttribute('role' , 'switch');
    fav.append(tooltip);
    fav.addEventListener("click", function() 
    {
        DBHelper.addRemFav(restaurant.id, fav, restaurant, tooltip);
    });

    li.append(fav);
    li.append(more);
    return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => 
{
    restaurants.forEach(restaurant => 
    {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        google.maps.event.addListener(marker, 'click', () => 
        {
            window.location.href = marker.url
        });
        self.markers.push(marker);
    });
}
