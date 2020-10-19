import {readLines} from "./eal/index.mjs";

const DIR = decodeURIComponent(import.meta.url
	.replace(/\/[^/]*$/, "")
	.replace(/^file:\/\//, ""));


export default class UCD {
	constructor(path = DIR + "/ucd"){
		this.path     = path;
		this.chars    = new Map();
		this.blocks   = {};
		this.brackets = {};
		this.mirrored = {};
		this.radicals = {};
	}
	
	[Symbol.iterator](){
		return this.chars.entries();
	}
	
	camelCase(input){
		return input
			.replace(/^[A-Z]+/, chars => chars.toLowerCase())
			.replace(/_([A-Z]+)/g, (_, chars) => chars.toUpperCase())
			.replace(/_/g, "");
	}
	
	get(code){
		code = this.parseCodePoint(code);
		return this.chars.get(code);
	}
	
	async load(ucdRoot = DIR + "/ucd"){
		await Promise.all([
			this.read("UnicodeData", (code, ...fields) => {
				const char = {
					name:                fields[0],
					generalCategory:     categories[fields[1] || "Cn"],
					combiningClass:      +fields[2],
					bidiClass:           bidiClasses[fields[3]],
					decomposition:       fields[4] || null,
					decimalDigitValue: +(fields[5] || NaN),
					digitValue:        +(fields[6] || NaN),
					numericValue:      +(fields[7] || NaN),
					mirrored:   "Y" ===  fields[8].toUpperCase(),
					unicode1Name:        fields[9],
					iso10646Comment:     fields[10],
					upperCaseMapping:    this.parseCodePoint(fields[11]),
					lowerCaseMapping:    this.parseCodePoint(fields[12]),
					titleCaseMapping:    this.parseCodePoint(fields[13]),
				};
				if(/^(?:<([^>]+)>\s+)?(\S.*)$/.test(char.decomposition || "")){
					char.decomposition = {mapping: this.parseCodePoint(RegExp.$2)};
					if(RegExp.$1)
						char.decomposition.type = RegExp.$1;
				}
				this.set(code, char);
			}),
			
			this.read("ArabicShaping", (code, ...fields) => {
				this.set(code, {
					joiningType: {
						R: "Right_Joining",
						L: "Left_Joining",
						D: "Dual_Joining",
						C: "Join_Causing",
						U: "Non_Joining",
						T: "Transparent",
					}[fields[1]] || null,
					joiningGroup: fields[2],
				});
			}),
			
			this.read("BidiBrackets", (code, pair, type) => {
				pair = this.parseCodePoint(pair);
				code = parseInt(code, 16);
				if("o" === type)
					this.brackets[String.fromCodePoint(code)] = String.fromCodePoint(pair);
				this.set(code, {
					bidiPairedBracket: pair,
					bidiPairedBracketType: {o: "open", c: "close"}[type] || null,
				});
			}),
			
			this.read("BidiMirroring", (code, pair) => {
				pair = this.parseCodePoint(pair);
				code = parseInt(code, 16);
				this.mirrored[String.fromCodePoint(code)] = String.fromCodePoint(pair);
				this.set(code, {bidiMirroringGlyph: pair});
			}),
			
			this.read("Blocks", (range, name) => {
				range = this.parseCodePoint(range);
				this.blocks[name] = range;
				this.set(range, {block: name});
			}),
			
			this.read("CaseFolding", (code, status, mapping) => {
				this.set(code, {
					caseFolding: this.parseCodePoint(mapping),
					caseFoldingStatus: {
						C: "common",
						F: "full",
						S: "simple",
						T: "turkic",
					}[status] || null,
				});
			}),
			
			this.read("CJKRadicals", (num, char, code) => {
				char = this.parseCodePoint(char);
				code = this.parseCodePoint(code);
				this.radicals[num] = {
					character:        char,
					unifiedIdeograph: code,
				};
				this.set(char, {cjkRadical: num});
			}),
			
			this.read("CompositionExclusions", code =>
				this.set(code, "compositionExclusion")),
			
			this.read("DerivedAge", (code, age) =>
				this.set(code, {age: parseFloat(age)})),
			
			this.read("DerivedCoreProperties", (code, name) =>
				this.set(code, this.camelCase(name))),
			
			this.read("EastAsianWidth", (code, width) =>
				this.set(code, {
					eastAsianWidth: {
						A:  "Ambiguous",
						F:  "Fullwidth",
						H:  "Halfwidth",
						N:  "Neutral",
						Na: "Narrow",
						W:  "Wide",
					}[width || "N"],
				})),
			
			this.read("EmojiSources", (...codes) => {
				codes = codes.map(this.parseCodePoint.bind(this));
				if("number" !== typeof codes[0]) return;
				this.set(codes[0], {
					shiftJISCodes: {
						DoCoMo:   codes[1],
						KDDI:     codes[2],
						SoftBank: codes[3],
					},
				});
			}),
			
			this.read("EquivalentUnifiedIdeograph", (code, ideo) => {
				ideo = this.parseCodePoint(ideo);
				this.set(code, {
					equivalentUnifiedIdeograph: ideo,
				});
			}),
			
			this.read("HangulSyllableType", (code, type) => {
				this.set(code, {hangulSyllableType: type})),
		]);
	}
	
	parseCodePoint(input){
		switch(typeof input){
			case "number": return isFinite(input) ? input : null;
			case "bigint": return Number(input);
			case "string":
				input = input.toUpperCase().trim();
				if(input.startsWith("U+"))
					input = input.slice(2);
				if(input.length < 5)
					input = parseInt(input, 16);
				else if(input.includes(" "))
					return input.split(" ").map(this.parseCodePoint);
				else if(input.includes(".."))
					return input.split("..").map(this.parseCodePoint);
				else input = parseInt(input, 16);
				return Number.isNaN(input) ? null : input;
			case "object":
				if(Array.isArray(input))
					return input.filter(Boolean).map(this.parseCodePoint);
		}
		return null;
	}
	
	async read(file, fn){
		return readLines(`${this.path}/${file}.txt`, fn, {fs: ";", comment: "#"});
	}
	
	set(code, ...props){
		if(props.length > 1)
			props = {[props[0]]: props[1]};
		else if("string" === typeof props[0])
			props = {[props[0]]: true};
		else [props] = props;
		
		code = this.parseCodePoint(code);
		if(Array.isArray(code))
			for(let i = code[0]; i < code[1]; ++i)
				this.set(i, props);
		else{
			if(!this.chars.has(code))
				this.chars.set(code, {});
			Object.assign(this.chars.get(code), props);
		}
	}
}


export const bidiClasses = Object.freeze({
	__proto__: null,
	L:   {type: "strong",   name: "Left_To_Right"},
	R:   {type: "strong",   name: "Right_To_Left"},
	AL:  {type: "strong",   name: "Arabic_Letter"},
	EN:  {type: "weak",     name: "European_Number"},
	ES:  {type: "weak",     name: "European_Separator"},
	ET:  {type: "weak",     name: "European_Terminator"},
	AN:  {type: "weak",     name: "Arabic_Number"},
	CS:  {type: "weak",     name: "Common_Separator"},
	NSM: {type: "weak",     name: "Nonspacing_Mark"},
	BN:  {type: "weak",     name: "Boundary_Neutral"},
	B:   {type: "neutral",  name: "Paragraph_Separator"},
	S:   {type: "neutral",  name: "Segment_Separator"},
	WS:  {type: "neutral",  name: "White_Space"},
	ON:  {type: "neutral",  name: "Other_Neutral"},
	LRE: {type: "explicit", name: "Left_To_Right_Embedding"},
	LRO: {type: "explicit", name: "Left_To_Right_Override"},
	RLE: {type: "explicit", name: "Right_To_Left_Embedding"},
	RLO: {type: "explicit", name: "Right_To_Left_Override"},
	PDF: {type: "explicit", name: "Pop_Directional_Format"},
	LRI: {type: "explicit", name: "Left_To_Right_Isolate"},
	RLI: {type: "explicit", name: "Right_To_Left_Isolate"},
	FSI: {type: "explicit", name: "First_Strong_Isolate"},
	PDI: {type: "explicit", name: "Pop_Directional_Isolate"},
});

export const categories = Object.freeze({
	__proto__: null,
	Lu: "Uppercase_Letter",       // An uppercase letter
	Ll: "Lowercase_Letter",       // A lowercase letter
	Lt: "Titlecase_Letter",       // A digraphic character, with first part uppercase
	LC: "Cased_Letter",           // Lu | Ll | Lt
	Lm: "Modifier_Letter",        // A modifier letter
	Lo: "Other_Letter",           // Other letters, including syllables and ideographs
	L:  "Letter",                 // Lu | Ll | Lt | Lm | Lo
	Mn: "Nonspacing_Mark",        // A nonspacing combining mark (zero advance width)
	Mc: "Spacing_Mark",           // A spacing combining mark (positive advance width)
	Me: "Enclosing_Mark",         // An enclosing combining mark
	M:  "Mark",                   // Mn | Mc | Me
	Nd: "Decimal_Number",         // A decimal digit
	Nl: "Letter_Number",          // A letterlike numeric character
	No: "Other_Number",           // A numeric character of other type
	N:  "Number",                 // Nd | Nl | No
	Pc: "Connector_Punctuation",  // A connecting punctuation mark, like a tie
	Pd: "Dash_Punctuation",       // A dash or hyphen punctuation mark
	Ps: "Open_Punctuation",       // An opening punctuation mark (of a pair)
	Pe: "Close_Punctuation",      // A closing punctuation mark (of a pair)
	Pi: "Initial_Punctuation",    // An initial quotation mark
	Pf: "Final_Punctuation",      // A final quotation mark
	Po: "Other_Punctuation",      // A punctuation mark of other type
	P:  "Punctuation",            // Pc | Pd | Ps | Pe | Pi | Pf | Po
	Sm: "Math_Symbol",            // A symbol of mathematical use
	Sc: "Currency_Symbol",        // A currency sign
	Sk: "Modifier_Symbol",        // A non-letterlike modifier symbol
	So: "Other_Symbol",           // A symbol of other type
	S:  "Symbol",                 // Sm | Sc | Sk | So
	Zs: "Space_Separator",        // A space character (of various non-zero widths)
	Zl: "Line_Separator",         // U+2028 LINE SEPARATOR only
	Zp: "Paragraph_Separator",    // U+2029 PARAGRAPH SEPARATOR only
	Z:  "Separator",              // Zs | Zl | Zp
	Cc: "Control",                // A C0 or C1 control code
	Cf: "Format",                 // A format control character
	Cs: "Surrogate",              // A surrogate code point
	Co: "Private_Use",            // A private-use character
	Cn: "Unassigned",             // A reserved unassigned code point or a noncharacter
	C:  "Other",                  // Cc | Cf | Cs | Co | Cn
});
