//[Data Javascript]
//Project: Responsive Pool Template
//Should Be Included In All Pages. It Controls Data And Charts

var WebURL = "https://example.org/";
var API = "https://example.org/api/";
var stratumAddress = "stratum+tcp://example.org";
var infoLink = "https://etcblockexplorer.com/block/";
var txLink = "https://etcblockexplorer.com/tx/";
var defaultPool = 'etc';
var currentPool = defaultPool;

// Check browser compatibility
var nua = navigator.userAgent;
var is_IE = ((nua.indexOf('Mozilla/5.0') > -1 && nua.indexOf('Trident') > -1) && !(nua.indexOf('Chrome') > -1));
if (is_IE) { console.log('Running in IE browser is not supported - ', nua); }

// General formatter function
function _formatter(value, decimal, unit) {
	if (value === 0) {
		return "0 " + unit;
	} else {
		var si = [
			{ value: 1, symbol: "" },
			{ value: 1e3, symbol: "K" },
			{ value: 1e6, symbol: "M" },
			{ value: 1e9, symbol: "G" },
			{ value: 1e12, symbol: "T" },
			{ value: 1e15, symbol: "P" },
			{ value: 1e18, symbol: "E" },
			{ value: 1e21, symbol: "Z" },
			{ value: 1e24, symbol: "Y" }
		];
		for (var i = si.length - 1; i > 0; i--) {
			if (value >= si[i].value) {
				break;
			}
		}
		return ((value / si[i].value).toFixed(decimal).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + " " + si[i].symbol + unit);
	}
}

// Time convert Local -> UTC
function convertLocalDateToUTCDate(date, toUTC) {
	date = new Date(date);
	var localOffset = date.getTimezoneOffset() * 60000;
	var localTime = date.getTime();
	if (toUTC) {
		date = localTime + localOffset;
	} else {
		date = localTime - localOffset;
	}
	newDate = new Date(date);
	return newDate;
}

// Time convert UTC -> Local
function convertUTCDateToLocalDate(date) {
	var newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
	var localOffset = date.getTimezoneOffset() / 60;
	var hours = date.getUTCHours();
	newDate.setHours(hours - localOffset);
	return newDate;
}

// String convert -> Date
function dateConvertor(date) {
	var options = {
		year: "numeric",
		month: "numeric",
		day: "numeric"
	};
	var newDateFormat = new Date(date).toLocaleDateString("en-US", options);
	var newTimeFormat = new Date(date).toLocaleTimeString();
	var dateAndTime = newDateFormat + ' ' + newTimeFormat
	return dateAndTime
}

// Converts seconds
function readableSeconds(t) {
	var seconds = Math.round(t);
	var minutes = Math.floor(seconds / 60);
	var hours = Math.floor(minutes / 60);
	var days = Math.floor(hours / 24);
	if (days === Infinity) days = 0;
	hours = hours - (days * 24);
	if (isNaN(hours)) hours = 0;
	if (hours === Infinity) hours = 0;
	minutes = minutes - (days * 24 * 60) - (hours * 60);
	if (isNaN(minutes)) minutes = 0;
	if (minutes === Infinity) minutes = 0;
	seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
	if (isNaN(seconds)) seconds = 0;
	if (seconds === Infinity) seconds = 0;
	if (days > 0) {
		return (days + "d " + hours + "h " + minutes + "m " + seconds + "s");
	}
	if (hours > 0) {
		return (hours + "h " + minutes + "m " + seconds + "s");
	}
	if (minutes > 0) {
		return (minutes + "m " + seconds + "s");
	}
	return (seconds + "s");
}

// Time different calculation
function timeDiff(tstart, tend) {
	var diff = Math.floor((tend - tstart) / 1000), units = [
		{ d: 60, l: "s" },
		{ d: 60, l: "m" },
		{ d: 24, l: "h" },
		{ d: 7, l: "d" }
	];
	var s = '';
	for (var i = 0; i < units.length; ++i) {
		s = (diff % units[i].d) + units[i].l + " " + s;
		diff = Math.floor(diff / units[i].d);
	}
	return s;
}

