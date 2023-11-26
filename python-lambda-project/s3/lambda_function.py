import sys
import os
def handler(event, context):
    return 'Hello ' + os.environ.get("TEST", "default") +' from AWS Lambda using Python' + sys.version + '!'

