$(document).ready(function() {

	//custom scripting goes here

	// injecting current year into footer
	// DO NOT DELETE

	var d = new Date();
	var year = d.getFullYear();

	$('.copyright').text(year);


	// some code blocks require javascript to function, like slideshows, synopsis blocks, etc
	// you can find that code here: https://github.com/DallasMorningNews/generator-dmninteractives/wiki/Cookbook


	// ***** CHARTING VARIABLES *****

	// data object to hold parsed data
	var stagingData = [];

	// data that d3 uses after we format the stagingData to get it ready right
	var chartData = [];

	// placeholder for counted occurrances
	var counts;

	// placeholder to hold the score with the most number of instances
	var highestCount;


	////////////////////////////////////////////////////////////////////////////
	///// HARVESTING USER INPUT ////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////

	// placeholder variables that will hold the score submitted by the user
	var cowboysScore, opponentScore;

	$("#submit").click(function() {

		// grabbinbg the scores in the input fields
		hornsScore = $("#hornsScore").val();
		soonersScore = $("#soonersScore").val();
		console.log(hornsScore, soonersScore);
		// we've got some work to do now that we have new data submitted
		// first, we'll validate that what we got back is a valid score (i.e. numbers)
		validateScore(hornsScore, soonersScore);

		// then we're going to update the response the user gets back after valid scores are submitted
		updateResponse(hornsScore, soonersScore);

		// then we're going to create custom facebook and twitter sharing functions
		// based off the score they submitted
		sharePicks(hornsScore, soonersScore);

	});

	/* VALIDATING SCORES */

	function validateScore(score1, score2) {

		// check to make sure both scores are actual numbers
		if (isNaN(score1) === true || isNaN(score2) === true) {
			alert("Please enter a valid score for both teams");
			return false;
		}

		// check that a score was entered for both teams
		if (score1.length === 0 || score2.length === 0) {
			alert("Please enter a score for both teams");
			return false;
		}

		// once we know we have valid scores, we're going to create the object that
		// will be passed back to the database. The week of the game was created above
		// based off the label in the html document. Scores for the cowboys and their
		// opponent is gathered from the input fields. Comment is a hold over from
		// some optional data collection that we're not currently doing.
		var response = {
			"horns": score1,
			"sooners": score2,
		};

		// send the response object to the database. if succssful, initialize the data draw
		// pulling the new set of data down from the database and handing it off to chart drawing functions
		$.post("http://apps.dallasnews.com/livewire/texou-picks-2016", response, function() {
			console.log("Success!");
			initializeDataDraw();
		}).fail(function() {
			console.log("Whoops, something bad happened!");
		});

		// once we know we have valid scores and they've been sent off the database
		// we want to hide the submission form and show the response with the
		// custom facebook and twitter sharing options
		$("#userForm").addClass("noShow");
		$("#response").removeClass("noShow");

	}

	/* UPDATING THE RESPONSE SCORES */

	// this updates the custom text generated after a user submits a prediction
	// based on who they think will win and the scores
	function updateResponse(hornsScore, soonersScore) {

		if (hornsScore > soonersScore) {

			// predicted cowboys win
			$(".userScore").text(hornsScore + "-" + soonersScore);
			$(".userTeam").text("Longhorns");

		} else if (soonersScore > hornsScore) {

			// predicted opponent win
			$(".userScore").text(soonersScore + "-" + hornsScore);
			$(".userTeam").text("Sooners");

		}
	}



	////////////////////////////////////////////////////////////////////////////
	///// SHARING PICK /////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////

	function sharePicks(hornsScore, soonersScore) {

			// generating a custom uriLink based off the week in the season (gathered above)
			var uriLink = "http%3A%2F%2Finteractives.dallasnews.com%2F2016%2Ftexas-oklahoma-gameday";

			var leadText;

			if (hornsScore >= soonersScore) {
				leadText = "My UT-OU prediction: Longhorns " + hornsScore + ", Sooners " + soonersScore + ". Make your pick now.";
			} else {
				leadText = "My UT-OU prediction: Sooners " + soonersScore + ", Longhorns " + hornsScore + ". Make your pick now.";
			}

			// facebook sharing function
			$("#faceShare").click(function () {
				//Facebook share
				FB.ui({
					method: 'feed',
					name: "Texas-Oklahoma Gameday: You make the call",
					link: storyURL,
					caption: '',
					picture: storyIMG,
					description: leadText
				});
			});

			// twitter sharing function
			$("#twitterShare").click(function () {
				window.open("https://www.twitter.com/intent/tweet?&hashtags=" + "&text=" + leadText + "&via=dallasnews&url=" + uriLink + "&image=" + storyIMG, "top=200, left=200,width=550,height=420");
			});

		}



	////////////////////////////////////////////////////////////////////////////
	///// CREATE CUSTOM READOUTS ///////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////

	// this calculates and updates the reader submission stats (team predicted
	// to win the most and by an average of how much)

	function customReadouts(data) {

		// some starting variable: total data length, total times cowboys and
		// opponent is predicted to win, total cumulative margin of victory
		var total = data.length;
		var totalHorns = 0;
		var totalSooners = 0;
		var hornsPoints = 0;
		var soonersPoints = 0;
		var winningTeam, winningPct, winningPts;

		// here we're going through the data. for each entry, we want to determine
		// a winner and by how many points they are predicted to win, and then
		// update the variable set above (totals and points)
		$.each(data, function(key, value) {
			if (value.hornsscore > value.soonersscore) {

				totalHorns++;
				hornsPoints += value.hornsscore - value.soonersscore;
				console.log(totalHorns, hornsPoints);
			} else if (value.soonersscore > value.hornsscore) {
				totalSooners++;
				soonersPoints += value.soonersscore - value.hornsscore;
			}
		});

		// based on the total times they've been picked, either set the winningTeam
		// variable to "Cowboys" or their opponent
		winningTeam = totalHorns >= totalSooners ? "Longhorns" : "Sooners";

		// figure out the percentage of submissions have that team winning
		winningPct = winningTeam === "Longhorns" ? totalHorns / total * 100 : totalSooners / total * 100;
		winningPct = Math.round(winningPct * 10) / 10;

		// figure out the average margin of victory that team is predicted to win by
		winningPts = winningTeam === "Longhorns" ? Math.round(hornsPoints / totalHorns * 10) / 10 : Math.round(soonersPoints / totalSooners * 10) / 10;


		// update those totals within the html output
		$(".predictPercentage").text(winningPct + "%");
		$(".predictTeam").text(winningTeam);
		$(".predictPoints").text(winningPts);

	}



	////////////////////////////////////////////////////////////////////////////
	///// GETTING USER RESPONSES FROM DATABASE /////////////////////////////////
	////////////////////////////////////////////////////////////////////////////

	function initializeDataDraw() {

		// clearing our data variable set earlier. we're clearing these here because
		// the chart gets updated after a submission
		stagingData = [];
		chartData = [];
		counts = "";
		highestCount = "";

		// clear the chart div to prepare for redraw.
		$("#chart").html("");

		// go get the data based on the current week in the season we are currently viewing
		$.getJSON("http://apps.dallasnews.com/livewire/texou-picks-2016").done(function(data) {

			// we've got a little bit of initial cleanup to do on the data. after that's done
			// we're going to put the clean data in cleanScores.
			var cleanScores = [];

			// we're going to weed out any score that is more than 60, because the frequency with which nfl teams
			// score that much is non-existent. This is mainly clearning out misbehaving score submitters

			$.each(data, function(key,value) {
				if (value.hornsscore < 80 && value.soonersscore < 80 && value.hornsscore !== value.soonersscore)  {
					cleanScores.push(value);
				}
			});

			// once we've got our clean data, we're going to format the data and
			// generate the customReadouts
			formatData(cleanScores);
			customReadouts(cleanScores);
		});
	}

	// get our initial set of data when the page is loaded
	initializeDataDraw();



	////////////////////////////////////////////////////////////////////////////
	///// FORMATTING USER RESPONSES ////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////

	function formatData(data) {

		//parse the sample data into the data object D3 expects
		data.forEach(function(entry) {
		  var tempArray = [];
		  tempArray.push(entry.hornsscore);
		  tempArray.push(entry.soonersscore);
		  stagingData.push(tempArray);
		});

		//Create object with counted occurences
		counts = _.countBy(stagingData);

		//Sort that object's counts and reverse to get highest at 0
		var sorted = _.sortBy(counts).reverse();

		//The highest count
		highestCount = sorted[0];

		//Avoid duplicate entries by looping through counts instead
		//of originalData. Go through each count and get the values from the keys
		_.forOwn(counts, function(value, key) {
		  var result = key.split(",");
		  var tempArray = [];
		  tempArray.push(parseInt(result[0]));
		  tempArray.push(parseInt(result[1]));
		  chartData.push(tempArray);
		});

		// hand the formatted data off to the chart drawing function
		drawChart(chartData);
	}



	////////////////////////////////////////////////////////////////////////////
	///// DRAWING THE SCATTERPLOT //////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////

	function drawChart(data) {
		console.log(data);
		//--------Start D3 Initialization--------

		//Dimensions
		var margin = {
		  top: 10,
		  right: 10,
		  bottom: 50,
		  left: 50
		};
		var width = $("#chart").width() - margin.left - margin.right;
		var height = $("#chart").width() - margin.top - margin.bottom;

		var halfpoint = (width - margin.left - margin.right) / 2;

		//Get and set maxValue
		var maxX = d3.max(data, function(d) {
		  return d[0];
	  	});

		var maxY = d3.max(data, function(d) {
		  return d[1];
	  	});

		var maxValue = 0;

		if (maxX > maxY) {
		  maxValue = maxX;
		} else {
		  maxValue = maxY;
		}

		//Set X range and domain
		var x = d3.scaleLinear()
		  .range([0, width])
		  .domain([0, maxValue]);

		//Set Y range and domain
		var y = d3.scaleLinear()
		  .range([height, 0])
		  .domain([0, maxValue]);

		//Prime axis
		var xAxis = d3.axisBottom(x).ticks(10).tickSize(-height);
		var yAxis = d3.axisLeft(y).ticks(10 * height / width).tickSize(-width);

		//Draw the shell
		var svg = d3.select("#chart").append("svg")
		  .attr("width", width + margin.left + margin.right)
		  .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		//Draw the axis
		svg.append("g")
		  .attr("class", "x axis ")
		  .attr('id', "axis--x")
		  .attr("transform", "translate(0," + height + ")")
		  .call(xAxis);

		svg.append("g")
		  .attr("class", "y axis")
		  .attr('id', "axis--y")
		  .call(yAxis);

		//Draw the dots
		var r = d3.scaleLinear()
		  //Range for dot sizes
		  .range([5, 20])
		  //Set the domain from data values
		  .domain([1, highestCount]);

		svg.selectAll(".dot")
		  .data(data)
		  .enter().append("circle")
		  .attr("class", "dot")
		  .attr("r", function(d) {
		    var thisCount = counts[d[0] + "," + d[1]];
		    return r(parseInt(thisCount));
		  })
		  .attr("cx", function(d) {
			  console.log(parseInt(d[0]));
		    return x(parseInt(d[0]));
		  })
		  .attr("cy", function(d) {
			  console.log(parseInt(d[1]));
		    return y(parseInt(d[1]));
		  })
		  .attr("opacity", '.6')
		  .attr("class", function(d) {
		    if (d[0] > d[1]) {
		      return "horns-color";
		    } else {
		      return "sooners-color";
		    }
		  })
		  .on("mouseenter", function(d) {
			  var thisCount = counts[d[0] + "," + d[1]];
			  var xCoord = d3.mouse(this)[0];
			  var yCoord = d3.mouse(this)[1];

			  positionToolTip(xCoord, yCoord, halfpoint, margin);

			  d3.select(".hornsTipScore").text(d[0]);
			  d3.select(".soonersTipScore").text(d[1]);
			  d3.select(".tipPredict").text(thisCount);
		  })
		  .on("mouseleave", function() {
			  d3.select("#tooltip")
			  	.classed("noShow", true);
		  });

		//Set small dots on top of big ones
		  d3.selectAll("circle")
		  .each(function(d) {
		    var rad =  parseInt(d3.select(this).attr("r"));
		    if (rad < 10) {
		      this.parentElement.appendChild(this);
		    }
		});

		//Draw the diagonal
		svg.append("line")
		  .attr("x1", height)
		  .attr("y1", 0)
		  .attr("x2", 0)
		  .attr("y2", height)
		  .attr("stroke-width", 2)
		  .attr("class", "diagonal")
		  .attr("stroke", "#329ce8");

		//Draw the labels
		svg.append("text")
		  .attr("text-anchor", "middle")
		//   .attr("x", height / 2)
		//   .attr("y", -30)
		  .attr("x", width / 2 * -1)
		  .attr("y", -25)
		  .attr("transform", "rotate(-90)")
		  .attr("class", "team-name")
		  .text("Sooners’ score");

		svg.append("text")
		  .attr("text-anchor", "middle")
		  .attr("y", width + 30)
		  .attr("x", width / 2)
		  .attr("class", "team-name")
		  .text("Longhorns’ score");
	}

	function positionToolTip(xCoord, yCoord, halfpoint, margin) {

			tooltipWidth = 180;

			if ($(window).width() <= 600) {
				tooltipWidth = 120;
			}

			d3.select("#tooltip")
			.classed("noShow", false)
			.style("left", function(d) {
				var position = xCoord <= halfpoint ? xCoord + margin.left + 20 + "px" : xCoord + margin.left - (tooltipWidth + 20) + "px";
				return position;
			})
			.style("top", yCoord + "px");
		}


	//setting min height for chart
	var chartWidth = $("#chartBlock").width();
	$("#chartBlock").css("min-height", chartWidth);

});
