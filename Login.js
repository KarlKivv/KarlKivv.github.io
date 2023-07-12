//functions for login page functionality
//renders the login form on the DOM
function renderLoginPage() {
    const data = `
    <div class="userauth">
      <form onsubmit="handleLoginSubmit(event)" class="userauthForm">
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

async function handleLoginSubmit(event) {
  try {
    event.preventDefault();
  } catch (error) {
    console.log(error);
    return
  }
  
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

function generateServerResponse(message) {
  document.querySelector('.serverResponse').textContent = message;
}

function renderFrontPage(login, firstName, lastName, xpSum, auditData, chartData) {
  generateServerResponse("");
    const pageContent = document.querySelector('.pageContent');
    pageContent.innerHTML = `
      <button onclick="handleLogout()">Logout</button>
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
      </div>`;
  
    sendQuery(XpPerName)
    .then(data => {
      if (!data.data || !data.data.transaction) {
          console.error('Error: data or data.transaction is undefined:', data.data);
          return;
      }
      Visualizations.generateBarChart(data.data.transaction);
      Visualizations.generateLineGraph(data.data.transaction);

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

async function login(username, password) {
  console.log("starting login");

  window.headers = new Headers();

  headers.set('Authorization', 'Basic ' + btoa(username + ":" + password));
  headers.set('Content-Type', 'application/json');

  var response = await fetch("https://01.kood.tech/api/auth/signin", {
      method: "POST",
      headers: headers,
  });

  if (!response.ok) {
    throw new Error('Invalid login credentials');
  }

  var jwt = await response.json();
  headers.set('Authorization', 'Bearer ' + jwt);
}
