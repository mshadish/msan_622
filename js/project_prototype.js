// author: Matt Shadish


// global color mapping
var color_mapping = {
    'Africa': '#1b9e77',
    'Americas': '#d95f02',
    'Europe': '#7570b3',
    'Southeast Asia': '#e7298a',
    'Eastern Mediterranean': '#66a61e',
    'Western Pacific': '#e6ab02'
};


// let's define the regions here
var global_regions = ['Africa','Americas','Europe','Southeast Asia',
                      'Western Pacific','Eastern Mediterranean'];

// read in the data
d3.json('data/who_data_merged.json', function(error, data) {
	if (error) {
		console.warn(error);
		return
	}

	var data_set = data;
    genBubblePlot(data_set);

    genParallelPlot(data_set);

    genSmallMultiples(data_set);
});



// DEFINE THE FUNCTION TO GENERATE THE BUBBLE PLOT
// note that we'll have to take into account the ability to change the x- and y-axes

// for now, we'll just focus on the time component
function genBubblePlot(data) {
    
    // define the x and y fields
    var x_field = 'Soc_sec_to_gov_health_spending';
    var y_field = 'Outofpocket_to_total_spending';

    // set the maximum radius
    var max_radius = 30;
    // and set the minimum x- and y- value
    var min_axis_value = Math.sqrt(max_radius);
    



	// set the margins
    var margin = {top: 40, right: 80, bottom: 80, left: 50};
    var width = 750 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    // set the x and y scales as well as the color scale
    var xScale = d3.scale.linear()
    	.range([0, width])
    	.domain([-min_axis_value, 100]);
    var yScale = d3.scale.linear()
    	.range([height, 0])
    	.domain([-min_axis_value, 100]);
    var radiusScale = d3.scale.sqrt()
        //.domain([1e7, 2e13])
        .domain([0, 2e13])
        .range([3, max_radius]);

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

    // initialize the tooltip
    var tip_obj = d3.tip()
        .attr('class', 'd3-tip')
        .attr('id', 'tip_obj')
        .offset([-7,0])
        .html(function(d) {
            return "<span style='color:white'>" + d.Country + "</span>";
        });
    svg.call(tip_obj);

	// Add the x-axis.
	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + (height + 10) + ")")
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
        .text('Healthcare Expenditure by Country');

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
            .style('fill', function(d) {return color_mapping[regionGet(d)]; })
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
            if (typeof min_val !== 'undefined') {
                return min_val;
            } else {
                return -50;
            }
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


    // ADD A LEGEND HERE
    var legend = d3.select('h4#bubble-legend').append('svg')
        .attr('height', 150)
        .attr('width', 400);


    legend.attr('class', 'legend')
        .selectAll('rect')
        .data(global_regions)
    .enter().append('g')
        .each(function(d,i) {
            var g = d3.select(this);
            g.append('rect')
                .attr('x', 50)
                .attr('y', i * 25)
                .attr('width', 10)
                .attr('height', 10)
                .style('fill', color_mapping[d]);

            g.append('text')
                .attr('x', 70)
                .attr('y', 9 + (i * 25))
                .attr('height', 30)
                .attr('width', 100)
                .style('font-size', '11px')
                .text(d);
        });



    // start adding the dots
    var dot = svg.append('g')
        .attr('class', 'dots')
    .selectAll('.dot')
        .data(interpolateData(1995))
    .enter().append('circle')
        .attr('class', 'dot')
        .call(position)
        .sort(order);
    dot.on('mouseover', tip_obj.show)
        .on('mouseout', tip_obj.hide);

    // grab the x-axis selection from the html
    var x_axis_selection = document.getElementById('bubble-x-axis');
    x_axis_selection.onchange=function() {
        x_field = x_axis_selection.value;
        // shift the x axis and x axis values

        // transition
        dot.transition()
            .duration(1500)
        .call(position);
    };

    // grab the y-axis selection
    var y_axis_selection = document.getElementById('bubble-y-axis');
    y_axis_selection.onchange=function() {
        y_field = y_axis_selection.value;
        // shift the y axis

        // transition
        dot.transition()
            .duration(1500)
        .call(position);
    };
}

/*
=====================
PARALLEL COORDINATES
=====================
*/

