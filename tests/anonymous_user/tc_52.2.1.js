/*
 Author: Prateek
 Description:This is a casperjs automation script for checking that the published mini.html notebook is visible to the anonymous user
 */

casper.test.begin("Mini.html notebook opening as a Anonymous user", 4, function suite(test) {

    var x = require('casper').selectXPath;
    var github_username = casper.cli.options.username;
    var github_password = casper.cli.options.password;
    var rcloud_url = casper.cli.options.url;
    var functions = require(fs.absolute('basicfunctions.js'));
    var notebook_id, before_url;

    casper.start(rcloud_url, function () {
        functions.inject_jquery(casper);
    });

    casper.wait(10000);

    //Login to GitHub and RCloud
    casper.viewport(1024, 768).then(function () {
        functions.login(casper, github_username, github_password, rcloud_url);
    });

    //Validating for RCloud main page to be loaded
    casper.viewport(1024, 768).then(function () {
        this.wait(9000);
        console.log("validating that the Main page has got loaded properly by detecting if some of its elements are visible. Here we are checking for Shareable Link and Logout options");
        functions.validation(casper);
    });

    //create a new notebook
    functions.create_notebook(casper);

    //Pulling the mini notebook of another user's
    casper.then(function () {
        this.click("li.dropdown:nth-child(3) > a:nth-child(1)");
        this.evaluate(function () {
            $('#pull_and_replace_notebook').click();
        });
        this.echo('opened pull and replcae dialog box');
        this.wait(2000);
    });

    //entering url
    casper.then(function(){
        casper.evaluate(function () {
            $('#pull-notebook-url').val("http://127.0.0.1:8080/edit.html?notebook=04233fe343df889fe40574a62d8c1a12");
        });      
        console.log("Clicking on pull button");
        this.waitForSelector("div.modal-footer:nth-child(7) > span:nth-child(2)").thenClick("div.modal-footer:nth-child(7) > span:nth-child(2)");
    }); 

    casper.wait(3000).then(function (){
        URL = this.getCurrentUrl();
        this.echo(URL);
        notebook_id = URL.substring(41);
        this.echo("after pulling: " + notebook_id);
    });

    casper.then(function (){
        this.reload();
        this.wait(12000);
    });
    functions.runall(casper);

    // casper.wait(10000).then(function (){
    //     functions.create_notebook(casper);
    //     functions.addnewcell(casper);
    //     functions.addcontentstocell(casper, "rcloud.publish.notebook('"+notebook_id+"')");
    // })

    //publishing the notebook
    casper.then(function (){
        functions.open_advanceddiv(casper);
        this.evaluate(function () {
                    $('.icon-check-empty').click();
                });
    });


    //logging out of RCloud
    casper.viewport(1366, 768).then(function () {
        console.log('Logging out of RCloud');
        this.click("#rcloud-navbar-menu > li:nth-child(7) > a:nth-child(1)");
        this.wait(6000);
    });

    //Opening in mini.html as anonymous user
    casper.then(function (){
        casper.page = casper.newPage();
        casper.viewport(1024, 768).open("http://127.0.0.1:8080/mini.html?notebook=" + notebook_id).then(function () {
            this.wait(10000);
            this.echo('url loaded successfully now checking for the element');
            this.wait(10000);
            this.then(function () {
                this.test.assertExists("#SWvL_0_0 > div:nth-child(1) > strong:nth-child(1)", 'Required element found hence "Mini.html" notebook opened successfully');
                this.wait(2000);
            });
        });
    });

    casper.run(function () {
        test.done();
    });
});