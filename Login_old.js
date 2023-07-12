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

//submit handler for login form
//sends user data to the server
async function handleLoginSubmit(event) {
  event.preventDefault();
  var username = event.target.login_username.value+"";
  var password = event.target.login_password.value+"";

  //console.log(username, password);
  window.headers = new Headers();
  var err;

  headers.set('Authorization', 'Basic ' + btoa(username + ":" + password));

  let token = await getToken();
  
  if(token == null) {
    console.log("token null");
    return
  }

  let data = await getQuery(UserQuery);
  
  if(data == null) {
    console.log("data null");
    return
  }

  console.log("handleLoginSubmit data: ", data);
}

async function getToken() {
  return await fetch("https://01.kood.tech/api/auth/signin", {
      method: "POST",
      headers: headers,
  })
  .then((response) => {
    return response.json()
  })
  .then((data) => {
    if (data.error) {
      generateServerResponse(data.error);
      return null
    } else {
      headers.set('Authorization', 'Bearer ' + data);
    }
  })
  .catch(err => console.log("getToken err: ", err))
}

//renders messages from the server on the DOM
function generateServerResponse(data) {
  var serverResponse = document.querySelector('.serverResponse');

  if (!serverResponse) {
    serverResponse = document.createElement('p');
    serverResponse.className = "serverResponse"
    document.querySelector('form').insertAdjacentElement('afterend', serverResponse);
  }

  serverResponse.textContent = JSON.stringify(data, null, 4);
}


async function getQuery(query) {
  await fetch("https://01.kood.tech/api/graphql-engine/v1/graphql", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(query),
  })
  .then((res) => {return res.json()})
  .then((newdata) => {
    if (newdata.errors) {
      generateServerResponse(newdata.errors);
      return null
    } else {
      return newdata
    }
  })
  .catch(err => console.log("getQuery err: ", err))
}






/*
            gets full schema
            query: `
            {
                __schema {
                    types {
                    name
                    }
                }
            }`

            
            gets current user's id and username
            query: `
            {
                user {
                    id
                    login
                }
            }`
            */


            /*
            to log out, send fetch with jwt token to https://01.kood.tech/api/auth/signout
            */