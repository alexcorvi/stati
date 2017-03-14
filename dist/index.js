#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path_1 = require("path");
const marked = require("marked");
const handlebars = require("handlebars");
const mkdirp = require("mkdirp");
function walkSync(dir, fileList = []) {
    const files = fs.readdirSync(dir).map((x) => path_1.join(path_1.resolve(dir), x));
    files.forEach((file) => {
        if (fs.statSync(file).isDirectory() && !/node_modules/.test(file))
            fileList = walkSync(file, fileList);
        else
            fileList.push(file);
    });
    return fileList;
}
;
function parseMd(filePath) {
    const requiredAttrs = ["permlink", "author", "title", "body"];
    const attrs = {};
    const contents = fs.readFileSync(filePath, "utf8");
    const attrsHead = contents.match(/<!--((.|\n)+)-->/);
    if (!attrsHead)
        return error(`file ${filePath} doesn't have any attributes`);
    const attrsRe = /(let|const|var)\s+(\w+)((\s?)+)=((\s?)+)("|')((\w?)+)("|');?/gi;
    let match = [];
    while (match = attrsRe.exec(attrsHead[0])) {
        if (!match)
            break;
        attrs[match[2]] = match[8];
    }
    const H1Matches = contents.match(/\s#\s?((.)+)\n/) || [""];
    if (!attrs["title"])
        attrs["title"] = H1Matches[0].replace(/\s#/g, "").replace(/\s/g, " ").trim();
    if (!attrs["permlink"])
        attrs["permlink"] = path_1.basename(filePath).replace(/\.\w+$/, "");
    attrs["body"] = marked(contents);
    requiredAttrs.forEach(x => {
        if (!attrs[x])
            error(`file ${filePath} doesn't have ${x}`);
    });
    return attrs;
}
function error(msg) {
    console.error(msg);
    process.exit(1);
    return {};
}
function main() {
    const allFiles = walkSync(process.cwd())
        .filter(x => x.endsWith(".md") || x.endsWith(".hbs"));
    const handlebarsFiles = allFiles.filter(x => x.endsWith(".hbs"));
    const postsTemplatePath = handlebarsFiles.find(x => /post/i.test(x));
    if (!postsTemplatePath)
        return error(`Can not find a post template`);
    const postsTemplate = fs.readFileSync(postsTemplatePath, "utf8");
    const homeTemplatePath = handlebarsFiles.find(x => /home/i.test(x));
    if (!homeTemplatePath)
        return error(`Can not find home template`);
    const homeTemplate = fs.readFileSync(homeTemplatePath, "utf8");
    const markdownFiles = allFiles.filter(x => x.endsWith(".md")).map(x => parseMd(x));
    const posts = markdownFiles.map(variables => handlebars.compile(postsTemplate)(variables));
    const home = handlebars.compile(homeTemplate)({ "posts": markdownFiles });
    fs.writeFileSync(path_1.join(process.cwd(), "index.html"), home);
    mkdirp.sync(path_1.join(process.cwd(), "blog"));
    posts.forEach((post, index) => {
        fs.writeFileSync(path_1.join(process.cwd(), "blog", markdownFiles[index]["permlink"]) + ".html", post);
    });
}
main();
