var editor = function () {
    // major key is sort_order and minor key is name (label)
    var ordering = {
        HEADER: 0, // like [New Notebook]
        NOTEBOOK: 1,
        SUBFOLDER: 2
    };

    // "private members"
    var this_user = null,
        $tree = undefined,
        this_config = undefined;

    function compare_nodes(a, b) {
        var so = a.sort_order-b.sort_order;
        if(so) return so;
        else {
            var alab = a.name || a.label, blab = b.name || b.label;
            // haha horrible special case to sort "Notebook X" numerically!
            if(/Notebook /.test(alab) && /Notebook /.test(blab)) {
                var an = alab.slice(9), bn = blab.slice(9);
                if($.isNumeric(an) && $.isNumeric(bn))
                    return an-bn;
            }
            var lc = alab.localeCompare(blab);
            return lc;
        }
    }

    function node_id(root, username, gistname, version) {
        var ret = '';
        for(var i=0; i < arguments.length; ++i)
            ret = ret + '/' + arguments[i];
        return ret;
    }

    function convert_notebook_set(root, username, set) {
        var notebook_nodes = [];
        for(var name in set) {
            var attrs = set[name];
            if(username!==this_user && root==='alls' && attrs.visibility==='private')
                continue;
            var result = {
                label: attrs.description,
                gistname: name,
                user: username,
                root: root,
                visibility: attrs.visibility || 'public',
                last_commit: attrs.last_commit || 'none',
                id: node_id(root, username, name),
                sort_order: ordering.NOTEBOOK
            };
            notebook_nodes.push(result);
        }
        return notebook_nodes;
    }

    function populate_interests() {
        var my_notebooks, user_nodes = [];
        if(!this_config.interests[this_user])
            this_config.interests[this_user] = {};
        for (var username in this_config.interests) {
            var user_notebooks = this_config.interests[username];
            var notebook_nodes = [];
            if(username === this_user) {
                notebook_nodes.push({
                    label: "[New Notebook]",
                    id: "newbook",
                    sort_order: ordering.HEADER
                });
            }
            notebook_nodes = notebook_nodes.concat(convert_notebook_set('interests', username, user_notebooks));

            if(username === this_user)
                my_notebooks = notebook_nodes;
            else {
                var node = {
                    label: someone_elses(username),
                    id: '/interests/' + username,
                    sort_order: ordering.SUBFOLDER,
                    children: notebook_nodes.sort(compare_nodes)
                };
                user_nodes.push(node);
            }
        }
        var children =  my_notebooks.concat(user_nodes).sort(compare_nodes);
        var interests = $tree.tree('getNodeById', "/interests");
        $tree.tree("loadData", children, interests);
        $(interests.element).parent().prepend(interests.element);
        $tree.tree('openNode', interests);
    }

    function load_all_configs(k) {
        rcloud.get_users(function(userlist) {
            var users = _.pluck(userlist, 'login');
            rcloud.load_multiple_user_configs(users, function(configset) {
                var my_alls = [], user_nodes = [], my_config = null;
                for(var username in configset) {
                    var user_config = configset[username];
                    if(!user_config)
                        continue;
                    var notebook_nodes = convert_notebook_set('alls', username, user_config.all_books);
                    if(username === this_user) {
                        my_config = user_config;
                        my_alls = notebook_nodes;
                    }
                    else {
                        var node = {
                            label: someone_elses(username),
                            id: '/alls/' + username,
                            sort_order: ordering.SUBFOLDER,
                            children: notebook_nodes.sort(compare_nodes)
                        };
                        user_nodes.push(node);
                    }
                }

                // create both root folders now but only load /alls now
                // populate_interests will load /interests
                var children = my_alls.concat(user_nodes).sort(compare_nodes);
                var root_data = [
                    {
                        label: 'My Interests',
                        id: '/interests'
                    },
                    {
                        label: 'All Notebooks',
                        id: '/alls',
                        children: children
                    }
                ];
                $tree.tree("loadData", root_data);

                k && k(my_config);
            });
        });
    }

    function insert_alpha(data, parent) {
        // this could be a binary search but linear is probably fast enough
        // for a single insert, and it also could be out of order
        for(var i = 0; i < parent.children.length; ++i) {
            var child = parent.children[i];
            var so = compare_nodes(data, child);
            if(so<0)
                return $tree.tree('addNodeBefore', data, child);
        }
        return $tree.tree('appendNode', data, parent);
    }

    function update_tree(root, user, gistname, data, last_chance) {
        var id = node_id(root, user, gistname);
        var node = $tree.tree('getNodeById', id);
        var parent, children;
        data.gistname = gistname;
        data.id = id;
        data.root = root;
        data.user = user;
        if(node) {
            // the update stuff doesn't exist in the jqtree version
            // we're using, and the latest jqtree didn't seem to work
            // at all, so.. blunt stupid approach here:
            parent = node.parent;
            children = node.children;
            if(last_chance)
                last_chance(node); // hacky
            $tree.tree('removeNode', node);
            node = insert_alpha(data, parent);
        }
        else {
            if(user == this_user) {
                parent = $tree.tree('getNodeById', node_id(root));
                node = insert_alpha(data, parent);
            }
            else {
                var usernode = $tree.tree('getNodeById', node_id(root, user));
                if(usernode)
                    node = insert_alpha(data, usernode);
                else {
                    // creating a subfolder and then using loadData on it
                    // seems to be *the* way that works
                    parent = $tree.tree('getNodeById', node_id(root));
                    var pdat = {
                        label: someone_elses(user),
                        id: node_id(root, user),
                        sort_order: ordering.SUBFOLDER
                    };
                    children = [data];
                    var user_folder = insert_alpha(pdat, parent);
                    $tree.tree('loadData', children, user_folder);
                    $tree.tree('openNode', user_folder);
                    node = $tree.tree('getNodeById',id);
                }
            }
        }
        return node;
    }

    // add_history_nodes:
    // - tries to add a constant INCR number of nodes
    // - or pass it a length and it erases and rebuilds to num
    // d3 anyone?
    function add_history_nodes(node, num) {
        const INCR = 5;
        var begin, end; // range [begin,end)

        function process_history() {
            var history = node.history;
            if(!history)
                return;
            var children = [];
            end = Math.min(end, history.length);
            for(var i=begin; i<end; ++i) {
                var hdat = _.clone(node);
                var sha = history[i].version.substring(0, 10);
                hdat.label = sha;
                hdat.version = history[i].version;
                hdat.last_commit = history[i].committed_at;
                hdat.id = node.id + '/' + hdat.version;
                $tree.tree('appendNode', hdat, node);
            }
        }

        if(num === undefined) {
            begin = node.children.length + 1;
            end = begin + INCR;
        }
        else {
            begin = 1;
            end = num + 1;
            if(node.children.length)
                for(var i = node.children.length - 1; i >= 0; --i)
                    $tree.tree('removeNode', node.children[i]);
            if(num==0)
                return;
        }
        if(node.history)
            process_history();
        else
            rcloud.load_notebook(node.gistname, null, function(notebook) {
                node.history = notebook.history;
                process_history();
            });
    }

    function display_date(ds) {
        function pad(n) { return n<10 ? '0'+n : n; }
        if(ds==='none')
            return '';
        var date = new Date(ds);
        var diff = Date.now() - date;
        if(diff < 24*60*60*1000)
            return date.getHours() + ':' + pad(date.getMinutes());
        else
            return (date.getMonth()+1) + '/' + date.getDate();
    }

    function someone_elses(name) {
        return name + "'s Notebooks";
    }

    var result = {
        init: function() {
            var that = this;
            this_user = rcloud.username();
            $("#input-text-source-results-title").css("display", "none");
            $("#input-text-history-results-title").css("display", "none");
            this.create_book_tree_widget();
            this.load_config(function() {
                if(shell.gistname) // notebook specified in url
                    this_config.currbook = shell.gistname;
                else if(this_config.currbook)
                    that.load_notebook(this_config.currbook, this_config.currversion);
                else // brand new config
                    that.new_notebook();
            });
            var old_text = "";
            window.setInterval(function() {
                var new_text = $("#input-text-search").val();
                if (new_text !== old_text) {
                    old_text = new_text;
                    that.search(new_text);
                }
            }, 500);
        },
        create_book_tree_widget: function() {
            var that = this;
            const icon_style = {'line-height': '90%'};
            const remove_icon_style = {'line-height': '90%', 'font-size': '75%'};

            function onCreateLiHandler(node, $li) {
                var title = $li.find('.title');
                if(node.visibility==='private')
                    title.wrap('<i/>');
                if(node.last_commit && (!node.version ||
                                        display_date(node.last_commit) != display_date(node.parent.last_commit))) {
                    title.after('<span style="float: right" id="date">'
                                             + display_date(node.last_commit) + '</span>');
                }
                if(node.version)
                    title.css({color: '#7CB9E8'});
                if(node.gistname && !node.version) {
                    var commands = $('<span/>', {class: 'notebook-commands'});
                    if(true) { // all notebooks have history - should it always be accessible?
                        var history = ui_utils.fa_button('icon-time', 'history', 'history', icon_style);
                        history.click(function() {
                            $(this).tooltip('hide');
                            that.show_history(node);
                        });
                        commands.append(history);
                    }
                    if(node.user===this_user) {
                        var make_private = ui_utils.fa_button('icon-eye-close', 'make private', 'private', icon_style),
                            make_public = ui_utils.fa_button('icon-eye-open', 'make public', 'public', icon_style);
                        if(node.visibility=='public')
                            make_public.hide();
                        else
                            make_private.hide();
                        make_private.click(function() {
                            $(this).tooltip('hide');
                            that.set_visibility(node, 'private');
                        });
                        make_public.click(function() {
                            $(this).tooltip('hide');
                            that.set_visibility(node, 'public');
                        });
                        commands.append(make_private, make_public);
                    }
                    if(node.root==='interests' || node.user===this_user) {
                        var remove = ui_utils.fa_button('icon-remove', 'remove', 'remove', remove_icon_style);
                        remove.click(function() {
                            $(this).tooltip('hide');
                            that.remove_notebook(node);
                        });
                        commands.append(remove);
                    };
                    commands.hide();
                    title.append('&nbsp;', commands);
                    $li.hover(
                        function() {
                            $('.notebook-commands', this).show();
                        },
                        function() {
                            $('.notebook-commands', this).hide();
                        });
                }
            }
            $tree = $("#editor-book-tree");
            $tree.tree({
                onCreateLi: onCreateLiHandler,
                selectable: true
            });
            $tree.bind(
                'tree.click', function(event) {
                    if (event.node.id === 'newbook')
                        that.new_notebook();
                    else if(event.node.gistname)
                        that.load_notebook(event.node.gistname, event.node.version || null);
                }
            );
        },
        load_config: function(k) {
            function defaults() {
                return ret;
            }
            load_all_configs(function(my_config) {
                // build up config incrementally & allow user to just
                // remove parts of it if they're broken
                this_config = my_config || {};
                this_config.currbook = this_config.currbook || null;
                this_config.currversion = this_config.currversion || null;
                this_config.nextwork = this_config.nextwork || 1;
                this_config.interests = this_config.interests || {};
                this_config.interests[this_user] = this_config.interests[this_user] || {};
                this_config.all_books = this_config.all_books || {};
                populate_interests();
                k && k();
            });
        },
        save_config: function() {
            rcloud.save_user_config(this_user, this_config);
        },
        load_notebook: function(gistname, version) {
            shell.load_notebook(gistname, version,
                _.bind(result.notebook_loaded, this, version));
        },
        new_notebook: function() {
            if(isNaN(this_config.nextwork))
                this_config.nextwork = 1;
            var desc = "Notebook " + this_config.nextwork;
            ++this_config.nextwork;
            shell.new_notebook(desc, _.bind(result.notebook_loaded, this, null));
        },
        rename_notebook: function(gistname, newname) {
            rcloud.rename_notebook(gistname, newname, _.bind(result.notebook_loaded, this, null));
        },
        remove_notebook: function(node) {
            if(node.root === 'alls') {
                if(node.user === this_user)
                    delete this_config.all_books[node.gistname];
            }
            else {
                delete this_config.interests[node.user][node.gistname];
                if(node.user!==this_user && _.isEmpty(this_config.interests[node.user])) {
                    delete this_config.interests[node.user];
                    var id = '/interests/' + node.user;
                    $tree.tree('removeNode', $tree.tree('getNodeById', id));
                }
            }
            $tree.tree('removeNode', node);
            this.save_config();
        },
        set_visibility: function(node, visibility) {
            if(node.user !== this_user)
                throw "attempt to set visibility on notebook not mine";
            var entry = this_config.interests[this_user][node.gistname];
            entry.visibility = visibility;
            this_config.all_books[node.gistname] = entry;
            this.update_tree_entry(this_user, node.gistname, entry);
        },
        fork_notebook: function(gistname) {
            shell.fork_notebook(gistname, null, _.bind(result.notebook_loaded, this, null));
        },
        show_history: function(node) {
            add_history_nodes(node);
            // just an annoying ui glitch in jqTree where the selection disappears
            // if you add siblings
            if(node.gistname === this_config.currbook && this_config.currversion) {
                var n = $tree.tree('getNodeById', node_id('interests', node.user, node.gistname, this_config.currversion));
                $tree.tree('selectNode', n);
            }
        },
        notebook_loaded: function(version, result) {
            this_config.currbook = result.id;
            this_config.currversion = version;
            this.update_notebook_status(result.user.login,
                                        result.id,
                                        {description: result.description,
                                         last_commit: result.updated_at || result.history[0].committed_at,
                                         // we don't want the truncated history from an old version
                                         history: version ? null : result.history});
        },
        update_notebook_status: function(user, gistname, status) {
            // this is almost a task for d3 or mvc on its own
            var iu = this_config.interests[user];
            if(!iu)
                iu = this_config.interests[user] = {};

            var entry = iu[gistname] || this_config.all_books[gistname] || {};

            entry.description = status.description;
            entry.last_commit = status.last_commit;
            entry.visibility = entry.visibility || 'public';

            // write back (maybe somewhat redundant)
            iu[gistname] = entry;
            if(user === this_user)
                this_config.all_books[gistname] = entry;

            var node = this.update_tree_entry(user, gistname, entry, status.history);
            $tree.tree('selectNode', node);
        },
        update_tree_entry: function(user, gistname, entry, history) {
            var data = {label: entry.description,
                        last_commit: entry.last_commit,
                        sort_order: ordering.NOTEBOOK,
                        visibility: entry.visibility,
                        history: history};

            // we only receive history here if we're at HEAD, so use that if we get
            // it.  otherwise use the history in the node if it has any.  otherwise
            // add_history_nodes will do an async call to get the history.
            // always show the same number of history nodes as before.
            var nhist;
            var node = update_tree('interests', user, gistname, data,
                                   function(node) {
                                       data.history = data.history || node.history;
                                       nhist = node.children ? node.children.length : 0;
                                   });
            add_history_nodes(node, nhist);
            if(this_config.currversion)
                node = $tree.tree('getNodeById', node_id('interests', user, gistname, this_config.currversion));
            update_tree('alls', user, gistname, data);

            this.save_config();
            return node;
        },
        search: function(search_string) {
            var that = this;
            function split_source_search_lines(line) {
                var r = /:/g;
                var r2 = /\/([^/]+)\/([^/]+)/;
                var result = [];
                while (r.exec(line) !== null) {
                    result.push(r.lastIndex);
                    if (result.length === 2) {
                        var path = line.substring(0, result[0]-1);
                        var t = path.match(r2);
                        return [t[1], t[2],
                                line.substring(result[0], result[1]-1),
                                line.substring(result[1])];
                    }
                }
                throw "shouldn't get here";
            };
            function split_history_search_lines(line) {
                var t = line.indexOf(':');
                var r = /\|/g;
                var line_number = line.substring(0, t);
                line = line.substring(t+1);
                var result = [];
                while (r.exec(line) !== null) {
                    result.push(r.lastIndex);
                    if (result.length === 2) {
                        return [line_number,
                                line.substring(0, result[0]-1),
                                line.substring(result[0], result[1]-1),
                                line.substring(result[1])];
                    }
                }
                throw "shouldn't get here";
            };

            function update_source_search(result) {
                d3.select("#input-text-source-results-title")
                    .style("display", (result !== null && result.length >= 1)?null:"none");
                var data = _.map(result, split_source_search_lines);
                d3.select("#input-text-source-results-table")
                    .selectAll("tr").remove();
                var td_classes = ["user", "filename", "linenumber", "loc"];
                d3.select("#input-text-source-results-table")
                    .selectAll("tr")
                    .data(data)
                    .enter().append("tr")
                    .selectAll("td")
                    .data(function(d,i) {
                        return _.map(d, function(v, k) {
                            return [v, i];
                        });
                    })
                    .enter()
                    .append("td")
                    .text(function(d, i) {
                        if (i === 2) {
                            return d[0] + ":";
                        } else {
                            return d[0];
                        }
                    })
                    .attr("class", function(d, i) {
                        var j = d[1];
                        d = d[0];
                        if (j === 0 || data[j-1][i] !== d)
                            return "text-result-table-" + td_classes[i];
                        else
                            return "text-result-table-same-" + td_classes[i];
                    })
                    .on("click", function(d, i) {
                        if (i !== 1 && i !== 3)
                            return;
                        var j = d[1];
                        var user = data[j][0], notebook = data[j][1];
                        that.load_notebook(notebook, null);
                    })
                ;
            };
            function update_history_search(result) {
                d3.select("#input-text-history-results-title")
                    .style("display", (result !== null && result.length >= 1)?null:"none");
                var data = _.map(result, split_history_search_lines);
                d3.select("#input-text-history-results-table")
                    .selectAll("tr").remove();
                var td_classes = ["date", "user", "loc"];
                d3.select("#input-text-history-results-table")
                    .selectAll("tr")
                    .data(data)
                    .enter().append("tr")
                    .selectAll("td")
                    .data(function(d,i) {
                        return _.map(d.slice(1), function(v, k) {
                            return [v, i];
                        });
                    })
                    .enter()
                    .append("td")
                    .text(function(d) {
                        return d[0];
                    })
                    .attr("class", function(d, i) {
                        var j = d[1];
                        d = d[0];
                        if (j === 0 || data[j-1][i+1] !== d)
                            return "text-result-table-" + td_classes[i];
                        else
                            return "text-result-table-same-" + td_classes[i];
                    })
                    .on("click", function(d, i) {
                    })
                ;
            };
            rcloud.search(search_string, function(result) {
                update_source_search(result[0]);
                update_history_search(result[1]);
            });
        }
    };
    return result;
}();
