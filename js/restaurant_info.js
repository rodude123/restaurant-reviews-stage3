let restaurant;
var map;
let c1 = 0;
let c2 = 0;
let c3 = 0;
let c4 = 0;
/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => 
{
    fetchRestaurantFromURL((error, restaurant) => 
    {
        if (error) 
        { 
          // Got an error!
          console.error(error);
        } 
        else 
        {
          self.map = new google.maps.Map(document.getElementById('map'), 
          {
            zoom: 16,
            center: restaurant.latlng,
            scrollwheel: false
          });
          if (c1 == 0) 
          {
            fillBreadcrumb();
            c1 = 1;
          }
          DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        }
    });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => 
{
    if (self.restaurant) 
    {
        // restaurant already fetched!
        callback(null, self.restaurant)
        return;
    }
    const id = getParameterByName('id');
    if (!id) 
    { 
        // no id found in URL
        error = 'No restaurant id in URL'
        callback(error, null);
    } 
    else 
    {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => 
        {
            self.restaurant = restaurant;
            if (!restaurant) 
            {
                console.error(error);
                return;
            }
            if (c2 == 0) 
            {
                fillRestaurantHTML();
                c2 = 1;
            }
            callback(null, restaurant)
        });
    }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => 
{
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const aLazy = document.getElementById('aLazy');
    aLazy.className = "progressive replace";
    aLazy.href = DBHelper.imageUrlForRestaurant(restaurant) + '800.webp';
    aLazy.setAttribute("data-srcset", `${DBHelper.imageUrlForRestaurant(restaurant)}300.webp 400w, ${DBHelper.imageUrlForRestaurant(restaurant)}400.webp 600w, ${DBHelper.imageUrlForRestaurant(restaurant)}600.webp 800w, ${DBHelper.imageUrlForRestaurant(restaurant)}800.webp 1200w`);

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img preview';
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
        aLazy.setAttribute("data-srcset", `/imgRes/10-300.webp 400w, /imgRes/10-400.webp 600w, /imgRes/10-600.webp 800w, /imgRes/10-800.webp 1200w`)
        image.alt = "Empty restaurant with tables and chairs angled towards the left";
        image.arialabel = "Empty restaurant with tables and chairs angled towards the left";
    }


    const fav = document.createElement('a');
    fav.innerHTML = '&#9733;';
    fav.id = "addToFav";
    if (restaurant.is_favorite == "true")
    {
        fav.className = "tooltip isFav";
    }
    else
    {
        fav.className = "tooltip isNotFav";
    }
    fav.setAttribute('aria-label', "Add to favourite");
    fav.style.marginLeft = "100px";
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltiptext';
    tooltip.innerHTML = 'Add to favourites';
    fav.setAttribute('role' , 'switch');
    fav.append(tooltip);
    fav.addEventListener("click", function() 
    {
        DBHelper.addRemFav(restaurant.id, fav, restaurant, tooltip);
    });
    document.getElementById("favContainer").append(fav);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) 
    {
        if (c3 == 0) 
        {
            fillRestaurantHoursHTML();
            c3 = 1;
        }
    }
    // fill reviews
    if (c4 == 0) 
    {
        fillReviewsHTML(restaurant);
        document.getElementById("reviewForm").addEventListener("submit", (e) =>
        {
            e.preventDefault();
            checkReview(getParameterByName("id"), restaurant.reviews); 
        });
        c4 = 1;
    }
  
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => 
{
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) 
  {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);
    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (restaurant) => 
{
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);
    DBHelper.fetchReviewsById(parseInt(getParameterByName('id'))).then((reviews) => 
    {        
        if (reviews.length == 0) 
        {
            const noReviews = document.createElement('p');
            noReviews.innerHTML = 'No reviews yet. Be the first one!';
            container.appendChild(noReviews);
        }
        else
        {
            restaurant.reviews = reviews;        
            ul = document.getElementById('reviews-list');
            reviews.forEach(review => 
            {
                ul.appendChild(createReviewHTML(review, review.updatedAt));
            });
            container.appendChild(ul);
        }
  });
}

checkReview = (restId, reviews) =>
{
    const name = strip(document.getElementById('name').value);
    const reviewBody = strip(document.getElementById('reviewBody').value);
    const rating  = parseInt(document.querySelector(`input[name="rating"]:checked`).value);
    if (!navigator.onLine) 
    {
        showMessage("It seems your ofline right now, the review will be sent when your online later");
        document.getElementById('reviewModal').style.display = "none";
        DBHelper.storeOflineReview(parseInt(restId), name, reviewBody, rating);
        let interval = setInterval(() => 
        {                    
            if (navigator.onLine) 
            {
                clearInterval(interval);
                showMessage("Attempting to add review");
                DBHelper.postOflineReview(parseInt(restId), reviews).then(review => 
                {
                    document.getElementById('reviews-list').appendChild(createReviewHTML(review));
                    showMessage("Review now added");
                });
            }
        } , 5000);
    }
    else
    {
        DBHelper.postReview(parseInt(restId), name, rating, reviewBody, reviews).then(review =>
        {
            document.getElementById('reviewModal').style.display = "none";
            document.getElementById('reviews-list').appendChild(createReviewHTML(review, review.updatedAt));
            showMessage("Review added");
        });

    }

}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, updatedAt) => 
{
    const li = document.createElement('li');
    li.className = "review"
    const header = document.createElement('div');
    header.className = "reviewHeader mainContainer";
    li.appendChild(header);

    const name = document.createElement('p');
    name.className = "name reviewHeaderContent";
    name.innerHTML = review.name;
    header.appendChild(name);

    const rDate = updatedAt;
    const date = document.createElement('p');
    date.className = "date reviewHeaderContent";
    date.innerHTML = new Date(rDate).toDateString();
    header.appendChild(date);

    const rating = document.createElement('div');
    const boldRating = document.createElement('strong');
    rating.className = "rating";
    rating.innerHTML = `Rating: ${review.rating}`;
    boldRating.appendChild(rating);
    li.appendChild(boldRating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => 
{
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
}

/**
 * Shows message when something happens like review upload
 */

showMessage = (message) =>
{
    document.getElementById("modalMessage").innerHTML = message;
    document.getElementById('messageModal').style.display = "block";
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => 
{
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Strip HTML Tags i.e remove them.
 */
strip = (string) => 
{
  return string.replace(/(<([^>]+)>)/ig,"");
}