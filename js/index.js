let rawListContent = null;
let userAuthenticated = false;
let tokenResponse = null;
let itemTableRawContent = null;
let topicTableRawContent = null;
let sectionTableRawContent = null;
let sectionContent = null;
let selectedSectionDataId = null;
let topicData = null;
let subTopicDataArray = null;
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

  //sideBarTopicList'Token Response', tokenResponse);


  // let payload = await fetch('https://graph.microsoft.com/v1.0/sites/root/lists/473f4f64-5200-4133-bf98-dcf975654344/items?expand=fields(select=Texto,linkInfo,imageInfo,Title)',
  // {
  //   headers: {
  //     'Authorization':`Bearer ${tokenResponse.accessToken}`
  //   }
  // });

  //const sectionData = await getSectionData(tokenResponse.accessToken);
  const sectionData = await getSectionData(tokenResponse.accessToken)
  //selectedSectionDataId = 1;
  processSectionData(sectionData);
  const topicDataList = await getTopicData(tokenResponse.accessToken);
  topicData = topicDataList;
  processTopicData(topicDataList);
  const subTopicDataList = await getSubTopicData(tokenResponse.accessToken);
  subTopicData = subTopicDataList
  //sideBarTopicListtopicDataList);
  processSubtopicData(subTopicDataList);
  const RawitemData = await(getItemData(tokenResponse.accessToken))
  itemData = RawitemData;
  processItemData(itemData);



  //let jsonContent = await payload.json();

  //rawListContent = jsonContent;
  userAuthenticated = true;
  //document.querySelector('#initialMessage').hidden = true;
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
  //sideBarTopicListitemTableRawContent.value)
  return itemTableRawContent.value
  } catch{
    console.error('Error retrieving item data:', error)
    throw error
  }

  //sideBarTopicList'GetItem data',itemTableRawContent.value)
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
  //sideBarTopicList'Getsubtopic data',subTopicTableRawContent.value)
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
  //sideBarTopicList'GetTopic data',topicTableRawContent.value)
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

  topicDataToIterate.forEach(topicObj=>{
    const subTopicRelatedList = document.createElement('ul')
    subTopicRelatedList.className="topicAndSubTopicGroup"
    //const sideBarListItem = document.createElement('h4');
    const sidebarLinkText = document.createElement('a');
    subTopicRelatedList.setAttribute('id',"TOP-"+ topicObj.id);
    //sideBarListItem.setAttribute('id',topicObj.id)
    sidebarLinkText.textContent= topicObj.fields.Title;
    sidebarLinkText.className = "topicItem"
    //sidebarLinkText.style.color="rgba(0,0, 0, 1)";
    sidebarLinkText.value=topicObj.fields.Title;
    sidebarLinkText.onclick= function ( ){
      selectedSectionDataId = topicObj.id
      doSomething(topicObj.id);
      return false;
    };
    //subTopicRelatedList.appendChild(testTagLi);
    //sideBarListItem.appendChild(sidebarLinkText);
    //sideBarListItem.appendChild(subTopicRelatedList);
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
    //sideBarTopicList'GetSection data', sectionTableRawContent.value);
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
    headerLinkText.onclick= function ( ){
      selectedSectionDataId = sectionObj.id
      filterTopicData(selectedSectionDataId);
      filterSubTopicData(selectedSectionDataId);
      filterItemData(selectedSectionDataId);
      return false;
    };
    headerListItem.appendChild(headerLinkText);
    headerSectionList.appendChild(headerListItem);
  });
}
function processSubtopicData(subTopicData){
  let subTopicDataToIterate = subTopicData;
  subTopicDataToIterate.forEach((subTopicData) => {
    const relatedTopicData = topicData.find((topic)=> topic.fields.id === subTopicData.fields.topicLookupId);
    const parentDomId = "TOP-"+  relatedTopicData.id
    let subTopicListItem = document.createElement('li');
    let subTopicListItemLink = document.createElement('a');
    subTopicListItemLink.textContent=subTopicData.fields.Title;
    subTopicListItemLink.setAttribute('id',"SUBTOP-"+ subTopicData.id)
    const parentTopic = document.getElementById(parentDomId);
    subTopicListItem.appendChild(subTopicListItemLink);
    //TODO - Melhorar essa lógica de try catch
    try{
      parentTopic.appendChild(subTopicListItem);
    } catch(error){

    }
    //sideBarTopicList'parent ID',subTopicData.fields.topicLookupId);

  });
}
function processItemData(itemData){
  //Locate the main div for each item data content manipulation
  const itemContentDiv = document.getElementById('main');
  let SubTopicRelatedItem = subTopicData;
  let itemDataToIterate = itemData;

  if(selectedSectionDataId != null){
    //console.log(selectedSectionDataId)
    itemContentDiv.innerHTML='';

  } else{
    //console.log(' vazio');
    const InitialTopicDataToIterate = topicData.filter((topic)=> topic.fields.sectionLookupId === "1");
    const InitialSubTopicDataToIterate = subTopicData;
    const SubTopicRelatedItem = InitialSubTopicDataToIterate.filter(subtopic => {
      const topicIdReferenciado = subtopic.fields.topicLookupId;
      return InitialTopicDataToIterate.some(topic => topic.id ===topicIdReferenciado);
    })
    const InitialItemData = itemData;
    itemDataToIterate = InitialItemData.filter(item =>{
      const itemIdReferenciado = item.fields.subTopicLookupId;
      return SubTopicRelatedItem.some(subtopic => subtopic.id === itemIdReferenciado)
    })
    // const InitialTopicDataIds = InitialTopicDataToIterate.map(topicData => topicData.id );
    // const filteredTopicData = InitialTopicDataToIterate.filter(InitialTopicData => InitialTopicDataIds.includes(InitialTopicData.fields.topicLookupId))
    console.log('Items',itemDataToIterate)
    //console.log(InitialSubTopicDataToIterate)
  }
  itemDataToIterate.forEach((itemData)=>{
    const relatedSubTopicData = SubTopicRelatedItem.find((subTopic)=> subTopic.fields.id === itemData.fields.subTopicLookupId );
    //sideBarTopicList'related parent subtopic', "SUBTOP-"+ relatedSubTopicData.id);
    //Item ContainerDiv
    let container = document.createElement('div');
    container.setAttribute('id', "itemContainer" + "-"  + itemData.id);
    container.className = "itemDisplayContainer";
    //Item itemcontainerHeader
    let containerHeader = document.createElement('div');
    containerHeader.setAttribute('id', "itemContainerHeader"+ "-" + itemData.id);
    containerHeader.className = "itemContainerHeader";
    //Adiciona Container header ao container
    container.appendChild(containerHeader)
    // Item Container HeaderTitle
    let containerHeaderTitle = document.createElement('p');
    containerHeaderTitle.className = "containerHeader";
    containerHeaderTitle.setAttribute('id', "containerHeaderTitle"+ "-" + itemData.id );
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
    itemContentDiv.appendChild(container)


    // let itemDataDiv = document.createElement('div');
    // itemDataDiv.setAttribute('id', "IT-"+itemData.id);
    // let itemDataText = document.createElement('p');
    // itemDataText.textContent = itemData.fields.Title;
    // itemDataDiv.appendChild(itemDataText);
    // itemContentDiv.appendChild(itemDataDiv)
  })
  //sideBarTopicListitemData)
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
  const filteredTopicData = topicData.filter((topic) => topic.fields.sectionLookupId === sectionDataId)
  filteredTopicData.forEach((topicData) => {
    filteredSubTopicData = subTopicData.filter((subTopic) => subTopic.fields.topicLookupId === topicData.id)
    filteredSubTopicData.forEach((filteredSubTopic) => {
      sectionFilteredSubTopicData.push(filteredSubTopic)
    });
  });
  processSubtopicData(sectionFilteredSubTopicData)
}
function filterItemData(sectionDataId){
  let sectionFilteredSubTopicData = new Array();
  let sectionFiltereditemData = new Array();
  const filteredTopicData = topicData.filter((topic) => topic.fields.sectionLookupId === sectionDataId)
  filteredTopicData.forEach((topicData) => {
    filteredSubTopicData = subTopicData.filter((subTopic) => subTopic.fields.topicLookupId === topicData.id)
    //filter the subtopic
    filteredSubTopicData.forEach((filteredSubTopic) => {
      sectionFilteredSubTopicData.push(filteredSubTopic)
    });
  });
  sectionFilteredSubTopicData.forEach((filteredSubTopicData)=>{
    filteredItemData = itemData.filter((item)=> item.fields.subTopicLookupId === filteredSubTopicData.id)
    filteredItemData.forEach((filteredItem)=>{
      sectionFiltereditemData.push(filteredItem)
    })
  })
  processItemData(sectionFiltereditemData);
}









//TODO - Parse the JSON response
// Get the Json Response data
// Process Json response data
// Render Json Response data in page

/////// Dom element Manupilation
// var dropdown = document.getElementsByClassName("dropdown-btn");
// var i;

//     for (i = 0; i < dropdown.length; i++) {
//       dropdown[i].addEventListener("click", function() {
//         this.classList.toggle("active");
//         var dropdownContent = this.nextElementSibling;
//         if (dropdownContent.style.display === "flex") {
//           dropdownContent.style.display = "none";
//         } else {
//           dropdownContent.style.display = "flex";
//           dropdownContent.style.flexDirection = "column";
//         }
//       });
//     }