function timeDiffSec(tstart, tend) {
	var diff = Math.floor((tend - tstart) / 1000), units = [
		{ d: 60, l: " seconds" }
	];
	var s = '';
	for (var i = 0; i < units.length; ++i) {
		s = (diff % units[i].d) + units[i].l + " " + s;
		diff = Math.floor(diff / units[i].d);
	}
	return s;
}

// Scroll to top of the page
function scrollPageTop() {
	document.body.scrollTop = 0;
	document.documentElement.scrollTop = 0;
	var elmnt = document.getElementById("page-scroll-top");
	elmnt.scrollIntoView();
}

// Check if file exits
function doesFileExist(urlToFile) {
	var xhr = new XMLHttpRequest();
	xhr.open('HEAD', urlToFile, false);
	xhr.send();
	if (xhr.status == "404") {
		return false;
	} else {
		return true;
	}
}

// Load Pool Stats Content
function loadStatsPage() {
	setInterval(
		(function load() {
			loadStatsData();
			loadSettingsData();
			loadPoolHashrateChart();
			loadPoolMinerChart();
			loadPoolWorkerChart();
			loadNetDiffChart();
			loadNetHashChart();
			loadStatsPrice();
			loadStatsTicker();
			return load;
		})(), 5000
	);
}

// Load Pool Stats Data
function loadStatsData() {
	$.when(
		$.ajax(API + "stats").done(function (data) {
			$.each(data.nodes, function (index, value) {
				difficulty = value.difficulty;
				nethash = value.difficulty / value.blocktime;
				blocktime = value.blocktime;
				chainheight = value.height;
			})
		}),
		$.ajax(API + "stats").done(function (data) {
			var lastBlockDateStats = convertLocalDateToUTCDate(new Date(data.stats.lastBlockFound * 1000), false);
			convertedBlockDateStats = dateConvertor(lastBlockDateStats);
			shares = data.stats.roundShares;
			poolhash = data.hashrate;
			miners = data.minersTotal;
			workers = data.totalWorkers;
		})
	)
		.then(function () {
			ttf = Math.round((nethash / poolhash) * blocktime);
			roundVariance = ((shares / difficulty) * 100).toFixed(2);
			roundShares = (shares / 1000000000).toFixed(2);
			$("#currentEffort").text(roundVariance + " %");
			$("#currentShares").text(roundShares);
			$("#poolTTF").text(readableSeconds(ttf));
			$("#poolHashrate").text(_formatter(poolhash, 3, "H/s"));
			$("#poolStatsHashrate").text(_formatter(poolhash, 3, "H/s"));
			$("#networkHashrate").text(_formatter(nethash, 3, "H/s"));
			$("#networkStatsHashrate").text(_formatter(nethash, 3, "H/s"));
			$("#poolMiners").text(miners + " Miner(s)");
			$("#poolStatsMiners").text(miners + " Miner(s)");
			$("#poolWorkers").text(workers + " Worker(s)");
			$("#poolStatsWorkers").text(workers + " Worker(s)");
			$("#netBlockTime").text(blocktime + " s");
			$("#networkDifficulty").text(_formatter(difficulty, 3, "H/s"));
			$("#networkStatsDifficulty").text(_formatter(difficulty, 3, "H/s"));
			$("#blockchainHeight").text(chainheight);
			$("#lastBlockStats").text(convertedBlockDateStats);
		});
}

// Load Pool Stats Settings
function loadSettingsData() {
	return $.ajax(API + "stats").done(function (data) {
		hold = (data.PayoutThreshold / 1000000000).toFixed(2);
		fee = data.PoolFee;
		pay = data.PayoutInterval;
		$("#payoutSheme").text("PROP");
		$("#poolFee").text(fee + " %");
		$("#payInterval").text(pay);
		$("#minPayment").text(hold + " ETC");
	})
		.fail(function () {
			$.notify(
				{ message: "Error: No response from API.<br>(loadSettingsData)" },
				{ type: "danger", timer: 3000 }
			);
		});
}

