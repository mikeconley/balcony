/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 "use strict";

const VIDEO_EVENTS = [
  "canplay",
  "playing",
  "pause",
];

class BalconyContent {
  constructor(commentaryURL, videoSelector = null) {
    this.commentaryURL = commentaryURL;
    this.videoSelector = videoSelector;
    this.audio = null;
    this.video = null;
  }

  attach() {
    let selector = this.videoSelector || "video";
    this.video = document.querySelector(selector);
    if (!this.video) {
      console.error("Balcony can't find the video to attach to.");
      return;
    }

    this.audio = document.createElement("audio");
    this.audio.src = this.commentaryURL;
    this.audio.crossOrigin = "anonymous";
    this.audio.addEventListener("canplay", this);
    document.body.appendChild(this.audio);

    for (let eventType of BalconyContent.VIDEO_EVENTS) {
      this.video.addEventListener(eventType, this);
    }
  }

  handleEvent(event) {
    if (event.target == this.video) {
      this.onVideoEvent(event);
    } else if (event.target == this.audio) {
      this.onAudioEvent(event);
    }
  }

  onVideoEvent(event) {
    switch(event.type) {
      case "canplay": {
        this.onVideoCanPlay();
        break;
      }
      case "playing": {
        this.onVideoPlaying();
        break;
      }
      case "pause": {
        this.onVideoPause();
        break;
      }
    }
  }

  onVideoCanPlay() {
    if (this.audioReady) {
      this.videoAndAudioReady();
    }
  }

  onVideoPlaying() {
    if (this.audioReady && this.audio.paused) {
      this.resyncVideoAndAudio();
      this.audio.play();
    }
  }

  onVideoPause() {
    if (this.audioReady) {
      this.audio.pause();
      this.resyncVideoAndAudio();
    }
  }

  onAudioEvent(event) {
    switch(event.type) {
      case "canplay": {
        this.onAudioCanPlay();
        break;
      }
    }
  }

  onAudioCanPlay() {
    if (this.videoReady) {
      this.videoAndAudioReady();
    }
  }

  async videoAndAudioReady() {
    if (this.audioCtx) {
      return;
    }

    if (!this.video.paused) {
      this.onVideoPlaying();
    }

    this.audioCtx = new AudioContext();
    let duckProcessor = browser.runtime.getURL("content/autoduck-processor.js");
    await this.audioCtx.audioWorklet.addModule(duckProcessor);

    this.videoSource = this.audioCtx.createMediaElementSource(this.video);
    this.audioSource = this.audioCtx.createMediaElementSource(this.audio);

    this.autoDuckNode = new AudioWorkletNode(this.audioCtx, "autoduck-processor");
    this.videoSource.connect(this.autoDuckNode, 0, 0);
    this.audioSource.connect(this.autoDuckNode, 0, 1);
    this.autoDuckNode.connect(this.audioCtx.destination);
  }

  resyncVideoAndAudio() {
    this.audio.currentTime = this.video.currentTime;
  }

  get videoReady() {
    return this.video.readyState >= this.video.HAVE_FUTURE_DATA;
  }

  get audioReady() {
    return this.audio.readyState >= this.audio.HAVE_FUTURE_DATA;
  }

  static get VIDEO_EVENTS() {
    return VIDEO_EVENTS;
  }
};

