precision mediump float;

uniform vec4 u_color;
uniform float u_useTexture;
uniform sampler2D u_texture;

varying vec2 v_texCoord;

void main() {
    if (u_useTexture > 0.5) {
        gl_FragColor = texture2D(u_texture, v_texCoord) * u_color;
    } else {
        gl_FragColor = u_color;
    }
}

