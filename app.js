const BASE = "UAH";
const CURRENCIES = ["USD", "EUR", "PLN"];
const curreciesDataPromises = getDataPromises(CURRENCIES, BASE);
console.log(curreciesDataPromises)
// fill table
/* Functionality: this function launches first, that passes a cycle on an array(Currencies)
and make a call on every item a function gets HistoricalDataForCurrency and returns
a promise. Then promise is pushed in a loop for promises so we're able to get itself
more than one time and call a function to initialize a table row (cos currency doesn't look
like a table notwithstanding it's a table in a mark-up.) It receives data, and sends it to store
and initialize a table.
*/
function getDataPromises(currencies, base){
    const promises = [];
    for(let currency of currencies){
        const temp = getHistoricalDataForCurrency(currency, base).then((item) => {
            addRowCurrency(item);
            console.log(item);

            return item;
        });
        promises.push(temp);
    }
    return promises;
}

curreciesDataPromises[0].then((data) => {
    initHighchart(data.timestamps, data.currency);
});

handleConverter();
// fill dropdown
document.getElementById("currecies-select").addEventListener("change", (e) => {
    if(curreciesDataPromises.length != 0){
        const targetIndex = CURRENCIES.indexOf(e.target.value)
        if(targetIndex > -1) {
            curreciesDataPromises[targetIndex].then((data) => {
                console.log(data);
                initHighchart(data.timestamps, data.currency);
            });
        }
    }
});

document.getElementById("sign-in-btn").addEventListener("click", () => {
    document.querySelector(".modal").style.display = "block";
});

document.querySelector(".close-btn").addEventListener("click", () => {
    closeModal();
});

document.getElementById("sign-in-form").addEventListener("submit", (e) => {
    e.preventDefault();
    closeModal();
});

//Functionality: is executed when u click on a cross of a modal window
function closeModal() {
    document.querySelector(".modal").style.display = "none";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
}
/*Functionality: converter and graph r independent, handleConverter attaches
an Event Handler to inputs and converter's selectors.
*/
function handleConverter() {
    let leftInput = document.getElementById("left-quantity");
    let leftSelect = document.getElementById("left-currency-select");

    let rightInput = document.getElementById("right-quantity");
    let rightSelect = document.getElementById("right-currency-select");

    let swicher = document.getElementById("switch-currency");

    leftInput.addEventListener("input", convertValueFromLeft);
    leftSelect.addEventListener("change", convertValueFromRight);

    rightInput.addEventListener("input", convertValueFromRight);
    rightSelect.addEventListener("change", convertValueFromLeft);

    swicher.addEventListener("click", () => {
        [leftSelect.value, rightSelect.value] = [rightSelect.value, leftSelect.value];
        convertValueFromLeft();
    });
    function convertValueFromLeft() {
        convertCurrencyValue({
            fromInput: leftInput,
            fromSelect: leftSelect,
            toInput: rightInput,
            toSelect: rightSelect
        });
    }

    function convertValueFromRight() {
        convertCurrencyValue({
            fromInput: rightInput,
            fromSelect: rightSelect,
            toInput: leftInput,
            toSelect: leftSelect
        });
    }
}

/*
Functionality: Handler convertCurrencyValue is a function. Firstly it checks
if values r true. Then, if currency is chosen in both selectors r the same, then
the value 1:1. Then if it converts to national currency, the value is divided to rate,
vice versa multiplies. If previous conditions were executed then the function'd finished.
If no it finds a rate between currency and multiply input's value.
*/
function convertCurrencyValue({fromInput, toInput, fromSelect, toSelect}){
    if(fromInput.value == "" || fromInput.value < 0) {
        if(toInput.value != "") toInput.value = "";
        return;
    }
    toInput.value == "";
    const currencyFrom = fromSelect.value;
    const currencyTo = toSelect.value;
    if(currencyFrom == currencyTo) {
        toInput.value = fromInput.value;
        return;
    }
    if(currencyTo == BASE){
        const rate = Number(document.getElementById(`${currencyFrom}-rate`).textContent);
        toInput.value = (fromInput.value * rate).toFixed(3);
        return;
    }
    if(currencyFrom == BASE) {
        const rate = Number(document.getElementById(`${currencyTo}-rate`).textContent);
        toInput.value = (fromInput.value / rate).toFixed(3);
        return;
    }
    const rateFrom = Number(document.getElementById(`${currencyFrom}-rate`).textContent);
    const rateTo = Number(document.getElementById(`${currencyTo}-rate`).textContent);

    toInput.value = ((rateFrom / rateTo) * fromInput.value).toFixed(3);
}

//adds a row in a table
function addRowCurrency({ currency, valueToday }){
    console.log(currency, valueToday)
    let table = document.getElementById("table-currency");

    let row = table.insertRow(table.rows.length );
    let currencyCell = row.insertCell(0);
    let exchangeCell = row.insertCell(1);

    currencyCell.textContent = currency;

    exchangeCell.id = `${currency}-rate`
    exchangeCell.textContent = valueToday;
}

/*
This function requests on API for values of current currency for a last month. Then
it parses and format response in a format where it's convenient to work w/ and return
a promise, that is continually using.
*/
function getHistoricalDataForCurrency(currency, base){
    const today = new Date();
    const startDay = new Date(today.getFullYear(), today.getMonth()-1, today.getDate());
    const formatDate = (date) => `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;

    // Preview's politic doesn't permit to load http, it creates it's own proxy, so we add proxy here
    const promise = fetch(`https://cors-anywhere.herokuapp.com/http://currencies.apps.grandtrunk.net/getrange/${formatDate(startDay)}/${formatDate(today)}/${currency}/${base}`, {
        mode: "cors"
    })
    .then((response) => response.text())
    .then((data) => {
        const lines = data.split("\n");
        const timestamps = lines.map((item, i) => {
            if(i == lines.length - 1) return;
            const splited = item.split(" ");
            splited[0] = new Date(splited[0]).getTime();
            splited[1] = +Number(splited[1]).toFixed(2);
            return splited;
        });

        timestamps.length = lines.length - 1;
        return {currency, timestamps, valueToday: timestamps[timestamps.length - 1][1]};
    }).catch((e) => console.log(e));

    return promise;
}

/*
Functionality: A set of values r transfer in a function(a moment of time, value),
thanks to which Highchart is building a graph, and name of currency for the sake of
displaying a tooltip's window correctly(if u lead on any point on a graph).
*/
function initHighchart(data, currency){
    Highcharts.chart("chart-container", {
        chart: {
            zoomType: "x",
            // backgroundColor: "transparent"
        },
        title: {
            text: ""
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Натисніть і потягніть у ділянці, щоб збільшити' : 'Стисніть діагаму, щоб збільшити'
        },
        xAxis: {
            type: 'datetime'
        },
        yAxis: {
            title: {
                text: 'Exchange rate'
            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1
                    },
                    stops: [
                        [0, "#359C13"],
                        [1, Highcharts.Color("#359C13").setOpacity(0).get('rgba')]
                    ],
                    // stops: [
                    //     [0, Highcharts.getOptions().colors[0]],
                    //     [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                    // ]
                },
                marker: {
                    radius: 2
                },
                lineWidth: 1,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                threshold: null
            }
        },
        series: [{
            type: 'area',
            name: `${currency} до ${BASE}`,
            data: data
        }]
    });
}
