# Welcome to your CDK TypeScript project!

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


## Cli tests
```
aws sqs send-message-batch --queue-url https://sqs.us-east-1.amazonaws.com/204961252708/vtypeioWebhooksSqsWorkerLambdaS-vtypeioWebhooksSqsWorkerLambda-19ZXBUDEQAL2T --entries file://message_batch.json
```
```
aws sqs send-message --queue-url https://sqs.us-east-1.amazonaws.com/204961252708/vtypeioWebhooksSqsWorkerLambdaS-vtypeioWebhooksSqsWorkerLambda-19ZXBUDEQAL2T --message-body "Hello from Amazon SQS"
```

## Queue
body:
```
[{"webhook_record_id":"2980","webhook_trigger_type":"update_contact","user_id":"638","contact_id":"CID638-1000069","REMOVED_tag":"Gold","ADDED_CF":"false","business_name":"","title":"NA","first_name":"todd","last_name":"valentine","suffix":"NA","email":"testnewcontact@aol.com","city":"Nashville","state":"TN","address_line":"123 Street","address_line2":"NA","postal_code":"12345","country_code":"US","phone_country_code":"+1","phone_number":"1234567890","phone_no_type":"Home","updated_on":"2021-11-29 11:07:08"},{"webhook_record_id":"2981","webhook_trigger_type":"update_contact","user_id":"638","contact_id":"CID638-1000069","ADDED_tag":"Platinum","ADDED_CF":"false","business_name":"","title":"NA","first_name":"todd","last_name":"valentine","suffix":"NA","email":"testnewcontact@aol.com","city":"Nashville","state":"TN","address_line":"123 Street","address_line2":"NA","postal_code":"12345","country_code":"US","phone_country_code":"+1","phone_number":"1234567890","phone_no_type":"Home","updated_on":"2021-11-29 11:07:16"}]
```
attribute: Signature
```
Kbth028EtHTtqCAOK/aQD3n0GjejPbFRRoXb4jOeT74=
```
attribute: Endpoint
```
https://webhook.site/82f8143f-ef99-41cf-b916-af0c85544d17
```
## TODO
- save webhook id and response to dynamodb table
