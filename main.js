/// <reference path="jquery-3.7.0.js" />

"use strict";

$(() => {

    // keep the switch checked for the items in "trackedCoins":
    // loadTrackedCoinsFromStorage(); ***ENABLE WHEN THE FUNCTION IS COMPLETED***

    // Display the first 100 coins each time the page is loaded:
    handleHome();

    // Show the progress bar when the page is loading:
    function showProgressBar() {
        $("#progressBar").show();
    }
    // Hide the progress bar when the page is loaded:
    function hideProgressBar() {
        $("#progressBar").hide();
    }

    $("a.nav-link").click(function () {
        // Pill UI:
        $("a.nav-link").removeClass("active");
        $(this).addClass("active");

        // Display current section:
        const sectionId = $(this).attr("data-section");
        $("section").hide();
        $("#" + sectionId).show();
        showProgressBar();
    });

    // Handle user searches:
    $("#form").submit(async function (event) {
        event.preventDefault();
        const searchInput = $("#searchInput").val();
        await searchCoins(searchInput);
        showProgressBar(); // Display progress bar when the page is loading...
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
              <input class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault_${coins[i].id}">
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
        hideProgressBar(); // Remove the progress bar when the coins are displayed
    }

    let trackedCoins = []; // Empty array to store tracked coins
    let selectedCoinIndex = -1; //Store the 6th coin's index

    // Track coins using the toggle button:
    $("#coinsContainer").on("click", ".form-check-input", function () {
        const isChecked = $(this).prop("checked");
        const coinId = $(this).closest(".card").find(".btn").attr("id").replace("button_", "");

        const maxLimit = 5;

        // Validation for turning on the toggle for 5 coins max:
        if (isChecked) {
            if (trackedCoins.length >= maxLimit) {
                $(this).prop("checked", false); // On the 6th press: disable the toggle button & open bootstrap dialog
                selectedCoinIndex = coinId;
                let html =
                    `
                <div id="dialogMsg" class="modal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Max Coin Limit</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>To add a new coin, please remove one of your current coins:</p>
                                <div id="trackedCoinsContainer"></div>
                            </div>
                            <div class="modal-footer">
                                <button id="close-button" type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                $("body").append(html);
                $("#dialogMsg").modal("show"); // Display the dialog
                displayCoinsTracked(trackedCoins);
            }
            else {

                // Used to display the data of "trackedCoins" array in the dialog:
                findCoinById(coinId).then(function (toggledCoin) {
                    if (toggledCoin) {
                        trackedCoins.push(toggledCoin);
                        console.log(`Toggle button for coin ${coinId} is ON`);
                        displayCoinsTracked(trackedCoins);
                        addToLocalStorage(coinId, trackedCoins);
                        console.log(`Coin ${coinId} was added to local storage`);
                    }
                }).catch(function (error) {
                    console.error(error);
                });
            }
        }
        else {

            // Remove the coin from the tracked coins array
            const index = trackedCoins.findIndex(coin => coin.id === coinId);
            if (index !== -1) {
                trackedCoins.splice(index, 1);
            }
            console.log(`Toggle button for coin ${coinId} is OFF`);
            removeFromLongTermStorage(coinId);
            console.log(`Coin ${coinId} was deleted from local storage`);
            displayCoinsTracked(trackedCoins);
        }
    });

    // Find coin by id:
    async function findCoinById(coinId) {
        const coins = await getJson("coins.json");
        return coins.find(coin => coin.id === coinId);
    }

    // Display the coins tracked in the dialog:
    function displayCoinsTracked(trackedCoins) {
        let html = "";
        for (let i = 0; i < trackedCoins.length; i++) {
            html += `
            <div class="card" style="width: 18rem; height: 20rem; overflow: auto;">
              <div class="card-body">
                <h5 class="card-title">${trackedCoins[i].symbol}</h5>
                <p class="card-text">${trackedCoins[i].name}</p> 
                <button class="btn btn-primary remove-coin" type="button" data-coin-id="${trackedCoins[i].id}">
                  Remove
                </button>
                    </div>
                  </div>
          `;
        }
        $("#trackedCoinsContainer").html(html); // Update the content of trackedCoinsContainer
    }

    // Remove coin from the "trackedCoins" array & close dialog when the user clicks "Remove":
    $("body").on("click", ".remove-coin", function () {
        const coinId = $(this).data("coin-id");
        const index = trackedCoins.findIndex(coin => coin.id === coinId);
        if (index !== -1) {
            trackedCoins.splice(index, 1);
            removeFromLongTermStorage(coinId);
            console.log(`Coin ${coinId} was deleted from local storage`);
            const checkedCoin = $(`#flexSwitchCheckDefault_${coinId}`);
            if (checkedCoin.length) {
                checkedCoin.prop("checked", false); // Uncheck the specific coin on the currencies section
            }
            console.log(`Coin ${coinId} has been removed from 'trackedCoins'`);
        }
        else {
            console.log(`Coin ${coinId} not found in 'trackedCoins'`);
        }
        $("#dialogMsg").modal("hide");
        console.log(trackedCoins);
    });

    // Add the new coin to "trackedCoins" arr & check his switch:
    $("body").on("hidden.bs.modal", "#dialogMsg", function () {
        trackedCoins.push(selectedCoinIndex);
        const toggleButton = $(`#flexSwitchCheckDefault_${selectedCoinIndex}`);
        toggleButton.prop("checked", true); // Check the specific coin on the currencies section  
        console.log("Coin " + selectedCoinIndex + " was added to 'trackedCoins");
    });

    // Add the tracked coins to local storage (don't delete after 2 minuets):
    function addToLocalStorage(coinId, trackedCoins) {
        localStorage.getItem(coinId);
        localStorage.setItem(coinId, JSON.stringify(trackedCoins));
    }

    // Remove coins that the user stopped tracking from local storage:
    function removeFromLongTermStorage(coinId) {
        localStorage.removeItem(coinId);
    }

    // Keep the switch checked for "trackedCoins" when the page is refreshed: ***COMPLETE***
    function loadTrackedCoinsFromStorage() {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const trackedCoins = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(trackedCoins) && trackedCoins.length > 0) {
            trackedCoins.forEach(coinId => {
              const toggleButton = $(`#flexSwitchCheckDefault_${coinId}`);
              toggleButton.prop("checked", true);
            });
          }
        }
      }
      

    // On click (More info button) display the first 3 letters of each coin:
    $("#coinsContainer").on("click", ".more-info", async function () {
        const coinId = $(this).attr("id").substring(7);
        await handleMoreInfo(coinId);
        showProgressBar();
    });

    $("#homeLink").click(async () => await handleHome());
    $("#reportsLink").click(() => { });

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

        addToSessionStorage(coinId, coinInfo);
    }

    // Add the "More Info" data to local *session* storage:
    function addToSessionStorage(coinId, coinInfo) {
        const saveData = sessionStorage.getItem(coinId);
        if (saveData) { // Check if coin ID already exist
            console.log(`${coinId} already exist in session storage.`); //If yes: just send a message
        }
        else {
            sessionStorage.setItem(coinId, JSON.stringify(coinInfo)); // Else: send a message & add to storage
            console.log(`${coinId} added to session storage.`);
        }
        setTimeout(() => {
            sessionStorage.removeItem(coinId);
            console.log(`${coinId} was removed from session storage`); // Remove all data after 2 minutes
        }, 120000);
    }

});