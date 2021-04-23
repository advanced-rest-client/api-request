# API request

A set of composite components that are used to build an HTTP request editor with the support of the AMF model.

[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-request.svg)](https://www.npmjs.com/package/@advanced-rest-client/api-request)

[![Tests and publishing](https://github.com/advanced-rest-client/api-request/actions/workflows/deployment.yml/badge.svg)](https://github.com/advanced-rest-client/api-request/actions/workflows/deployment.yml)

## Usage

In this package:

- api-request-editor - The HTTP editor powered with AMF data
- api-request-panel - The request editor and the response view for an API request
- api-response-view - Simplified version of ARC's response view
- xhr-simple-request-transport - XHR as a web component
- xhr-simple-request - A web component that handles the `api-request` event and makes HTTP request for an API using the XHR object.

### Installation

```sh
npm install --save @api-components/api-request
```

## Development

```sh
git clone https://github.com/advanced-rest-client/api-request
cd api-request
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests

```sh
npm test
```
