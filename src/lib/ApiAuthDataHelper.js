/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
import { UiDataHelper } from '@advanced-rest-client/authorization';
import CustomAuth from './auth-ui/CustomAuth.js';
import ApiKeyAuth from './auth-ui/ApiKeyAuth.js';
import PassThroughAuth from './auth-ui/PassThroughAuth.js';
import OAuth2Auth from './auth-ui/OAuth2Auth.js';

/** @typedef {import('@advanced-rest-client/authorization').AuthUiInit} AuthUiInit */
/** @typedef {import('../elements/ApiAuthorizationMethodElement').default} ApiAuthorizationElement */

export class ApiAuthDataHelper extends UiDataHelper {
  /**
   * @param {ApiAuthorizationElement} element
   * @param {AuthUiInit} init
   */
  static setupCustom(element, init) {
    const i = new CustomAuth(init);
    i.amf = element.amf;
    i.security = element.security;
    i.descriptionOpened = element.descriptionOpened;
    i.globalCache = element.globalCache;
    i.compatibility = element.compatibility;
    return i;
  }

  /**
   * @param {ApiAuthorizationElement} element
   * @param {CustomAuth} ui
   */
  static populateCustom(element, ui) {
    element.schemeName = ui.schemeName;
    element.schemeDescription = ui.schemeDescription;
  }

  /**
   * @param {ApiAuthorizationElement} element
   * @param {AuthUiInit} init
   */
  static setupApiKey(element, init) {
    const i = new ApiKeyAuth(init);
    i.amf = element.amf;
    i.security = element.security;
    i.globalCache = element.globalCache;
    return i;
  }

  /**
   * @param {ApiAuthorizationElement} element
   * @param {ApiKeyAuth} ui
   */
  static populateApiKey(element, ui) {
    // ...
  }

  /**
   * @param {ApiAuthorizationElement} element
   * @param {AuthUiInit} init
   */
  static setupPassThrough(element, init) {
    const i = new PassThroughAuth(init);
    i.amf = element.amf;
    i.security = element.security;
    i.descriptionOpened = element.descriptionOpened;
    i.globalCache = element.globalCache;
    i.compatibility = element.compatibility;
    return i;
  }

  /**
   * @param {ApiAuthorizationElement} element
   * @param {PassThroughAuth} ui
   */
  static populatePassThrough(element, ui) {
    element.schemeName = ui.schemeName;
    element.schemeDescription = ui.schemeDescription;
  }

  /**
   * @param {ApiAuthorizationElement} element
   * @param {AuthUiInit} init
   */
  static setupOauth2(element, init) {
    const i = new OAuth2Auth(init);
    i.amf = element.amf;
    i.security = element.security;
    i.globalCache = element.globalCache;
    // @ts-ignore
    UiDataHelper.setOAuth2Values(element, init);
    return i;
  }
}
