/* jslint utility2:true */
(function () {
    "use strict";
    let colList;
    let csvFromList;
    let fs;
    let mechList;
    let strNormalize;
    let tableList;
    fs = require("fs");
    csvFromList = function (list) {
        return list.map(function (row, ii) {
            let str;
            str = "";
            if (ii === 0) {
                str += colList.join("\t") + "\n";
            }
            str += colList.map(function (key) {
                return row[key];
            }).join("\t") + "\n";
            return str;
        }).join("");
    };
    strNormalize = function (str) {
        return str.replace((
            /<[^>]*?>/g
        ), "").replace((
            /&nbsp;/g
        ), " ").replace((
            /&quot;/g
        ), "\"").replace((
            /[^\u0000-\u007f]/g
        ), "").replace((
            /\s+/g
        ), " ").trim();
    };
    tableList = [];
    fs.readFileSync(
        "mwo.smurfy-net.de.index.html",
        "utf8"
    ).toLowerCase().replace((
        /<table\b[^>]*?>([\S\s]+?)<\/table>/g
    ), function (ignore, match1) {
        let rowList;
        rowList = [];
        match1.replace((
            /<tr\b[^>]*?>([\S\s]+?)<\/tr>/g
        ), function (match) {
            rowList.push(match);
            return "";
        });
        tableList.push(rowList);
        return "";
    });
    tableList = tableList.map(function (rowList) {
        return rowList.map(function (row) {
            let data;
            let meta;
            data = [];
            meta = {};
            row.replace((
                /\bdata-(\S*?)="(\S*?)"/g
            ), function (ignore, match1, match2) {
                meta[match1] = strNormalize(match2);
                return "";
            });
            row.replace((
                /<(?:td|th)\b[^>]*?>([\S\s]+?)<\/(?:td|th)>/g
            ), function (ignore, match1) {
                data.push(strNormalize(match1));
                return "";
            });
            return {
                data,
                meta
            };
        });
    });
    fs.writeFileSync(
        "raw.json",
        JSON.stringify(tableList, undefined, 4)
    );
    mechList = [];
    tableList[1].forEach(function (row, ii) {
        let data;
        if (ii === 1) {
            colList = row.data;
            return;
        }
        if (!row.meta.hasOwnProperty("mechfilter-faction")) {
            return;
        }
        Object.keys(row.meta).forEach(function (key) {
            if (row.meta[key][0] === "{") {
                return;
            }
            if (colList.indexOf(key) < 0) {
                colList.push(key);
            }
        });
        data = {};
        colList.forEach(function (key, ii) {
            data[key] = row.data[ii] || row.meta[key];
        });
        data["sort-key"] = (
            data["mechfilter-faction"]
            + "." + data["mechfilter-family"]
            + "." + data.name
        );
        data["engine-default"] = data.engines.split(" ").slice(-2).join(" ");
        mechList.push(data);
    });
    Array.from([
        "name",
        "mech-tons",
        "engine-default"
    ]).reverse().forEach(function (key) {
        colList.splice(colList.indexOf(key), 1);
        colList.unshift(key);
    });
    colList.unshift("sort-key");
    mechList = mechList.map(function (row) {
        let data;
        data = {};
        colList.forEach(function (key) {
            data[key] = row[key];
        });
        return data;
    });
    mechList.sort(function (aa, bb) {
        aa = aa["sort-key"];
        bb = bb["sort-key"];
        return (
            aa < bb
            ? -1
            : 1
        );
    });
    fs.writeFileSync(
        "mech.all.json",
        JSON.stringify(mechList, undefined, 4)
    );
    fs.writeFileSync(
        "mech.all.csv",
        csvFromList(mechList)
    );
    fs.writeFileSync(
        "mech.xl.csv",
        csvFromList(mechList.filter(function (row) {
            return row["engine-default"].indexOf("xl") === 0;
        }).sort(function (aa, bb) {
            aa = aa["mechfilter-faction"] + " " + aa["engine-default"];
            bb = bb["mechfilter-faction"] + " " + bb["engine-default"];
            return (
                aa < bb
                ? -1
                : 1
            );
        }))
    );
}());
