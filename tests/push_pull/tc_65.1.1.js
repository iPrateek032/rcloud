/*
 Author: Prateek 
 Description: Check whether user is able to pull the notebook using valid URL of another user
*/

//Begin Test
casper.test.begin("Using the valid Url of the another user", 5, function suite(test) {
    var x = require('casper').selectXPath;
    var github_username = casper.cli.options.username;
    var github_password = casper.cli.options.password;
    var rcloud_url = casper.cli.options.url;
    var functions = require(fs.absolute('basicfunctions'));
    var URL,Notebook_id, title, initial_title, notebook_id;

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
        test.assertDoesntExist(x(".//*[@id='part1.R']/div[2]/div[1]/span[1]/span/input"), "after creating no cell is present");
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

        casper.evaluate(function () {
            $('#pull-notebook-url').val("http://127.0.0.1:8080/edit.html?notebook=3652cac0e91622c2b8ffa1b2447c599c");
        });      
        console.log("Clicking on pull button");
        this.waitForSelector("div.modal-footer:nth-child(7) > span:nth-child(2)").thenClick("div.modal-footer:nth-child(7) > span:nth-child(2)");
    });

    casper.wait(8000);

    casper.then(function (){
        test.assertExist(x(".//*[@id='part1.Rmd']/div[3]/div[1]/div[1]/pre/code"), "User is able to pull the contents using URL")      
    });     

    casper.run(function () {
        test.done();
    });
}); 
        
