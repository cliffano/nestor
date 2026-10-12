REPO_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../..)
DOCKER_COMPOSE := docker compose -f $(REPO_ROOT)/test-integration/fixtures/docker-compose.yaml

# Start Jenkins and block until its healthcheck passes
start-jenkins:
	$(DOCKER_COMPOSE) up -d --quiet-pull --wait --wait-timeout 300

stop-jenkins:
	$(DOCKER_COMPOSE) down --volumes

get-jenkins-ip-address:
	@docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $$($(DOCKER_COMPOSE) ps -q jenkins)

get-jenkins-secured-ip-address:
	@docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $$($(DOCKER_COMPOSE) ps -q jenkins_secured)

.PHONY: start-jenkins stop-jenkins get-jenkins-ip-address get-jenkins-secured-ip-address
