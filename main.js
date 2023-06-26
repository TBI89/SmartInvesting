/// <reference path="jquery-3.7.0.js" />

"use strict";

$(() => {

    // Display the first 100 coins each time the page is loaded:
    handleHome();

    $("a.nav-link").click(function () {
        // Pill UI:
        $("a.nav-link").removeClass("active");
        $(this).addClass("active");

        // Display progress bar  (ENABLE WHEN ALL SECTIONS ARE SET)
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

    // Fetch coin data from the given url:
    async function getJson(url) {
        const response = await fetch(url);
        const json = await response.json();
        return json;
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
    }

    // Empty array to store tracked coins
    let trackedCoins = [];

    // Track coins using the toggle button:
    $("#coinsContainer").on("click", ".form-check-input", function () {
        const isChecked = $(this).prop("checked");
        const coinId = $(this).closest(".card").find(".btn").attr("id").replace("button_", "");

        const maxLimit = 5;

        //   Validation for turn on the toggle for 5 coins max:
        if (isChecked) {
            if (trackedCoins.length >= maxLimit) { // on the 6th press: disable the toggle button & open bootstrap dialog
                $(this).prop("checked", false);
                let html =
                    `
                <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static">
               <div class="modal-dialog">
                   <div class="modal-content">
                       <div class="modal-header">
                           <h1 class="modal-title fs-5" id="staticBackdropLabel">Max Tracking Limit</h1>
                           <button type="button" class="btn-close"></button>
                       </div>
                       <div class="modal-body">
                           To add a new coin, please remove one of your correct coins:
                       </div>
                       <div class="modal-footer">
                           <button type="button" class="btn btn-secondary" id="close-button">Done</button>
                       </div>
                   </div>
               </div>
               </div>
               `;
                $("#dialogDiv").html(html);
                $("#staticBackdrop").modal("show"); // Display the dialog
            }
            else {
                trackedCoins.push(coinId);
                console.log(`Toggle button for coin ${coinId} is ON`);
            }
        }
        else {
            // Remove the coin ID from the tracked coins array
            const index = trackedCoins.indexOf(coinId);
            if (index !== -1) {
                trackedCoins.splice(index, 1);
            }
            console.log(`Toggle button for coin ${coinId} is OFF`);
        }
    });

    // Remove dialog when the user clicks "Done"
    $("#dialogDiv").on("click", "#close-button",  function () { // ***FIX***
        $("#staticBackdrop").modal("hide");
        console.log("clicked");
    });

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

        const coinInfo = {
            imageSource: imageSource,
            usd: usd,
            eur: eur,
            ils: ils
        };

        addToLocalStorage(coinId, coinInfo); // Add the "More Info" data to local storage
    }

    function addToLocalStorage(coinId, coinInfo) {
        const saveData = localStorage.getItem(coinId);
        if (saveData) { // Check if coin ID already exist
            console.log(`${coinId} already exist in local storage.`); //If yes: just send a message
        }
        else {
            localStorage.setItem(coinId, JSON.stringify(coinInfo)); // Else: send a message & add to storage
            console.log(`${coinId} added to local storage.`);
        }
        setTimeout(() => {
            localStorage.removeItem(coinId);
            console.log(`${coinId} was removed from local storage`); // Remove all data after 2 minutes
        }, 120000);
    }

});