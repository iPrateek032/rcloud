/*
 Author: Prateek 
 Description: Check whether users is able to pull  the existing notebook contents or not
*/

//Begin Test
casper.test.begin("Pulling the notebook contents of another user's encrypted notebook using URL as source ", 4, function suite(test) {
    var x = require('casper').selectXPath;
    var github_username = casper.cli.options.username;
    var github_password = casper.cli.options.password;
    var rcloud_url = casper.cli.options.url;
    var functions = require(fs.absolute('basicfunctions'));
    var URL, title;
    var pull_url = 'http://127.0.0.1:8080/edit.html?notebook=840b87841d6beb3a630727a4c4b48eb9';//ENcrypted notebook URL of another user

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

    casper.then(function (){
        URL = this.getCurrentUrl();
        console.log("Current loaded notebook URL is :" + URL)
    });

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

    casper.then(function(){  
        this.click("#pull-notebook-url");
        this.sendKeys("#pull-notebook-url", pull_url);
        console.log("entering URL");
        console.log("Clicking on pull button");
        this.waitForSelector("div.modal-footer:nth-child(7) > span:nth-child(2)").thenClick("div.modal-footer:nth-child(7) > span:nth-child(2)");
    });

    casper.wait(2000);

    casper.then(function (){
        test.assertSelectorHasText("#pull-error", "checksum mismatch", "'Err:rcloud.get.notebook 840b87841d6beb3a630727a4c4b48eb9: Bad credentials (401)'. is displayed")
    });     

    casper.run(function () {
        test.done();
    });
}); 
        
