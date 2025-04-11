uniform float uTime;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;

varying vec2 vUv;

#include ../partials/simplex3dNoise.frag

void main(){
  // Displace the uv
  vec2 displacedUv = vUv + snoise(vec3(vUv * 2.0, uTime * 0.1));

  // Perlin noise
  float strength = snoise(vec3(displacedUv * 5.0, uTime * 0.2));

  // Outer glow
  float outerGlow = distance(vUv, vec2(0.5)) * 5.0 - 1.4;
  strength += outerGlow;

  strength += step(-0.2, strength) * 0.8;

  // Clamp the value
  strength = clamp(strength, 0.0, 1.0);

  // Final color
  vec3 color = mix(uColorStart, uColorEnd, strength);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
  #include <tonemapping_fragment>
}

