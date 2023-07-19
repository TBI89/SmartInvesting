/// <reference path="jquery-3.7.0.js" />

"use strict";

$(() => {

    // Display the first 100 coins each time the page is loaded:
    handleHome();

    // Load the "trackedCoins" array from storage: 
    loadTrackedCoinsFromLocalStorage();

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
        try {
            event.preventDefault();
            const searchInput = $("#searchInput").val();
            await searchCoins(searchInput);
        }
        catch (err) {
            console.log(err.message);
        }
    });

    // Fetch coins data, filter coins & display results:
    async function searchCoins(query) {
        const coins = await getJson("coins.json");
        // const coins = await getJson("https://api.coingecko.com/api/v3/coins/list"); Replace with that line to get live data.
        const searchResult = coins.filter(coin =>
            coin.symbol.toLowerCase() === (query.toLowerCase()) // Result will display only if the user enters the whole symbol name.
        );
        displayCoins(searchResult);
    }

    // Fetch coin data from the given url:
    async function getJson(url) {
        try {
            const response = await fetch(url);
            const json = await response.json();
            return json;
        }
        catch (err) {
            console.log(err.message);
        }
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
            html += `<div class="card" style="width: 15rem; height: 25rem; overflow: auto;">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault_${coins[i].id}">
              <label class="form-check-label" for="flexSwitchCheckDefault"></label>
            </div>
            <div class="card-body">
              <h5 class="card-title">${coins[i].symbol}</h5>
              <p class="card-text">${coins[i].name}</p>
          
              <button id="button_${coins[i].id}" class="btn btn-primary more-info" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_${coins[i].id}">
                More Info
              </button>
              <div style="min-height: 120px;">
                <div class="collapse collapse-vertical w-100 p-3"  id="collapse_${coins[i].id}">
                  <div class="card card-body">
          
                  </div>
                </div>
              </div>
            </div>
          </div>
          `;
        }
        $("#coinsContainer").html(html);
        hideProgressBar(); // Remove the progress bar when the coins are displayed.
    }

    let trackedCoins = []; // Empty array to store tracked coins.
    let selectedCoinIndex = -1; // Store the 6th coin's index.

    // Track coins using the toggle button:
    $("#coinsContainer").on("click", ".form-check-input", function () {
        const isChecked = $(this).prop("checked");
        const coinId = $(this).closest(".card").find(".btn").attr("id").replace("button_", "");

        const maxLimit = 5;

        // Validation for turning on the toggle for 5 coins max:
        if (isChecked) {
            if (trackedCoins.length >= maxLimit) {
                $(this).prop("checked", false); // On the 6th press: disable the toggle button & open bootstrap dialog.
                selectedCoinIndex = coinId;
                let html =
                    `
                <div id="dialogMsg" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
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
                $("#dialogMsg").modal("show"); // Display the dialog.
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

            // Remove the coin from the tracked coins array:
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
        try {
            const coins = await getJson("coins.json");
            // const coins = await getJson("https://api.coingecko.com/api/v3/coins/list"); Replace with that line to get live data.
            return coins.find(coin => coin.id === coinId);
        }
        catch (err) {
            console.log(err.message);
        }
    }

    // Display the coins tracked in the dialog:
    function displayCoinsTracked(trackedCoins) {
        let html = "";
        for (let i = 0; i < trackedCoins.length; i++) {
            html += `
            <div id="modal-card" class="card" style="width: 15rem; height: 25rem; overflow: auto;">
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
        $("#trackedCoinsContainer").html(html); // Update the content of trackedCoinsContainer.
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
                checkedCoin.prop("checked", false); // Uncheck the specific coin on the currencies section.
            }
            console.log(`Coin ${coinId} has been removed from 'trackedCoins'`);
        }
        else {
            console.log(`Coin ${coinId} not found in 'trackedCoins'`);
        }
        $("#dialogMsg").modal("hide");
    });

    // Add the new coin to "trackedCoins" arr & check his switch:
    $("body").on("hidden.bs.modal", "#dialogMsg", () => {
        trackedCoins.push(selectedCoinIndex);
        addToLocalStorage(selectedCoinIndex, trackedCoins);
        const toggleButton = $(`#flexSwitchCheckDefault_${selectedCoinIndex}`);
        toggleButton.prop("checked", true); // Check the specific coin on the currencies section.
        console.log("Coin " + selectedCoinIndex + " was added to 'trackedCoins");
        console.log(trackedCoins);
    });

    // Add the tracked coins to local storage (don't delete after 2 minuets):
    function addToLocalStorage(coinId, trackedCoins) {
        localStorage.getItem(coinId);
        localStorage.setItem(coinId, JSON.stringify(trackedCoins));
    }

    // Load the trackCoins arr from local storage:    
    function loadTrackedCoinsFromLocalStorage() {
        for (const coinId in localStorage) {
            if (localStorage.hasOwnProperty(coinId)) {
                const trackedCoins = JSON.parse(localStorage.getItem(coinId));
                if (Array.isArray(trackedCoins)) {
                    trackedCoins.forEach(coin => {
                        const toggleButton = $(`#flexSwitchCheckDefault_${coin.id}`);
                        if (toggleButton.length) {
                            toggleButton.prop("checked", true); // Keep the switch "checked" when the page is refreshed.
                        }
                    });
                }
            }
        }
    }

    // Remove coins that the user stopped tracking from local storage:
    function removeFromLongTermStorage(coinId) {
        localStorage.removeItem(coinId);
    }

    // Hold the reference for setInterval function:
    let liveReportsInterval;

    // Save old data points (to display on the graph):
    const dataPointHistories = {};

    // Get data to display on the live reports:
    async function handleLiveReports() {
        const trackedCoinResponse = await getJson(
            `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${trackedCoins
                .map(c => c.symbol)
                .join(",")}&tsyms=USD`
        );

        try {
            for (const coinSymbol in trackedCoinResponse) {
                const coinValue = trackedCoinResponse[coinSymbol].USD;
                const dataPoint = { x: new Date(), y: coinValue };

                if (!dataPointHistories[coinSymbol]) {
                    dataPointHistories[coinSymbol] = []; // Create a new dataPointHistory array for the coin if it doesn't exist.
                }

                dataPointHistories[coinSymbol].push(dataPoint); // Add the data point to the corresponding dataPointHistory array.
            }

            const dataSeries = Object.keys(dataPointHistories).map(coinSymbol => ({
                type: "spline",
                name: coinSymbol,
                showInLegend: true,
                xValueFormatString: "HH:mm:ss",
                yValueFormatString: "#,##0.00",
                dataPoints: dataPointHistories[coinSymbol] // Use the corresponding dataPointHistory array for each coin.
            }));

            const options = {
                exportEnabled: true,
                animationEnabled: true,
                title: {
                    text: "Live Reports",
                },
                axisY: {
                    title: "Coin Value (USD)",
                    titleFontColor: "#4F81BC",
                    lineColor: "#4F81BC",
                    labelFontColor: "#4F81BC",
                    tickColor: "#4F81BC",
                },
                axisX: {
                    valueFormatString: "HH:mm:ss",
                },
                toolTip: {
                    shared: true,
                    content: "{name}: ${y}",
                },
                legend: {
                    cursor: "pointer",
                },
                data: dataSeries,
            };

            if (trackedCoins.length > 0) {
                const chartContainer = $("#chartContainer").CanvasJSChart();

                // Check if the chart already exists:
                if (chartContainer) {
                    chartContainer.options.data = dataSeries;  // Update the dataPoints of the existing chart.
                    chartContainer.render();
                } else {// Create a new chart.
                    $("#chartContainer").CanvasJSChart(options);
                }
                $(".alert").hide();
            } else {
                let html =
                    `
            <div class="alert alert-info" role="alert">
            Your favorite traced coins is empty.\n Please press the button (on the right hand side) for coins you wish to get live reports for
           </div>
            `;
                $("#alertContainer").html(html);
            }

            const maxDataPoints = 4; // Max number of data points on the chart.

            // Remove the oldest data point:
            for (const coinSymbol in dataPointHistories) {
                if (dataPointHistories[coinSymbol].length > maxDataPoints) {
                    dataPointHistories[coinSymbol].shift();
                }
            }

        } catch (error) {
            console.error("Error fetching live reports data:", error);
        }
    }

    // On click (More info button) display the first 3 letters of each coin:
    $("#coinsContainer").on("click", ".more-info", async function () {
        const coinId = $(this).attr("id").substring(7);
        await handleMoreInfo(coinId);
    });

    $("#homeLink").click(async () => {
        clearInterval(liveReportsInterval); // Stop updating the graph when the user clicks on another nav-link.
        await handleHome();
    });

    $("#reportsLink").click(async () => {
        await handleLiveReports();
        clearInterval(liveReportsInterval);  // Clear the existing interval if it is already set.
        liveReportsInterval = setInterval(handleLiveReports, 2000);  // Update the graph every 2 seconds.
        hideProgressBar(); // Remove progress bar when the reports page is loaded.
    });

    $("#aboutLink").click(() => {
        clearInterval(liveReportsInterval); // Stop updating the graph when the user clicks on another nav-link.
        hideProgressBar(); // Remove progress bar when the about page is loaded.
    });

    async function handleHome() {
        const coins = await getJson("coins.json");
        // const coins = await getJson("https://api.coingecko.com/api/v3/coins/list"); Replace with that line to get live data.
        console.log(coins);
        displayCoins(coins);
    }

    // Display image and data about the coin in relation to USD, EUR and ILS:
    async function handleMoreInfo(coinId) {
        const coin = await getJson("https://api.coingecko.com/api/v3/coins/" + coinId);
        const imageSource = coin.image.thumb;

        // If the currencies for a given coin is undefined: display "N/A" (to avoid an error in promise):
        const usd = coin.market_data.current_price.usd !== undefined ? coin.market_data.current_price.usd.toFixed(3) : 'N/A';
        const eur = coin.market_data.current_price.eur !== undefined ? coin.market_data.current_price.eur.toFixed(3) : 'N/A';
        const ils = coin.market_data.current_price.ils !== undefined ? coin.market_data.current_price.ils.toFixed(3) : 'N/A';

        const moreInfo = `
            <div class="price-info">
                <img src="${imageSource}"> <br>
                USD $${usd !== 'N/A' ? usd : 'N/A'}<br>
                EUR: €${eur !== 'N/A' ? eur : 'N/A'}<br>
                ILS: ₪${ils !== 'N/A' ? ils : 'N/A'}
            </div>
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

    // Add the "More Info" data to *session* storage:
    function addToSessionStorage(coinId, coinInfo) {
        const saveData = sessionStorage.getItem(coinId);
        if (saveData) { // Check if coin ID already exist.
            console.log(`${coinId} already exist in session storage.`); //If yes: just send a message.
        }
        else {
            sessionStorage.setItem(coinId, JSON.stringify(coinInfo)); // Else: send a message & add to storage.
            console.log(`${coinId} added to session storage.`);
        }
        setTimeout(() => {
            sessionStorage.removeItem(coinId);
            console.log(`${coinId} was removed from session storage`); // Remove all data after 2 minutes.
        }, 120000);
    }

});