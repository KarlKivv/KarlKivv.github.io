// this file is used in the online version only

(function () {
    //// From Queries.js
    const userQuery = `{
        user { 
            id 
            login
            firstName
            lastName
        }
    }`
        
    const userXpQuery = `{
        transaction_aggregate(
            where: {
            _and: [
                {
                _or: [
                    {object: {type: {_eq: "project"}}},
                    {object: {type: {_eq: "piscine"}}},
                ]
                }, 
                {type: {_eq: "xp"}}, 
                {eventId: {_eq: 20}}]
            }
        ) {
            aggregate {
                sum {
                    amount
                }
            }
        }
    }`
        
    const userUpXpQuery = `{
        transaction_aggregate(
            where: {
            _and: [
                {
                _or: [
                    {object: {type: {_eq: "project"}}},
                    {object: {type: {_eq: "piscine"}}},
                ]
                }, 
                {type: {_eq: "up"}}, 
                {eventId: {_eq: 20}}]
            }
        ) {
            aggregate {
                sum {
                    amount
                }
            }
        }
    }`
        
    const userDownXpQuery = `{
        transaction_aggregate(
            where: {
            _and: [
                {
                _or: [
                    {object: {type: {_eq: "project"}}},
                    {object: {type: {_eq: "piscine"}}},
                ]
                }, 
                {type: {_eq: "down"}}, 
                {eventId: {_eq: 20}}]
            }
        ) {
            aggregate {
                sum {
                    amount
                }
            }
        }
    }`
        
    const XpPerName = `{
        transaction(
            where: {
            _and: [
                {
                _or: [
                    {object: {type: {_eq: "project"}}},
                    {object: {type: {_eq: "piscine"}}},
                ]
                }, 
                {type: {_eq: "xp"}},
                {eventId: {_eq: 20}},
            ]
            }, 
            order_by: {
                createdAt:asc
            }
        ) {
            object {
                name
            }
            createdAt
            amount
            type
        }
    }`

    //// From App.js

    // Gets audit data from graphQL server and formats it
    async function fetchUserAuditRatio() {
        const upTransactions = await sendQuery(userUpXpQuery);
        const downTransactions = await sendQuery(userDownXpQuery);

        if (!upTransactions.errors && !downTransactions.errors) {
            const auditMade = (upTransactions.data.transaction_aggregate.aggregate.sum.amount / 1000).toFixed(0)*1;
            const auditReceived = (downTransactions.data.transaction_aggregate.aggregate.sum.amount / 1000).toFixed(0)*1;
            const ratio = auditMade / auditReceived;
            return { auditMade, auditReceived, ratio };
        } else {
            return null;
        }
    }

    // Fetch API to interact with GraphQL server.
    async function sendQuery(query) {
        return fetch("https://01.kood.tech/api/graphql-engine/v1/graphql", {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                query: query,
            })
        })
        .then((res) => {return res.json()});
    }

    
    //// From Login.js

    //renders the login form on the DOM
    function renderLoginPage() {
        const data = `
            <div class="userauth">
            <form onsubmit="publicInterface.loginSubmit(event)" class="userauthForm">
                <h2>Log in</h2>
                <div class="formGroup">
                <label>
                    Username:
                    <br />
                    <input
                        type="text"
                        id="login_username"
                        name="username"
                        placeholder="Enter username or email"
                        autocomplete="on"
                    />
                </label>
                </div>
                <div class="formGroup">
                <label>
                    Password:
                    <br />
                    <input
                        type="password"
                        id="login_password"
                        name="password"
                        placeholder="Enter password"
                        required
                        autocomplete="on"
                    />
                </label>
                </div>
                <button type="submit">Log in</button>
            </form>
            </div>`;
        document.querySelector('.pageContent').innerHTML = data;
    }

    // precesses user login data
    async function handleLoginSubmit(event) {
        // try {
        //     event.preventDefault();
        // } catch (error) {
        //     console.log(error);
        //     return
        // }

        var username = event.target.login_username.value+"";
        var password = event.target.login_password.value+"";

        try {
            await login(username, password);

            var data = await sendQuery(userQuery);

            if (data.errors) {
                console.log("handleLoginSubmit error: ", data.errors);
            } else {
                var userLogin = data.data.user[0].login;
                var userId = data.data.user[0].id;

                var firstName = data.data.user[0].firstName;
                var lastName = data.data.user[0].lastName;

                var xpData = await sendQuery(userXpQuery);
                var auditData = await fetchUserAuditRatio();

                if (xpData.errors || auditData == null) {
                    console.log(xpData.errors);
                } else {
                    renderFrontPage(userLogin, firstName, lastName, xpData.data.transaction_aggregate.aggregate.sum.amount, auditData);
                }
            }
        } catch (error) {
            generateServerResponse(error.message);
        }
    }

    // displays status and error messages on the dom
    function generateServerResponse(message) {
        document.querySelector('.serverResponse').textContent = message;
    }


    function renderFrontPage(login, firstName, lastName, xpSum, auditData, chartData) {
        generateServerResponse("");
        const pageContent = document.querySelector('.pageContent');
        pageContent.innerHTML = `
            <button onclick="publicInterface.logout()">Logout</button>
            <h1 class="greeting">Welcome, ${firstName} ${lastName}!</h1>
            <div class="userData">
                <div class="userId">
                    <p>Your total XP:</p>
                    <p class="totalXp">${(xpSum / 1000).toFixed(2)}kb.</p>
                </div>
                <div id="auditData" class="auditData">
                    <p>Your audit ratio: </p>
                    <p class="auditRatio">${auditData.ratio.toFixed(2)}</p>
                    <p class="auditsDone">XP from audits done: ${auditData.auditMade}kb.</p>
                    <p class="auditsRecieved">XP from audits received: ${auditData.auditReceived}kb.</p>
                </div>
            </div>
            <div id="barChart" class="barChart">
                <h3>XP gained per project</h3>
            </div>
            <div id="lineGraph" class="lineGraph">
                <h3>XP gained over time</h3>
            </div>
            <div id="pieChart" class="pieChart">
                <h3>XP gained per project as a donut chart</h3>
            </div>`;

        sendQuery(XpPerName)
        .then(data => {
            if (!data.data || !data.data.transaction) {
                console.error('Error: data or data.transaction is undefined:', data.data);
                return;
            }
            generateBarChart(data.data.transaction);
            generateLineGraph(data.data.transaction, xpSum);

            generatePieChart(data.data.transaction);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    async function handleLogout() {
        delete window.headers;
        renderLoginPage();
    }

    // sends user login data to the server
    async function login(username, password) {
        console.log("starting login");
        window.headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa(username + ":" + password));
        headers.set('Content-Type', 'application/json');
        var response = await fetch("https://01.kood.tech/api/auth/signin", {
                method: "POST",
                headers: headers,
            }
        );
        if (!response.ok) {
            throw new Error('Invalid login credentials');
        }
        var jwt = await response.json();
        headers.set('Authorization', 'Bearer ' + jwt);
    }

    //// From Visualizations.js

    function generateBarChart(data) {
        var xpPerProject = {};
        data.forEach(transaction => {
            var project = transaction.object.name;
            var xp = transaction.amount / 1000;
            xpPerProject[project] = xp;
        });
    
        var margin = {top: 20, right: 20, bottom: 30, left: 40};
        var width = 660 - margin.left - margin.right - 100;
        var height = 200 - margin.top - margin.bottom - 100;
    
        var x = d3.scaleBand()
            .range([0, width])
            .padding(0.1);
        var y = d3.scaleLinear()
            .range([height, 0]);
    
        var svg = d3.select(".barChart").append("svg")
            .attr("width", width + margin.left + margin.right + 100)
            .attr("height", height + margin.top + margin.bottom + 100)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
        x.domain(Object.keys(xpPerProject));
        y.domain([0, d3.max(Object.values(xpPerProject))]);
    
        //x-axis
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-1em")
            .attr("dy", "0.2em")
            .attr("transform", "rotate(-65)");
    
        svg.selectAll(".bar")
            .data(Object.entries(xpPerProject))
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { 
                return x(d[0]); 
            })
            .attr("width", x.bandwidth())
            .attr("y", function(d) { 
                return y(d[1]); 
            })
            .attr("height", function(d) { 
                return height - y(d[1]); 
            });
    
        // x-axis label
        svg.append("text")             
            .attr("transform", `translate(${width/2}, ${height + margin.top + 20})`)
            .style("text-anchor", "middle")
    
        // y-axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("XP");
    
        // adding values to each bar
        svg.selectAll(".text")
            .data(Object.entries(xpPerProject))
            .enter()
            .append("text")
            .attr("class","label")
            .attr("x", (function(d) { 
                return x(d[0]) + x.bandwidth()/2 ; 
            }))
            .attr("y", function(d) { 
                return y(d[1]) - 5; 
            })
            .attr("text-anchor", "middle")
            .text(function(d) { 
                return d[1].toFixed(2); 
            });
    }
    
    function generateLineGraph(data, totalXp) {
        var xpPerDate = {};
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
    
        // xpPerDate from object to array of objects
        var dataArr = Object.keys(xpPerDate).map(date => {
            return {date: new Date(date), xp: xpPerDate[date]};
        });
    
        // cumulative XP over time
        var cumulativeXP = 0;
        dataArr = dataArr.map((item) => {
            cumulativeXP += item.xp;
            return {...item, xp: cumulativeXP};
        });
    
        // total XP for current date
        dataArr.push({
            date: new Date(),
            xp: cumulativeXP,
        });
    
        var margin = {top: 20, right: 20, bottom: 30, left: 50};
        var width = 660 - margin.left - margin.right - 100;
        var height = 400 - margin.top - margin.bottom -100;
    
        var svg = d3.select(".lineGraph").append("svg")
            .attr("width", width + margin.left + margin.right + 100)
            .attr("height", height + margin.top + margin.bottom+100)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
        var x = d3.scaleTime()
            .range([0, width])
            .domain(d3.extent(dataArr, function(d) { 
                return d.date; 
            }));
    
        var yMax = d3.max(dataArr, function(d) { 
                return d.xp; 
            });
    
        var numTicks = Math.ceil(yMax / 100);
    
        var y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, yMax + 50]);
    
        var line = d3.line()
            .curve(d3.curveStepAfter)
            .x(function(d) { 
                return x(d.date); 
            })
            .y(function(d) { 
                return y(d.xp); 
            });
    
        // for formating dates in dataArr
        var customTickFormat = function(date) {
            if(date.valueOf() === dataArr[dataArr.length - 1].date.valueOf()) {
                // format for the last date
                var formatTime = d3.timeFormat("%d.%m.%Y");
                return formatTime(date);
            } else {
                // format for everything else
                return d3.timeFormat("%b %d")(date);
            }
        };
    
        let tickValues = x.ticks();
        tickValues.push(dataArr[dataArr.length - 1].date);
    
        var xAxis = d3.axisBottom(x)
            .tickFormat(customTickFormat)
            .tickValues(tickValues);
    
        var xAxisGroup = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis);
    
        xAxisGroup.selectAll(".tick")
            .filter(function (d, i) { 
                return i === tickValues.length - 1; 
            })
            .select("text")
            .style("text-anchor", "end")  
            .attr("y", 10)
            .attr("x", -10)
            .attr("dx", "-1em")
            .attr("dy", "0.2em")
            .attr("transform", "rotate(-65)");
    
        // for creating y-axis with dotted lines every 100 units
        var yAxis = d3.axisLeft(y)
            .tickSize(-width)
            .ticks(numTicks)
            .tickFormat("");
    
        svg.append("g")
            .attr("class", "grid")
            .call(yAxis);
    
        svg.selectAll(".grid line")
            .style("stroke-dasharray", ("3, 3"));
    
        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y))
            .append("text")
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

    //// From Visualizations2.js

    function generatePieChart(data) {
        d3.select('.pieChart')
            .append('svg')
            .attr('viewBox', "0 0 500 500")
            .classed('pieChartSvg', true);
    
        let svg = d3.select('.pieChartSvg');
    
        let margin = 250 * 0.3;
        let radiusOut = 250 - margin;
        let radiusIn = radiusOut * 0.7;
        
        let colors = d3.scaleOrdinal()
            .domain(data.map(d => d.index))
            .range(d3.schemeDark2);
    
        let pieGenerator = d3.pie().value((d) => d.amount);
    
        let segments = d3.arc()
                        .innerRadius(radiusIn)
                        .outerRadius(radiusOut)
                        .padAngle(0.05)
                        .padRadius(25);
    
        let sections = d3.select('.pieChartSvg')
            .append('g')
            .attr('transform', `translate(250, 250)`)
            .selectAll('path')
            .data(pieGenerator(data))
            .enter()
            .append('path')
            .attr('d', segments)
            .attr('fill', function (d) {
                return colors(d.index)
            })
            .on('mouseenter', function (event, d) {
                d3.select(this)
                    .attr('fill', 'lightgray');
    
                d3.select('.piePlaceholder')
                    .classed('visible', false);
    
                d3.select('.pieTooltip')
                    .classed('visible', true);
    
                d3.select('.pieTooltipName')
                    .text(`${d.data.object.name}`);
    
                d3.select('.pieTooltipXp')
                    .text(`${(d.data.amount / 1000).toFixed(2)}kb`);
            })
            .on('mouseleave', function () {
                d3.select(this)
                    .attr('fill', function (d) {
                        return colors(d.index)
                    });
    
                d3.select('.pieTooltip')
                    .classed('visible', false);
    
                d3.select('.piePlaceholder')
                    .classed('visible', true);
            });
        
        svg.append('text')
            .attr('class', 'pieTooltip')
            .style('pointer-events', 'none')
            .attr('x', '250')
            .attr('y', '250');
    
        d3.select('.pieTooltip')
            .append('tspan')
            .classed('pieTooltipName', true)
            .attr('x', '250')
            .attr('dy', '0');
            
        d3.select('.pieTooltip')
            .append('tspan')
            .classed('pieTooltipXp', true)
            .attr('x', '250')
            .attr('dy', '1em');
            
        svg.append('text')
            .attr('class', 'piePlaceholder')
            .style('pointer-events', 'none')
            .attr('x', '250')
            .attr('y', '250')
            .classed('visible', true);
    
        d3.select('.piePlaceholder')
            .append('tspan')
            .text("Hover over a slice")
            .attr('x', '250')
            .attr('dy', 0);
    
        d3.select('.piePlaceholder')
            .append('tspan')
            .text("for more details")
            .attr('x', '250')
            .attr('dy', '1em');
    }

    window.publicInterface = {
        loginPage: function() {
            renderLoginPage();
        },
        loginSubmit: function (event) {
            try {
                event.preventDefault();
            } catch (error) {
                console.log(error);
                return
            }
            handleLoginSubmit(event);
        },
        logout: function () {
            handleLogout();
        }
    } 
})()