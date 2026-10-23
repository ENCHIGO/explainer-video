"""配音 / 配图 / 配乐的多家接入。选哪家、用哪个模型都由环境变量决定（也可写进当前目录的 .env）。

    VIDEO_TTS    = openrouter | openai | dashscope | volcengine      （默认：哪家有密钥用哪家）
    VIDEO_IMAGE  = openrouter | openai | dashscope | ark
    VIDEO_MUSIC  = openrouter | openai

密钥：
    OPENROUTER_API_KEY
    OPENAI_API_KEY + OPENAI_BASE_URL      任何 OpenAI 兼容服务：OpenAI、腾讯云、自建 new-api/one-api 网关……
    DASHSCOPE_API_KEY [+ DASHSCOPE_BASE_URL]   阿里云百炼（国际站填 https://dashscope-intl.aliyuncs.com）
    ARK_API_KEY [+ ARK_BASE_URL]               火山方舟（Seedream 配图）
    VOLC_TTS_APPID + VOLC_TTS_TOKEN [+ VOLC_TTS_CLUSTER]   火山豆包语音

可选覆盖：VIDEO_TTS_MODEL / VIDEO_TTS_VOICE / VIDEO_IMAGE_MODEL / VIDEO_IMAGE_SIZE / VIDEO_MUSIC_MODEL
"""
import base64, json, os, subprocess, tempfile, time, urllib.request, uuid


def _load_env():
    for p in ('.env', os.path.expanduser('~/.config/explainer-video/.env')):
        if os.path.exists(p):
            for line in open(p):
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"\''))


_load_env()
env = os.environ.get


def _need(*names):
    miss = [n for n in names if not env(n)]
    if miss:
        raise SystemExit(f'缺少环境变量：{", ".join(miss)}（export 一下，或写进当前目录的 .env）')


def _http(url, body=None, headers=None, timeout=600, tries=6, method=None):
    """带退避重试的请求；网络偶尔 SSL 断开属正常。返回 (bytes, content-type)。"""
    err = None
    for a in range(tries):
        try:
            data = json.dumps(body).encode() if body is not None else None
            req = urllib.request.Request(url, data=data, method=method, headers={'Content-Type': 'application/json', **(headers or {})})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read(), r.headers.get('Content-Type', '')
        except urllib.error.HTTPError as e:
            err = e.read()[:300]
            if e.code in (400, 401, 403, 404):  # 参数/鉴权错误，重试没用
                break
        except Exception as e:  # noqa: BLE001
            err = e
        time.sleep(3 + a * 4)
    raise RuntimeError(f'{url} 失败：{err!r}'[:500])


def _pick(kind, order):
    chosen = env(f'VIDEO_{kind}')
    if chosen:
        return chosen
    keys = {'openrouter': 'OPENROUTER_API_KEY', 'openai': 'OPENAI_API_KEY', 'dashscope': 'DASHSCOPE_API_KEY', 'ark': 'ARK_API_KEY', 'volcengine': 'VOLC_TTS_TOKEN'}
    for p in order:
        if env(keys[p]):
            return p
    raise SystemExit(f'没有可用的{kind}接入：至少配置一家的密钥，见 scripts/providers.py 顶部说明')


def _openai_base():
    _need('OPENAI_API_KEY')
    return (env('OPENAI_BASE_URL') or 'https://api.openai.com/v1').rstrip('/'), {'Authorization': 'Bearer ' + env('OPENAI_API_KEY')}


def _openrouter():
    _need('OPENROUTER_API_KEY')
    return 'https://openrouter.ai/api/v1', {'Authorization': 'Bearer ' + env('OPENROUTER_API_KEY')}


def _to_mp3(raw, src_ext, out, speed=1.0):
    """统一转成 44.1k 立体声 mp3（有的播放器打不开 32k 单声道）；接口不支持调速时用 atempo 补。"""
    with tempfile.NamedTemporaryFile(suffix='.' + src_ext, delete=False) as f:
        f.write(raw)
    af = ['-af', f'atempo={speed}'] if abs(speed - 1) > 0.01 else []
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f.name, *af, '-ar', '44100', '-ac', '2', '-b:a', '160k', out], check=True)
    os.unlink(f.name)


# ---------------- 配音 ----------------
TTS_DEFAULTS = {
    'openrouter': ('minimax/speech-2.8-hd', 'Chinese (Mandarin)_Laid_BackGirl'),  # 随性女孩：活泼不幼
    'openai': ('gpt-4o-mini-tts', 'coral'),
    'dashscope': ('qwen3-tts-flash', 'Cherry'),
    'volcengine': ('volcano_tts', 'BV001_streaming'),
}


