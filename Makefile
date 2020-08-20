all: ucd


# Download the latest version of the Unicode Database
ucd:
	@ $(require) wget
	test -d "$@" || mkdir $@
	cd $@ && wget \
		--cut-dirs=2 \
		--mirror \
		--no-config \
		--no-host-directories \
		--no-verbose \
		--preserve-permissions \
		--progress=bar \
		--retr-symlinks \
		--timestamping \
		--xattr \
		ftp://unicode.org/Public/UNIDATA/


# CJK database files, zipped by default
unihan: ucd/unihan
ucd/unihan: ucd/Unihan.zip
	@ $(require) unzip
	test -d "$@" || mkdir $@
	unzip -od $@ $^

ucd/Unihan.zip: ucd


# Pull any upstream changes to the UCD
update:
	@$(MAKE) -B ucd unihan

.PHONY: update


# Wipe downloaded or generated files
clean:
	rm -rf ucd

.PHONY: clean


# Declare a list of programs as recipe dependencies
require = \
	require(){ \
		while [ $$\# -gt 0 ]; do command 2>&1 >/dev/null -v "$$1" || { \
			printf >&2 'Required command `%s` not found\n' "$$1"; \
			return 1; \
		}; shift; done; \
	}; require
