# Build deployment packages, don't deploy
all: clean packages/ping.zip packages/start_oauth.zip packages/callback.zip
	@echo "Deployment packages up-to-date"

# Deploy everything to lambda
deploy: deploy-ping deploy-ouath deploy-callback

deploy-ping: packages/ping.zip
	aws lambda update-function-code --function-name ping_handler --zip-file "fileb://packages/ping.zip" > /dev/null
	@echo "Deployed ping"

deploy-ouath: packages/start_oauth.zip
	aws lambda update-function-code --function-name start_oauth --zip-file "fileb://packages/start_oauth.zip" > /dev/null
	@echo "Deployed start_oauth"

deploy-callback: packages/callback.zip
	aws lambda update-function-code --function-name callback --zip-file "fileb://packages/callback.zip" > /dev/null
	@echo "Deployed callback"

# Remove packages
clean:
	rm -f packages/*.zip

.PHONY: all deploy deploy-ping deploy-ouath deploy-callback clean

packages/ping.zip:
	@mkdir -p packages
	zip -j packages/ping.zip ping/index.js access.json

packages/start_oauth.zip:
	@mkdir -p packages
	zip -j packages/start_oauth.zip start_oauth/index.js access.json

packages/callback.zip:
	@mkdir -p packages
	zip -j packages/callback.zip callback/index.js access.json