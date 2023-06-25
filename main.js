/// <reference path="jquery-3.7.0.js" />

"use strict";

$(() => {

    // Display the first 100 coins each time the page is loaded:
    handleHome();

    $("a.nav-link").click(function () {
        // Pill UI:
        $("a.nav-link").removeClass("active");
        $(this).addClass("active");
        //    Display progress bar (ENABLE AFTER ALL SECTIONS ARE SET!):
        // $("#progressBar").html('<img src="assets/images/progress-bar.gif"></img>');

        // Display current section:
        const sectionId = $(this).attr("data-section");
        $("section").hide();
        $("#" + sectionId).show();
    });

    // Handle user searches:
    $("#form").submit(async function (event) {
        event.preventDefault();
        const searchInput = $("#searchInput").val();
        await searchCoins(searchInput);
    });

    // Fetch coins data, filter coins & display results:
    async function searchCoins(query) {
        const coins = await getJson("coins.json");
        const searchResult = coins.filter((coin) =>
            coin.symbol.toLowerCase().includes(query.toLowerCase())
        );
        displayCoins(searchResult);
    }

    // Display the first 100 items on the page:
    function displayCoins(coins) {
        if (!Array.isArray(coins) || coins.length === 0) {
            $("#coinsContainer").html("No Coins Found");
            return;
        }

        coins = coins.filter(c => c.symbol && c.symbol.length <= 3);
        let html = "";
        for (let i = 0; i < Math.min(coins.length, 100); i++) {
            html += `<div class="card" style="width: 18rem; height: 20rem; overflow: auto;">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault">
              <label class="form-check-label" for="flexSwitchCheckDefault"></label>
            </div>
            <div class="card-body">
              <h5 class="card-title">${coins[i].symbol}</h5>
              <p class="card-text">${coins[i].name}</p>
          
              <button id="button_${coins[i].id}" class="btn btn-primary more-info" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_${coins[i].id}">
                More info
              </button>
              <div style="min-height: 120px;">
                <div class="collapse collapse-horizontal" id="collapse_${coins[i].id}">
                  <div class="card card-body">
          
                  </div>
                </div>
              </div>
            </div>
          </div>
          `;
        }
        $("#coinsContainer").html(html);
        $("#progressBar").css("display: none;");
    }

    // On click (More info button) display the first 3 letters of each coin:
    $("#coinsContainer").on("click", ".more-info", async function () {
        const coinId = $(this).attr("id").substring(7);
        await handleMoreInfo(coinId);
    });

    $("#homeLink").click(async () => await handleHome());
    $("#reportsLink").click(() => { });
    $("#aboutLink").click(() => { });

    async function handleHome() {
        const coins = await getJson("coins.json");
        console.log(coins);
        displayCoins(coins);
    }

    // Display image and data about the coin in relation to USD, EUR and ILS:
    async function handleMoreInfo(coinId) {
        const coin = await getJson("https://api.coingecko.com/api/v3/coins/" + coinId);
        const imageSource = coin.image.thumb;
        const usd = coin.market_data.current_price.usd;
        const eur = coin.market_data.current_price.eur;
        const ils = coin.market_data.current_price.ils;
        const moreInfo = `
    <div class="price-info">
        <img src="${imageSource}"> <br>
        USD $${usd}<br>
        EUR:€ ${eur}<br>
        ILS:₪ ${ils}
        `;
        $(`#collapse_${coinId}`).children().html(moreInfo);
    }

    // Fetch coin data from the given url:
    async function getJson(url) {
        const response = await fetch(url);
        const json = await response.json();
        return json;
    }

});