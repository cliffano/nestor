#!/usr/bin/env bash
set -o nounset

cd ../
bob dep
npm link
cd examples/

run_command() {
  printf "\n\n========================================\n"
  printf "%s: %s\n" "$1" "$2"
  eval "$2"
}

run_command "Show help guide" "../bin/nestor.js --help"
run_command "Show version info" "../bin/nestor.js --version"
run_command "View Jenkins version number" "../bin/nestor.js ver"
run_command "View queued jobs" "../bin/nestor.js queue"
run_command "View executors status" "../bin/nestor.js executor"
run_command "View dashboard" "../bin/nestor.js dashboard"

run_command "Ensure test job does not exist" "../bin/nestor.js delete-job somejob"
run_command "Create a new job" "../bin/nestor.js create-job somejob config_job.xml"
run_command "Fetch new job config" "../bin/nestor.js fetch-job-config somejob > ../stage/config_job_fetched.xml"
run_command "Update job config" "../bin/nestor.js update-job somejob ../stage/config_job_fetched.xml"
run_command "Read job info" "../bin/nestor.js read-job somejob"
run_command "Build job" "../bin/nestor.js build somejob"
run_command "Wait for the build to finish" "sleep 10"
run_command "Ensure job has console output" "../bin/nestor.js console somejob"
run_command "Ensure job is listed on dashboard" "../bin/nestor.js dashboard"
run_command "Read last build info of the job" "../bin/nestor.js last somejob"
run_command "Build job" "../bin/nestor.js build somejob"
run_command "Stop job" "../bin/nestor.js stop somejob"
run_command "Disable job" "../bin/nestor.js disable somejob"
run_command "Enable job" "../bin/nestor.js enable somejob"
run_command "Delete job" "../bin/nestor.js delete somejob"

run_command "Create a new view" "../bin/nestor.js create-view someview config_view.xml"
run_command "Fetch new view config" "../bin/nestor.js fetch-view-config someview > ../stage/config_view_fetched.xml"
run_command "Update view config" "../bin/nestor.js update-view someview ../stage/config_view_fetched.xml"
