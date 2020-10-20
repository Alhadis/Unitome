#!/usr/bin/env node

import UCD from "./index.mjs";
import {argv, log, isNode, warn, exit} from "./eal/index.mjs";

(async () => {
	
	if(isNode){
		const {inspect} = await import("util");
		inspect.defaultOptions.depth = Infinity;
	}
	
	const ucd = new UCD();
	await ucd.load();
	for(const arg of argv){
		if(Number.isNaN(parseInt(arg, 16)))
			for(const codePoint of [...arg])
				log(ucd.get(codePoint.codePointAt(0)));
		else log(ucd.get(arg));
	}
	
})().catch(error => {
	warn(error);
	exit(1);
});
