.DEFAULT_GOAL := all

include Makefile.env.mk

USERSCRIPT_TARGETS := \
	UrlAutoHelper \
	ByeByeAnnoyingThumbnails

env_check:
	$(call assert, $(TEST) -n "$(TARGET)", "You must specific a target need to continue")
	$(call assert, $(TEST) -d $(TARGET), "Directory \"$(TARGET)\" not found")
	$(call echo-h, Installing global dependencies)
	@npm i $(IGNORE_STDOUT)

build: env_check
	@TARGET_LOWER=$(shell echo $(TARGET) | $(TR) '[:upper:]' '[:lower:]') && \
		cd $(TARGET) && \
		$(call echo, Installing dependencies for $(TARGET)) && npm i $(IGNORE_STDOUT) && \
		$(call echo, Building $(TARGET)) && npm run build $(IGNORE_STDOUT) && \
		$(call echo, Moving distribution of $(TARGET)) && $(MOVE) -f dist/$$TARGET_LOWER.user.js ../dist/$$TARGET_LOWER.user.js
	$(call echo-h, Done)

debug: env_check
	@cd $(TARGET) && \
	$(call echo, Installing dependencies for $(TARGET)) && npm i $(IGNORE_STDOUT) && \
	npm run dev

clean:
	@$(RM) -rf dist

build_prepare:
	@$(MKDIR) -p dist

all: build_prepare
	@$(foreach target, $(USERSCRIPT_TARGETS), $(MAKE) build TARGET=$(target);)

.PHONY: build_prepare clean