commits := $(shell git rev-list --count HEAD)

export VERSION_CODE = $(commits)

define assert
@if ! $1; then \
	echo Error: $2; \
	exit 1;\
fi
endef

define echo
	echo "==> $1"
endef

define echo-h
	@echo "==> $1"
endef

ifeq ($(OS),Windows_NT)
	IGNORE_STDOUT := >nul
	IGNORE_OUT := >nul 2>&1

	TR=busybox tr
	COPY=busybox cp
	MOVE=busybox mv
	RM=busybox rm
	MKDIR=busybox mkdir
	TEST=busybox test
else
	IGNORE_STDOUT := >/dev/null
	IGNORE_OUT := >/dev/null 2>&1

	TR=tr
	COPY=cp
	MOVE=mv
	RM=rm
	MKDIR=mkdir
	TEST=test
endif