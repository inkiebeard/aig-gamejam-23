// Modified from code by Daniel Shiffman https://thecodingtrain.com/CodingChallenges/145-2d-ray-casting.html
class Ray {
  constructor(pos, angle, distance = STATICS.robot.viewDistance) {
    this.pos = pos;
    this.dir = p5.Vector.fromAngle(angle);
    this.distance = distance;
  }

  show() {
    push();
    stroke(255, 0, 0);
    const endX = this.pos.x + this.dir.x * this.distance;
    const endY = this.pos.y + this.dir.y * this.distance;
    line(this.pos.x, this.pos.y, endX, endY);
    pop();
  }

  castLine(x1, y1, x2, y2) {

    const x3 = this.pos.x;
    const y3 = this.pos.y;
    const x4 = this.pos.x + this.dir.x;
    const y4 = this.pos.y + this.dir.y;

    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den == 0) {
      return;
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0 && u < this.distance) {
      const pt = createVector();
      pt.x = x1 + t * (x2 - x1);
      pt.y = y1 + t * (y2 - y1);
      return pt;
    } else {
      return;
    }
  }

  cast(object) {
    const halfSize = object.size / 2;
    const topSide = {
      x1: object.position.x - halfSize,
      y1: object.position.y - halfSize,
      x2: object.position.x + halfSize,
      y2: object.position.y - halfSize
    };
    const bottomSide = {
      x1: object.position.x - halfSize,
      y1: object.position.y + halfSize,
      x2: object.position.x + halfSize,
      y2: object.position.y + halfSize
    };
    const leftSide = {
      x1: object.position.x - halfSize,
      y1: object.position.y - halfSize,
      x2: object.position.x - halfSize,
      y2: object.position.y + halfSize
    };
    const rightSide = {
      x1: object.position.x + halfSize,
      y1: object.position.y - halfSize,
      x2: object.position.x + halfSize,
      y2: object.position.y + halfSize
    };
    const topHit = this.castLine(topSide.x1, topSide.y1, topSide.x2, topSide.y2);
    if (topHit) {
      return topHit;
    }
    const bottomHit = this.castLine(bottomSide.x1, bottomSide.y1, bottomSide.x2, bottomSide.y2);
    if (bottomHit) {
      return bottomHit;
    }
    const leftHit = this.castLine(leftSide.x1, leftSide.y1, leftSide.x2, leftSide.y2);
    if (leftHit) {
      return leftHit;
    }
    const rightHit = this.castLine(rightSide.x1, rightSide.y1, rightSide.x2, rightSide.y2);
    if (rightHit) {
      return rightHit;
    }
    return;
  }
}
