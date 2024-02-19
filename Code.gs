const ADD_ACTION = "add";
const REMOVE_ACTION = "remove";
const MIN_ITEM_ID = 101;

function doPost(e) {
  
  // first check the request

  if(!requestIsValid_(e)) {
    console.error("Invalid request received");
    throw "Invalid request";
  }

  // get the action
  let action = getRequestData_(e, "action");

  let responseMsg = "";

  if(action === ADD_ACTION)
  {

    let desc = getRequestData_(e, "desc");
    let weight = getRequestData_(e, "weight");

    if(!desc) {
      throw "Invalid data";
    }

    if(!weight) {
      weight = ""; // it's optional
    }
    
    // add item will return the ID of the newly added item
    let newID = addItem(desc, weight);

    if(newID) {
      responseMsg = "Item " + newID + " added";
    } else {
      throw "Error: ITEM NOT ADDED";
    }

  } else if(action === REMOVE_ACTION) {

    let removeID = getRequestData_(e, "id");

    if(!removeID) {
      throw "Invalid data";
    }

    if(deleteItem(removeID)) {
      responseMsg = "Item " + removeID + " removed";
    } else {
      throw "Error: ITEM " + removeID + " NOT FOUND";
    }

  } else {
    throw "Invalid action";
  }

  console.log(responseMsg);
  return ContentService.createTextOutput(responseMsg);
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



