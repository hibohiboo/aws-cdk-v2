#!/bin/bash
bin_dir=$(cd $(dirname $0) && pwd)
DOCUMENT_NAME=port-relay

# aws ssm delete-document \
#     --name ${DOCUMENT_NAME} \
#     --profile produser
cd $bin_dir && aws ssm create-document \
    --content file://command-document.yml \
    --name ${DOCUMENT_NAME} \
    --document-type "Command" \
    --document-format "YAML" \
    --profile produser