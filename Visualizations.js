const Visualizations = (function() {
  function generateBarChart(data) {
   
      var xpPerProject = {};  // Object to store the total XP per project.
      data.forEach(transaction => {
        var project = transaction.object.name;
        var xp = transaction.amount / 1000;
        // if (xpPerProject[project]) {
        //   xpPerProject[project] += xp;
        // } else {
        //   xpPerProject[project] = xp;
        // }

        xpPerProject[project] = xp;
      });
    
      var margin = {top: 20, right: 20, bottom: 30, left: 40};
      var width = 660 - margin.left - margin.right -100;
      var height = 200 - margin.top - margin.bottom -100;
    
      var x = d3.scaleBand()
          .range([0, width])
          .padding(0.1);
      var y = d3.scaleLinear()
          .range([height, 0]);
    
      var svg = d3.select("#barChart").append("svg")
        .attr("width", width + margin.left + margin.right + 100)
        .attr("height", height + margin.top + margin.bottom + 100)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
      x.domain(Object.keys(xpPerProject));
      y.domain([0, d3.max(Object.values(xpPerProject))]);

      //a call to create the x-axis with labels
      //this code must be after the line where you define your x scale 
      //and before you start creating bars
      svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
          .selectAll("text")  
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)");



    
      svg.selectAll(".bar")
        .data(Object.entries(xpPerProject))
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(d) { return x(d[0]); })
          .attr("width", x.bandwidth())
          .attr("y", function(d) { return y(d[1]); })
          .attr("height", function(d) { return height - y(d[1]); });

      // For the x-axis label
      svg.append("text")             
          .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top + 20) + ")")
          .style("text-anchor", "middle")
          //.text("Project Names");

      // For the y-axis label
      svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x", 0 - (height / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("XP");
      // add values to each bar
      svg.selectAll(".text")
          .data(Object.entries(xpPerProject))
          .enter()
          .append("text")
          .attr("class","label")
          .attr("x", (function(d) { return x(d[0]) + x.bandwidth()/2 ; }  ))
          .attr("y", function(d) { return y(d[1]) - 5; })
          .attr("text-anchor", "middle")
          .text(function(d) { return d[1]; });
  

      //...
  }

  function generateLineGraph(data) {
      var xpPerDate = {};  // Object to store the total XP per date.
      data.forEach(transaction => {
        let originalTimestamp = transaction.createdAt;
        let dateObj = new Date(originalTimestamp);
        transaction.createdAt = dateObj.toISOString().split('.')[0] + "Z";
        
        var date = transaction.createdAt;
        var xp = transaction.amount / 1000;
        if (xpPerDate[date]) {
          xpPerDate[date] += xp;
        } else {
          xpPerDate[date] = xp;
        }
      });    
      
      // Convert xpPerDate to an array of objects.
      var dataArr = Object.keys(xpPerDate).map(date => {
        return {date: new Date(date), xp: xpPerDate[date]};
      });
    
      dataArr.sort((a, b) => a.date - b.date);  // Sort data by date.

      // Now calculate the cumulative XP over time.
      var cumulativeXP = 0;
      dataArr = dataArr.map((item) => {
        cumulativeXP += item.xp;
        return {...item, xp: cumulativeXP};
      });

      dataArr.push({
        date: new Date(),
        xp: cumulativeXP,
      });

    
      var margin = {top: 20, right: 20, bottom: 30, left: 50};
      var width = 660 - margin.left - margin.right - 100;
      var height = 400 - margin.top - margin.bottom -100;
    
      var svg = d3.select("#lineGraph").append("svg")
        .attr("width", width + margin.left + margin.right + 100)
        .attr("height", height + margin.top + margin.bottom+100)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      var x = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(dataArr, function(d) { return d.date; }));



      var yMax = d3.max(dataArr, function(d) { return d.xp; });
      var numTicks = Math.ceil(yMax / 100); // calculate number of ticks for y axis



      var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, yMax]);
      
      var line = d3.line()
        .curve(d3.curveStepAfter)  // Make the line steady until next point
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.xp); });

      // Define a custom tick format function.
      var customTickFormat = function(date){
        // Use the timeFormat function to format the last date.
        if(date.valueOf() === dataArr[dataArr.length - 1].date.valueOf()){
            var formatTime = d3.timeFormat("%d.%m.%Y");
            return formatTime(date);
        } else {
            // Otherwise, use the default time format.
            return d3.timeFormat("%b %d")(date);
        }
      };

      // Calculate the tick values
      let tickValues = x.ticks();
      tickValues.push(dataArr[dataArr.length - 1].date);

      var xAxis = d3.axisBottom(x)
        .tickFormat(customTickFormat)
        .tickValues(tickValues);

      // Add the x-axis to the svg.
      var xAxisGroup = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      // Rotate the last tick label
      xAxisGroup.selectAll(".tick")
        .filter(function (d, i) { return i === tickValues.length - 1; })  // Select last tick
        .select("text")
        .style("text-anchor", "end")  
        .attr("y", 10)
        .attr("x", -10)
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

      // Create Y axis with dotted lines every 100 units
      var yAxis = d3.axisLeft(y)
        .tickSize(-width) // this is what creates the lines across the chart
        .ticks(numTicks)
        .tickFormat("");  // removes labels along y-axis 

      svg.append("g")
      .attr("class", "grid")
      .call(yAxis);


      // Make the lines dashed
      svg.selectAll(".grid line")
      .style("stroke-dasharray", ("3, 3"));

      svg.append("g")
          .attr("class", "y axis")
          .call(d3.axisLeft(y))
        .append("text")
          .attr("fill", "#000") // color of the text  
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x", 0 - (height / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Cumulative XP");
    
      svg.append("path")
          .datum(dataArr)
          .attr("class", "line")
          .attr("d", line);
  }
    

  return {
    generateBarChart,
    generateLineGraph
  };
})();