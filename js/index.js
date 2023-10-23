let rawListContent = null;
let tokenResponse = null;
let itemTableRawContent = null;
let topicTableRawContent = null;
let sectionTableRawContent = null;
let sectionContent = null;
let selectedSectionDataId = null;
let topicData = null;
let contentData = new Array();
//Globar variables to store content data, those variables load all content data
let sectionDataArray = null
let topicDataArray = null
let subTopicDataArray = null
let itemDataArray = null
//Global variables to store the selected content data
let selectedSection = null
let selectedTopic = null
let selectedSubTopic = null
let selectedItem=null
//TODO - Verificar se o método de autenticação de redirect (não o de popup) é menos bugado
//Realiza a autenticação do usuário usando o OAuthFlow da microsoft com o tenant @elogroup
async function run(){
  //Esconde o login Button ao clicar
  document.getElementById('loginBtn').style.visibility = "hidden"

  //Config to connect to elogroup sp using msal auth
  const config = {
    auth:{
      clientId:'acb41c67-8c92-4bdc-a3bd-4a93f7f29b8e',
      authority:'https://login.microsoftonline.com/298ec275-be18-4a15-bb9c-ad62eceeb328',
      redirectUri:'http://localhost:8080' //Dev
      //http://localhost:8080
      //https://samuelmalaga.github.io/PoC-CMS/ ---> Prod
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

  //Shows the sidenav on login
  document.getElementById('sideBarTopicList').style.width='270px' ;
  //Puxa os dados da lista section no sharepoint
  const sectionData = await getSectionData(tokenResponse.accessToken);
  sectionDataArray = sectionData;
  const topicData = await getTopicData(tokenResponse.accessToken);
  topicDataArray = topicData;
  const subTopicData = await getSubTopicData(tokenResponse.accessToken);
  console.log(subTopicData)
  subTopicDataArray = subTopicData;
  const itemData = await(getItemData(tokenResponse.accessToken));
  itemDataArray = itemData
  processSectionData(sectionDataArray);
  const defaultSelectedSection = sectionDataArray[0]
  processTopicData(topicDataArray);
  processSubtopicData(defaultSelectedSection.id);
  selectedSubTopic = subTopicData[0]
  processItemData(selectedSubTopic.id)
  // //Puxa os dados da lista topic no sharepoint

  // topicData = topicDataList;
  // processTopicData(topicDataList);
  // //Mostra a sidebar após o login

  // //Puxa os dados da lista subTopic no sharepoint
  // subTopicData = subTopicDataList
  // processSubtopicData(subTopicDataList);
  // //Mostra apenas os subtópico do primeiro tópico da primeira seção
  // displaySubTopicInfo(subTopicData[0]);
  // //Puxa os dados da lista items no sharepoint

  // itemData = RawitemData;
  // //Mostra apenas os itens referentes ao primeiro subtópico
  // //TODO - Melhorar a lógica dos processadores de Itens
  // processItemData(itemData,subTopicData[0] );

}

async function getItemData(acessToken){
  try{
    let payload = await fetch('https://graph.microsoft.com/v1.0/sites/root/lists/473f4f64-5200-4133-bf98-dcf975654344/items?expand=fields(select=Texto,linkInfo,imageInfo,subTopicLookupId,Title)',
  {
    headers: {
      'Authorization':`Bearer ${tokenResponse.accessToken}`
    }
  });
  itemTableRawContent = await payload.json();
  return itemTableRawContent.value
  } catch{
    console.error('Error retrieving item data:', error)
    throw error
  }
}
async function getSubTopicData(acessToken){
  try{
    let payload = await fetch('https://graph.microsoft.com/v1.0/sites/root/lists/7f78830c-d674-4e85-b28b-263e0de776da/items?expand=fields(select=topicLookupId,Title,LinkTitle,id)',
  {
    headers: {
      'Authorization':`Bearer ${tokenResponse.accessToken}`
    }
  });
  subTopicTableRawContent = await payload.json();
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
  topicData = topicTableRawContent.value
  return topicTableRawContent.value;
  } catch(error){
    console.error('Error retrieving topic data:', error);
    throw error
  }

}
function processTopicData(topicDataList){

  let topicDataToIterate = topicDataList

  const sideBarTopicList = document.getElementById('sideBarTopicList');
  //TODO - Melhorar esse mecanismo
  if(selectedSectionDataId != null){
    sideBarTopicList.innerHTML='';
  } else{
    topicDataToIterate = topicDataList.filter((topic)=> topic.fields.sectionLookupId === "1")
  }
  //Construtor de elementos DOM para o topicData
  topicDataToIterate.forEach(topicObj=>{
    const subTopicRelatedList = document.createElement('ul')
    subTopicRelatedList.className="topicAndSubTopicGroup"
    const sidebarLinkText = document.createElement('a');
    subTopicRelatedList.setAttribute('id',"TOP-"+ topicObj.id);
    sidebarLinkText.textContent= topicObj.fields.Title;
    sidebarLinkText.className = "topicItem"
    sidebarLinkText.value=topicObj.fields.Title;
    sidebarLinkText.onclick= function ( ){
      selectedTopic = topicObj
      const testFilter = subTopicDataArray.filter(subTopicObj => subTopicObj.fields.topicLookupId===selectedTopic.id)
      selectedSectionDataId = topicObj.id
      console.log(testFilter)
      return false;
    };
    subTopicRelatedList.appendChild(sidebarLinkText)
    sideBarTopicList.appendChild(subTopicRelatedList);
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
    headerLinkText.className = "sectionButton"
    headerLinkText.textContent= sectionObj.fields.Title;
    headerLinkText.style.color="rgba(255,255, 255, 1)";
    headerLinkText.value=sectionObj.fields.Title
    //Atribui ao header Link as chamadas de funções necessárias para manipular os itens e os subtópicos
    headerLinkText.onclick= function ( ){
      selectedSection = sectionObj;
      console.log('This section',selectedSection.id);
      selectedSectionDataId = selectedSection.id
      const relatedTopicData = topicData.filter(topicObj => topicObj.fields.sectionLookupId === selectedSection.id);
      console.log('related topics', relatedTopicData);
      processTopicData(relatedTopicData);
      processSubtopicData(selectedSection.id);
      // const filteredSubTopicData = filterSubTopicData(selectedSectionDataId);
      // displaySubTopicInfo(filteredSubTopicData[0])
      // filterItemData(filteredSubTopicData[0].id,filteredSubTopicData[0] );
      return false;
    };
    headerListItem.appendChild(headerLinkText);
    headerSectionList.appendChild(headerListItem);
  });
}
//Populates the sidenav
function processSubtopicData(selectedSectionId){
  const sectionRelatedTopicData = topicDataArray.filter(topicObj => topicObj.fields.sectionLookupId===selectedSectionId)
  // let subTopicDataToIterate = subTopicData;
  const subTopicBySection = new Array();
  //Gets all the subtopic related to the topics and sections shown in the screen
  sectionRelatedTopicData.forEach((topicObj) => {
    const subtopicByTopic = subTopicDataArray.filter(subTopicObj => subTopicObj.fields.topicLookupId===topicObj.id)
    subtopicByTopic.forEach((subtopic) => {
      subTopicBySection.push(subtopic)
    })
  });
  //Iterates through each subtopic obj and creates the DOM element for it
  //TODO - Create a function to create DOM Element instead of doing it inside the code
  subTopicBySection.forEach((subTopicObj)=>{
    const parentDomId = "TOP-" +  subTopicObj.fields.topicLookupId
    let subTopicListItem = document.createElement('li');
    let subTopicListItemLink = document.createElement('a');
    subTopicListItemLink.onclick = function(){
      testeGetItemData = itemDataArray.filter(itemObj=>itemObj.fields.subTopicLookupId === subTopicObj.id)
      window.alert("Subtopic ID" + subTopicObj.id);
      selectedSubTopic = subTopicObj
      processItemData(selectedSubTopic.id)
      console.log(testeGetItemData)
      //displaySubTopicInfo(subTopicData)
      // filterItemData(itemData,subTopicData)
      return false
    }
    subTopicListItemLink.textContent=subTopicObj.fields.Title;
    subTopicListItemLink.setAttribute('id',"SUBTOP-"+ subTopicObj.id)
    const parentTopic = document.getElementById(parentDomId);
    subTopicListItem.appendChild(subTopicListItemLink);
    //TODO - Melhorar essa lógica de try catch
    try{parentTopic.appendChild(subTopicListItem)} catch(error){}
  })
}
//Função não utilizada
function createSubTopicSection(subTopicId){
  const mainDiv = document.getElementById('main');
  mainDiv.innerHTML ='';
  let subTopicTest = document.createElement('p');
  subTopicTest.textContent = "Esse é um teste" + subTopicId;
  mainDiv.appendChild(subTopicTest);
}
function processItemData(parentSubtopicId){
  const mainContent = document.getElementById('main');
  //Clears the main div for content
  mainContent.innerHTML=''
  //Locate the main div for each item data content manipulation
  const itemContentDiv = document.getElementById('main');
  const itemDataToDisplay = itemDataArray.filter(itemData=> itemData.fields.subTopicLookupId === parentSubtopicId);
  //Gera os elementos DOM para cada item data
  itemDataToDisplay.forEach((itemData)=>{
    // const relatedSubTopicData = SubTopicRelatedItem.find((subTopic)=> subTopic.fields.id === itemData.fields.subTopicLookupId );
    //Item ContainerDiv
    let container = document.createElement('div');
    container.setAttribute('id', "itemContainer" + "-"  + itemData.id);
    container.className = "itemDisplayContainer";
    //Item itemcontainerHeader
    let containerHeader = document.createElement('div');
    containerHeader.setAttribute('id', "containerHeader"+ "-" + itemData.id);
    containerHeader.className = "containerHeader";
    //Adiciona Container header ao container
    container.appendChild(containerHeader)
    // Item Container HeaderTitle
    let containerHeaderTitle = document.createElement('p');
    containerHeaderTitle.className = "itemTitle";
    containerHeaderTitle.setAttribute('id', "itemTitle"+ "-" + itemData.id );
    containerHeaderTitle.textContent = itemData.fields.Title;
    //Adiciona o containerHeaderTitle ao containerHeader
    containerHeader.appendChild(containerHeaderTitle);
    //Item containerBody itemContentBody
    let containerBody = document.createElement('div');
    containerBody.className = "itemContentBody";
    containerBody.setAttribute('id', "itemContentBody"+ "-" + itemData.id );
    //Adiciona o containerBody ao container
    container.appendChild(containerBody);
    //Item body itemText
    let itemText = document.createElement('p');
    itemText.className = "itemText";
    itemText.textContent = itemData.fields.Texto
    itemText.setAttribute('id', "itemText"+ "-" + itemData.id );
    //Adiciona o itemText ao containerBody
    containerBody.appendChild(itemText);
    //Adiciona a containerDiv criada na main div
    itemContentDiv.appendChild(container);
    try{container.appendChild(processImageResponse(itemData))}catch(e){}
  })
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
function filterSubTopicData(sectionDataId){
  let sectionFilteredSubTopicData = new Array();
  const filteredTopicData = topicData.filter((topic) => topic.fields.sectionLookupId === sectionDataId);

  filteredTopicData.forEach((topicData) => {
    filteredSubTopicData = subTopicData.filter((subTopic) => subTopic.fields.topicLookupId === topicData.id)
    filteredSubTopicData.forEach((filteredSubTopic) => {
      sectionFilteredSubTopicData.push(filteredSubTopic)
    });

  });


  //Populates the sidenav
  processSubtopicData(sectionFilteredSubTopicData);
  return sectionFilteredSubTopicData;
}
//
function filterItemData(sectionDataId,subTopicTest){
  // let sectionFiltereditemData = new Array();
  // let sectionFilteredSubTopicData = new Array();
  // const filteredTopicData = topicData.filter((topic) => topic.fields.sectionLookupId === sectionDataId)
  // filteredTopicData.forEach((topicData) => {
  //   filteredSubTopicData = subTopicData.filter((subTopic) => subTopic.fields.topicLookupId === topicData.id)
  //   //filter the subtopic
  //   filteredSubTopicData.forEach((filteredSubTopic) => {
  //     sectionFilteredSubTopicData.push(filteredSubTopic)
  //   });
  // });
  // sectionFilteredSubTopicData.forEach((filteredSubTopicData)=>{
  //   filteredItemData = itemData.filter((item)=> item.fields.subTopicLookupId === filteredSubTopicData.id)
  //   filteredItemData.forEach((filteredItem)=>{
  //     sectionFiltereditemData.push(filteredItem)
  //   })
  // })
  let testSubtopicDataId = subTopicTest.id
  let itemDataToIterate = itemData;
  let sectionFiltereditemData = itemDataToIterate.filter(itemData=> itemData.fields.subTopicLookupId === subTopicTest.id);
  processItemData(sectionFiltereditemData,subTopicTest);
}
function processImageResponse(itemObj){
  id = itemObj.id
  if(typeof itemObj.fields.imageInfo ==='undefined'){
    return;
  } else{
    imageJsonResponse = JSON.parse(itemObj.fields.imageInfo);
    let imageLink = imageJsonResponse.serverUrl + imageJsonResponse.serverRelativeUrl;
    let imageContent = document.createElement('img');
    imageContent.src = imageLink;
    let imageDiv = document.createElement('div');
    imageDiv.setAttribute('id', "ItemImg-"+id);
    imageDiv.className = "itemImage";
    imageDiv.appendChild(imageContent);
    return imageDiv
  }

}
function processItemText(itemData){
  console.log("Aqui",itemData.fields.Texto)

}
function displaySubTopicInfo(subTopic){
  //Locate the main div
  const mainDiv = document.getElementById('main');
  //Clear the main Div
  mainDiv.innerHTML='';
  //Create the subTopicDisplayContainer
  let subTopicDisplayContainer = document.createElement('div');
  subTopicDisplayContainer.className = "subTopicDisplayContainer";
  subTopicDisplayContainer.setAttribute('id', "subTopicDisplayContainer-"+subTopic.id);
  //Create the containerHeader
  let containerHeader = document.createElement('div');
  containerHeader.setAttribute('id', "containerHeader"+ "-" + subTopic.id);
  containerHeader.className = "containerHeader";
  //Adiciona o containerHeader no subTopicDisplayContainer
  subTopicDisplayContainer.appendChild(containerHeader)
  //Create the containerHeaderTitle
  let containerHeaderTitle = document.createElement('p');
  containerHeaderTitle.className = "subTopicTitle";
  containerHeaderTitle.setAttribute('id', "subTopicTitle"+ "-" + subTopic.id );
  containerHeaderTitle.textContent = subTopic.fields.Title + "-" + subTopic.id;
  //Adiciona o containerHeaderTitle ao containerHeader
  containerHeader.appendChild(containerHeaderTitle);
  //Cria o containerBody
  let containerBody = document.createElement('div');
  containerBody.className = "subTopicContentBody";
  containerBody.setAttribute('id', "subTopicContentBody"+ "-" + subTopic.id );
  //Adiciona o containerBody ao container
  subTopicDisplayContainer.appendChild(containerBody);
  //Cria o subTopicText
  let itemText = document.createElement('p');
  itemText.className = "subTopicText";
  //itemText.textContent = subTopic.fields.Texto
  itemText.setAttribute('id', "subTopicText"+ "-" + subTopic.id );
  //Adiciona o itemText ao containerBody
  containerBody.appendChild(itemText);
  //Adiciona tudo ao main
  mainDiv.appendChild(subTopicDisplayContainer);
}

