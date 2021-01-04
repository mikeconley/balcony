/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 "use strict";

browser.runtime.onMessage.addListener(
  (message, sender) => {
    if (message.command === "attach") {
      let balcony = new BalconyContent(message.commentaryUrl, message.cssSelector);
      balcony.attach();
      return Promise.resolve('done');
    }
  }
);
