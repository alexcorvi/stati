#!/usr/bin/env node
/// <reference path="../node_modules/@types/node/index.d.ts"/>
import * as fs from "fs";
import {join,resolve,basename} from "path";
import marked = require("marked");
import handlebars = require("handlebars");
import mkdirp = require("mkdirp");

// retrieve a list of all the files in a given directory
function walkSync (dir:string, fileList:string[]=[]) {
	const files = fs.readdirSync(dir).map((x)=>join(resolve(dir),x));
	files.forEach((file) => {
		if(fs.statSync(file).isDirectory() && !/node_modules/.test(file)) fileList = walkSync(file, fileList);
		else fileList.push(file);
	});
	return fileList;
};

// parse markdown files
function parseMd (filePath:string) {
	const requiredAttrs = ["permlink","author","title","body"];
	const attrs:{[key:string]:string} = {};
	const contents = fs.readFileSync(filePath,"utf8");
	const attrsHead = contents.match(/<!--((.|\n)+)-->/);
	if(!attrsHead) return error(`file ${filePath} doesn't have any attributes`);
	const attrsRe = /(let|const|var)\s+(\w+)((\s?)+)=((\s?)+)("|')((\w?)+)("|');?/gi;
	let match:string[]|null = [];
	while (match = attrsRe.exec(attrsHead[0])) {
		if(!match) break;
		attrs[match[2]] = match[8];
	}
	const H1Matches = contents.match(/\s#\s?((.)+)\n/) || [""];
	if(!attrs["title"]) attrs["title"] = H1Matches[0].replace(/\s#/g,"").replace(/\s/g," ").trim();
	if(!attrs["permlink"]) attrs["permlink"] = basename(filePath).replace(/\.\w+$/,"");
	attrs["body"] = marked(contents);
	requiredAttrs.forEach(x=>{
		if(!attrs[x]) error(`file ${filePath} doesn't have ${x}`);
	});
	return attrs;
}

function error (msg:string) {
	console.error(msg);
	process.exit(1);
	return {};
}

function main () {

	const allFiles = walkSync(process.cwd())
	.filter(x=>x.endsWith(".md") || x.endsWith(".hbs"));
	const handlebarsFiles = allFiles.filter(x=>x.endsWith(".hbs"));
	const postsTemplatePath = handlebarsFiles.find(x=>/post/i.test(x));
	if(!postsTemplatePath) return error(`Can not find a post template`);
	const postsTemplate = fs.readFileSync(postsTemplatePath,"utf8");
	const homeTemplatePath = handlebarsFiles.find(x=>/home/i.test(x));
	if(!homeTemplatePath) return error(`Can not find home template`);
	const homeTemplate = fs.readFileSync(homeTemplatePath,"utf8");
	const markdownFiles = allFiles.filter(x=>x.endsWith(".md")).map(x=>parseMd(x));
	const posts = markdownFiles.map(variables=>handlebars.compile(postsTemplate)(variables));
	const home = handlebars.compile(homeTemplate)({"posts":markdownFiles});

	fs.writeFileSync(join(process.cwd(),"index.html"),home);
	mkdirp.sync(join(process.cwd(),"blog"))
	posts.forEach((post,index)=>{
		fs.writeFileSync(join(process.cwd(),"blog",markdownFiles[index]["permlink"])+".html",post);
	});
}

main();