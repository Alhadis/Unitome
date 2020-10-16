#!/usr/bin/env node

import UCD from "./index.mjs";

new UCD().load().then(x => {
	console.log(x);
});
