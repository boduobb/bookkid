const WebSocket = require('ws');
const fs = require('fs');
const crypto = require('crypto');

const DOUBAO_ASR_API_KEY = process.env.DOUBAO_ASR_API_KEY || process.env.DOUBAO_API_KEY;
const DOUBAO_ASR_RESOURCE_ID = process.env.DOUBAO_ASR_RESOURCE_ID || 'volc.bigasr.sauc.duration';
const ASR_URL = 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_nostream';

const PROTOCOL_VERSION = 0b0001;
const HEADER_SIZE = 0b0001;

const MESSAGE_TYPE_FULL_CLIENT_REQUEST = 0b0001;
const MESSAGE_TYPE_AUDIO_ONLY_REQUEST = 0b0010;
const MESSAGE_TYPE_FULL_SERVER_RESPONSE = 0b1001;
const MESSAGE_TYPE_ERROR = 0b1111;

const SERIALIZE_METHOD_JSON = 0b0001;
const SERIALIZE_METHOD_RAW = 0b0000;

const NO_SEQUENCE = 0b0000;
const POS_SEQUENCE = 0b0001;
const NEG_SEQUENCE_WITH_SEQUENCE = 0b0011;
const NEG_SEQUENCE_LAST = 0b0010;

const NO_COMPRESSION = 0b0000;
const GZIP_COMPRESSION = 0b0001;

function buildHeader(messageType, messageTypeSpecificFlags, serialization, compression) {
  const byte0 = (PROTOCOL_VERSION << 4) | HEADER_SIZE;
  const byte1 = (messageType << 4) | messageTypeSpecificFlags;
  const byte2 = (serialization << 4) | compression;
  const byte3 = 0x00;
  return Buffer.from([byte0, byte1, byte2, byte3]);
}

function buildFullClientRequest(config) {
  const payload = Buffer.from(JSON.stringify(config), 'utf8');
  const header = buildHeader(
    MESSAGE_TYPE_FULL_CLIENT_REQUEST,
    NO_SEQUENCE,
    SERIALIZE_METHOD_JSON,
    NO_COMPRESSION
  );
  const payloadSize = Buffer.alloc(4);
  payloadSize.writeUInt32BE(payload.length, 0);
  return Buffer.concat([header, payloadSize, payload]);
}

function buildAudioOnlyRequest(audioData, isLast, sequence) {
  const hasSequence = !isLast;
  const flags = isLast ? NEG_SEQUENCE_LAST : POS_SEQUENCE;
  const header = buildHeader(
    MESSAGE_TYPE_AUDIO_ONLY_REQUEST,
    flags,
    SERIALIZE_METHOD_RAW,
    NO_COMPRESSION
  );
  const parts = [header];
  if (hasSequence) {
    const seqBuf = Buffer.alloc(4);
    seqBuf.writeUInt32BE(sequence, 0);
    parts.push(seqBuf);
  }
  const payloadSize = Buffer.alloc(4);
  payloadSize.writeUInt32BE(audioData.length, 0);
  parts.push(payloadSize);
  parts.push(audioData);
  return Buffer.concat(parts);
}

function parseServerResponse(data) {
  if (data.length < 4) return null;
  const header = data.slice(0, 4);
  const messageType = (header[1] >> 4) & 0x0F;
  const messageTypeSpecificFlags = header[1] & 0x0F;
  const serialization = (header[2] >> 4) & 0x0F;
  const compression = header[2] & 0x0F;

  let offset = 4;

  if (messageType === MESSAGE_TYPE_ERROR) {
    const payloadSize = data.readUInt32BE(offset);
    offset += 4;
    const payload = data.slice(offset, offset + payloadSize);
    return { type: 'error', message: payload.toString('utf8') };
  }

  const isLast = (messageTypeSpecificFlags & 0x02) !== 0;

  const payloadSize = data.readUInt32BE(offset);
  offset += 4;
  const payload = data.slice(offset, offset + payloadSize);

  let result;
  if (serialization === SERIALIZE_METHOD_JSON) {
    try {
      result = JSON.parse(payload.toString('utf8'));
    } catch (e) {
      result = { raw: payload.toString('utf8') };
    }
  } else {
    result = { raw: payload };
  }

  return {
    type: messageType === MESSAGE_TYPE_FULL_SERVER_RESPONSE ? 'response' : 'other',
    isLast: isLast,
    data: result
  };
}

function recognizeAudio(audioPath) {
  return new Promise((resolve, reject) => {
    const audioBuffer = fs.readFileSync(audioPath);
    const connectId = crypto.randomUUID();

    const ws = new WebSocket(ASR_URL, {
      headers: {
        'X-Api-Key': DOUBAO_ASR_API_KEY,
        'X-Api-Resource-Id': DOUBAO_ASR_RESOURCE_ID,
        'X-Api-Connect-Id': connectId
      }
    });

    let fullText = '';
    let resolved = false;

    ws.on('open', () => {
      console.log('ASR WebSocket连接成功');
      const config = {
        user: { uid: 'xiaoshutong-' + Date.now() },
        audio: {
          format: 'mp3',
          rate: 16000,
          channel: 1,
          codec: 'mp3'
        },
        request: {
          model_name: 'bigmodel',
          enable_itn: true,
          enable_punc: true
        }
      };

      console.log('ASR发送配置:', JSON.stringify(config));
      ws.send(buildFullClientRequest(config));

      const chunkSize = 3200;
      let offset = 0;
      let seq = 2;
      const totalLength = audioBuffer.length;
      const sendNext = () => {
        if (offset >= totalLength) {
          console.log('ASR发送最后一包');
          ws.send(buildAudioOnlyRequest(Buffer.alloc(0), true));
          return;
        }
        const end = Math.min(offset + chunkSize, totalLength);
        const chunk = audioBuffer.slice(offset, end);
        ws.send(buildAudioOnlyRequest(chunk, false, seq));
        seq++;
        offset = end;
        setTimeout(sendNext, 100);
      };
      sendNext();
    });

    ws.on('message', (data) => {
      console.log('ASR收到消息，长度:', data.length);
      const resp = parseServerResponse(data);
      console.log('ASR解析结果:', JSON.stringify(resp).substring(0, 500));
      if (!resp) return;

      if (resp.type === 'error') {
        if (!resolved) {
          resolved = true;
          ws.close();
          reject(new Error(resp.message || '语音识别失败'));
        }
        return;
      }

      if (resp.data && resp.data.result) {
        const resultData = resp.data.result;
        if (resultData.text) {
          fullText = resultData.text;
        }
        if (Array.isArray(resultData.utterances)) {
          fullText = resultData.utterances.map(u => u.text || '').join('');
        }
      }

      if (resp.isLast) {
        if (!resolved) {
          resolved = true;
          ws.close();
          resolve(fullText.trim());
        }
      }
    });

    ws.on('error', (err) => {
      console.log('ASR WebSocket错误:', err.message);
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    ws.on('close', (code, reason) => {
      console.log('ASR WebSocket关闭, code:', code, 'reason:', reason?.toString());
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { ws.close(); } catch (e) {}
        if (fullText) {
          resolve(fullText.trim());
        } else {
          reject(new Error('语音识别超时'));
        }
      }
    }, 30000);
  });
}

module.exports = {
  recognizeAudio
};
