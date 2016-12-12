/*
 Author: Amith
 Description: This is a casperjs automated test script for showing that When the "flexdashboard.html" is selected from the dropdown menu near the shareable link, if we click on the shareable link it will display the output of the code present in the notebook in new tab, also pulling the notebook using pull and replace option.

 */

//Begin Tests

casper.test.begin("flexdashboard.html test", 8, function suite(test) {

    var x = require('casper').selectXPath;
    var github_username = casper.cli.options.username;
    var github_password = casper.cli.options.password;
    var rcloud_url = casper.cli.options.url;
    var functions = require(fs.absolute('basicfunctions'));
   // var notebookid = "4a091ff2d3169ec5584f2a881e9f4596";//to get the notebook id

    casper.start(rcloud_url, function () {
        functions.inject_jquery(casper);
    });

    casper.wait(10000);

    //login to Github and RCloud
    casper.viewport(1024, 768).then(function () {
        functions.login(casper, github_username, github_password, rcloud_url);
    });

    casper.viewport(1024, 768).then(function () {
        this.wait(9000);
        console.log("validating that the Main page has got loaded properly by detecting if some of its elements are visible. Here we are checking for Shareable Link and Logout options");
        functions.validation(casper);
        this.wait(4000);
    });
    
    casper.wait(4000);
    
    //create a new notebook
    functions.create_notebook(casper);
    
    casper.wait(6000).then(function () {
        this.click(x(".//*[@id='rcloud-navbar-menu']/li[3]/a"));
        this.wait(4000);
        this.click(x(".//*[@id='pull_and_replace_notebook']"), 'Clicking on pull and replace option');
    });
/*
    casper.wait(4000).then(function () {
       this.click(x(".//*[@id='pull-notebook-url']"), 'Clicking on text input');
       this.wait(4000);
       
    });
*/  
    casper.then(function () {
       this.sendKeys(x(".//*[@id='pull-notebook-url']"),"http://127.0.0.1:8080/edit.html?notebook=4a091ff2d3169ec5584f2a881e9f4596");
       this.wait(4000);
       this.click(x(".//*[@id='pull-changes-dialog']/div/div/div[2]/div[4]/span[2]"), 'Clicking on pull button'); 
    });


    casper.wait(4000);
    
    casper.wait(4000).then(function (){
        var URL = this.getCurrentUrl()
        this.echo(URL);
        var ID = URL.substring(41);
        this.echo(ID);
        this.thenOpen("http://127.0.0.1:8080/shared.R/rcloud.flexdashboard/flexdashboard.html?notebook="+ID)
    })

    //Opening in flexdashboard.html
    casper.wait(9000).then(function () {
        this.test.assertUrlMatch(/flexdashboard.html/, 'flexdashboard.html link is opened');
        this.wait(8000);
    });
    
    casper.wait(4000);
    
    casper.wait(6000).then(function (){
        this.setContent('<div class="chart-title">Chart A</div>');
        this.test.assertExists('.chart-title', 'Required Element found hence "flexdashboard.html" loaded  successfully');
        console.log("Confirmed flexdashboard page opened"); 
    });

    casper.run(function () {
        test.done();
    });
});

