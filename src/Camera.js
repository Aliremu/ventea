import { glMatrix, mat2, mat3, mat4, vec2, vec3, vec4 }  from '../lib/gl-matrix/index.js';

export class Camera {

    /**
     * Creates a camera
     * @constructor
     * @param {int[]} pos e.g. [0, 0, 0]
     * @param {number} fov Left bound of the frustum
     * @param {number} aspect Right bound of the frustum
     * @param {number} zNear Near bound of the frustum
     * @param {number} zFar Far bound of the frustum
     */
    constructor(fov, aspect, zNear, zFar) {
      this.viewMatrix = new Float32Array(16);
      this.projMatrix = new Float32Array(16);
  
      this.fov = fov;
      this.aspect = aspect;
      this.zNear = zNear;
      this.zFar = zFar;
  
      this.pos = vec3.fromValues(-10, 2, -10);
      this.forward = vec3.fromValues(0, 0, 1);
      this.up = vec3.fromValues(0, 1, 0);
  
      mat4.lookAt(this.viewMatrix, this.pos, vec3.add(vec3.create(), this.forward, this.pos), this.up);
      mat4.perspective(this.projMatrix, this.fov, this.aspect, this.zNear, this.zFar);
    }
  
    getViewProjection() {
      return this.getProjection() * this.getView();
    }
  
    getView() {
      mat4.lookAt(this.viewMatrix, this.pos, vec3.add(vec3.create(), this.forward, this.pos), this.up);
  
      return this.viewMatrix;
    }
  
    getProjection() {
      mat4.perspective(this.projMatrix, this.fov, this.aspect, this.zNear, this.zFar);
  
      return this.projMatrix;
    }
  
    update(entity) {
      this.pos = entity.pos;
    }
  
    getPos() { return this.pos; }
    getForward() { return this.forward; }
    getUp() { return this.up; }
  
    setPos(pos) { this.pos = pos; }
    setForward(forward) { this.forward = forward; }
    setUp(up) { this.up = up; }
    setAspect(aspect) { this.aspect = aspect; }
  }
  