function genParallelPlot(data) {
    // note: we have temporarily removed GDP
    var fields = ['GDP',
        'External reseources for health / Total health spend',
        'Gov health spend / Total gov spend',
        'Gov health spend / Total health spend',
        'Out-of-pocket health spend / Private health spend',
        'Out-of-pocket health spend / Total health spend',
        'Private prepaid plans / Private health spend',
        'Private health spend / Total health spend',
        'Social security health spend / Gov health spend',
        'Total health spend / GDP']


    // set the margins
    var margin = {top: 80, left: 50, bottom: 30, right: 80};
    var width = 1100 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    // specify the different scalings
    var x = d3.scale.ordinal().rangePoints([0, width], 1);
    var y = {};
    var dragging = {};

    // line generator
    //var line = d3.svg.line();
    var line = d3.svg.line().defined(function(d) {
        return d[1] !== null; 
    });
    // set the axes
    var axis = d3.svg.axis().orient("left").ticks(5);
    var background;
    var foreground;

    // initialize the svg
    var svg = d3.select("svg#b")
        .attr("width", width + margin.left + margin.right + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style('padding', 30)
    .append("g")
        .attr("transform", "translate(" + 40 + "," + 40 + ")");

    // make the title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '20px')
        .text('Healthcare Expenditure by Country');


    // let's specify the dimensions of the parallel plot
    x.domain(dimensions = fields);
    // for each y axis, set the scale from 0 to 100
    fields.forEach(function(d) {
        if (d === 'GDP') {
            y[d] = d3.scale.log().domain([1e0, 2e13]).range([height, 0]);
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
        .style('stroke', function(d) {return color_mapping[d.Region]; });


    // data interpolation function
    function interpolateData(year) {
        return data.map(function(d) {
            return {
                Country: d.Country,
                Region: d.Region,
                GDP: interpolateValues(d['GDP'], year, 1e7),
                'External reseources for health / Total health spend': interpolateValues(d['External resources for health / total spending on health'], year),
                'Gov health spend / Total gov spend': interpolateValues(d['Gov spending on health / total gov spending'], year),
                'Gov health spend / Total health spend': interpolateValues(d['Gov spending on health / total spending on health'], year),
                'Out-of-pocket health spend / Private health spend': interpolateValues(d['Out-of-pocket spending / private spending on health'], year),
                'Out-of-pocket health spend / Total health spend': interpolateValues(d['Out-of-pocket spending / total spending on health'], year),
                'Private prepaid plans / Private health spend': interpolateValues(d['Private prepaid plans / private spending on health'], year),
                'Private health spend / Total health spend': interpolateValues(d['Private spending on health / total spending on health'], year),
                'Social security health spend / Gov health spend': interpolateValues(d['Soc security spending on health / gov spending on health'], year),
                'Total health spend / GDP': interpolateValues(d['Total spending on health / GDP'], year)
            };
        });
    }

    /*
    ====================================
    ADD THE DRAGGING FUNCTIONALITY HERE
    ====================================
    */
    var g = svg.selectAll('.dimension')
        .data(dimensions)
    .enter().append('g')
        .attr('class', 'dimension')
        .attr('transform', function(d) {return 'translate(' + x(d) + ')'; })
        .call(d3.behavior.drag()
                .on('dragstart', function(d) {
                    dragging[d] = this.__origin__ = x(d);
                })
                .on('drag', function(d) {
                    dragging[d] = Math.min(width, Math.max(0, this.__origin__ += d3.event.dx));
                    foreground.attr('d', path);
                    dimensions.sort(function(a,b) {
                        return position(a) - position(b);
                    });
                    x.domain(dimensions);
                    g.attr('transform', function(d) {
                        return 'translate(' + position(d) + ')';
                    });
                })
                .on('dragend', function(d) {
                    delete this.__origin__;
                    delete dragging[d];
                    transition(d3.select(this)).attr('transform', 'translate(' + x(d) + ')');
                    transition(foreground).attr('d', path);
                    
                })
        );

    // transition for axis moving
    function transition(g) {
        return g.transition().duration(500);
    }

    /*
    ====================================
    ADD THE BRUSHING FUNCTIONALITY HERE
    ====================================
    */
    g.append('g')
        .attr('class', 'brush')
        .each(function(d) {
            d3.select(this)
                .call(y[d].brush = d3.svg.brush().y(y[d])
                    .on('brushstart', brushstart)
                    .on('brush', brush));
        })
        .selectAll('rect')
            .attr('x', -8)
            .attr('width', 16);
    // brushing functions
    function brushstart() {
        d3.event.sourceEvent.stopPropagation();
    }
    function brush() {
        var actives = dimensions.filter(function(p) {
            return !y[p].brush.empty();
        });
        var extents = actives.map(function(p) {
            return y[p].brush.extent();
        });
        
        foreground.style('display', function(d) {
            return actives.every(function(p,i) {
                return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            }) ? null : 'none';
        });
    }



    // make the axis titles
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
        .style('font-size', '9px')
        .text(function(String) {
            var temp_str = String;
            return temp_str.replace(/_/g, ' ');
        })
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
        // if it's empty, here we'll set it to ''
        // to help with the data interpolation
        if (values.length === 0) {
            return '';
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
        var v = dragging[d];
        return v == null ? x(d) : v;
    }

    // define the path function
    function path(d) {
        return line(dimensions.map(function(p) {
            // check for undefined values
            if (d[p] === '') {
                return [position(p), null];
            } else {
                return [position(p), y[p](d[p])];
            }
        }));
    }


    // ADD A LEGEND HERE
    var legend = svg.append('svg')
        .attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right + margin.right);


    legend.attr('class', 'legend')
        .selectAll('rect')
        .data(global_regions)
    .enter().append('g')
        .each(function(d,i) {
            var g = d3.select(this);
            g.append('rect')
                .attr('x', width)
                .attr('y', 150 + i * 25)
                .attr('width', 10)
                .attr('height', 10)
                .style('fill', color_mapping[d]);

            g.append('text')
                .attr('x', width + 20)
                .attr('y', 159 + (i * 25))
                .attr('height', 30)
                .attr('width', 100)
                .style('font-size', '11px')
                .text(d);
        });



}




function genSmallMultiples(data) {
    // we'll define the fields here, which we will end up using as keys
    var fields = ['Gov spending on health / total gov spending',
                  'Gov spending on health / total spending on health',
                  'Out-of-pocket spending / private spending on health',
                  'Out-of-pocket spending / total spending on health',
                  'Private prepaid plans / private spending on health',
                  'Private spending on health / total spending on health',
                  'Soc security spending on health / gov spending on health',
                  'Total spending on health / GDP',
                  'External resources for health / total spending on health'];

    // define the margins, sizes
    var margin = {top: 10, right: 20, bottom: 20, left: 40};
    //var width = 900 - margin.left - margin.right;
    var width = 450 - margin.left - margin.right;
    //var height = 150 - margin.top - margin.bottom;
    var height = 100 - margin.top - margin.bottom;
    // context height
    var context_height = height/2;

    // scalings
    var xScale = d3.scale.linear()
        .domain([1995, 2012])
        .range([0, width]);

    // make a y-scaling for each field

    
    var yScale = d3.scale.linear()
        .range([height, 0]);
    


    // context x and y scales
    var context_xScale = d3.scale.linear().range([0, (width*2) + margin.left + margin.right])
        .domain(xScale.domain());


    // axis callback functions
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .ticks(2)
        .orient('left');
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .ticks(5)
        .tickFormat(d3.format('d'));

    // context axis
    var context_xAxis = d3.svg.axis().scale(context_xScale)
        .orient('bottom')
        .tickFormat(d3.format('d'));
    // initialize the brushing variable
    var brush = d3.svg.brush()
        .x(context_xScale)
        .on('brush', brushed);


    // line plotting function
    var line = d3.svg.line()
        .interpolate('linear')
        .x(function(d) {
            return xScale(d[0]);
        })
        .y(function(d) {
            return yScale(d[1]);
        });

    // context line
    var context_line = d3.svg.line()
        .x(function(d) {return context_xScale(d[0]); })
        .y(function(d) {return context_yScale(d[1]); });





    /*
    =======================================
    WE MUST COMPUTE THE AVERAGES BY REGION
    =======================================
    */
    var regional_avgs = {};
    // initialize how we'll keep track of the average for each
    global_regions.forEach(function(d) {
        regional_avgs[d] = {};
        fields.forEach(function(e) {
            regional_avgs[d][e] = {};
        });
    });

    // loop through our data
    data.forEach(function(d) {
        // pull out the region
        var region = d.Region;
        // step through the fields
        fields.forEach(function(field) {
            // check for the existence of that key
            if (field in d) {
                // pull out the array
                var records = d[field];
                // loop through the years
                records.forEach(function(e) {
                    // pull the year
                    var year = e[0];
                    if (year in regional_avgs[region][field]) {
                        // update our sum and count
                        regional_avgs[region][field][year]['sum'] += e[1];
                        regional_avgs[region][field][year]['count']++;
                    } else {
                        // otherwise, initialize
                        regional_avgs[region][field][year] = {};
                        regional_avgs[region][field][year]['sum'] = e[1];
                        regional_avgs[region][field][year]['count'] = 1;
                    }
                });
            }
        });
    });


    var average_dict = {};
    fields.forEach(function(d) {
        average_dict[d] = {};
        global_regions.forEach(function(e) {
            average_dict[d][e] = [];
        })
    })


    // compute the averages
    // for each region...
    global_regions.forEach(function(region) {
        //...and each field in each region...
        fields.forEach(function(field) {
            var years = Object.keys(regional_avgs[region][field]);
            // for every year we have for this field in this region...
            years.forEach(function(year) {
                var percentage = regional_avgs[region][field][year]['sum'] / regional_avgs[region][field][year]['count'];
                // add to our average dictionary
                average_dict[field][region].push([Number(year), percentage]);
            });
        });
    });

    // and now turn into a list
    var final_list = [];
    fields.forEach(function(field) {
        average_dict[field]['key'] = field;
        final_list.push(average_dict[field]);
    });
    /*
    ==============================
    AVERAGE COMPUTATION COMPLETE
    ==============================
    */

    /*
    COMPUTE THE MAXES, BY FIELD, FOR THE Y-DOMAINS
    */
    var field_max_lookup = {};
    final_list.forEach(function(field) {
        var field_max_list = [];
        global_regions.forEach(function(region) {
            var region_max = d3.max(field[region], function(d) {
                return d[1];
            });
            field_max_list.push(region_max);
        });
        // update the y-domain for this field
        field_max_lookup[field.key] = Math.max.apply(null, field_max_list);
    });


    var svg = d3.select('div.d').append('g');

    var all_plots = svg.selectAll('.plots')
        .data(final_list)
    .enter().append('svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
    .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('id', function(d,i) {return 'small_multi_' + String.fromCharCode(97 + i); });



    // we need to add a separate path class for each region
    global_regions.forEach(function(d) {
        all_plots.append('svg')
            .attr('width', width)
            .attr('height', height)
        .append('path')
            .attr('class', 'path_' + d.replace(/ /g, '_'))
            .attr('d', function(e) {
                var input_list = e[d].map(toObject);
                yScale.domain([0, field_max_lookup[e.key] + Math.min(field_max_lookup[e.key] * 0.2, 10)]);
                return line(input_list);
            })
            .style('stroke', color_mapping[d])
            .style('fill', 'none')
            .style('stroke-width', '1.5');
    });


    $( document ).ready(function() {

        fields.forEach(function(d,i) {
            yScale.domain([0, field_max_lookup[d] + Math.min(field_max_lookup[d] * 0.2, 10)]);
            
            d3.select('g#small_multi_' + String.fromCharCode(97 + i))
                .attr('class', 'y axis')
                .call(yAxis);

        });
    });


    



    // add the context svg
    var context = d3.select('div.e').append('svg')
        .attr('class', 'context')
        .attr('width', (width + margin.left + margin.right)*2)
        .attr('height', context_height + margin.top + margin.top + margin.bottom)
    .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    context.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (context_height / 2) + ')')
        .call(context_xAxis)
        .style('font-size', '14px');

    // brushing on the context
    context.append('g')
        .attr('class', 'x brush')
        .call(brush)
    .selectAll('rect')
        .attr('y', 0)
        .attr('height', (context_height + 10));

    // let's add some specifying text
    context.append('text')
        .attr('x', width)
        .attr('y', context_height + 25)
        .text('Brushing Axis');




    // brushing function
    function brushed() {
        xScale.domain(brush.empty() ? context_xScale.domain() : brush.extent());

        // update the paths in each small multiple for each region
        global_regions.forEach(function(d) {
            all_plots.select('.path_' + d.replace(/ /g, '_'))
                .attr('d', function(e) {
                    var input_list = e[d].map(toObject);
                    yScale.domain([0, field_max_lookup[e.key] + Math.min(field_max_lookup[e.key] * 0.2, 10)]);
                    return line(input_list);
                });
        });

        // update the x-axis
        all_plots.select('.x.axis').call(xAxis);
    }



    // array to object conversion
    function toObject(arr) {
        var return_obj = {};
        
        for (var idx = 0; idx < arr.length; ++idx) {
            if (arr[idx] !== undefined) {
                return_obj[idx] = arr[idx];
            }
        }
        return return_obj;
    }



    
    // add a title for each
    all_plots.append('text')
        .attr('x', (width /2))
        .attr('y', 0)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text(function(d) {return d.key; });
    


    // ADD A LEGEND HERE
    var legend = d3.select('h4#small-legend').append('svg')
        .attr('height', 600)
        .attr('width', 400);

    legend.append('text')
        .attr('x', 0)
        .attr('y', 50)
        .style('font-size', '24px')
        .text('Small Multiples');


    legend.attr('class', 'legend')
        .selectAll('rect')
        .data(global_regions)
    .enter().append('g')
        .each(function(d,i) {
            var g = d3.select(this);
            g.append('rect')
                .attr('x', 0)
                .attr('y', 150 + i * 25)
                .attr('width', 10)
                .attr('height', 10)
                .style('fill', color_mapping[d]);

            g.append('text')
                .attr('x', 20)
                .attr('y', 159 + (i * 25))
                .attr('height', 30)
                .attr('width', 100)
                .style('font-size', '11px')
                .text(d);
        });


    // add 2 x-axes, one for each "side"
    var small_multiples_x_left = d3.select('g#small_multi_i')
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .style('font-size', '14px')
        .call(xAxis);
    var small_multiples_x_right = d3.select('g#small_multi_h')
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .style('font-size', '14px')
        .call(xAxis);

}