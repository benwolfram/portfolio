import { useEffect, useRef } from 'react'

const VERT = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

// Light moving across broad diagonal folds of dark fabric, with a soft sheen
// on each crest. render() takes aspect-corrected screen space, y in [-1, 1].
const FRAG = `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;

const vec3 DARK = vec3(0.016, 0.027, 0.020);
const vec3 DEEP = vec3(0.106, 0.173, 0.114);
const vec3 MID = vec3(0.278, 0.400, 0.290);

float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 perm(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }

float noise(vec3 p) {
  vec3 a = floor(p);
  vec3 d = p - a;
  d = d * d * (3.0 - 2.0 * d);

  vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
  vec4 k1 = perm(b.xyxy);
  vec4 k2 = perm(k1.xyxy + b.zzww);

  vec4 c = k2 + a.zzzz;
  vec4 k3 = perm(c);
  vec4 k4 = perm(c + 1.0);

  vec4 o1 = fract(k3 * (1.0 / 41.0));
  vec4 o2 = fract(k4 * (1.0 / 41.0));

  vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
  vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

  return o4.y * d.y + o4.x * (1.0 - d.y);
}

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

mat2 rotate2d(float a) {
  return mat2(cos(a), -sin(a), sin(a), cos(a));
}

vec3 render(vec2 p) {
  float t = uTime * 1.4;

  // Drift, so the folds travel across the screen instead of only morphing
  p = rotate2d(-0.75) * p + vec2(t * 0.18, t * -0.07);

  // Warp the coordinates themselves so folds bend, pinch and split
  vec2 warp = vec2(noise(vec3(p * 0.55, t * 0.45)), noise(vec3(p * 0.55 + 7.3, t * 0.45)));
  p += (warp - 0.5) * 2.2;

  float n = noise(vec3(p * 0.8, t * 0.7));
  float detail = noise(vec3(p * 2.6 + 4.0, t * 1.3));
  // Fold spacing drifts across the screen rather than staying even
  float spacing = mix(1.0, 2.3, noise(vec3(p * 0.3 - 5.0, t * 0.25)));
  float w = p.x * spacing + p.y * (n - 0.5) * 1.4 + n * 2.4 + detail * 0.45;

  float fold = 0.5 + 0.5 * sin(w * 3.1415);
  // Fade crests in and out so no band runs unbroken edge to edge
  fold *= mix(0.35, 1.0, smoothstep(0.25, 0.7, noise(vec3(p * 0.9 + 11.0, t * 0.6))));
  float sheen = pow(fold, 6.0);

  vec3 color = mix(DARK, DEEP, smoothstep(0.1, 0.9, fold));
  color = mix(color, MID, sheen * 0.9);

  float shade = smoothstep(0.2, 0.8, noise(vec3(p * 0.5 - 3.0, t * 0.5)));
  return mix(DARK, color, 0.3 + 0.7 * shade);
}

void main() {
  vec2 p = gl_FragCoord.xy / uRes * 2.0 - 1.0;
  p.x *= uRes.x / uRes.y;

  vec3 color = render(p);
  color *= mix(1.0, 0.45, uScroll);
  color += random(gl_FragCoord.xy * 0.01 + fract(uTime * 7.0)) * 0.05 - 0.015;

  gl_FragColor = vec4(color, 1.0);
}
`

const SPEED = 0.126 // monopo: 7e-5 * speed 30 per frame at 60fps

function createProgram(gl) {
  const program = gl.createProgram()
  for (const [type, source] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]]) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader))
    }
    gl.attachShader(program, shader)
  }
  gl.linkProgram(program)
  return program
}

export default function Gradient() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl', { antialias: false, powerPreference: 'low-power' })
    if (!gl) return

    let program
    try {
      program = createProgram(gl)
    } catch (err) {
      console.error(err)
      return
    }
    gl.useProgram(program)

    // One oversized triangle covers the viewport
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'uRes')
    const uTime = gl.getUniformLocation(program, 'uTime')
    const uScroll = gl.getUniformLocation(program, 'uScroll')

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let time = 14
    let last = performance.now()
    let raf = 0

    const draw = () => {
      gl.uniform1f(uTime, time)
      gl.uniform1f(uScroll, Math.min(1, window.scrollY / window.innerHeight))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round(canvas.clientHeight * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      draw()
    }

    const frame = (now) => {
      time += (Math.min(now - last, 50) / 1000) * SPEED
      last = now
      draw()
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      cancelAnimationFrame(raf)
      if (reduceMotion.matches) {
        draw()
      } else {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    const onScroll = () => reduceMotion.matches && draw()

    resize()
    start()
    canvas.dataset.ready = ''
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    reduceMotion.addEventListener('change', start)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      reduceMotion.removeEventListener('change', start)
    }
  }, [])

  return <canvas ref={canvasRef} className="gradient" aria-hidden="true" />
}
