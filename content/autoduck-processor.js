/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 "use strict";

class AutoDuckProcessor extends AudioWorkletProcessor {
  process (inputs, outputs, parameters) {
    let outputChannels = outputs[0];
    let inputChannels = inputs[0];

    for (let i = 0; i < outputChannels.length; ++i) {
      let inputChannel = inputChannels[i];
      if (!inputChannel) {
        continue;
      }
      let outputChannel = outputChannels[i];

      for (let j = 0; j < inputChannel.length; ++j) {
        outputChannel[j] = inputChannel[j];
      }
    }

    return true;


    this.current++;
    /*
    let duckeeChannels = [inputs[0], inputs[1]];
    let duckerChannels = [inputs[2], inputs[3]];
    let outputChannels = outputs[0];


/*
    let duck = false;
    console.log("Here", inputs);
    for (let i = 0; i < duckerChannels[0].length; ++i) {
      if (duckerChannels[0][i] > 0.5) {
        let duck = true;
      }
    }
    console.log("Duck?", duck);

/*
    for (let i = 0; i < outputChannels.length; ++i) {
      let channel = outputChannels[i];
      for (let j = 0; j < channel.length; ++j) {
        channel[j] = inputs[0][j];
      }
    }
*/
    return true;
  }
}

registerProcessor("autoduck-processor", AutoDuckProcessor)
