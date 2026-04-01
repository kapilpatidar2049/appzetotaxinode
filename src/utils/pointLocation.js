class PointLocation {
  constructor() {
    this.pointOnVertex = true;
  }

  pointInPolygon(point, polygon, pointOnVertex = true) {
    this.pointOnVertex = pointOnVertex;

    const p = this.pointStringToCoordinates(point);
    const vertices = polygon.map((v) => this.pointStringToCoordinates(v));

    if (this.pointOnVertex && this.isPointOnVertex(p, vertices)) {
      return true;
    }

    let intersections = 0;
    const verticesCount = vertices.length;

    for (let i = 1; i < verticesCount; i++) {
      const vertex1 = vertices[i - 1];
      const vertex2 = vertices[i];

      // Horizontal boundary
      if (
        vertex1.y === vertex2.y &&
        vertex1.y === p.y &&
        p.x > Math.min(vertex1.x, vertex2.x) &&
        p.x < Math.max(vertex1.x, vertex2.x)
      ) {
        return true;
      }

      if (
        p.y > Math.min(vertex1.y, vertex2.y) &&
        p.y <= Math.max(vertex1.y, vertex2.y) &&
        p.x <= Math.max(vertex1.x, vertex2.x) &&
        vertex1.y !== vertex2.y
      ) {
        const xinters =
          ((p.y - vertex1.y) * (vertex2.x - vertex1.x)) /
            (vertex2.y - vertex1.y) +
          vertex1.x;

        if (xinters === p.x) {
          return true;
        }

        if (vertex1.x === vertex2.x || p.x <= xinters) {
          intersections++;
        }
      }
    }

    return intersections % 2 !== 0;
  }

  pointStringToCoordinates(pointString) {
    const [x, y] = String(pointString).split(" ").map(Number);
    return { x, y };
  }

  isPointOnVertex(point, vertices) {
    return vertices.some((v) => v.x === point.x && v.y === point.y);
  }
}

module.exports = PointLocation;