// Load Pool Stats Ticker
function loadStatsTicker() {
	$.when(
		$.ajax(API + "stats").done(function (data) {
			hold = (data.PayoutThreshold / 1000000000).toFixed(2);
			fee = data.PoolFee;
			pay = data.PayoutInterval;
		}),
		$.ajax(API + "stats").done(function (data) {
			shares = data.stats.roundShares;
			poolhash = data.hashrate;
			miners = data.minersTotal;
			workers = data.totalWorkers;
			difficulty = data.nodes[0].difficulty;
			nethash = data.nodes[0].difficulty / data.nodes[0].blocktime;
			blocktime = data.nodes[0].blocktime;
			chainheight = data.nodes[0].height;
		})
	)
		.then(function () {
			$("#payoutShemeTicker").text("PROP");
			$("#poolFeeTicker").text(fee + " %");
			$("#payIntervalTicker").text(pay);
			$("#minPaymentTicker").text(hold + " ETC");
			$("#poolHashrateTicker").text(_formatter(poolhash, 3, "H/s"));
			$("#networkHashrateTicker").text(_formatter(nethash, 3, "H/s"));
			$("#networkDifficultyTicker").text(_formatter(difficulty, 3, "H/s"));
			$("#poolMinersTicker").text(miners + " Miner(s)");
			$("#poolWorkersTicker").text(workers + " Worker(s)");
			$("#blockchainHeightTicker").text(chainheight);
		});
}

// Load Pool Hashrate Charts
function loadPoolHashrateChart() {
	return $.ajax(API + "stats").done(function (data) {
		labels = [];
		poolHashrate = [];
		$.each(data.poolCharts, function (index, value) {
			if (labels.length === 0 || (labels.length + 1) % 6 === 1) {
				var createDate = new Date(value.x * 1000);
				labels.push(createDate.getHours() + ":" + (createDate.getMinutes() < 10 ? '0' : '') + createDate.getMinutes());
			} else {
				labels.push("");
			}
			poolHashrate.push(value.y);
		});
		var dataPoolHash = { labels: labels, series: [poolHashrate] };
		var chartPoolhash = {
			height: "377px", showArea: true, showPoint: false, seriesBarDistance: 1, axisX: { showGrid: false },
			fullWidth: true, chartPadding: { right: 10, left: -5, bottom: -10 },
			axisY: { offset: 47, scale: "logcc", labelInterpolationFnc: function (value) { return _formatter(value, 1, "H/s"); } },
			lineSmooth: Chartist.Interpolation.simple({ divisor: 2 })
		};
		var responsiveOptions = [["screen and (max-width: 640px)", { axisX: { labelInterpolationFnc: function (value) { return value[1]; } } }]];
		Chartist.Line("#chartStatsPoolHashrate", dataPoolHash, chartPoolhash, responsiveOptions);
	})
}

// Load Pool Miner Charts
function loadPoolMinerChart() {
	return $.ajax(API + "stats").done(function (data) {
		labels = [];
		poolMiner = [];
		$.each(data.clientCharts, function (index, value) {
			if (labels.length === 0 || (labels.length + 1) % 6 === 1) {
				var createDate = new Date(value.x * 1000);
				labels.push(createDate.getHours() + ":" + (createDate.getMinutes() < 10 ? '0' : '') + createDate.getMinutes());
			} else {
				labels.push("");
			}
			poolMiner.push(value.y);
		});
		var dataPoolMiner = { labels: labels, series: [poolMiner] };
		var chartPoolMiner = {
			height: "125px", showArea: true, showPoint: false, seriesBarDistance: 1, axisX: { showGrid: false },
			fullWidth: true, chartPadding: { right: 5, left: -5, bottom: -15 },
			axisY: { offset: 47, scale: "logcc", labelInterpolationFnc: function (value) { return _formatter(value, 1, ""); } },
			lineSmooth: Chartist.Interpolation.simple({ divisor: 2 })
		};
		var responsiveOptions = [["screen and (max-width: 640px)", { axisX: { labelInterpolationFnc: function (value) { return value[1]; } } }]];
		Chartist.Line("#chartStatsPoolMiner", dataPoolMiner, chartPoolMiner, responsiveOptions);
	})
}

