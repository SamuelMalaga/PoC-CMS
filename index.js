let rawListContent = null;
let userAuthenticated = false;
document.querySelector('#userAuthenticated').innerHTML = userAuthenticated;

//Realiza a autenticação do usuário usando o OAuthFlow da microsoft com o tenant @elogroup
async function run(){

  console.log("running");
  document.querySelector('#output').innerHTML = 'Now Running.... ';

  const config = {
    auth:{
      clientId:'acb41c67-8c92-4bdc-a3bd-4a93f7f29b8e',
      authority:'https://login.microsoftonline.com/298ec275-be18-4a15-bb9c-ad62eceeb328',
      redirectUri:'http://localhost:8080'
    }
  }

  var client = new msal.PublicClientApplication(config);

  var loginRequest = {
    scopes:['user.read','Sites.Read.All']
  };

  let loginResponse = await client.loginPopup(loginRequest);

  var tokenRequest ={
      scopes:['user.read','Sites.Read.All'],
      account: loginResponse.account
  };
  let tokenResponse = await client.acquireTokenSilent(tokenRequest);
  console.log('Token Response', tokenResponse);


  let payload = await fetch('https://graph.microsoft.com/v1.0/sites/root/lists/473f4f64-5200-4133-bf98-dcf975654344/items?expand=fields(select=Texto,linkInfo,imageInfo)',
  {
    headers: {
      'Authorization':`Bearer ${tokenResponse.accessToken}`
    }
  });
  let jsonContent = await payload.json();

  rawListContent = jsonContent
  userAuthenticated = true;
  document.querySelector('#userAuthenticated').innerHTML = userAuthenticated;

}

function getData(){
  document.querySelector('#output').innerHTML = JSON.stringify(rawListContent,null,4);
}
//TODO - Parse the JSON response
// Get the Json Response data
// Process Json response data
// Render Json Response data in page
