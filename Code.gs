const ADD_ACTION = "ADD";
const REMOVE_ACTION = "REMOVE";
const GET_ACTION = "GET";

const MIN_ITEM_ID = 101;

const DIGEST_RECIPIENT_EMAIL = "somebody@somewhere.com";
const DIGEST_MAX_AGE = 90;

const ResponseTypes = {
  OK: "OK",
  ERROR: "ERROR"
}

function doPost(e) {
  
  // first check the request

  if(!requestIsValid_(e)) {
    console.error("Invalid request received");
    return createErrorResponse("Invalid request");
  }

  // get the action
  let action = getRequestData_(e, "action");

  let responseMsg = "";

  if(action === ADD_ACTION)
  {

    let desc = getRequestData_(e, "desc");
    let weight = getRequestData_(e, "weight");

    if(!desc) {
      return createErrorResponse("Invalid data");
    }

    if(!weight) {
      weight = ""; // it's optional
    }
    
    // add item will return the ID of the newly added item
    let newID = addItem(desc, weight);

    if(newID) {
      responseMsg = "Item " + newID + " added";
    } else {
      return createErrorResponse("Error: ITEM NOT ADDED");
    }

  } else if(action === REMOVE_ACTION || action === GET_ACTION) {

    let itemID = getRequestData_(e, "id");

    if(!itemID) {
      return createErrorResponse("Invalid data");
    }

    if(action === REMOVE_ACTION) {
      if(deleteItem(itemID)) {
        responseMsg = "Item " + itemID + " removed";
      } else {
        return createErrorResponse("Error: ITEM " + itemID + " NOT FOUND");
      }
    } else {
      // GET
      let getResult = getItem(itemID);
      if(getResult) {
        responseMsg = "Item " + getResult.id + ", " + getResult.desc;
        if(getResult.weight) {
          responseMsg += " (" + getResult.weight + ")";
        }
      } else {
        return createErrorResponse("Error: ITEM " + itemID + " NOT FOUND");
      }    
    }

  } else {
    return createErrorResponse("Invalid action");
  }

  console.log(responseMsg);
  return createResponse(responseMsg);
}

function createGenericResponse(responseType, responseMsg, responseData)
{
    let content = {
      type: responseType,
      message: responseMsg,
      data: responseData || ""
  }
  return ContentService.createTextOutput(JSON.stringify(content) ).setMimeType(ContentService.MimeType.JSON); 

}

function createResponse(responseMsg, responseData)
{
  return createGenericResponse(ResponseTypes.OK, responseMsg, responseData);

}

function createErrorResponse(errorMsg)
{
  return createGenericResponse(ResponseTypes.ERROR, errorMsg, null);
}

function addItem(itemDesc, weight) {

  let inventorySheet = getDataSheet_();

  // get today's date
  let formattedDate = Utilities.formatDate(
    new Date(), "GMT-5", "M/d/yyyy");

  // calculate a new ID
  let newID = getFirstAvailableID();

  if(newID < MIN_ITEM_ID) {
    // something went wrong
    return null;
  }

  // add the new row with the data
  inventorySheet.appendRow([newID,itemDesc, weight, formattedDate]);

  // find that last row so we can add the age formula
  let lastRow = inventorySheet.getLastRow();    
  let lastColumn = inventorySheet.getLastColumn();
  let lastCell = inventorySheet.getRange(lastRow, lastColumn);

  lastCell.setValue("=TODAY()-R[0]C[-1]");

  return newID;

}

function deleteItem(itemID) {

  let inventorySheet = getDataSheet_();

  let lastRow = inventorySheet.getLastRow();

  // look for a row with a matching ID
  
  let deleted = false;

  for (let i = lastRow; i > 0; i--) {
    let range = inventorySheet.getRange(i,1); 
    let data = range.getValue();
    if (data == itemID) {
      console.log(data);
      inventorySheet.deleteRow(i);
      deleted = true;
    }
  }

  return deleted;
}

function getItem(itemID) {
  let inventorySheet = getDataSheet_();

  let lastRow = inventorySheet.getLastRow();

  // look for a row with a matching ID
  
  let matched = -1;

  let range = inventorySheet.getRange(1, 1, lastRow, 5);
  let values = range.getValues();

  for(var row in values) {
    if(values[row][0] == itemID) {
      // Found it
      return { id: itemID, desc: values[row][1], weight: values[row][2] };
    }
  }

  // didn't find it
  return null;

}

// deprecated: returns the max item ID in use
function getMaxItemID() {

  let inventorySheet = getDataSheet_();

  // Our IDs are in column 1
  let column = 1; 
  let idsInUse = inventorySheet.getRange(2, column, 
    inventorySheet.getLastRow()).getValues();

  let maxInColumn = idsInUse.sort(
    function(a,b){return b-a}
  )[0][0];

  return maxInColumn;
}

function getFirstAvailableID() {

  let inventorySheet = getDataSheet_();

  // Our IDs are in column 1
  let column = 1; 
  let idsInUse = inventorySheet.getRange(2, column, 
    inventorySheet.getLastRow()).getValues().flat();

  let available = false;
  let newID = -1;
 
  // walk through looking for the first ID that isn't in use
  for(let i = MIN_ITEM_ID; !available; i++)
  {
    newID = i;
    available = !idsInUse.includes(i);
  }

  console.log("First available id is " + newID);
  return newID;
}

function sendOldItemDigest() {

  let oldItems = checkForOldItems_(DIGEST_MAX_AGE);
  if(oldItems && oldItems.length > 0) 
  {
    var template = HtmlService.createTemplateFromFile('emailTemplate');
    template.oldItems = oldItems.sort((a, b) => b.age - a.age );
    let content = template.evaluate().getContent();

    MailApp.sendEmail({
      to: DIGEST_RECIPIENT_EMAIL,
      subject: "Freezer Inventory Notification",
      htmlBody: content
    });
  }


}

function checkForOldItems_(age) {

  let inventorySheet = getDataSheet_();

  let lastRow = inventorySheet.getLastRow();


  // look for items older than the given age

  let range = inventorySheet.getRange(1, 1, lastRow, 5);
  let values = range.getValues();

  let oldItems = [];
  for(var row in values) {

    let thisItem = { id: values[row][0], desc: values[row][1], weight: values[row][2], added: values[row][3], age: values[row][4]}

    if(thisItem.age > age) {
      oldItems.push(thisItem);
    }
  }

  console.log(oldItems);

  return oldItems;
}

function getRequestData_(e, paramName) {
  let value = null;
  try {
    let data = JSON.parse(e.postData.contents);

    return data[paramName];

  } catch {
    console.log("Parameter " + paramName + " not found!");
  }

  return value;
}

function getDataSheet_() {
  return SpreadsheetApp
    .openById("THIS-IS-THE-ID")
    .getSheetByName('Sheet1');
}

function requestIsValid_(e) {
  // TODO: Do something here to add additional validation to your request, if desired
  // Otherwise, always return true.
  return true;
}



