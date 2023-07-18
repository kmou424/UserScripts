.DEFAULT_GOAL := all

commits := $(shell git rev-list --count HEAD)

export VERSION_CODE = $(commits)

define assert
@if ! $1; then \
    echo "Error:$2"; \
    exit 1; \
fi
endef

TARGET = default

prepare:
	@busybox mkdir -p build

build-UrlAutoHelper:
	@cd UrlAutoHelper && npm i && npm run build && \
		busybox cp dist/urlautohelper.user.js ../build/urlautohelper.user.js

debug:
	$(call assert, busybox test "$(TARGET)" != "default", "You must specific a target need to debug")
	$(call assert, busybox test -d $(TARGET), "Target directory: \"$(TARGET)\" not found")
	@cd $(TARGET) && npm i && npm run dev

clean:
	@busybox rm -rf build

all: prepare build-UrlAutoHelper

.PHONY: prepare clean