#!/usr/bin/env node

import UCD from "./index.mjs";
import {argv, log, isNode, isTTY, readLines, warn, exit} from "./eal/index.mjs";

(async () => {
	
	if(isNode){
		const {inspect} = await import("util");
		inspect.defaultOptions.depth = Infinity;
	}
	
	const ucd = new UCD();
	await ucd.load();
	
	if(!isTTY())
		return readLines("/dev/stdin", line => ucd.showString(line, "short"), {fs: ""});
	else for(const arg of argv){
		if(Number.isNaN(parseInt(arg, 16)))
			ucd.showString(arg);
		else ucd.show(arg);
	}
	
})().catch(error => {
	warn(error);
	exit(1);
});
