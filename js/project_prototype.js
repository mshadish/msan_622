// initialize the data set as a global
// FOR DEBUGGING PURPOSES
var data_set;


// read in the data
d3.json('data/who_data_merged.json', function(error, data) {
	if (error) {
		console.warn(error);
		return
	}

	data_set = data;
    genBubblePlot(data_set);

    genParallelPlot(data_set);
});



// DEFINE THE FUNCTION TO GENERATE THE BUBBLE PLOT
// note that we'll have to take into account the ability to change the x- and y-axes

// for now, we'll just focus on the time component
function genBubblePlot(data) {
    
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
    var colorScale = d3.scale.ordinal().range(colorbrewer.Dark2[6]);
    var radiusScale = d3.scale.sqrt()
        .domain([1e7, 9e12])
        .range([4, 25]);

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
        .text('X');

	// Add the y-axis.
	svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis)
    .append('text')
        .attr('id', 'bubble_y_axis')
        .attr('x', 0)
        .attr('y', -margin.top/2)
        .style('text-anchor', 'middle')
        .text('Y');

    // Add a title
    svg.append('text')
        .attr('x', (margin.left + width)/2)
        .attr('y', -margin.top/2)
        .style('text-anchor', 'middle')
        .style('font-size', 24)
//        .style('font-weight', 'bold')
        .text('Health Spend, by country');

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
    function regionGet(d) {return d.Region; }

    // define the position function
    function position(dot) {
        dot.attr('cx', function(d) {return xScale(xGet(d)); })
            .attr('cy', function(d) {return yScale(yGet(d)); })
            .style('fill', function(d) {return colorScale(regionGet(d)); })
            .attr('r', function(d) {return radiusScale(gdpGet(d)); });
    }


    // bisector
    var bisect = d3.bisector(function(d) {return d[0]; });

    // will 'tween' the year
    function tweenYear() {
        var year = d3.interpolateNumber(1995, 2012);
        return function(t) {displayYear(year(t)); };
    }


    // display the specified year
    function displayYear(year) {
        dot.data(interpolateData(year), keyGet).call(position);
        label.text(Math.round(year));
    }

    
    // interpolate the data
    function interpolateData(year) {
        return data.map(function(d) {
            return {
                Country: d.Country,
                Region: d.Region,
                GDP: interpolateValues(d['GDP'], year, 1e7),
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
    function interpolateValues(values, year, min_val) {
        // if it's empty, here we'll set it to 0
        if (values.length === 0) {
            min_val = typeof min_val !== 'undefined' ? min_val : 0;
            return min_val;
        }

        
        var i = bisect.left(values, year, 0, values.length - 1);

        // take the leading record
        var a = values[i];

        // initialize our return value
        var return_val;
        // we need to check that the year does not exceed the maximum year
        if (i > 0 && year < a[0]) {
            // preceding record
            var b = values[i - 1];
            // compute the weighting
            var t = (year - a[0]) / (b[0] - a[0]);
            // and weight our return value
            return_val = a[1] * (1-t) + b[1] * t;
        // otherwise, set the return value to the maximum record
        } else {
            return_val = a[1];
        }


        return return_val;

    }


    // Defines a sort order so that the smallest dots are drawn on top.
    function order(a, b) {
      return b['GDP'] - a['GDP'];
    }




    // start adding the dots
    var dot = svg.append('g')
        .attr('class', 'dots')
    .selectAll('.dot')
        .data(interpolateData(1995))
    .enter().append('circle')
        .attr('class', 'dot')
        .call(position)
        .sort(order);

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

        //console.log(document.getElementById('bubble_y_axis').innerHTML);
    };
}

/*
=====================
PARALLEL COORDINATES
=====================
*/

function genParallelPlot(data) {
    // note: we have temporarily removed GDP
    var fields = ['GDP', 'Ext_resources_to_total_spending','Gov_to_total_gov',
        'Gov_to_total_spending','Outofpocket_to_private','Outofpocket_to_total_spending',
        'Private_prepaid_to_private_spending','Private_spending_to_total_spending',
        'Soc_sec_to_gov_health_spending','Total_spending_to_GDP']


    // set the margins
    var margin = {top: 80, left: 50, bottom: 30, right: 40};
    var width = 1100 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    // specify the different scalings
    var x = d3.scale.ordinal().rangePoints([0, width], 1);
    var colorScale = d3.scale.ordinal().range(colorbrewer.Dark2[6]);
    var y = {};
    var dragging = {};

    // line generator
    var line = d3.svg.line();
    // set the axes
    var axis = d3.svg.axis().orient("left").ticks(5);
    var background;
    var foreground;

    // initialize the svg
    var svg = d3.select("svg#b")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style('padding', 30)
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + 40 + ")");

    // make the title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '20px')
        .text('Health Spend Data, Parallel Coordinates');


    // let's specify the dimensions of the parallel plot
    x.domain(dimensions = fields);
    // for each y axis, set the scale from 0 to 100
    fields.forEach(function(d) {
        if (d === 'GDP') {
            y[d] = d3.scale.log().domain([1e7, 9e12]).range([height, 0]);
        } else {
            y[d] = d3.scale.linear().domain([0,100]).range([height, 0]);
        }
    });

    // bisector
    var bisect = d3.bisector(function(d) {return d[0]; });

    // we will only use a foreground, to reduce the amount of data processing necessary
    foreground = svg.append('g')
        .attr('class', 'foreground')
    .selectAll('path')
        .data(interpolateData(1995))
    .enter().append('path')
        .attr('d', path)
        .style('stroke', function(d) {return colorScale(d.Region); });


    // data interpolation function
    function interpolateData(year) {
        return data.map(function(d) {
            return {
                Country: d.Country,
                Region: d.Region,
                GDP: interpolateValues(d['GDP'], year, 1e7),
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

    // make the axis titles
    var g = svg.selectAll('.dimension')
        .data(dimensions)
    .enter().append('g')
        .attr('class', 'dimension')
        .attr('transform', function(d) {return 'translate(' + x(d) + ')'; });

    g.append('g')
        .attr('class', 'axis')
        .each(function(d, i) {
            d3.select(this).call(axis.scale(y[d]));
        })
        .append('text')
        .attr('text-anchor', 'middle')
        .each(function(d,i) {
            if (i % 2 === 0) {
                d3.select(this).attr('y', -9);
            } else {
                d3.select(this).attr('y', height + margin.bottom - 9);
            }
        })
        .style('font-size', '11px')
        .text(String)
        ;


    // add the year label
    var label = svg.append('text')
        .attr('class', 'year label')
        .attr('text-anchor', 'end')
        .attr('y', 0)
        .attr('x', 0)
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



    // display the specified year
    function displayYear(year) {
        foreground.data(interpolateData(year))
            .attr('d', path);
        label.text(Math.round(year));
    }


    function userMovement() {

        // define the annual scaling for user specification
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



    // interpolate values
    function interpolateValues(values, year, min_val) {
        // if it's empty, here we'll set it to 0
        if (values.length === 0) {
            min_val = typeof min_val !== 'undefined' ? min_val : 0;
            return min_val;
        }

        
        var i = bisect.left(values, year, 0, values.length - 1);

        // take the leading record
        var a = values[i];

        // initialize our return value
        var return_val;
        // we need to check that the year does not exceed the maximum year
        if (i > 0 && year < a[0]) {
            // preceding record
            var b = values[i - 1];
            // compute the weighting
            var t = (year - a[0]) / (b[0] - a[0]);
            // and weight our return value
            return_val = a[1] * (1-t) + b[1] * t;
        // otherwise, set the return value to the maximum record
        } else {
            return_val = a[1];
        }


        return return_val;

    }



    // position function
    function position(d) {
        return x(d);
    }

    // define the path function
    function path(d) {
        return line(dimensions.map(function(p) {
            return [position(p), y[p](d[p])];
        }));
    }




}