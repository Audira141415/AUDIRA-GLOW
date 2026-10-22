---
name: audio-system-manager
description: Audio playback engine supporting dual-codecs (.ogg / .m4a), biome-based BGM playback, combat sound effects, and volume mixer controls.
---

# Audio System Manager Skill

This skill explains how background music (BGM) and sound effects (SFX) are loaded, played, and modulated across different game biomes and combat scenarios.

## 1. Dual-Codec Web Audio Controller

```javascript
export class AudioManager {
  constructor() {
    this.bgmAudio = new Audio();
    this.bgmAudio.loop = true;
    this.sfxPool = [];
    this.bgmVolume = 0.5;
    this.sfxVolume = 0.8;
  }

  playBGM(trackName) {
    // Prefer modern OGG, fallback to M4A/AAC
    const canPlayOgg = this.bgmAudio.canPlayType('audio/ogg; codecs="vorbis"');
    const ext = canPlayOgg ? 'ogg' : 'm4a';
    this.bgmAudio.src = `/sound/bgm/${trackName}.${ext}`;
    this.bgmAudio.volume = this.bgmVolume;
    this.bgmAudio.play().catch(e => console.warn("Autoplay blocked until user interaction:", e));
  }

  playSFX(sfxName) {
    const sfx = new Audio(`/sound/sfx/${sfxName}.ogg`);
    sfx.volume = this.sfxVolume;
    sfx.play();
  }

  setVolume(bgm, sfx) {
    this.bgmVolume = bgm;
    this.sfxVolume = sfx;
    this.bgmAudio.volume = bgm;
  }
}
```

## 2. Biome to BGM Mapping
- **Coral Bay / Tropical:** `bgm_beach_day.ogg`
- **Sproutvale / Grassland:** `bgm_meadow_peace.ogg`
- **Verdant Reach / Dense Forest:** `bgm_forest_mystery.ogg`
- **Frosthaven / Frozen Tundra:** `bgm_snow_winds.ogg`
- **Emberdune / Lava Desert:** `bgm_desert_heat.ogg`
- **Moonveil / Void Nebula:** `bgm_cosmic_abyss.ogg`
- **Boss Arena:** `bgm_field_boss_clash.ogg`
