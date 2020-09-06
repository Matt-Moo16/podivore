const foodBaseUrl = 'https://api.edamam.com/search'
const foodApiId = '3a6519e0'
const foodApiKey = '00283b389d17959e620d37c080e4a8df'
const podcastBaseUrl = 'https://listen-api.listennotes.com/api/v2/search'
const podcastGenreUrl = 'https://listen-api.listennotes.com/api/v2/genres'
const podcastApiKey = 'b97f13b83bf04b4e9f5b1cd691990094'

let recipesTime = 0

function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
      // XHR for Chrome/Firefox/Opera/Safari.
      xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
      // XDomainRequest for IE.
      xhr = new XDomainRequest();
      xhr.open(method, url);
    } else {
      // CORS not supported.
      xhr = null;
    }
    return xhr;
  }

function generateFoodUrl(ingredients) {
    const query = '?q=' + encodeURIComponent(ingredients)
    const apiKey = '&app_key=' + foodApiKey;
    const apiId = '&app_id=' + foodApiId;
    const finalFoodUrl = foodBaseUrl + query + apiKey + apiId;

    return finalFoodUrl;
}

function generateHeader() {
    return `<section>
    <img src="images/Podivore-logo.png" alt="Podivore" class="logo">
    <h2>Podcast perfect for cook time.</h2>
    <p>What is Podivore? Podivore is an app that will generate podcasts that are the length of time as a recipe.
        This app will let you choose what kind of cuisine you want, what kind of meal type that you want, input the ingridents that you have or want to use, and choose the genre of the podcast that you want to listen to.
    </p>
    <p>Due to the nature of the podcast API we used, we embedded an in-app player to listen to your podcasts, but sometimes a download link for the podcast's audio file will be returned instead and will automaticall download to your device.
    In the event that you run into any trouble with this, simply just try to regenerate a new podcast using the Generate Recipe and Podcast Pairing with your desired ingredients. </p>
</section>`
}

function generateLandingPage(genres) {
    return `${generateHeader()}
<section>
    <form>
      <div>
          <label for="ingredients">Write in an Ingredient</label>
          <input type="text" id="ingredients" name="ingredients" placeholder="Ex: Chicken"> 
      </div>
      <div>
          <label for="genre">Choose a genre for the podcasts</label>
          <select name="genre" id="genre">
              ${generateGenreDropdown(genres)}
          </select>
          
      </div>
       <button type="submit" class="submit">Generate Recipe and Podcast Pairing</button>

    </form>
    <ul class="recipe"></ul>
    <ul class="podcast"></ul>
</section>`

}

function generatePodcastUrl(genre, time) {
    const query = '?q=' + genre
    const type = '&type=episode'
    const podcastMin = '&len_min=' + time 
    const podcastMax = '&len_max=' + (time + 10) 
    const finalPodcastUrl = podcastBaseUrl + query + type + podcastMin + podcastMax
    return finalPodcastUrl
}

// need XML request for CORS; Promisifying it in the function
function fetchRecipe(ingredients) {
    return new Promise((resolve, reject) => {
        var url = generateFoodUrl(ingredients);
        
        var xhr = createCORSRequest('POST', url);
        if (!xhr) {
            alert('CORS not supported');
            return;
        }
        // This acts as a Fetch request
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const parsedJson = JSON.parse(xhr.response)
                if (parsedJson.count === 0) {
                    
                    alert('No recipe available for this search. Please try another search.')
                }
                else {
                    resolve(xhr.response);
                }
                
            } else {
                reject(xhr.statusText);
            }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
    });
}

function fetchPodcast(genre, time) {
    const headers = {
        'X-ListenAPI-Key': podcastApiKey
    }
    return fetch(generatePodcastUrl(genre, time), {headers})
    .then(response => {
        if (response.ok) {
           return response.json()
        }
        else {
            alert('Cannot get a podcast right now. Please try again later.')
        }
    })
}

function fetchGenre() {
    const headers = {
        'X-ListenAPI-Key': podcastApiKey
    }
    return fetch(podcastGenreUrl, {headers})
    .then(response => response.json())
    .catch(() => alert('Something went wrong. Please try again later.'))
}


function generateGenreDropdown(genres) {
    const genreDropdown = genres.map(genre => 
        `<option value="${genre.name}">${genre.name}</option>`)
        .join('\n')
        return genreDropdown
}

function generateRecipe(response) {
    // get the total count of hits
    const totalHits = response.hits.length;
    const min = 0;
    // generate random number between 0 and total hit count minus 1 for the index
    const max = totalHits - 1;
    const randomNum = Math.round(Math.random() * (max - min) + min);
    const ingredientsList = response.hits[randomNum].recipe.ingredientLines.map(list =>
        `<li>${list}</li>`
    ).join('')
    if (response.hits[randomNum].recipe.totalTime === 0) {
        //Some of the api response return 0 for total time, even though this isnt the case
        //In these scenarios we will default the time to 30 minutes, which we found to be the average cooktime of most recipes
        recipesTime = 30
    }
    else {
        recipesTime = response.hits[randomNum].recipe.totalTime
    }
    const recipeCode = `
        <div>
            <h2>${response.hits[randomNum].recipe.label}</h2>
            <h3>Total Cook Time: ${recipesTime}</h3>
            <img src="${response.hits[randomNum].recipe.image}">
            <ul class="ingredients">${ingredientsList}</ul>      
            <a href="${response.hits[randomNum].recipe.url}" target="_blank" class="recipelink">Click Here To View The Recipe</a>
        </div>
    `
    return recipeCode
}

function generatePodcast(podcast) {
   return `
    <article>
        <h2>${podcast.title_original}</h2>
        <img src="${podcast.image}" alt="${podcast.title_original}">
        <p class="description">${podcast.description_original}</p>
        <iframe src="${podcast.audio }" height="170px" loading="lazy" frameborder="0" scrolling="no"></iframe>   
    </article>`
}

function displayLandingPage(genres) {
    $('main').html(generateLandingPage(genres))
} 

function displayRecipe(recipe) {
    $('.recipe').html(recipe)

}

function displayPodcasts(podcasts) {
    const totalPodcasts = podcasts.results.length;
    const min = 0;
    // generate random number between 0 and total hit count minus 1 for the index
    const max = totalPodcasts - 1;
    const randomNum = Math.round(Math.random() * (max - min) + min);
    $('.podcast').html(generatePodcast(podcasts.results[randomNum]))
}

function handleSubmitButton() {
    $('main').on('submit', 'form', event => {
        event.preventDefault()
        const ingredients = $('#ingredients').val().toLowerCase()
        const genre = $('#genre').val().toLowerCase()

        fetchRecipe(ingredients)
            .then(
                response => generateRecipe(JSON.parse(response))
            )
            .then(
                recipeHTML => displayRecipe(recipeHTML)
            )
            .then(
                response => fetchPodcast(genre, recipesTime)
            )
            .then(
                podcastHTML => displayPodcasts(podcastHTML, 1)
            )
    })
}


function setUpUi() {
    fetchGenre().then(responseJson => displayLandingPage(responseJson.genres))
    handleSubmitButton()
}

$(setUpUi)