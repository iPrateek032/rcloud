/*
 Author: Prateek 
 Description: Check whether user is able to pull the notebook using valid URL of another user
*/

//Begin Test
casper.test.begin("Using the valid Url of the another user", function suite(test) {
    var x = require('casper').selectXPath;
    var github_username = casper.cli.options.username;
    var github_password = casper.cli.options.password;
    var rcloud_url = casper.cli.options.url;
    var functions = require(fs.absolute('basicfunctions'));
    var URL,Notebook_id, title;
    var Notebook_ID = "ff92d6fd2695772db862ff34b5faf377";
    var NB = 'Notebook id';

    casper.start(rcloud_url, function () {
        functions.inject_jquery(casper);
    });
    casper.wait(10000);

    casper.viewport(1024, 768).then(function () {
        functions.login(casper, github_username, github_password, rcloud_url);
    });

    casper.viewport(1024, 768).then(function () {
        this.wait(9000);
        console.log("validating that the Main page has got loaded properly by detecting if some of its elements are visible. Here we are checking for Shareable Link and Logout options");
        functions.validation(casper);
    });

    //Create a new Notebook.
    functions.create_notebook(casper);

    // Getting the title of new Notebook
    casper.then(function () {
        title = functions.notebookname(casper);
        this.echo("New Notebook title : " + title);
        this.wait(3000);
    });

    casper.then(function () {
        this.click("li.dropdown:nth-child(3) > a:nth-child(1)");
        this.evaluate(function () {
            $('#pull_and_replace_notebook').click();
        });
        this.echo('opened pull and replcae dialog box');
        this.wait(2000);
    });

    // change the URL to Notebook ID as source
    casper.then(function(){
        this.mouse.click(x(".//*[@id='pull-changes-by']"));//x path for dropdown menu
        console.log("Clicking on dropdown to select Notebook_ID as source to pull");
        this.wait(2000);
    });
    
    //selecting Notebook ID from the drop down menu
    casper.then(function(){
        var index = 'id';
        this.evaluate(function(index) {
            document.querySelector('select#pull-changes-by').value=index;
        }, index);
        console.log('Notebook ID is selected from the drop down menu');
    });

    casper.then(function (){
        this.click(x(".//*[@id='pull-changes-by']/option[2]"));
    })

    casper.wait(5000);

    casper.wait(6000).then(function(){
        this.click("#pull-notebook-id");
        this.sendKeys("#pull-notebook-url", "ff92d6fd2695772db862ff34b5faf377");    
        console.log("Clicking on pull button");
        this.waitForSelector("div.modal-footer:nth-child(7) > span:nth-child(2)").thenClick("div.modal-footer:nth-child(7) > span:nth-child(2)");
    });

    casper.run(function () {
        test.done();
    });
}); 
        
