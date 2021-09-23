import sinon from 'sinon';

/**
 * Mocking server for tests
 */
export class MockServer {
  /**
   * Creates server endpoints
   */
  createServer() {
    this.srv = sinon.fakeServer.create({
      autoRespond: true
    });
    this.mock();
  }

  /**
   * Restores XHR object.
   */
  restore() {
    this.srv.restore();
  }

  /**
   * Creates endpoints
   */
  mock() {
    this.mockSuccess();
    this.mockSuccessJson();
    this.mockSuccessXml();
    this.mockSuccessPost();
    this.mockSuccessHeaders();
    this.mock404();
    this.mockMultipart();
  }

  /**
   * Mocks success response
   */
  mockSuccess() {
    const url = 'http://success.domain.com/';
    this.srv.respondWith('GET', url, (xhr) => {
      xhr.respond(200, {
        'Content-Type': 'text/plain'
      }, 'test');
    });
  }

  /**
   * Mocks success response for JSON
   */
  mockSuccessJson() {
    const url = 'http://success.domain.com/json';
    this.srv.respondWith('GET', url, (xhr) => {
      xhr.respond(200, {
        'Content-Type': 'application/json'
      }, JSON.stringify({'test': true}));
    });
  }

  /**
   * Mocks success response for XML
   */
  mockSuccessXml() {
    const url = 'http://success.domain.com/xml';
    this.srv.respondWith('GET', url, (xhr) => {
      xhr.respond(200, {
        'Content-Type': 'application/xml'
      }, '<test></test>');
    });
  }

  /**
   * Mocks success response for POST method
   */
  mockSuccessPost() {
    const url = 'http://success.domain.com/post';
    this.srv.respondWith('POST', url, (xhr) => {
      xhr.respond(200, {
        'Content-Type': 'text/plain'
      }, xhr.requestBody);
    });
  }

  /**
   * Mocks success response to test headers
   */
  mockSuccessHeaders() {
    const url = 'http://success.domain.com/headers';
    this.srv.respondWith('GET', url, (xhr) => {
      xhr.respond(200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(xhr.requestHeaders));
    });
  }

  /**
   * Mocks 404 error response
   */
  mock404() {
    const url = 'http://error.domain.com/404';
    this.srv.respondWith('GET', url, (xhr) => {
      xhr.respond(404, {
        'Content-Type': 'text/plain'
      }, 'e404');
    });
  }

  /**
   * Mocks multipart data response
   */
  mockMultipart() {
    const url = 'http://multipart.domain.com/';
    this.srv.respondWith('POST', url, (xhr) => {
      const rsp = {
        headers: xhr.requestHeaders,
        payload: xhr.requestBody
      };
      xhr.respond(200, {
        'Content-Type': 'text/plain'
      }, JSON.stringify(rsp));
    });
  }
}
