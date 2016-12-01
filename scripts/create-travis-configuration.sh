#!/bin/bash
echo "Current directory:"
rm -f conf/rcloud.conf
echo "Host: 127.0.0.1" >> conf/rcloud.conf
echo "Session.server: http://127.0.0.1:4301" >> conf/rcloud.conf
echo "github.client.id: 5b46f7cb315d069df2f8" >> conf/rcloud.conf
echo "github.client.secret: 650c0269fb791fd86f60466d54f1d31e505fd147" >> conf/rcloud.conf
echo "github.base.url: https://github.com/" >> conf/rcloud.conf
echo "github.api.url: https://api.github.com/" >> conf/rcloud.conf
echo "github.gist.url: https://gist.github.com/" >> conf/rcloud.conf
echo "rcs.engine: redis" >> conf/rcloud.conf
echo "rcs.redis.host: 127.0.0.1:6379" >> conf/rcloud.conf
echo "rcloud.alluser.addons: rcloud.viewer, rcloud.enviewer, rcloud.notebook.info" >> conf/rcloud.conf
echo "rcloud.languages: rcloud.r, rcloud.python, rcloud.rmarkdown, rcloud.sh" >> conf/rcloud.conf
echo "rcloud.menu.forum: 2000, edit, link, Forum, http://www.google.com/" >> conf/rcloud.conf
echo "rcloud.menu.about: 3000, edit | view, link, About, http://www.nytimes.com/" >> conf/rcloud.conf
echo "solr.host.port: 127.0.0.1:8983" >> conf/rcloud.conf
echo "solr.collection: rcloudnotebooks" >> conf/rcloud.conf
echo "solr.url: http://127.0.0.1:8983/solr/rcloudnotebooks" >> conf/rcloud.conf
echo "solr.page.size: 10" >> conf/rcloud.conf
