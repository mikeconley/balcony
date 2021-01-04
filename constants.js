/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-disable no-unused-vars */

"use strict";

const DEFAULT_UPDATE_INTERVAL = 60; // minutes
const ALARM_NAME = "check-for-updates";
const UPDATE_ON_INIT_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 1 day, in milliseconds

// Anytime we want to alert the user about changes in the changelog, we should
// bump the revision number here.
const FEATURE_ALERT_REV = 1;
const FEATURE_ALERT_BG_COLOR = "#EC9329";
const FEATURE_ALERT_STRING = "New";

const HTTP_NOT_MODIFIED = 304;

