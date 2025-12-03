
// Shared AudioContext to prevent "max number of hardware contexts reached" error
let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ 
      sampleRate: 24000,
      latencyHint: 'interactive'
    });
  }
  // Try to resume if suspended (common browser policy)
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(e => console.warn("Audio Resume warning:", e));
  }
  return sharedAudioContext;
}

// Decodes base64 string to raw bytes
export function decodeBase64(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 decode error", e);
    return new Uint8Array(0);
  }
}

// Helper to convert Base64 Image to Blob URL (Much lighter on RAM than large Base64 strings)
export function base64ToBlobUrl(base64: string, mimeType: string = 'image/png'): string {
  try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      return URL.createObjectURL(blob);
  } catch(e) {
      console.error("Blob conversion error", e);
      return "";
  }
}

// Decodes raw PCM data (Gemini output) into an AudioBuffer
export async function decodeAudioData(
  data: Uint8Array,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  
  // Safety check for empty data
  if (data.length === 0) {
      // Return a silent 1s buffer to prevent crash
      return ctx.createBuffer(1, sampleRate, sampleRate);
  }

  try {
      const dataInt16 = new Int16Array(data.buffer);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
          // Convert Int16 to Float32 [-1.0, 1.0]
          channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
      }
      return buffer;
  } catch (e) {
      console.error("Audio Decode Error:", e);
      // Return silent buffer on fail
      return ctx.createBuffer(1, sampleRate, sampleRate);
  }
}

// Convert AudioBuffer to WAV Blob for download/playback via URL
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this app)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while (pos < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArray], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
