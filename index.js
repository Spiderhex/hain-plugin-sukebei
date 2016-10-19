'use strict';

const got = require('got');
const $ = require('cheerio');
const t2m = require('torrent-to-magnet');
const pjson = require('./package.json');

module.exports = (PluginContext) => {
	const app = PluginContext.app;
	const shell = PluginContext.shell;
	const prefix = pjson.hain.prefix;
	var do_search = 0;
	
	function search(query, res) {
		var query_trim = query.trim();
		if (do_search == 0)
		{
			res.add({
			  icon: "#fa fa-search",
			  id: query_trim,
			  payload: "search",
			  title: `Press Enter to search ${query_trim} on Sukebei.Nyaa`,
			  desc: ""
			});
			return 0;
		}
		do_search = 0;
		var url = `https://sukebei.nyaa.se/?page=search&sort=2&term=${query_trim}`;
		res.add({
			id: '__temp',
			title: 'fetching...',
			desc: 'from Sukebei',
			icon: '#fa fa-circle-o-notch fa-spin'
		});
		got(url).then(response => {
			var results = $(".tlist tr", response.body).toArray();
			var viewtop = $(".viewtop", response.body);
			var viewtable = $(".viewtable", response.body);
			results.shift();
			if ((results.length == 0 && viewtop + viewtable == 0)|| $(results[0]).text() == "No torrents found.")
			{
				res.remove('__temp');
				res.add({
					title: `No results for ${query_trim}`,
					icon: '#fa fa-times'
				});
			}
			else if (viewtable + viewtop == 0)
			{
				var res_temp = [];
				$(results).each(function (index, element) {
					var rank = element["attribs"]["class"];
					var header = "";
					if (!!rank)
					{
						if (rank.indexOf("aplus") != -1)
							header = "<span style='border-radius: 5px; background-color: #4090D0; color: #ffffff; padding: 2px'>A+</span> ";
						else if (rank.indexOf("trusted") != -1)
							header = "<span style='border-radius: 5px; background-color: #78B988; color: #ffffff; padding: 2px'>Trusted</span> ";
						else if (rank.indexOf("remake") != -1)
							header = "<span style='border-radius: 5px; background-color: #D09060; color: #ffffff; padding: 2px'>Remake</span> ";
					}
					res_temp.push({
						icon: '#fa fa-magnet',
						id: $(this).find(".tlistdownload a").attr("href"),
						payload: 'open',
						title: "<span style='line-height: 18px'>"+$(this).find(".tlistname a").text()+"</span>",
						desc: header + $(this).find(".tlisticon a").attr("title") + " | " + $(this).find(".tlistsize").text() + " | S:" + $(this).find(".tlistsn").text() + " L:" + $(this).find(".tlistln").text()
					});
				});
				res.remove('__temp');
				res.add(res_temp);
			}
			else {
				var rank = $(".content", response.body)[0]["attribs"]["class"];
				var header = "";
				if (!!rank)
				{
					if (rank.indexOf("aplus") != -1)
						header = "<span style='border-radius: 5px; background-color: #4090D0; color: #ffffff; padding: 2px'>A+</span> ";
					else if (rank.indexOf("trusted") != -1)
						header = "<span style='border-radius: 5px; background-color: #78B988; color: #ffffff; padding: 2px'>Trusted</span> ";
					else if (rank.indexOf("remake") != -1)
						header = "<span style='border-radius: 5px; background-color: #D09060; color: #ffffff; padding: 2px'>Remake</span> ";
				}
				res.remove('__temp');
				res.add({
					icon: '#fa fa-magnet',
					id: $(response.body).find(".viewdownloadbutton a").attr("href"),
					payload: 'open',
					title: "<span style='line-height: 18px'>"+$(viewtable).find(".viewtorrentname").text()+"</span>",
					desc: header + $(viewtop).find(".viewcategory").text() + " | " + $(viewtable).find("tr:last-child .vtop").text() + " | S:" + $(viewtable).find(".viewsn").text() + " L:" + $(viewtable).find(".viewln").text()
				});
			}
		});
	}

	function execute(id, payload) {
		if (payload == "open") {
			t2m("https:"+id, {}, function (err, uri) {
				shell.openExternal(uri);
			});
			return 0;
		}
		if (payload == "search") {
			do_search = 1;
			app.setQuery(prefix+" "+id);
			return 0;
		}
	}

  return {search, execute};
};
