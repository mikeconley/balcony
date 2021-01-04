/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

class Balcony {
  async init({ alertRev = FEATURE_ALERT_REV, } = {}) {
    browser.alarms.onAlarm.addListener(this.onAlarm.bind(this));
    browser.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));
    browser.pageAction.onClicked.addListener(this.onPageActionClicked.bind(this));

    console.debug("Looking for feature rev");
    let { featureRev, } = await browser.storage.local.get("featureRev");
    if (!featureRev) {
      console.debug("No feature rev - this is a first timer.");
      featureRev = alertRev;
      await browser.storage.local.set({ featureRev, });
    } else {
      console.debug("Got feature rev ", featureRev);
    }

    this.featureRev = featureRev;

    let { updateInterval, } = await browser.storage.local.get("updateInterval");
    if (!updateInterval) {
      updateInterval = DEFAULT_UPDATE_INTERVAL;
      await browser.storage.local.set({
        updateInterval,
      });
    }
    this.updateInterval = updateInterval;

    let { lastUpdate, } = await browser.storage.local.get("lastUpdate");
    let { providers, } = await browser.storage.local.get("providers");
    this.providers = providers || [];

    if (!this.providers.length) {
      this.providers.push({
        name: "Mike Conley's Video Commentary",
        url: "https://mikeconley.ca/balcony/balcony.json",
      });
    }

    if (!lastUpdate || (lastUpdate - Date.now()) < UPDATE_ON_INIT_THRESHOLD_MS) {
      await this.update();
    }
  }

  uninit() {
    delete this.providers;
    delete this.updateInterval;
    delete this.featureRev;
  }

  onAlarm(alarmInfo) {

  }

  async update() {
    for (let provider of this.providers) {
      let headers = {
        "Content-Type": "application/json",
      }

      if (provider.ETag) {
        headers["If-None-Match"] = provider.ETag;
      }

      let request = new Request(provider.url, {
        method: "GET",
        headers,
        redirect: "follow",
      });

      let response = await window.fetch(request);
      if (response.status == HTTP_NOT_MODIFIED) {
        continue;
      }

      if (!response.ok) {
        console.error(`Failed to update Balcony provider ${provider.name} `
          + `at ${provider.url}: status code ${response.status}`);
        continue;
      }

      let payload = await response.json();
      provider.payload = payload;
      if (response.headers.has("ETag")) {
        provider.ETag = response.headers.get("ETag");
      }
    }

    this.commentarySets = this.updateCommentarySets(this.providers);

    await browser.storage.local.set({
      providers: this.providers,
      lastUpdate: Date.now(),
    });
  }

  updateCommentarySets(providers) {
    let result = new Map();

    for (let provider of providers) {
      for (let commentary of provider.payload) {
        let commentarySet = result.get(commentary.url) || [];
        commentarySet.push(commentary);
        result.set(commentary.url, commentarySet);
      }
    }

    return result;
  }

  onTabUpdated(tabId, changeInfo) {
    if (changeInfo.url) {
      let hasCommentary = this.commentarySets.has(changeInfo.url);
      if (hasCommentary) {
        browser.pageAction.show(tabId);
      } else {
        browser.pageAction.hide(tabId);
      }
    }
  }

  onPageActionClicked(tab, clickData) {
    let commentarySet = this.commentarySets.get(tab.url);
    if (!commentarySet) {
      return;
    }

    let commentary = commentarySet[0];

    browser.tabs.sendMessage(tab.id, {
      command: "attach",
      commentaryUrl: commentary.commentaryUrl,
      cssSelector: commentary.cssSelector,
    });
  }
}

new Balcony().init();
