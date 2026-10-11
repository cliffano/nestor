REPO_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../..)
DOCKER_COMPOSE := docker compose -f $(REPO_ROOT)/test-integration/fixtures/docker-compose.yaml

# Start Jenkins and block until its healthcheck passes
start-jenkins:
	$(DOCKER_COMPOSE) up -d --quiet-pull --wait --wait-timeout 300

stop-jenkins:
	$(DOCKER_COMPOSE) down --volumes

.PHONY: start-jenkins stop-jenkins
