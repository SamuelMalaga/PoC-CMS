let rawListContent = null;
let userAuthenticated = false;
let tokenResponse = null;
let itemTableRawContent = null;
let topicTableRawContent = null;
let sectionTableRawContent = null;
let sectionContent = null;
let selectedSectionDataId = null;

let contentData = new Array();
//TODO - Verificar se o método de autenticação de redirect (não o de popup) é menos bugado
//Realiza a autenticação do usuário usando o OAuthFlow da microsoft com o tenant @elogroup
async function run(){

  //Config to connect to elogroup sp using msal auth
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
  tokenResponse = await client.acquireTokenSilent(tokenRequest);

  //console.log('Token Response', tokenResponse);


  let payload = await fetch('https://graph.microsoft.com/v1.0/sites/root/lists/473f4f64-5200-4133-bf98-dcf975654344/items?expand=fields(select=Texto,linkInfo,imageInfo)',
  {
    headers: {
      'Authorization':`Bearer ${tokenResponse.accessToken}`
    }
  });

  //const sectionData = await getSectionData(tokenResponse.accessToken);
  const sectionData = await getSectionData(tokenResponse.accessToken)
  //selectedSectionDataId = 1;
  processSectionData(sectionData);
  const topicDataList = await getTopicData(tokenResponse.accessToken);
  //filterTopicData(selectedSectionDataId);
  processTopicData(topicDataList);
  getItemData(tokenResponse.accessToken);
  //getSubTopicData(tokenResponse.accessToken);


  let jsonContent = await payload.json();

  rawListContent = jsonContent;
  userAuthenticated = true;
  document.querySelector('#initialMessage').hidden = true;
}

async function getItemData(acessToken){
  let payload = await fetch('https://graph.microsoft.com/v1.0/sites/root/lists/473f4f64-5200-4133-bf98-dcf975654344/items?expand=fields(select=Texto,linkInfo,imageInfo)',
  {
    headers: {
      'Authorization':`Bearer ${tokenResponse.accessToken}`
    }
  });
  itemTableRawContent = await payload.json();
  //console.log('GetItem data',itemTableRawContent.value)
}
async function getSubTopicData(acessToken){
  try{
    let payload = await fetch('https://graph.microsoft.com/v1.0/sites/root/lists/7f78830c-d674-4e85-b28b-263e0de776da/items?expand=fields(select=topicLookupId,Title,LinkTitle,id)',
  {
    headers: {
      'Authorization':`Bearer ${tokenResponse.accessToken}`
    }
  });
  //subTopicTableRawContent = await payload.json();
  console.log('Getsubtopic data',subTopicTableRawContent.value)
  return subTopicTableRawContent.value;
  } catch(error){
    console.error('Error retrieving topic data:', error);
    throw error
  }

}
async function getTopicData(acessToken){
  try{
    let payload = await fetch('https://graph.microsoft.com/v1.0/sites/root/lists/47b34abe-b095-4f95-a68a-8e73e9bbef41/items?expand=fields(select=sectionLookUpId,Title,LinkTitle,topic_descricao,id)',
  {
    headers: {
      'Authorization':`Bearer ${tokenResponse.accessToken}`
    }
  });
  topicTableRawContent = await payload.json();
  //console.log('GetTopic data',topicTableRawContent.value)
  topicData = topicTableRawContent.value
  return topicTableRawContent.value;
  } catch(error){
    console.error('Error retrieving topic data:', error);
    throw error
  }

}
function processTopicData(topicDataList){

  const sidebarSectionList = document.getElementById('sidebarSectionList');
  if(selectedSectionDataId != null){
    sidebarSectionList.innerHTML='';
  }

  topicDataList.forEach(topicObj=>{
    const sideBarListItem = document.createElement('h4');
    const sidebarLinkText = document.createElement('a');
    sidebarLinkText.textContent= topicObj.fields.Title;
    sidebarLinkText.style.color="rgba(0,0, 0, 1)";
    sidebarLinkText.value=topicObj.fields.Title;
    sideBarListItem.appendChild(sidebarLinkText);
    sidebarSectionList.appendChild(sideBarListItem);
  });
}
async function getSectionData(acessToken){
  try{
    let payload = await fetch('https://graph.microsoft.com/v1.0/sites/root/lists/c6d4a088-cc51-4ab5-93f1-3bce07790527/items?expand=fields(select=Title,id,section_description)',
      {
        headers: {
          'Authorization':`Bearer ${tokenResponse.accessToken}`
        }
    });
    sectionTableRawContent = await payload.json();
    //console.log('GetSection data', sectionTableRawContent.value);
    sectionData = sectionTableRawContent.value;
    return sectionTableRawContent.value;
  } catch(error){
    console.error('Error retrieving section data:', error);
    throw error
  }
}
function processSectionData(sectionData){
  const headerSectionList = document.getElementById('headerSectionList');
  sectionData.forEach(sectionObj=>{
    const headerListItem = document.createElement('li');
    const headerLinkText = document.createElement('a');
    headerLinkText.textContent= sectionObj.fields.Title;
    headerLinkText.style.color="rgba(255,255, 255, 1)";
    headerLinkText.value=sectionObj.fields.Title
    headerLinkText.onclick= function ( ){
      selectedSectionDataId = sectionObj.id
      filterTopicData(sectionObj.id);
      return false;
    };
    headerListItem.appendChild(headerLinkText);
    headerSectionList.appendChild(headerListItem);
  });
}
//test Function
function doSomething(testText){
  alert(testText)
}
//Filter the topic data based on the section Id
function filterTopicData(sectionDataId){
  const filteredTopicData = topicData.filter((topic) => topic.fields.sectionLookupId === sectionDataId)
  processTopicData(filteredTopicData)
}









//TODO - Parse the JSON response
// Get the Json Response data
// Process Json response data
// Render Json Response data in page
