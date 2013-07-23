
REPO = git@github.com:urban/swipe-pane.git
BUILD := build
GH_PAGES = $(BUILD)/gh-pages

build: components index.js
	@component build --dev

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

# 
# Make the gh-pages website
# 
# cd into build/gh-pages to check in the new site
# 
web: | pages
	@cp build/build.js $(GH_PAGES)/build/
	@cp example.html $(GH_PAGES)/index.html
	@echo
	@echo "Website build in $(GH_PAGES)."

# 
# Checkout the gh-pages branch.
#
pages: | build
	@if [ ! -d "$(GH_PAGES)" ]; then \
	git clone -b gh-pages $(REPO) $(GH_PAGES); \
	rm -rf $(GH_PAGES)/*; \
	fi;
	@mkdir -p $(GH_PAGES)/build

.PHONY: clean