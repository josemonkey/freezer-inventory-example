# Freezer Inventory Automation Example

This example shows how to use a a Siri Shortcut, a Google App Script, and a Google Sheets spreadsheet to setup a home automation workflow that will allow you to manage items in a freezer inventory.

**NOTE: This example hasn't been thoroughly tested and is provided AS-IS. Use at your own risk.**

## Description

This project allows you to use a Siri Shortcut to add / remove items from a spreadsheet that is your "freezer inventory." When adding items, you provide a description and an (optional) weight for the item. It then automatically adds a row to the spreadsheet with the current date and assigns the item a numeric ID.

This ID should be recorded - I suggest by writing on the item with a marker. 

Later, to remove an item, you run the shortcut again and select the "remove" option and enter the ID of the item to remove. The shortcut will then try to find the item and ask you to confirm it's the right one before removing it. That's all!

Plus, I've added the option to set up a regular email digest that will let you know when you have items in your freezer that are getting old.

## Setup

### Create the Spreadsheet

1. Create a Google Sheet spreadsheet to store the inventory items. Mine has the following columns:

	ID  | Description | Weight | Date Added | Age (Days)
	--- | ----------- | ------ | ---------- | ----------
	101 | Meatballs   | 1 lb   | 1/14/2024  | 10
	102 | Wings       | 4 lb   | 1/15/2024  | 9

  
2. Get the ID of the Google Sheet. You will find it in the URL that you use to access the spreadsheet.

	https://docs.google.com/spreadsheets/d/**THIS-IS-THE-ID**/edit#gid=0
	
	You will need this ID in a few minutes.
	
### Set up the Google App Script Webapp
	
