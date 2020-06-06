/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 "use strict";

const THRESHOLD = 0.01;
const DUCK_PROPORTION = 0.1;
const MAX_LEVEL = 1.0;

const NORMAL = 0;
const DUCK = 1;

const FADE_DOWN = 0;
const STAY_DOWN = 1;
const FADE_UP = 2;
const STAY_UP = 3;

class AutoDuckProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.state = NORMAL;
  }

  process(inputs, outputs, parameters) {
    let duckeeInputChannels = inputs[0];
    let duckeeOutputChannels = outputs[0];

    let duckerInputChannels = inputs[1];
    let duckerOutputChannels = outputs[1];

    let allSilence = true;
    let newState = null;
    for (let i = 0; i < duckerInputChannels.length; ++i) {
      let inputChannel = duckerInputChannels[i];
      let outputChannel = duckerOutputChannels[i];

      for (let j = 0; j < inputChannel.length; ++j) {
        if (inputChannel[j] > THRESHOLD) {
          allSilence = false;
          newState = DUCK;
        }
        outputChannel[j] = inputChannel[j];
      }
    }

    if (allSilence) {
      newState = NORMAL;
    }

    let operation = null;
    if (this.state == NORMAL && newState == DUCK) {
      operation = FADE_DOWN;
    } else if (this.state == DUCK && newState == DUCK) {
      operation = STAY_DOWN;
    } else if (this.state == DUCK && newState == NORMAL) {
      operation = FADE_UP;
    } else if (this.state == NORMAL && newState == NORMAL) {
      operation = STAY_UP;
    }

    this.state = newState;

    for (let i = 0; i < duckeeInputChannels.length; ++i) {
      let inputChannel = duckeeInputChannels[i];
      let outputChannel = duckeeOutputChannels[i];

      let samples = inputChannel.length;
      let slope, y0;

      switch (operation) {
        case STAY_DOWN: {
          slope = 0;
          y0 = DUCK_PROPORTION;
          break;
        }
        case STAY_UP: {
          slope = 0;
          y0 = MAX_LEVEL;
          break;
        }
        case FADE_UP: {
          slope = (MAX_LEVEL - DUCK_PROPORTION) / samples;
          y0 = DUCK_PROPORTION;
          break;
        }
        case FADE_DOWN: {
          slope = (DUCK_PROPORTION - MAX_LEVEL) / samples;
          y0 = MAX_LEVEL;
          break;
        }
      }

      for (let j = 0; j < samples; ++j) {
        outputChannel[j] = inputChannel[j] * ((slope * j) + y0);
      }
    }

    return true;
  }
}

registerProcessor("autoduck-processor", AutoDuckProcessor)