// Load Pool Worker Charts
function loadPoolWorkerChart() {
	return $.ajax(API + "stats").done(function (data) {
		labels = [];
		poolWorker = [];
		$.each(data.workerCharts, function (index, value) {
			if (labels.length === 0 || (labels.length + 1) % 6 === 1) {
				var createDate = new Date(value.x * 1000);
				labels.push(createDate.getHours() + ":" + (createDate.getMinutes() < 10 ? '0' : '') + createDate.getMinutes());
			} else {
				labels.push("");
			}
			poolWorker.push(value.y);
		});
		var dataPoolWorker = { labels: labels, series: [poolWorker] };
		var chartPoolWorker = {
			height: "125px", showArea: true, showPoint: false, seriesBarDistance: 1, axisX: { showGrid: false },
			fullWidth: true, chartPadding: { right: 5, left: -5, bottom: -15 },
			axisY: { offset: 47, scale: "logcc", labelInterpolationFnc: function (value) { return _formatter(value, 1, ""); } },
			lineSmooth: Chartist.Interpolation.simple({ divisor: 2 })
		};
		var responsiveOptions = [["screen and (max-width: 640px)", { axisX: { labelInterpolationFnc: function (value) { return value[1]; } } }]];
		Chartist.Line("#chartStatsPoolWorker", dataPoolWorker, chartPoolWorker, responsiveOptions);
	})
}

// Load Net Difficulty Charts
function loadNetDiffChart() {
	return $.ajax(API + "stats").done(function (data) {
		labels = [];
		netDiff = [];
		$.each(data.netCharts, function (index, value) {
			if (labels.length === 0 || (labels.length + 1) % 6 === 1) {
				var createDate = new Date(value.x * 1000);
				labels.push(createDate.getHours() + ":" + (createDate.getMinutes() < 10 ? '0' : '') + createDate.getMinutes());
			} else {
				labels.push("");
			}
			netDiff.push(value.y);
		});
		var dataNetDiff = { labels: labels, series: [netDiff] };
		var chartNetDiff = {
			height: "125px", showArea: true, showPoint: false, seriesBarDistance: 1, axisX: { showGrid: false },
			fullWidth: true, chartPadding: { right: 5, left: -5, bottom: -15 },
			axisY: { offset: 47, scale: "logcc", labelInterpolationFnc: function (value) { return _formatter(value, 1, "H/s"); } },
			lineSmooth: Chartist.Interpolation.simple({ divisor: 2 })
		};
		var responsiveOptions = [["screen and (max-width: 640px)", { axisX: { labelInterpolationFnc: function (value) { return value[1]; } } }]];
		Chartist.Line("#chartStatsNetDiff", dataNetDiff, chartNetDiff, responsiveOptions);
	})
}

// Load Net Hashrate Charts
function loadNetHashChart() {
	return $.ajax(API + "stats").done(function (data) {
		labels = [];
		netHash = [];
		var blockTime = data.nodes[0].blocktime;
		$.each(data.netCharts, function (index, value) {
			if (labels.length === 0 || (labels.length + 1) % 6 === 1) {
				var createDate = new Date(value.x * 1000);
				labels.push(createDate.getHours() + ":" + (createDate.getMinutes() < 10 ? '0' : '') + createDate.getMinutes());
			} else {
				labels.push("");
			}
			netHash.push(value.y / blockTime);
		});
		var dataNetHash = { labels: labels, series: [netHash] };
		var chartNetHash = {
			height: "125px", showArea: true, showPoint: false, seriesBarDistance: 1, axisX: { showGrid: false },
			fullWidth: true, chartPadding: { right: 5, left: -5, bottom: -15 },
			axisY: { offset: 47, scale: "logcc", labelInterpolationFnc: function (value) { return _formatter(value, 1, "H/s"); } },
			lineSmooth: Chartist.Interpolation.simple({ divisor: 2 })
		};
		var responsiveOptions = [["screen and (max-width: 640px)", { axisX: { labelInterpolationFnc: function (value) { return value[1]; } } }]];
		Chartist.Line("#chartStatsNetHash", dataNetHash, chartNetHash, responsiveOptions);
	})
}

