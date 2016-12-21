casper.test.begin("Exporting Rmarkdown file to local system", 5, function suite(test) {

    var x = require('casper').selectXPath;
    var github_username = casper.cli.options.username;
    var github_password = casper.cli.options.password;
    var rcloud_url = casper.cli.options.url;
    var functions = require(fs.absolute('basicfunctions'));
    var fileName = 'SampleFiles/IRIS.csv'; // File path directory
    var URL, counter, i, v, Notebook, flag, temp;
    var system = require('system');
    var currentFile = require('system').args[4];
    var curFilePath = fs.absolute(currentFile);
    var curFilePath = curFilePath.replace(currentFile, '');
    fileName = curFilePath + fileName;

    casper.start(rcloud_url, function () {
        functions.inject_jquery(casper);
    });
    casper.on('resource.requested', function(requestData, resource) { console.log(decodeURI(requestData.url)); });

    casper.wait(10000);

    //Login to GitHub
    casper.viewport(1024, 768).then(function () {
        functions.login(casper, github_username, github_password, rcloud_url);
    });

    // casper.wait(4000).then(function () {

    // });

    //Validation for RCLoud page
    casper.wait(4000).then(function () {
        this.wait(3000);
        console.log("validating that the Main page has got loaded properly by detecting if some of its elements are visible. Here we are checking for Shareable Link and Logout options");
        functions.validation(casper);
    });

    casper.then(function () {
        URL = (this.getCurrentUrl());
    });

    functions.create_notebook(casper);

    casper.then(function () {
        this.click("li.dropdown:nth-child(3) > a:nth-child(1)");
        this.evaluate(function () {
            $('#pull_and_replace_notebook').click();
        });
        this.echo('opened pull and replcae dialog box');
        this.wait(2000);
    });

    casper.then(function () {

        casper.evaluate(function () {
            $('#pull-notebook-url').val("http://127.0.0.1:8080/edit.html?notebook=5b027a5e09a5dd3654e35396a827552c");
        });
        console.log("Clicking on pull button");
        this.waitForSelector("div.modal-footer:nth-child(7) > span:nth-child(2)").thenClick("div.modal-footer:nth-child(7) > span:nth-child(2)");
    });

    casper.wait(8000);

    casper.then(function () {
        test.assertExist(x(".//*[@id='part1.md']/div[3]/div[1]/div[1]/pre/code"), "User is able to pull the contents using URL")
    });


    casper.then(function () {
        this.thenOpen(URL);
        this.wait(5000);
    });

    // casper.then(function (){
    //     Notebook = this.fetchText(".jqtree-selected > div:nth-child(1) > span:nth-child(1)");
    //     this.page.onFileDownload = function(status){console.log('onFileDownload(' + status + ')');
    //     //SYSTEM WILL DETECT THE DOWNLOAD, BUT YOU WILL HAVE TO NAME THE FILE BY YOURSLEF!!
    //     return Notebook+".Rmd"; };
    // });


    // casper.on('resource.received', function(resource) {
    //     if (resource.stage !== "end") {
    //         console.log("resource.stage !== 'end'");
    //         return;
    //     }
    //     if (resource.url.indexOf(Notebook+'.Rmd') > -1) {
    //         console.log("Downloading md file");
    //         this.download(resource.url, file+'.md');
    //     }
    // });

    casper.then(function(){
        functions.open_advanceddiv(casper);
        this.echo("Clicking on export button")
        casper.setFilter("page.prompt", function (msg, currentValue) {
            if (msg === "You have choosen to open:") {
                return true;
            }
        });
        this.click("#rmdExport");
    });


    // casper.then(function(){
    //     // var ev = document.createEvent('KeyboardEvent');
    //     // // Send key '13' (= enter)
    //     // ev.initKeyEvent(
    //     //     'keydown', true, true, window, false, false, false, false, 13, 0);
    //     // document.body.dispatchEvent(ev);
    //     var jszip = require('./assets/js/jszip.js');
    //     base64contents = this.getElementAttribute('#a_download_notice', 'data');
    //     var data = jszip.base64.decode(base64contents) ;
    //     require('fs').write('template.zip', data, 'wb');
    // });


    casper.then(function () {
        var temp = this.fetchText("#session-info-panel");
        this.echo(temp);//functions.notebookname(casper);
    });

    casper.wait(10000);

    casper.run(function () {
        test.done();
    });
});
