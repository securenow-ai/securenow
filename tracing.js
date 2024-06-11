// tracing.js
'use strict'
const process = require('process');
//OpenTelemetry
const opentelemetry = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
//instrumentations
const { ExpressInstrumentation } = require("@opentelemetry/instrumentation-express");
const { MongoDBInstrumentation } = require("@opentelemetry/instrumentation-mongodb");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");

const { v4: uuidv4 } = require('uuid');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const securenow_instance = process.env.securenow_instance|| 'http://65.108.80.206:4318';
const exporterOptions = {
  url: securenow_instance+'/v1/traces'
}

const traceExporter = new OTLPTraceExporter(exporterOptions);
const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  instrumentations: [new ExpressInstrumentation(), new MongoDBInstrumentation(), new HttpInstrumentation()],
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.securenow || 'securenow-free-'+uuidv4()
  })
});
  
  // initialize the SDK and register with the OpenTelemetry API
  // this enables the API to record telemetry
  sdk.start()
  
  // gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
    });