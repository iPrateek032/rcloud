#Session Key Server Setup
cd services
git clone https://github.com/s-u/SessionKeyServer.git
cd SessionKeyServer
sudo make
cd /home/travis/build/iPrateek032/rcloud/services

sudo sed -i -e '2iROOT=/home/travis/build/iPrateek032/rcloud\' rcloud-sks
sudo sh rcloud-sks &

Rscript -e 'chooseCRANmirror(ind=81)'
Rscript -e 'install.packages("XML", repos=c("http://RForge.net", "http://R.research.att.com"), type="source")'
Rscript -e 'install.packages("rcloud.dcplot", repos="http://rforge.net")'
Rscript -e 'install.packages("rpython2", repos="http://rforge.net")'
Rscript -e 'install.packages("xml2", repos=c("http://RForge.net", "http://R.research.att.com"), type="source")'

cd /home/travis/build/iPrateek032/rcloud/tests
#sudo apt-get install xvfb
pwd
echo "Executing testscripts from $1"
sudo xvfb-run -a casperjs test --ssl-protocol=any --engine=slimerjs $1 --username=RCloudatt --password=musigma12 --url=http://127.0.0.1:8080/login.R --xunit=Reports/report.xml
# sudo xvfb-run -a casperjs test --ssl-protocol=any --engine=slimerjs 2-3Test/*.js --username=iPrateek032 --password=musigma12 --url=http://127.0.0.1:8080/login.R --xunit=Reports/report.xml

echo -e "Starting to update AUTO_IMG\n"
# change directory to Travis Home
cd $Home

#Making a new directory in travis home and open it
echo -e "Creating Images folder\n"
mkdir Images
sudo chmod 777 Images
echo -e "Opening Images floder\n"
cd Images
pwd

#copying file/directory from /home/travis/build/iPrateek032/rcloud/tests to the newly created Images directory
echo -e "copying file/directory from /home/travis/build/iPrateek032/rcloud/tests to the newly created Images directory\n"
cp -R /home/travis/build/iPrateek032/rcloud/tests/Images/*.png $HOME/Images/
ls
sudo chmod 777 *

#go to travis home directory and configure git
cd $HOME
git config --global user.email "travis@travis-ci.org"
git config --global user.name "travis"


#using token clone the other branch(here its AUTO_IMG) in travis home directory
git clone --quiet --branch=AUTO_IMG https://${GH_TOKEN}@github.com/iPrateek032/rcloud.git  AUTO_IMG > /dev/null

#Go the the newly cloned branch(AUTO_IMG)
cd AUTO_IMG
#Now copy the images from Travis home directory to the newly cloned branch directory
cp -Rf $HOME/Images/* ./tests/Images/

#add, commit and push files to the cloned branch (eg: "AUTO_IMG" branch)
git add -f .
git commit -m "Travis build $TRAVIS_BUILD_NUMBER pushed to AUTO_IMG"
git push https://iPrateek032:musigma12@github.com/iPrateek032/rcloud.git AUTO_IMG > /dev/null
# git push -fq origin AUTO_IMG > /dev/null
echo -e "The test images are uploaded \n"

#Changing the directory where parse.R script prsent and run that script
cd /home/travis/build/iPrateek032/rcloud/tests
Rscript parse.R

if [ $? -eq 0 ]
then
  echo "Build Pass"
else
  echo "Build Fail"
exit 1
fi


# #!/usr/bin/bash

# sudo libreoffice --headless --convert-to csv Details.ods --outdir 

# INPUT_FILE='Details.csv'
# i=0
# IFS=','
# while read U P T C
# do 
# U1[$i]=$U
# P1[$i]=$P
# T1[$i]=$T
# Choice[$i]=$C
# i=$((i+1))
# done <$INPUT_FILE

# echo "username: $U1"
# echo "password: $P1"
# counter=0
# j=0
# while [ $j -lt $i ]
# do
# if [ ${Choice[j]} == "TRUE" ]
# then
# 	echo "Current Testsuite: ${T1[j]}"
# 	sudo casperjs test --engine=slimerjs ${T1[j]}/*.js --username=$U1 --password=$P1 --url=http://127.0.0.1:8080/login.R --xunit=Reports/${T1[j]}.xml
# 	counter=$((counter+1))
# fi
# j=$((j+1));
# done
# if [ $counter == 0 ] 
# then
# 	echo "No Testsuite selected....!!!! Please Select the testsuites from Details1.ods file...!!!! "
# fi