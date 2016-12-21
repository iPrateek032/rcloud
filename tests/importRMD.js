casper.test.begin("Import Notebook from File", 6, function suite(test) {

    var x = require('casper').selectXPath;
    var github_username = casper.cli.options.username;
    var github_password = casper.cli.options.password;
    var rcloud_url = casper.cli.options.url;
    var functions = require(fs.absolute('basicfunctions'));
    var fileName = 'SampleFiles/waste-lands.Rmd'; // File path directory
    var URL, counter, i,v, Notebook,flag, temp;
    var system = require('system')
    var currentFile = require('system').args[4];
    var curFilePath = fs.absolute(currentFile);
    var curFilePath = curFilePath.replace(currentFile, '');
    fileName = curFilePath + fileName;
    var title = "Waste Lands";

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
            this.click("#rmdImport");
            console.log("Clicking on import Rmarkdown file option form the dropdown");
            this.wait(3000);
        });

        //Selecting desired file from the directory
        casper.then(function () {
            this.evaluate(function (fileName) {
                __utils__.findOne('input[id="notebook-file-upload"]').setAttribute('value', fileName)
            }, {fileName: fileName});
            this.page.uploadFile('input[id="notebook-file-upload"]', fileName);
            console.log('Selecting a file');
        });

        casper.wait(5000);
    });


    casper.wait(2000).then(function () {
        this.test.assertExists("div.container:nth-child(2) > p:nth-child(2) > div:nth-child(1) > pre:nth-child(1)", "Notebook description is present");
        this.click("#import-notebook-file-dialog > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > span:nth-child(2)");
        console.log("Clicking on import button")
        this.wait(3000);
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
            temp = this.fetchText("ul.jqtree_common:nth-child(1) > li:nth-child(1) > ul:nth-child(2) > li:nth-child(1) > ul:nth-child(2) > li:nth-child("+ v +") > div:nth-child(1) > span:nth-child(1)");
            if (temp == title) {
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