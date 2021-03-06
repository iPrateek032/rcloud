/*
 Author: Prateek
 Description: This is a casperjs automated test script for showing that,After forking a notebook 
 belonging to some other user , the local user should be able to upload a file . Consequently, the contents should be visible in Assets div
 */
//Begin Tests

casper.test.begin("Upload a file to another user's notebook after forking it ", 8, function suite(test) {
    var x = require('casper').selectXPath;
    var github_username = casper.cli.options.username;
    var github_password = casper.cli.options.password;
    var rcloud_url = casper.cli.options.url;
    var functions = require(fs.absolute('basicfunctions'));
    var new_username = 'att-Musigma';
    var new_user_password = 'musigma12';
    var notebook_id, URL, before_forking ;
    var res1 = 'disabled';// to compare with res
    var fileName = "SampleFiles/PHONE.csv";
    var system = require('system');
    var currentFile = require('system').args[4];
    var curFilePath = fs.absolute(currentFile);
    var curFilePath = curFilePath.replace(currentFile, '');
    fileName = curFilePath + fileName;

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

    casper.then(function () {
        URL = this.getCurrentUrl();
    });

    // Getting the title of new Notebook
    casper.then(function () {
        before_forking = this.fetchText('#notebook-author');
        console.log("Notebook owner after forking = " + before_forking);
        initial_title = functions.notebookname(casper);
        this.echo("New Notebook title : " + initial_title);
    });

    //getting Notebook ID
    casper.viewport(1024, 768).then(function () {
        var temp1 = this.getCurrentUrl();
        notebookid = temp1.substring(41);
        this.echo("The Notebook Id: " + notebookid);
    });

    //loging out of RCloud
    casper.viewport(1366, 768).then(function () {
        test.comment('⌚️  Logging out of RCloud and GitHub to check shareable links for anonymous usere ...');
        this.wait(13000)
        // console.log('Logging out of RCloud');
        this.click("#rcloud-navbar-menu > li:nth-child(7) > a:nth-child(1)");
    });

    casper.then(function () {
        this.wait(7000);
        this.click('#main-div > p:nth-child(2) > a:nth-child(2)')
    });
    casper.then(function () {
        this.wait(7000);
        this.click('.btn');
        this.wait(4000);
    });

    casper.wait(3000);

    //Login to RCloud with new user
    casper.then(function () {
        test.comment('⌚️  Logging in with the another user credentials ...');
        this.thenOpen('http://127.0.0.1:8080/login.R');
        this.wait(13000);
        functions.login(casper, new_username, new_user_password, rcloud_url);
    });

    casper.then(function () {
        this.thenOpen(URL);
        this.wait(8000);
    });

    casper.then(function () {
        console.log('Checking whether user is able to upload files to notebook or not by fetching element info')
        var temp = this.getElementInfo('#upload-to-notebook').tag;
        this.echo(temp);
        var res = temp.substring(17, 25);

        this.echo(res);
        this.test.assertEquals(res1, res, "For unforked Notebooks file uploaad to notebook is disabled")
    })

    functions.fork(casper);

    casper.then(function () {
        casper.page.uploadFile("#file", fileName);
        console.log('Selecting a file');
    });

    casper.then(function () {
        this.wait(5000, function () {
            this.click(x(".//*[@id='upload-to-notebook']"));
            console.log("Clicking on Upload to notebook check box");
            this.click(x(".//*[@id='upload-submit']"));
            console.log("Clicking on Submit icon");
        });
    });

    casper.then(function () {
        this.wait(5000);
        this.waitUntilVisible(x('//*[contains(text(), "added")]'), function then() {
            console.log("File has been uploaded");
        });
    });

    casper.then(function () {
        console.log('Verifying whether the uploaded contentsa are present in Asset div or not');
        this.test.assertSelectorHasText(x(".//*[@id='asset-list']/li[3]/div"), 'PHONE.csv', 'After forking, file can be uploaded and Uploaded file is present in assets');
    });

    casper.run(function () {
        test.done();
    });
});