// Load Pool Stats Price
function loadStatsPrice() {
	return $.ajax("https://api.coingecko.com/api/v3/coins/ethereum-classic").done(function (data) {
		coins = 2.500;
		price = (data.market_data.current_price.usd).toFixed(2);
		blockRewardUSD = (coins * price).toFixed(2);
		$("#etcToUSD").html("$ " + data.market_data.current_price.usd.toFixed(2));
		$("#etcToBTC").html(data.market_data.current_price.btc.toFixed(8));
		$("#priceHigh").html("$ " + data.market_data.high_24h.usd.toFixed(2));
		$("#priceHighBTC").html(data.market_data.high_24h.btc.toFixed(8));
		$("#priceLow").html("$ " + data.market_data.low_24h.usd.toFixed(2));
		$("#priceLowBTC").html(data.market_data.low_24h.btc.toFixed(8));
		$("#changeBTC").html(data.market_data.price_change_24h_in_currency.btc.toFixed(8));
		$("#changeBTCPercent").html(data.market_data.price_change_percentage_24h_in_currency.btc.toFixed(2) + " %");
		$("#marketCap").html(data.market_data.market_cap_rank);
		$("#genesisDate").html(data.genesis_date);
		$("#blockToUSD").html(blockRewardUSD + " $");
		$("#lastBlockReward").html(coins + " ETC");
	});
}

// Load Pool Blocks Overview Content
function loadBlocksOverviewPage() {
	setInterval(
		(function load() {
			loadBlocksPage();
			loadImmaturePage();
			loadAvgTotalPage();
			loadluckPage();
			return load;
		})(), 5000
	);
}

// Load Pool Blocks Content
function loadBlocksPage() {
	return $.ajax(API + "blocks").done(function (data) {
		var blockList = "";
		if (data.matured.length > 0) {
			$.each(data.matured, function (index, value) {
				var createDate = convertLocalDateToUTCDate(new Date(value.timestamp * 1000), false);
				convertedDate = dateConvertor(createDate);
				var effort = ((value.shares / value.difficulty) * 100).toFixed(2);
				var reward = (value.reward / 1000000000000000000).toFixed(4);
				var effortClass = "";
				if (effort < 100) {
					effortClass = "effort1";
				} else if (effort < 200) {
					effortClass = "effort2";
				} else if (effort < 500) {
					effortClass = "effort3";
				} else {
					effortClass = "effort4";
				}
				blockList += "<tr>";
				blockList += "<td class='text-white'>" + convertedDate + "</td>";
				var blockart = value.uncle;
				if (value.uncle == false) {
					blockList += "<td><span class='badge badge-success'>Block</span></td>";
				} else if (value.uncle == true) {
					blockList += "<td><span class='badge badge-info'>Uncle</span></td>";
				} else {
					blockList += "<td>" + blockart + "</td>";
				}
				blockList += "<td><a href='" + infoLink + "' target='_blank'>" + value.height + "</a></td>";
				blockList += "<td class='text-white'><a href='" + infoLink + value.hash + "' target='_blank'>" + value.hash.substring(0, 8) + " &hellip; " + value.hash.substring(value.hash.length - 8) + "</a></td>";
				blockList += "<td class='text-white'>" + _formatter(value.difficulty, 5, "H/s") + "</td>";
				blockList += "<td><span class='" + effortClass + "'>" + effort + "%</span></td>";
				var status = value.orphan;
				if (value.orphan == false) {
					blockList += "<td><span class='badge badge-success'>Confirmed</span></td>";
				} else if (value.orphan == true) {
					blockList += "<td><span class='badge badge-danger'>Orphaned</span></td>";
				} else {
					blockList += "<td>" + status + "</td>";
				}
				blockList += "<td class='text-white'>" + reward + " ETC</td>";
				blockList += "</tr>";
			});
		} else {
			blockList += '<tr><td colspan="6">No Blocks Found Yet</td></tr>';
		}
		$("#blockList").html(blockList);
	})
}

