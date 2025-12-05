broker_binary=brokerApp
listener_binary=listenerApp
auth_binary=authApp
log_binary=logApp

build_listener:
	chdir ..\listener && set GOOS=linux&& set GOARCH=amd64&& set CGO_ENABLED=0 && go build -o ${listener_binary} ./cmd/listener

build_broker:
	chdir ..\broker && set GOOS=linux&& set GOARCH=amd64&& set CGO_ENABLED=0 && go build -o ${broker_binary} ./cmd/broker

build_auth:
	chdir ..\auth && set GOOS=linux&& set GOARCH=amd64&& set CGO_ENABLED=0 && go build -o ${auth_binary} ./cmd/auth

build_log:
	chdir ..\log && set GOOS=linux&& set GOARCH=amd64&& set CGO_ENABLED=0 && go build -o ${log_binary} ./cmd/log

build: build_broker build_listener build_auth build_log
	docker-compose up --build -d

build_all: build_broker build_listener build_auth build_log
	docker-compose up --build -d

down:
	docker-compose down