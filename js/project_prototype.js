// initialize the data set
var data_set;


/*
function testing() {
    console.log('blort found');
}
*/



// read in the data
d3.json('data/who_data_merged.json', function(error, data) {
	if (error) {
		console.warn(error);
		return
	}

	data_set = data;
    genBubblePlot(data_set);
});



// DEFINE THE FUNCTION TO GENERATE THE BUBBLE PLOT
// note that we'll have to take into account the ability to change the x- and y-axes

// for now, we'll just focus on the time component
function genBubblePlot(data, x_field, y_field) {
    
    // define the x and y fields
    var x_field = 'Soc_sec_to_gov_health_spending';
    var y_field = 'Outofpocket_to_total_spending';
    



	// set the margins
    var margin = {top: 40, right: 80, bottom: 80, left: 50};
    var width = 850 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    // set the x and y scales as well as the color scale
    var xScale = d3.scale.linear()
    	.range([0, width])
    	.domain([0, 100]);
    var yScale = d3.scale.linear()
    	.range([height, 0])
    	.domain([0, 100]);
    var colorScale = d3.scale.category10();
    var radiusScale = d3.scale.sqrt()
        .domain([0, 10e13])
        .range([3, 40]);

    // axes
    var xAxis = d3.svg.axis()
    	.orient('bottom')
    	.scale(xScale)
        .ticks(5);
    var yAxis = d3.svg.axis()
    	.orient('left')
    	.scale(yScale)
        .ticks(5);

    // Create the SVG container and set the origin.
	var svg = d3.select("svg#a")
		.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// Add the x-axis.
	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis)
    .append('text')
        .attr('x', (width)/2)
        .attr('y', 40)
        .style('text-anchor', 'middle')
        .text(x_field);

	// Add the y-axis.
	svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
    .append('text')
        .attr('id', 'bubble_y_axis')
        .attr('x', 50)
        .attr('y', -margin.top/2)
        .style('text-anchor', 'middle')
        .text(y_field);

    // Add a title
    svg.append('text')
        .attr('x', (margin.left + width)/2)
        .attr('y', -margin.top/2)
        .style('text-anchor', 'middle')
        .style('font-size', 24)
        .style('font-weight', 'bold')
        .text('Title Here');

    // add the year label
    var label = svg.append('text')
        .attr('class', 'year label')
        .attr('text-anchor', 'end')
        .attr('y', height - 30)
        .attr('x', width + margin.left)
        .text(1995);


    // add an overlay for the box
    var box = label.node().getBBox();


    var overlay = svg.append('rect')
        .attr('class', 'overlay')
        .attr('x', box.x)
        .attr('y', box.y)
        .attr('width', box.width)
        .attr('height', box.height)
        .on('mouseover', userMovement);

    // start the transition to do data interpolation
    /*
    svg.transition()
        .duration(0)
        .ease('linear')
        .tween('year', tweenYear)
        .each('end', userMovement);
    */


    function userMovement() {

        // define the annual scaling for user speicifcation
        var yearScale = d3.scale.linear()
            .domain([1995, 2012])
            .range([box.x + 10, box.x + box.width - 10])
            .clamp(true);

        svg.transition().duration(0);
        // add the mouse scaling
        overlay.on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('mousemove', mousemove)
            .on('touchmove', mousemove);

        // define the mouseover, mouseout, and mousemove functions
        function mouseover() {
            label.classed('active', true);
        }
        function mouseout() {
            label.classed('active', false);
        }
        function mousemove() {
            displayYear(yearScale.invert(d3.mouse(this)[0]));
        }
    }



    // define the getter functions
    function xGet(d) {return d[x_field]; }
    function yGet(d) {return d[y_field]; }
    function gdpGet(d) {return d.GDP; }
    function keyGet(d) {return d.Country; }

    // define the position function
    function position(dot) {
        dot.attr('cx', function(d) {return xScale(xGet(d)); })
            .attr('cy', function(d) {return yScale(yGet(d)); })
            .style('fill', function(d) {return colorScale(keyGet(d)); })
            .attr('r', function(d) {return radiusScale(gdpGet(d)); });
    }


    // bisector
    var bisect = d3.bisector(function(d) {return d[0]; });

    // will 'tween' the year
    function tweenYear() {
        var year = d3.interpolateNumber(1995, 2012);
        return function(t) {displayYear(year(t)); };
    }

    // we'll keep track of the current year
    var current_year = 1995;

    // display the specified year
    function displayYear(year) {
        dot.data(interpolateData(year), keyGet).call(position);
        label.text(Math.round(year));
        // update the current year
        current_year = year;
        //console.log(current_year);
    }

    
    // interpolate the data
    function interpolateData(year) {
        return data.map(function(d) {
            return {
                Country: d.Country,
                GDP: interpolateValues(d['GDP'], year),
                Ext_resources_to_total_spending: interpolateValues(d['External resources for health / total spending on health'], year),
                Gov_to_total_gov: interpolateValues(d['Gov spending on health / total gov spending'], year),
                Gov_to_total_spending: interpolateValues(d['Gov spending on health / total spending on health'], year),
                Outofpocket_to_private: interpolateValues(d['Out-of-pocket spending / private spending on health'], year),
                Outofpocket_to_total_spending: interpolateValues(d['Out-of-pocket spending / total spending on health'], year),
                Private_prepaid_to_private_spending: interpolateValues(d['Private prepaid plans / private spending on health'], year),
                Private_spending_to_total_spending: interpolateValues(d['Private spending on health / total spending on health'], year),
                Soc_sec_to_gov_health_spending: interpolateValues(d['Soc security spending on health / gov spending on health'], year),
                Total_spending_to_GDP: interpolateValues(d['Total spending on health / GDP'], year)
            };
        });
    }
    

    // interpolate values
    function interpolateValues(values, year) {
        // if it's empty, we'll want to plot the result off-screen
        if (values.length === 0) {
            return -100;
        }

        var i = bisect.left(values, year, 0, values.length - 1);
        var a = values[i];

        if (i > 0) {
            var b = values[i - 1];
            var t = (year - a[0]) / (b[0] - a[0]);
            return a[1] * (1-t) + b[1] * t;
        }
        // otherwise...
        return a[1];
    }



    // start adding the dots
    var dot = svg.append('g')
        .attr('class', 'dots')
    .selectAll('.dot')
        .data(interpolateData(1995))
    .enter().append('circle')
        .attr('class', 'dot')
        .call(position);

    // grab the x-axis selection from the html
    var x_axis_selection = document.getElementById('x-axis');
    x_axis_selection.onchange=function() {
        x_field = x_axis_selection.value;
        // shift the x axis and x axis values

        // transition
        dot.transition()
            .duration(1500)
        .call(position);
    };

    // grab the y-axis selection
    var y_axis_selection = document.getElementById('y-axis');
    y_axis_selection.onchange=function() {
        y_field = y_axis_selection.value;
        // shift the y axis

        // transition
        dot.transition()
            .duration(1500)
        .call(position);
//        console.log(document.getElementById(y_field).innerText);

        console.log(document.getElementById('bubble_y_axis').innerHTML);
    };
}