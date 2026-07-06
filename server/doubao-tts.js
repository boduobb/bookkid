const https = require('https');
const crypto = require('crypto');

const DOUBAO_TTS_API_KEY = process.env.DOUBAO_TTS_API_KEY || process.env.DOUBAO_API_KEY;
const DOUBAO_TTS_RESOURCE_ID = process.env.DOUBAO_TTS_RESOURCE_ID || 'seed-tts-2.0';
const DOUBAO_TTS_SPEAKER = process.env.DOUBAO_TTS_SPEAKER || 'zh_female_xiaoyu';
const TTS_URL = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';

function synthesizeSpeech(text) {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();

    const requestBody = {
      req_params: {
        text: text,
        speaker: DOUBAO_TTS_SPEAKER,
        audio_params: {
          format: 'mp3',
          sample_rate: 24000,
          speech_rate: 0,
          loudness_rate: 0
        }
      }
    };

    const payload = JSON.stringify(requestBody);

    const options = {
      hostname: 'openspeech.bytedance.com',
      port: 443,
      path: '/api/v3/tts/unidirectional',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': DOUBAO_TTS_API_KEY,
        'X-Api-Resource-Id': DOUBAO_TTS_RESOURCE_ID,
        'X-Api-Request-Id': requestId
      }
    };

    const chunks = [];

    const req = https.request(options, (res) => {
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);

        if (res.statusCode !== 200) {
          reject(new Error(`TTS请求失败: ${res.statusCode} ${buffer.toString('utf8')}`));
          return;
        }

        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            const result = JSON.parse(buffer.toString('utf8'));
            if (result.resp_params && result.resp_params.audio) {
              const audioBuffer = Buffer.from(result.resp_params.audio, 'base64');
              resolve(audioBuffer);
            } else if (result.error) {
              reject(new Error(result.error.message || 'TTS合成失败'));
            } else {
              reject(new Error('TTS返回格式错误: ' + JSON.stringify(result).substring(0, 200)));
            }
          } catch (err) {
            reject(new Error('TTS响应解析失败: ' + err.message));
          }
        } else if (contentType.includes('audio') || contentType.includes('octet-stream')) {
          resolve(buffer);
        } else {
          if (buffer.length > 0 && buffer[0] === 0x49 && buffer[1] === 0x44) {
            resolve(buffer);
          } else {
            try {
              const result = JSON.parse(buffer.toString('utf8'));
              if (result.error) {
                reject(new Error(result.error.message || 'TTS合成失败'));
              } else {
                reject(new Error('TTS未知响应格式: ' + buffer.toString('utf8').substring(0, 200)));
              }
            } catch (e) {
              resolve(buffer);
            }
          }
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = {
  synthesizeSpeech
};
