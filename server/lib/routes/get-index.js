/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const flowMetrics = require('../flow-metrics');
const logger = require('../logging/log')('routes.index');

module.exports = function (config) {
  const featureFlags = require('fxa-shared/feature-flags')(config.get('featureFlags'), {});

  const AUTH_SERVER_URL = config.get('fxaccount_url');
  const CLIENT_ID = config.get('oauth_client_id');
  const COPPA_ENABLED = config.get('coppa.enabled');
  const ENV = config.get('env');
  const FLOW_ID_KEY = config.get('flow_id_key');
  const MARKETING_EMAIL_API_URL = config.get('marketing_email.api_url');
  const MARKETING_EMAIL_ENABLED = config.get('marketing_email.enabled');
  const MARKETING_EMAIL_PREFERENCES_URL = config.get('marketing_email.preferences_url');
  const OAUTH_SERVER_URL = config.get('oauth_url');
  const PROFILE_SERVER_URL = config.get('profile_url');
  const STATIC_RESOURCE_URL = config.get('static_resource_url');
  const SCOPED_KEYS_ENABLED = config.get('scopedKeys.enabled');
  const SCOPED_KEYS_VALIDATION = config.get('scopedKeys.validation');
  // add version from package.json to config
  const RELEASE = require('../../../package.json').version;
  const WEBPACK_PUBLIC_PATH = `${STATIC_RESOURCE_URL}/${config.get('jsResourcePath')}/`;

  const serializedConfig = encodeURIComponent(JSON.stringify({
    authServerUrl: AUTH_SERVER_URL,
    env: ENV,
    isCoppaEnabled: COPPA_ENABLED,
    marketingEmailEnabled: MARKETING_EMAIL_ENABLED,
    marketingEmailPreferencesUrl: MARKETING_EMAIL_PREFERENCES_URL,
    marketingEmailServerUrl: MARKETING_EMAIL_API_URL,
    oAuthClientId: CLIENT_ID,
    oAuthUrl: OAUTH_SERVER_URL,
    profileUrl: PROFILE_SERVER_URL,
    release: RELEASE,
    scopedKeysEnabled: SCOPED_KEYS_ENABLED,
    scopedKeysValidation: SCOPED_KEYS_VALIDATION,
    staticResourceUrl: STATIC_RESOURCE_URL,
    webpackPublicPath: WEBPACK_PUBLIC_PATH,
  }));

  const NO_LONGER_SUPPORTED_CONTEXTS = new Set([
    'fx_desktop_v1'
  ]);

  return {
    method: 'get',
    path: '/',
    process: function (req, res) {
      const flowEventData = flowMetrics.create(FLOW_ID_KEY, req.headers['user-agent']);

      if (NO_LONGER_SUPPORTED_CONTEXTS.has(req.query.context)) {
        return res.redirect(`/update_firefox?${req.originalUrl.split('?')[1]}`);
      }

      res.render('index', {
        // Note that bundlePath is added to templates as a build step
        bundlePath: '/bundle',
        config: serializedConfig,
        featureFlags: encodeURIComponent(JSON.stringify(await featureFlags.get())),
        flowBeginTime: flowEventData.flowBeginTime,
        flowId: flowEventData.flowId,
        // Note that staticResourceUrl is added to templates as a build step
        staticResourceUrl: STATIC_RESOURCE_URL
      });

      if (req.headers.dnt === '1') {
        logger.info('request.headers.dnt');
      }
    }
  };
};
