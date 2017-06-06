# requirements:
# - Jenkins running on localhost at port 8080
# - User 'someuser' must exist with password 'somepassword'

JENKINS_URL=http://someuser:somepassword@localhost:8080 cmdt --debug --base-dir ../.bob/test-integration-local/ run ./
