/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 "use strict";

/**
 * Just hardcoding a video and some commentary right now until I figure out the
 * proper scheme for subscribing to / discovering commentary that scales well and
 * doesn't send user visits to some server somewhere.
 */
if (window.location == "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4") {
  let balcony = new BalconyContent("https://ia601406.us.archive.org/4/items/big-buck-bunny-balcony-test-commentary/Big%20Buck%20Bunny%20-%20Balcony%20Test%20Commentary.ogg");
  balcony.attach();
}