def tts(text, out, speed=1.15, emotion='happy'):
    p = _pick('TTS', ['openrouter', 'openai', 'dashscope', 'volcengine'])
    model = env('VIDEO_TTS_MODEL') or TTS_DEFAULTS[p][0]
    voice = env('VIDEO_TTS_VOICE') or TTS_DEFAULTS[p][1]
    if p in ('openrouter', 'openai'):
        base, h = _openrouter() if p == 'openrouter' else _openai_base()
        body = {'model': model, 'input': text, 'voice': voice, 'response_format': 'mp3', 'speed': speed}
        if p == 'openrouter' and model.startswith('minimax/'):
            body['emotion'] = emotion
        raw, ct = _http(base + '/audio/speech', body, h, timeout=300)
        if 'json' in ct:
            raise RuntimeError(raw[:300])
        _to_mp3(raw, 'mp3', out)
    elif p == 'dashscope':
        _need('DASHSCOPE_API_KEY')
        base = (env('DASHSCOPE_BASE_URL') or 'https://dashscope.aliyuncs.com').rstrip('/')
        raw, _ = _http(base + '/api/v1/services/aigc/multimodal-generation/generation',
                       {'model': model, 'input': {'text': text, 'voice': voice, 'language_type': 'Chinese'}},
                       {'Authorization': 'Bearer ' + env('DASHSCOPE_API_KEY')}, timeout=300)
        url = json.loads(raw)['output']['audio']['url']
        _to_mp3(_http(url, timeout=300)[0], 'wav', out, speed)
    elif p == 'volcengine':
        _need('VOLC_TTS_APPID', 'VOLC_TTS_TOKEN')
        body = {'app': {'appid': env('VOLC_TTS_APPID'), 'token': env('VOLC_TTS_TOKEN'), 'cluster': env('VOLC_TTS_CLUSTER') or model},
                'user': {'uid': 'explainer-video'},
                'audio': {'voice_type': voice, 'encoding': 'mp3', 'speed_ratio': speed},
                'request': {'reqid': str(uuid.uuid4()), 'text': text, 'operation': 'query'}}
        raw, _ = _http('https://openspeech.bytedance.com/api/v1/tts', body, {'Authorization': 'Bearer;' + env('VOLC_TTS_TOKEN')}, timeout=300)
        d = json.loads(raw)
        if d.get('code') != 3000:
            raise RuntimeError(str(d)[:300])
        _to_mp3(base64.b64decode(d['data']), 'mp3', out)
    else:
        raise SystemExit(f'不认识的 VIDEO_TTS={p}')
    return p


# ---------------- 配图 ----------------
IMAGE_DEFAULTS = {
    'openrouter': ('openai/gpt-image-2.5-sunburst', '1536x1024'),
    'openai': ('gpt-image-1', '1536x1024'),
    'ark': ('doubao-seedream-4-0-250828', '2496x1664'),
    'dashscope': ('qwen-image', '1664*928'),
}


def image(prompt, out):
    p = _pick('IMAGE', ['openrouter', 'openai', 'ark', 'dashscope'])
    model = env('VIDEO_IMAGE_MODEL') or IMAGE_DEFAULTS[p][0]
    size = env('VIDEO_IMAGE_SIZE') or IMAGE_DEFAULTS[p][1]
    if p in ('openrouter', 'openai', 'ark'):
        if p == 'ark':
            _need('ARK_API_KEY')
            base, h = (env('ARK_BASE_URL') or 'https://ark.cn-beijing.volces.com/api/v3').rstrip('/'), {'Authorization': 'Bearer ' + env('ARK_API_KEY')}
        else:
            base, h = _openrouter() if p == 'openrouter' else _openai_base()
        body = {'model': model, 'prompt': prompt, 'size': size}
        if p == 'ark':
            body.update(response_format='b64_json', watermark=False)
        raw, _ = _http(base + '/images/generations', body, h)
        d = json.loads(raw)['data'][0]
        data = base64.b64decode(d['b64_json']) if d.get('b64_json') else _http(d['url'])[0]
    elif p == 'dashscope':
        _need('DASHSCOPE_API_KEY')
        base = (env('DASHSCOPE_BASE_URL') or 'https://dashscope.aliyuncs.com').rstrip('/')
        raw, _ = _http(base + '/api/v1/services/aigc/multimodal-generation/generation',
                       {'model': model, 'input': {'messages': [{'role': 'user', 'content': [{'text': prompt}]}]}, 'parameters': {'size': size, 'watermark': False}},
                       {'Authorization': 'Bearer ' + env('DASHSCOPE_API_KEY')})
        url = json.loads(raw)['output']['choices'][0]['message']['content'][0]['image']
        data = _http(url)[0]
    else:
        raise SystemExit(f'不认识的 VIDEO_IMAGE={p}')
    open(out, 'wb').write(data)
    return p


# ---------------- 配乐 ----------------
def music(prompt, out):
    """Lyria 这类音乐模型走 chat 接口 + 流式音频（必须 stream=true、modalities 带 audio）。"""
    p = _pick('MUSIC', ['openrouter', 'openai'])
    base, h = _openrouter() if p == 'openrouter' else _openai_base()
    body = {'model': env('VIDEO_MUSIC_MODEL') or 'google/lyria-3-pro-preview', 'stream': True, 'modalities': ['audio', 'text'],
            'messages': [{'role': 'user', 'content': prompt}]}
    for attempt in range(6):
        try:
            req = urllib.request.Request(base + '/chat/completions', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', **h})
            chunks, fmt = [], 'mp3'
            with urllib.request.urlopen(req, timeout=900) as r:
                for rawline in r:
                    line = rawline.decode('utf-8', 'ignore').strip()
                    if not line.startswith('data:') or line[5:].strip() == '[DONE]':
                        continue
                    try:
                        ev = json.loads(line[5:])
                    except json.JSONDecodeError:
                        continue
                    for ch in ev.get('choices', []):
                        a = (ch.get('delta') or {}).get('audio') or {}
                        if a.get('data'):
                            chunks.append(a['data']); fmt = a.get('format') or fmt
            if chunks:
                _to_mp3(b''.join(base64.b64decode(c) for c in chunks), fmt, out)
                return p
        except Exception as e:  # noqa: BLE001
            print('重试', attempt + 1, e)
        time.sleep(5)
    raise SystemExit('配乐生成失败。也可以不生成，直接给 plan.py 传 --music 你自己的音乐文件')
