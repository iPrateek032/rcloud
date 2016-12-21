/*

 Author: Amith
 Description:This is a casperjs automation script for checking that the published flexdashboard.html notebook is visible to the anonymous user
 */


casper.test.begin("flexdashboard.html notebook opening as a Anonymous user", 8, function suite(test) {

    var x = require('casper').selectXPath;
    var github_username = casper.cli.options.username;
    var github_password = casper.cli.options.password;
    var rcloud_url = casper.cli.options.url;
    var functions = require(fs.absolute('basicfunctions.js'));
    var notebook_id;
    
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

    casper.thenOpen("http://127.0.0.1:8080/edit.html?notebook=4a091ff2d3169ec5584f2a881e9f4596", function () {
        this.wait(5000);
        functions.validation(casper);
    });

    casper.then(function () {
        this.wait(2000);
        functions.fork(casper);
    });
    
    casper.then( function () {
		this.wait(10000);
		var temp1 = this.getCurrentUrl();
        notebook_id = temp1.substring(41);
        this.echo("Notebook Id is: " + notebook_id);
        this.thenOpen(temp1);
        this.wait(10000);
	});
    
    casper.then(function () {
		this.click(x(".//*[@id='rcloud-navbar-menu']/li[3]/a/b"));
        console.log("Opening dropdown");
        this.click(x(".//*[@id='publish_notebook']/i"));
        console.log("Publishing Notebook");
        this.wait(4000);
    });
    
    casper.then(function () {
        this.click(x(".//*[@id='view-mode']/b"));
        console.log("Opening drop down to choose flexdashboard");
        this.wait(4000);
    });

    casper.then(function () {
        this.click(x(".//*[@id='view-type']/li[3]/a"));
        console.log("selecting flexdashboard option from the drop down");
        this.wait(1000);
    });

    casper.then( function () {
		var temp1 = this.getCurrentUrl();
        notebook_id = temp1.substring(41,61);
        this.echo("The Notebook Id: " + notebook_id);
	});

    //logging out of RCloud
    casper.viewport(1366, 768).then(function () {
        console.log('Logging out of RCloud');
        this.click("#rcloud-navbar-menu > li:nth-child(7) > a:nth-child(1)");
        this.wait(6000);
    });

    //Accessing flexdashboard.html for published notebook as anonymous user
    casper.then( function () {
		this.thenOpen("http://127.0.0.1:8080/shared.R/rcloud.flexdashboard/flexdashboard.html?notebook=" + notebook_id);
        this.wait(10000);
        this.echo('url loaded successfully now checking for the element');
        this.wait(10000);
        this.then(function () {
            this.test.assertExists('.chart-title', 'Required Element found hence "flexdashboard.html" loaded  successfully');
            console.log("Confirmed flexdashboard page opened"); 
        });
    });

    casper.wait(10000);

    casper.run(function () {
        test.done();
    });
});
    