// Load Pool Immature Content
function loadImmaturePage() {
	$.when(
		$.ajax(API + "stats").done(function (data) {
			var lastBlockDate = convertLocalDateToUTCDate(new Date(data.stats.lastBlockFound * 1000), false);
			convertedBlockDate = dateConvertor(lastBlockDate);
			$.each(data.nodes, function (index, value) {
				chainheight = value.height;
			});
			$("#lastBlock").html(convertedBlockDate);
		}),
		$.ajax(API + "blocks").done(function (data) {
			var immaList = "";
			if (data.immature.length > 0) {
				$.each(data.immature, function (index, value) {
					var createDate = convertLocalDateToUTCDate(new Date(value.timestamp * 1000), false);
					convertedDate = dateConvertor(createDate);
					blockheight = value.height;
					var effort = ((value.shares / value.difficulty) * 100).toFixed(2);
					var reward = (value.reward / 1000000000000000000).toFixed(4);
					var confirm = chainheight - blockheight;
					var effortClass = "";
					if (effort < 100) {
						effortClass = "effort1";
					} else if (effort < 200) {
						effortClass = "effort2";
					} else if (effort < 500) {
						effortClass = "effort3";
					} else {
						effortClass = "effort4";
					}
					var confclass = "";
					if (confirm < 100) {
						confclass = confirm;
					} else {
						confclass = "100";
					}
					immaList += "<tr>";
					immaList += "<td class='text-white'>" + convertedDate + "</td>";
					if (value.uncle = false) {
						immaList += "<td><span class='badge badge-success'>Block</span></td>";
					} else {
						immaList += "<td><span class='badge badge-info'>Pending</span></td>";
					}
					immaList += "<td><a href='" + infoLink + "' target='_blank'>" + value.height + "</a></td>";
					immaList += "<td class='text-white'><a href='" + infoLink + value.hash + "' target='_blank'>" + value.hash.substring(0, 8) + " &hellip; " + value.hash.substring(value.hash.length - 8) + "</a></td>";
					immaList += "<td class='text-white'>" + _formatter(value.difficulty, 5, "H/s") + "</td>";
					immaList += "<td><span class='" + effortClass + "'>" + effort + "%</span></td>";
					immaList += "<td class='text-white'>" + reward + " ETC</td>";
					immaList += "<td><div class='progress-bar progress-bar-striped bg-info progress-bar-animated' role='progressbar' aria-valuenow='" + confclass + "' aria-valuemin='0' aria-valuemax='100' style='width: " + confclass + "%'><span class='text-white'>" + confclass + "% Completed</span></div></td>";
					immaList += "</tr>";
				});
			} else {
				immaList += "<tr><td colspan='6'>No Immature Blocks Found</td></tr>";
			}
			$("#immaList").html(immaList);
		}),
	)
}

// Load Pool Average Total Content
function loadAvgTotalPage() {
	return $.ajax(API + "blocks").done(function (data) {
		var total = 0;
		var totalCoin = 0;
		var luckListAll = "";
		if (data.matured.length > 0) {
			$.each(data.matured, function (index, value) {
				total += parseFloat(value.shares / value.difficulty);
				totalCoin += parseFloat(value.reward);
				var avg = ((total * 100) / data.matured.length).toFixed(2);
				var effortClass = "";
				if (avg < 100) {
					effortClass = "effort1";
				} else if (avg < 200) {
					effortClass = "effort2";
				} else if (avg < 500) {
					effortClass = "effort3";
				} else {
					effortClass = "effort4";
				}
				luckListAll = "<span class='" + effortClass + "'>" + avg + " %</span>";
			});
		}
		var coins = (totalCoin / 1000000000000000000).toFixed(4);
		$("#avgLuckTotal").html(luckListAll);
		$("#totalBlocks").html(data.matured.length + " Blocks");
		$("#totalCoins").html(coins + " ETC");
	})
}

// Load Pool Luck Content
function loadluckPage() {
	return $.ajax(API + "blocks").done(function (data) {
		var imma = data.immatureTotal;
		$.each(data.luck, function (index, value) {
			uncle = value.uncleRate;
		});
		$("#uncleRate").html(uncle + " %");
		$("#immature").html(imma + " Blocks");
	})
}

// Load Pool Miners Content
function loadTopMinersPage() {
	setInterval(
		(function load() {
			loadMinersPage();
			return load;
		})(), 5000
	);
}

// Load Pool Miners
function loadMinersPage() {
	return $.ajax(API + "miners").done(function (data) {
		var minerList = "";
		if (data.miners) {
			var minerCount = 0;
			$.each(data.miners, function (index, value) {
				minerCount++;
				start = new Date(value.lastBeat).valueOf();
				end = new Date().getTime();
				lastShareDiff = timeDiffSec(start, end);
				minerList += "<tr>";
				minerList += "<td class='text-success'><b>" + minerCount + "</b></td>";
				minerList += "<td class='text-white'><a href='dashboard.html?#" + currentPool + "/stats?address=" + index + "'>" + index + "</td>";
				minerList += "<td class='text-white'>" + lastShareDiff + " ago</td>";
				minerList += "<td class='text-white'>" + _formatter(value.hr, 5, "H/s") + "</td>";
				minerList += "</tr>";
			});
		} else {
			minerList += '<tr><td  class="text-danger" colspan="4">No Miner Connected</td></tr>';
		}
		$("#minerList").html(minerList);
	})
}

