/*
 Author: Prateek
 Description:Delete a cell, navigate to another notebook, then navigate back, the deleted cell should remain deleted.
 */

//Begin Test
casper.test.begin("deleting the created Shell cell ", 8, function suite(test) {
    var x = require('casper').selectXPath;
    var github_username = casper.cli.options.username;
    var github_password = casper.cli.options.password;
    var rcloud_url = casper.cli.options.url;
    var functions = require(fs.absolute('basicfunctions'));
    var errors = [];
    var input_code = 'pwd';
    var temp;// To store the URL address

    casper.start(rcloud_url, function () {
        casper.page.injectJs('jquery-1.10.2.js');
    });
    casper.wait(10000);

    casper.viewport(1024, 768).then(function () {
        functions.login(casper, github_username, github_password, rcloud_url);
    });

    casper.viewport(1024, 768).then(function () {
        this.wait(9000);
        console.log("validating that the Main page has got loaded properly by detecting if some of its elements are visible. Here we are checking for Shareable Link and Logout options");
        functions.validation(casper);
        this.capture("./Images/59.2.1.png");
    });

    //create a new notebook
    functions.create_notebook(casper);

    //change the language from R to Shell
    casper.then(function(){
        this.mouse.click({ type: 'xpath' , path: ".//*[@id='prompt-area']/div[1]/div/select"});//x path for dropdown menu
        this.echo('clicking on dropdown menu');
        this.wait(2000);
    });

    //selecting Shell from the drop down menu
    casper.then(function(){
        this.evaluate(function() {
            var form = document.querySelector('.form-control');
            form.selectedIndex = 4;
            $(form).change();
        });
    });

    //create a new cell
    casper.then(function(){
        functions.addnewcell(casper);
        console.log('Shell Language is selected from the drop down menu');
    });

    //adding contents to the newly created Shell cells
    functions.addcontentstocell(casper, input_code);

    //verfying the results
    casper.then(function(){
        // functions.runall(casper);
        this.wait(4000);
        this.test.assertVisible(".r-result-div>pre>code",'Cell gets executed');
        console.log('Output is visible after cell gets executed');
    });

    //Deleting the created cell
    casper.then(function () {
        this.click(x(".//*[@id='part1.sh']/div[2]/div[1]/span[1]/span/input"));
        console.log("Selecting check box of the cell")        
        var z = casper.evaluate(function () {
            $('#selection-bar-delete').click();
        });
        console.log('Deleting Shell cell')
        this.wait(5000);
        this.test.assertDoesntExist('.left-indicator.cell-control', "Cell is not visible after Deleting");
    });


    casper.then(function(){
        temp = this.getCurrentUrl();// after deleting cell, fetching the URL and storing it in a variable temp
    });

    // Creating a new notebook
    functions.create_notebook(casper);

    //Switch back to the previous notebook and verify the cell gets deleted or not
    casper.wait(5000,function(){
        this.thenOpen(temp);
        this.wait(5000);
    });

    casper.then(function(){
        this.test.assertNotVisible(".cell-status.nonselectable", 'The deleted cell is not visible after navigating from anothe notebook');
    });


    //Registering to the page.errors actually not required but still if there are some errors found on the page it will gives us the details
    casper.on("page.error", function(msg, trace) {
        this.echo("Error:    " + msg, "ERROR");
        this.echo("file:     " + trace[0].file, "WARNING");
        this.echo("line:     " + trace[0].line, "WARNING");
        this.echo("function: " + trace[0]["function"], "WARNING");
        errors.push(msg);
    });

    casper.run(function() {
        if (errors.length > 0) {
            this.echo(errors.length + ' Javascript errors found', "WARNING");
        } else {
            this.echo(errors.length + ' Javascript errors found', "INFO");
        }
        test.done();
    });
});