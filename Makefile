.DEFAULT_GOAL := all

commits := $(shell git rev-list --count HEAD)

export VERSION_CODE = v$(commits)

prepare:
	@busybox mkdir -p build

build-UrlAutoHelper:
	@cd UrlAutoHelper && npm i && npm run build && \
		busybox cp dist/urlautohelper.user.js ../build/urlautohelper.user.js

clean:
	@busybox rm -rf build

all: prepare build-UrlAutoHelper

.PHONY: prepare clean