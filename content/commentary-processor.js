/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 "use strict";

const CUTBACK_RATIO = 0.7;
const THRESHOLD = 0.01;
const MAX_CONSECUTIVE_BELOW_THRESHOLDS = 500;
const STATE_NORMAL = 0;
const STATE_DUCK = 1;

let gConsecutiveBelowThresholds = 0;
let gState = STATE_NORMAL;

let logBumper = 0;

class CommentaryProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    logBumper++;

    let originalInputChannels = inputs[0];
    let originalOutputChannels = outputs[0];

    let commentaryInputChannels = inputs[1];
    let commentaryOutputChannels = outputs[1];

    let belowThreshold = true;
    let isMono = commentaryInputChannels.length <= 1;

    if (commentaryInputChannels.length) {
      for (let channel = 0; channel < commentaryOutputChannels.length; ++channel) {
        for (let sampleIndex = 0; sampleIndex < commentaryOutputChannels[channel].length; ++sampleIndex) {
          let sample = isMono ? commentaryInputChannels[0][sampleIndex]
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

        if (gState == STATE_DUCK) {
          originalOutputChannel[j] = originalInputChannel[j] * 0.2;
        } else {
          originalOutputChannel[j] = originalInputChannel[j];
        }
      }
    }

    return true;
  }
}

registerProcessor("commentary-processor", CommentaryProcessor)
