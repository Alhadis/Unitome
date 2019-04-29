#!/usr/bin/env node
"use strict";

const fs = require("fs");

const unicodeData = fs.readFileSync("UnicodeData.txt", "utf8")
	.trim().split("\n").map(line => {
		const fields = line.split(";");
		return {
			codePoint:          fields[0],
			name:               fields[1],
			generalCategory:    fields[2],
			combiningClass:     fields[3],
			bidiCategory:       fields[4],
			decomposition:      fields[5],
			decimalDigitValue: +fields[6],
			digitValue:        +fields[7],
			numericValue:      +fields[8],
			mirrored:   "Y" === fields[9].toUpperCase(),
			unicode1Name:       fields[10],
			iso10646Comment:    fields[11],
			upperCaseMapping:   fields[12],
			lowerCaseMapping:   fields[13],
			titleCaseMapping:   fields[14],
		};
	});
