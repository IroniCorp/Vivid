import { AudioListener, PositionalAudio, Audio, AudioLoader } from 'three';
import { Component } from '../Component';

export class AudioComponent extends Component {
    constructor(options = {}) {
        super();
        this.audioType = options.positional ? 'positional' : 'global';
        this.volume = options.volume || 1.0;
        this.loop = options.loop || false;
        this.autoplay = options.autoplay || false;
        this.url = options.url || '';
        this.audio = null;
        this.isPlaying = false;
    }

    onAttach() {
        // Create audio listener if it doesn't exist in the scene
        if (!this.object.scene.audioListener) {
            const camera = this.object.scene.camera;
            if (camera) {
                const listener = new AudioListener();
                camera.add(listener);
                this.object.scene.audioListener = listener;
            }
        }

        // Create audio source
        if (this.audioType === 'positional') {
            this.audio = new PositionalAudio(this.object.scene.audioListener);
        } else {
            this.audio = new Audio(this.object.scene.audioListener);
        }

        this.audio.setVolume(this.volume);
        this.audio.setLoop(this.loop);

        // Load audio if URL is provided
        if (this.url) {
            this.load(this.url);
        }

        this.object.add(this.audio);
    }

    onDetach() {
        if (this.audio) {
            this.stop();
            this.object.remove(this.audio);
            this.audio = null;
        }
    }

    load(url) {
        return new Promise((resolve, reject) => {
            const loader = new AudioLoader();
            loader.load(url, 
                (buffer) => {
                    this.audio.setBuffer(buffer);
                    if (this.autoplay) {
                        this.play();
                    }
                    resolve(buffer);
                },
                undefined,
                (error) => {
                    console.error('Error loading audio:', error);
                    reject(error);
                }
            );
        });
    }

    play() {
        if (this.audio && this.audio.buffer && !this.isPlaying) {
            this.audio.play();
            this.isPlaying = true;
        }
    }

    pause() {
        if (this.audio && this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        }
    }

    stop() {
        if (this.audio) {
            this.audio.stop();
            this.isPlaying = false;
        }
    }

    setVolume(value) {
        if (this.audio) {
            this.volume = Math.max(0, Math.min(1, value));
            this.audio.setVolume(this.volume);
        }
    }

    setLoop(value) {
        if (this.audio) {
            this.loop = value;
            this.audio.setLoop(value);
        }
    }

    // For positional audio only
    setRefDistance(value) {
        if (this.audio && this.audio instanceof PositionalAudio) {
            this.audio.setRefDistance(value);
        }
    }

    setRolloffFactor(value) {
        if (this.audio && this.audio instanceof PositionalAudio) {
            this.audio.setRolloffFactor(value);
        }
    }

    toJSON() {
        return {
            ...super.toJSON(),
            audioType: this.audioType,
            volume: this.volume,
            loop: this.loop,
            autoplay: this.autoplay,
            url: this.url
        };
    }

    fromJSON(json) {
        super.fromJSON(json);
        this.audioType = json.audioType;
        this.volume = json.volume;
        this.loop = json.loop;
        this.autoplay = json.autoplay;
        this.url = json.url;
    }
} 