// Load Pool Dashboard Content
function loadDashboardPage() {
	function render() {
		setInterval(
			(function load() {
				loadDashboardData($("#walletAddress").val());
				loadDashboardWorkerList($("#walletAddress").val());
				loadDashboardPaymentList($("#walletAddress").val());
				loadDashboardChart($("#walletAddress").val());
				loadMinerAddressPage($("#walletAddress").val());
				return load;
			})(), 5000
		);
	}
	var walletQueryString = window.location.hash.split(/[#/?]/)[3];
	if (walletQueryString) {
		var wallet = window.location.hash.split(/[#/?]/)[3].replace("address=", "");
		if (wallet) {
			$(walletAddress).val(wallet);
			localStorage.setItem(currentPool + "-walletAddress", wallet);
			render();
		}
	}
	if (localStorage[currentPool + "-walletAddress"]) {
		$("#walletAddress").val(localStorage[currentPool + "-walletAddress"]);
	}
}

// Load Pool Dashboard Wallet
function loadWallet() {
	console.log('Loading wallet address:', $("#walletAddress").val());
	if ($("#walletAddress").val().length > 0) {
		localStorage.setItem(currentPool + "-walletAddress", $("#walletAddress").val());
	}
	var coin = window.location.hash.split(/[#/?]/)[1];
	var currentPage = window.location.hash.split(/[#/?]/)[2] || "stats";
	window.location.href = "#" + currentPool + "/" + currentPage + "?address=" + $("#walletAddress").val();
}

// Load Pool Dashboard Data
function loadDashboardData(walletAddress) {
	return $.ajax(API + "accounts/" + walletAddress).done(function (data) {
		coins = ((data.stats.paid + data.stats.balance) / 1000000000).toFixed(4);
		rshares = data.roundShares / 1000000000;
		pendsbal = (data.stats.balance / 1000000000).toFixed(8);
		$("#minerHashrate").text(_formatter(data.currentHashrate, 3, "H/s"));
		$("#pendingBalance").text(pendsbal + " ETC");
		$("#lifetimeBalance").text(coins + " ETC");
		$("#minerShares").text(rshares);
		$("#avgHash").text(_formatter(data.hashrate, 3, "H/s"));
		$("#blocksFound").text(data.stats.blocksFound);
	})
}

// Load Pool Dashboard Worker
function loadDashboardWorkerList(walletAddress) {
	return $.ajax(API + "accounts/" + walletAddress).done(function (data) {
		var workerList = "";
		if (data.workers) {
			var workerCount = 0;
			$.each(data.workers, function (index, value) {
				workerCount++;
				start = new Date(value.lastBeat).valueOf();
				end = new Date().getTime();
				lastShareDiff = timeDiffSec(start, end);
				workerList += "<tr>";
				workerList += "<td class='text-success'><b>" + workerCount + "</b></td>";
				workerList += "<td class='text-white'>" + index + "</td>";
				workerList += "<td class='text-white'>" + _formatter(value.hr, 3, "H/s") + "</td>";
				workerList += "<td class='text-white'>" + lastShareDiff + " ago</td>";
				workerList += "</tr>";
			});
		} else {
			workerList += '<tr><td  class="text-danger" colspan="4">No Worker Connected</td></tr>';
		}
		$("#workerCount").text(workerCount);
		$("#workerList").html(workerList);
	})
}

// Load Pool Dashboard Payment
function loadDashboardPaymentList(walletAddress) {
	return $.ajax(API + "accounts/" + walletAddress).done(function (data) {
		var wpaymentList = "";
		if (data.payments) {
			var wpaymentCount = 0;
			$.each(data.payments, function (index, value) {
				wpaymentCount++;
				var createDate = convertLocalDateToUTCDate(new Date(value.timestamp * 1000), false);
				convertedDate = dateConvertor(createDate);
				wtxid = value.tx;
				paid = (value.amount / 1000000000).toFixed(4);
				wpaymentList += "<tr>";
				wpaymentList += "<td class='text-success'><b>" + wpaymentCount + "</b></td>";
				wpaymentList += "<td class='text-white'>" + convertedDate + "</td>";
				wpaymentList += "<td class='text-white'>" + paid + " ETC</td>";
				wpaymentList += "<td class='text-white'><a href='" + txLink + wtxid + "' target='_blank'>" + wtxid.substring(0, 5) + " &hellip; " + wtxid.substring(wtxid.length - 5) + "</a></td>";
				wpaymentList += "</tr>";
			});
		} else {
			wpaymentList += '<tr><td class="text-danger" colspan="4">No Payments Done</td></tr>';
		}
		$("#wpaymentCount").html(wpaymentCount);
		$("#wpaymentList").html(wpaymentList);
	})
}

// Load Pool Dashboard Chart
function loadDashboardChart(walletAddress) {
	return $.ajax(API + "accounts/" + walletAddress).done(function (data) {
		labels = [];
		minerHashrate = [];
		$.each(data.minerCharts, function (index, value) {
			if (labels.length === 0 || (labels.length + 1) % 4 === 1) {
				var createDate = new Date(value.x * 1000);
				labels.push(createDate.getHours() + ":" + (createDate.getMinutes() < 10 ? '0' : '') + createDate.getMinutes());
			} else {
				labels.push("");
			}
			minerHashrate.push(value.minerHash);
		});
		var data = { labels: labels, series: [minerHashrate] };
		var options = {
			height: "300px", showArea: true, showPoint: false, seriesBarDistance: 1, axisX: { showGrid: false },
			fullWidth: true, chartPadding: { right: 10, left: -5, bottom: -10, top: 10 },
			axisY: { offset: 47, labelInterpolationFnc: function (value) { return _formatter(value, 1, "H/s"); } },
			lineSmooth: Chartist.Interpolation.simple({ divisor: 2 })
		};
		var responsiveOptions = [["screen and (max-width: 640px)", { axisX: { labelInterpolationFnc: function (value) { return value[0]; } } }]];
		Chartist.Line("#chartDashboardHashrate", data, options, responsiveOptions);
	})
}

// Load Pool Miner Address
function loadMinerAddressPage(walletAddress) {
	$.when(
		$.ajax(API + "accounts/" + walletAddress).done(function (data) {
			minershares = data.roundShares;
			minerhash = data.currentHashrate;
		}),
		$.ajax(API + "stats").done(function (data) {
			poolshares = data.stats.roundShares;
			poolhash = data.hashrate;
			creward = 2.5;
		})
	)
		.then(function () {
			var shareDominance = ((minershares * 100) / poolshares).toFixed(2);
			var hashDominance = ((minerhash * 100) / poolhash).toFixed(2);
			var avgpay = ((shareDominance / 100) * creward).toFixed(4);
			$("#minerPercent").html(hashDominance + " %");
			$("#minerSharesDominance").html(shareDominance + " %");
			$("#avgPayout").html(avgpay + " ETC");
		});
}

// Load Pool Payments Content
function loadPaymentsOverviewPage() {
	setInterval(
		(function load() {
			loadPaymentsPage();
			return load;
		})(), 5000
	);
}

// Load Pool Payments Page
function loadPaymentsPage() {
	return $.ajax(API + "payments").done(function (data) {
		var paymentList = "";
		$.each(data.payments, function (index, value) {
			var createDate = convertUTCDateToLocalDate(new Date(value.timestamp * 1000), false);
			convertedDate = dateConvertor(createDate);
			reward = (value.amount / 1000000000).toFixed(8);
			miner = value.address;
			txid = value.tx;
			paymentList += "<tr>";
			paymentList += "<td class='text-white'>" + convertedDate + "</td>";
			paymentList += "<td class='text-white'><a href='" + txLink + txid + "' target='_blank'>" + txid.substring(0, 8) + " &hellip; " + txid.substring(txid.length - 8) + "</a></td>";
			paymentList += "<td class='text-white'>" + miner + "</td>";
			paymentList += "<td class='text-white'>" + reward + " ETC</td>";
			paymentList += "</tr>";
		});
		$("#paymentList").html(paymentList);
	})
}
