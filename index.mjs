import {streamFile, log, warn, exit} from "./eal/index.mjs";

const DIR = decodeURIComponent(import.meta.url
	.replace(/\/[^/]*$/, "")
	.replace(/^file:\/\//, ""));


export default class UCD {
	chars  = [];
	ranges = {};
	#path  = "";
	
	constructor(path){
		this.#path = path || DIR + "/ucd";
	}
	
	async load(){
		await this.read(this.#path + "/UnicodeData.txt", (...fields) => {
			const char = {
				codePoint:           parseInt(fields[0], 16),
				name:                fields[1],
				generalCategory:     fields[2],
				combiningClass:      fields[3],
				bidiCategory:        fields[4],
				decomposition:       fields[5],
				decimalDigitValue: +(fields[6] || NaN),
				digitValue:        +(fields[7] || NaN),
				numericValue:      +(fields[8] || NaN),
				mirrored:   "Y" ===  fields[9].toUpperCase(),
				unicode1Name:        fields[10],
				iso10646Comment:     fields[11],
				upperCaseMapping:    fields[12],
				lowerCaseMapping:    fields[13],
				titleCaseMapping:    fields[14],
			};
			let {name} = char;
			if(name.endsWith(", First>") || name.endsWith(", Last>")){
				name = name.slice(1, name.lastIndexOf(","));
				(this.ranges[name] = this.ranges[name] || []).push(char.codePoint);
			}
			else this.chars[char.codePoint] = char;
		});
		return this;
	}
	
	async read(path, fn, opts = {}){
		const {fs = ";", rs = "\n", commentChar = "#"} = opts;
		let partial = "";
		await streamFile(path, chunk => {
			if(partial){
				chunk = partial + chunk;
				partial = "";
			}
			if(!chunk.endsWith(rs)){
				const nl = chunk.lastIndexOf(rs);
				partial = chunk.slice(nl);
				chunk = chunk.slice(0, nl);
			}
			for(const line of chunk.split(rs)){
				const comment = line.indexOf("#");
				if(~comment) line = line.slice(0, comment);
				if(line) fn(...fs ? line.split(fs) : [line]);
			}
		});
		if(partial) fn(partial);
		return;
	}
}
