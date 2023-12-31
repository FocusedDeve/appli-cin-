let movieNameref = document.getElementById("movie-name");
let searchBtn = document.getElementById("search-btn");
let result = document.getElementById("result");

let getMovie = () =>{
    let movieName = movieNameref.value;
    let url = `http://www.omdbapi.com/?t=${movieName}&apikey=${key}`;

    //si le champ input est vide

    
    if(movieName === undefined || movieName === null || movieName === "") {
        result.innerHTML = `<h3 class="msg">Merci d'entrer un nom de film</h3>`;
      }
      
    else{
        fetch(url).then((response) => response.json()).then
        ((data) => {
            if(data.Response == "True") {
                result.innerHTML =`
                <div class="info">
                    <div>
                        <h2>${data.Title}</h2>
                        <div class="rating">
                            <img src="assets/star-icon.svg" alt="star">
                            <h4>${data.imdbRating}</h4>
                        </div>
                        <div class="details">
                            <span>${data.Rated}</span>
                            <span>${data.Year}</span>
                            <span>${data.Runtime}</span>
                        </div>
                        <div class="genre">
                            <div>${data.Genre.split(",").join("</div><div>")}</div>
                        </div>
                        <div class="content">
                            <h3>Plot:</h3>
                            <p>${data.Plot}</p>
                            <h3>Cast:</h3>
                            <p>${data.Actors}</p>
                        </div>
                        <div class="voir-film">
                        <!-- lien sur les sites -->
                            <a href="https://www.imdb.com/" target="_blank">Streamer sur iMDb TV</a>                        
                            <a href="https://www.netflix.com/" target="_blank">Regarder sur Netflix</a>                        
                            <a href="https://t.me/fimsserieszone" target="_blank">Telecharger sur Telegram</a>
                            <a href=" https://www.rakuten.tv/fr/gardens/free" target="_blank">Voir sur rakutenTV</a>
                            <a href="https://animationdigitalnetwork.fr/vi..." target="_blank">Voir les animés</a>
                            <a href="https://wedotv.com/" target="_blank">Voir Documentaire</a>
                           
                            </div>
                    </div>
                    <img src=${data.Poster} class="poster">
                </div>
            `
            } 
            // si le film n'existe pas dans la base de donnée
            else{
                result.innerHTML = `<h3 class="msg">${data.Error}</h3`
            }
        }).catch(() =>{
            result.innerHTML = `<h3 class="msg"> Erreur de recharchement verifiez votre connection internet</h3`

        })
            
    }
}

searchBtn.addEventListener("click", getMovie);
window.addEventListener("load", getMovie);


const themeBtn = document.getElementById("theme-btn");
let darkMode = true;

themeBtn.addEventListener("click", () => {
    if (darkMode) {
        document.documentElement.style.setProperty('--bgColor', 'var(--bgColor-light)');
        document.documentElement.style.setProperty('--textColor', 'var(--textColor-light)');
        themeBtn.textContent = "Mode sombre";
        darkMode = false;
    } else {
        document.documentElement.style.setProperty('--bgColor', 'var(--bgColor-dark)');
        document.documentElement.style.setProperty('--textColor', 'var(--textColor-dark)');
        themeBtn.textContent = "Mode clair";
        darkMode = true;
    }
});