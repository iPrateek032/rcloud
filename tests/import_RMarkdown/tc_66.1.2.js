/* Description: 
Check whether file description is displayed in modal window while selecting .Rmd
*/

//Begin test
casper.test.begin("Check for notebook description while importing .Rmd file from the local system", 6, function suite(test) {

    var x = require('casper').selectXPath;
    var github_username = casper.cli.options.username;
    var github_password = casper.cli.options.password;
    var rcloud_url = casper.cli.options.url;
    var functions = require(fs.absolute('basicfunctions'));
    var fileName1 = 'SampleFiles/waste-lands.Rmd'; // File path directory
    var URL, counter, i,v, Notebook,flag;
    var system = require('system')
    var currentFile = require('system').args[4];
    var curFilePath = fs.absolute(currentFile);
    var curFilePath = curFilePath.replace(currentFile, '');
    fileName1 = curFilePath + fileName1;
    var title = "Waste Lands";
    var temp, temp1, res, str;

    casper.start(rcloud_url, function () {
        functions.inject_jquery(casper);
    });

    casper.wait(10000);

    //Login to GitHub
    casper.viewport(1024, 768).then(function () {
        functions.login(casper, github_username, github_password, rcloud_url);
    });

    //Validation for RCLoud page
    casper.wait(4000).then(function () {
        this.wait(3000);
        console.log("validating that the Main page has got loaded properly by detecting if some of its elements are visible. Here we are checking for Shareable Link and Logout options");
        functions.validation(casper);
    });

    casper.then(function (){
        URL = (this.getCurrentUrl());
    })

    casper.then(function (){
        this.thenOpen(URL);
        this.wait(5000);
    });

    //Importing Rmarkdown file 
    casper.wait(2000).then(function () {
        //Opening advanced dropdown option
        casper.then(function () {
            functions.open_advanceddiv(casper);
            // this.click("#rmdImport");
            casper.click(x('//*[text()="Import Rmarkdown file"]'));//Import
            console.log("Clicking on import Rmarkdown file option form the dropdown");
            this.wait(3000);
        });

        //Selecting desired file from the directory
        casper.then(function () {
            this.evaluate(function (fileName1) {
                __utils__.findOne('input[id="notebook-file-upload"]').setAttribute('value', fileName1)
            }, {fileName: fileName1});
            this.page.uploadFile('input[id="notebook-file-upload"]', fileName1);
            console.log('Selecting a file');
        });

        casper.wait(5000);
    });


    casper.wait(2000).then(function () {
        this.test.assertExists("div.container:nth-child(2) > p:nth-child(2) > div:nth-child(1) > pre:nth-child(1)", "Notebook description is present");
        casper.click(x('//*[text()="Import"]'));
        console.log("Clicking on import button")
        this.wait(3000);
    });

    casper.then(function (){
        this.thenOpen(URL);
        this.wait(8000);
    });

    casper.then(function (){
        flag = 0;//to check if notebook has been found
        var counter = 0;//counts the number of notebooks
        do
        {
            counter = counter + 1;
            
        } while (this.visible("ul.jqtree_common:nth-child(1) > li:nth-child(1) > ul:nth-child(2) > li:nth-child(1) > ul:nth-child(2) > li:nth-child("+ counter +") > div:nth-child(1) > span:nth-child(1)"));
        counter = counter + 1;
        for (v = 1; v <= counter; v++) {
            this.wait(2000);
            temp1 = this.fetchText("ul.jqtree_common:nth-child(1) > li:nth-child(1) > ul:nth-child(2) > li:nth-child(1) > ul:nth-child(2) > li:nth-child("+ v +") > div:nth-child(1) > span:nth-child(1)");
            if (temp1 == title) {
                flag = 1;
                break;
            }
        }//for closes
        this.test.assertEquals(flag, 1, "Located the imported Rmarkdown notebook");        
    });

    casper.then(function(){
        if (flag == 1) {
            this.test.assertEquals(flag, 1, "Import Notebook from File, Notebook with title " + title + " is PRESENT under Notebooks tree");
        }
        else {
            this.test.assertEquals(flag, 0, "Import Notebook from File, Notebook with title " + title + " is ABSENT under Notebooks tree");
        }
    });
    
    casper.run(function () {
        test.done();
    });
});