1. Go to the [Google App Script](https://script.google.com) site and click "Create New Project" and name it something appropriate like "Freezer Inventory Webapp."
2. The interface will show you a Code.gs file that contains placeholder code. Replace everything in that file with the code from [the Code.gs file in this project](https://github.com/josemonkey/freezer-inventory-example/blob/main/Code.gs).
3. Find the function called getDataSheet_() near the bottom of the file and replace "THIS-IS-THE-ID" with the spreadsheet ID from the previous step.

	```
	function getDataSheet_() {
  		return SpreadsheetApp
    		.openById("THIS-IS-THE-ID")
    		.getSheetByName('Sheet1');
	}
	```
	
### Run the Script to Grant Permissions

1. Use the App Script interface to execute the doPost() function. It will generate errors since it's not being invoked correctly (by passing parameters in a web request), but this step should be done simply to get it to ask you whether or not you wish to grant the app script access to the spreadsheet. 

	![Auth Required Screenshot](https://github.com/josemonkey/freezer-inventory-example/blob/b04122c464d7c4758214e93999ee569eb51c78e2/docs/Screenshot%20-%20app%20script%20permissions.png)
	
	Read everything carefully, and agree to everything to grant access. (Or, if you're not comfortable, don't and stop here!)
	
2. The function should run and produce errors - probably something like "Invalid action." This is normal.

### Deploy the Script as a Webapp

In order for this script to be able to listen in to incoming web requests (like from your Siri Shortcut), you will need to deploy it as a webapp.

1. In the app script window, click "Deploy" in the upper right corner and select "New Deployment."
2. Under "Select Type," choose "Web App."
3. Enter a description and under "Who has access" select "Anyone." 

	**NOTE: This means anyone can execute this webapp if they know the URL. Do not do this if you're not ok with that.**  
	
	![Deployment Screenshot](https://github.com/josemonkey/freezer-inventory-example/blob/b04122c464d7c4758214e93999ee569eb51c78e2/docs/Screenshot%20-%20new%20deployment.png)

	
4. You will now need to grant the webapp access as well. Again, confirm this access if you're ok with that. (Or don't! You can stop at any time! 🤪)

    ![Deployment Permissions Screenshot](https://github.com/josemonkey/freezer-inventory-example/blob/b04122c464d7c4758214e93999ee569eb51c78e2/docs/Screenshot%20-%20give%20access.png)

5.  Once it is deployed, you will get a confirmation screen that tells you the webapp ID and URL. We will need this for our Siri Shortcut. Copy the URL and hold on to it.

	![Post Deployment Screenshot](https://github.com/josemonkey/freezer-inventory-example/blob/24e2403cbfbceab4d89d4e99174e8daa51fa9033/docs/Screenshot%20-%20Post%20deplyoment%20info.png)


### Set up your Siri Shortcut
I haven't shared the shortcut to iCloud, so you're going to need to configure this part manually.

Here is a screen shot. (It's from the MacOS interface, but you can do it on your phone - it's essentially the same.)

![Siri Shortcut Screenshot](https://raw.githubusercontent.com/josemonkey/freezer-inventory-example/main/docs/Screenshot%20-%20Siri%20Shortcut.png)

**NOTE: You must change the text "YOUR\_WEBAPP\_ID" to the web app ID that you generated in the last step!**

### Run the shortcut!

That's it! Try running the shortcut to add something to the inventory. You should get a confirmation message with the new item ID. You can then verify that you see it in the spreadsheet.

You can also remove the item you just added by running the shortcut again and selecting the "remove" option. When you do, enter the ID it gave you when you added the item.

## Email Digest Setup (optional)

Recently, user @RichardTheuws suggested that I add functionality to send automatic emails about items that are older than a certain date. (Great idea!) They went ahead and implemented a version of this on their own, and I appreciate the suggestion and the reference code they shared. 

I have implemented something inspired by that. I have now implemented a function that will send an email digest on a schedule that looks like this:

![Email Example](https://raw.githubusercontent.com/josemonkey/freezer-inventory-example/main/docs/Email%20Example.png)

To get this to work, you need to configure an app script "trigger" to run on a schedule of your choosing. You also need to configure a few variables in the code to tell it who to email and how old you consider old enough to warrant a reminder. 

### Set your Variables
Edit the Code.gs file to set the following variables:

- Return value of getDigestEmailRecipient\_() - the email address of the recipient or a comma-separated list of email addresses to be the recipients is returned by the function getDigestEmailRecipient\_(). I put this value here because it's a private function that shouldn't be visibile to clients under any circumstance.  
- DIGEST\_MAX\_AGE - How many days old something should be before you are notified about it

### Configure the email template
Copy and paste the code from [the emailTemplate.html file from this project](https://github.com/josemonkey/freezer-inventory-example/blob/main/emailTemplate.html) into a file of the same name in your app script project. (It should live next to Code.gs.) Tweak the content of this file as desired.

### Test the digest function
Try using the "Run" method to execute the sendOldItemDigest() to make sure it does what you want it to do. If it doesn't send you an email... idk, try debugging your setup. Make sure you actually have items old enough to trigger an email, or no email will be sent!

### Set up the Trigger
In your app script project, create a trigger to run the function sendOldItemDigest() and configure it for whatever schedule you want to use. I chose a weekly schedule.

![Trigger Configuration Screenshot](https://raw.githubusercontent.com/josemonkey/freezer-inventory-example/main/docs/Screenshot%20-%20Trigger%20Configuration.png)

Once you do that, you should get emailed when you have items that are older than your configured cutoff.

## Closing Thoughts

Obviously, this example can be adapted to similar applications easily by changing the spreadsheet structure, app script code, and Siri Shortcut. Have fun with it!

### Using an NFC tag to launch the shortcut

If you saw my video about this, you know that I used an NFC tag to launch the shortcut. That's totally not required, but can be done by simply setting up an auotmation in Siri Shortcuts to [run your shortcut when a specific NFC tag is detected](https://letmegooglethat.com/?q=run+siri+shortcut+when+nfc+detected)

### Note about hardening

As you may have noticed, this is not the most secure approach in the world. Anyone who learns the URL to your webapp could affect the data in your spreadsheet. 

I recommend implementing logic in the requestIsValid_() function to do something additional here to validate that the request is legitimate. I defer to you to decide what you're comfortable with here. 

## Credits & Acknowledgements

As I said in my [original TikTok video about this](https://www.tiktok.com/@the_josemonkey/video/7333726337800178975), I was inspired to do this by things I saw [Brett ⍩ | Tech & Smart Home](https://www.tiktok.com/@b_turner50) doing in his videos. Check out his stuff.

Also, I must give a great deal of credit to a Reddit user named [lautarooo](https://www.reddit.com/user/lautarooo/) who posted [a very similar example several years ago](https://www.reddit.com/r/shortcuts/comments/aafe5e/update_a_google_sheet_with_your_expenses/) that helped me quite a lot as I was working on this. 

## DISCLAIMER

Like I said a bunch of times - this is an example, your mileage may vary, it's provided as-is, use at your own risk, etc. Don't break anything.