/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/**
 * This is a quick and dirty autoducker. It takes two inputs - the original
 * audio track for a video, and a commentary track. It feeds those inputs
 * back to the outputs, but cuts back the original audio track by
 * CUTBACK_RATIO if sufficient signal has been detected on the commentary
 * track.
 */

const CUTBACK_RATIO = 0.2;
const THRESHOLD = 0.01;
const MAX_CONSECUTIVE_BELOW_THRESHOLDS = 500;

const STATE_NORMAL = 0;
const STATE_DUCK = 1;

let gConsecutiveBelowThresholds = 0;
let gState = STATE_NORMAL;

class CommentaryProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    let originalInputChannels = inputs[0];
    let originalOutputChannels = outputs[0];

    let commentaryInputChannels = inputs[1];
    let commentaryOutputChannels = outputs[1];

    let belowThreshold = true;
    let isMono = commentaryInputChannels.length <= 1;

    // An AudioWorkletProcessor only receives a small set of samples
    // per call to process, which isn't enough to determine whether or
    // not sufficient "silence" has passed to enter STATE_NORMAL. We instead
    // keep track of how many consecutive process calls result in no samples
    // being over THRESHOLD. If we've seen MAX_CONSECUTIVE_BELOW_THRESHOLDS
    // consecutive process calls with no samples over the threshold, then we
    // enter STATE_NORMAL. Otherwise, we enter STATE_DUCK.
    if (commentaryInputChannels.length) {
      for (
        let channel = 0;
        channel < commentaryOutputChannels.length;
        ++channel
      ) {
        for (
          let sampleIndex = 0;
          sampleIndex < commentaryOutputChannels[channel].length;
          ++sampleIndex
        ) {
          let sample = isMono
            ? commentaryInputChannels[0][sampleIndex]
            : commentaryInputChannels[channel][sampleIndex];
          if (Math.abs(sample) > THRESHOLD) {
            belowThreshold = false;
          }
          commentaryOutputChannels[channel][sampleIndex] = sample;
        }
      }
    } else {
      belowThreshold = true;
    }

    if (belowThreshold) {
      gConsecutiveBelowThresholds++;
    } else {
      if (gConsecutiveBelowThresholds > MAX_CONSECUTIVE_BELOW_THRESHOLDS) {
        gState = STATE_DUCK;
      }
      gConsecutiveBelowThresholds = 0;
    }

    if (gConsecutiveBelowThresholds > MAX_CONSECUTIVE_BELOW_THRESHOLDS) {
      gState = STATE_NORMAL;
    }

    for (let i = 0; i < originalInputChannels.length; ++i) {
      let originalInputChannel = originalInputChannels[i];
      let originalOutputChannel = originalOutputChannels[i];

      for (let j = 0; j < originalInputChannel.length; ++j) {
        let ratio = (gState == STATE_DUCK) ? CUTBACK_RATIO : 1.0;
        originalOutputChannel[j] = originalInputChannel[j] * ratio;
      }
    }

    return true;
  }
}

registerProcessor("commentary-processor", CommentaryProcessor);
