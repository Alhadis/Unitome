#!/usr/bin/env node

import {readFileSync} from "fs";

const unicodeData = readFileSync("ucd/UnicodeData.txt", "utf8")
	.trim().split("\n").map(line => {
		const fields = line.split(";");
		return {
			codePoint:          parseInt(fields[0], 16),
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

console.log(unicodeData);
