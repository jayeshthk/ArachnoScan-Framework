export const arrangeTreeLayout = (nodes, edges, rootUrl) => {
  const nodeMap = new Map();
  const childrenMap = new Map();
  const rootNode = nodes.find((n) => n.url === rootUrl);

  // Initialize maps
  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    childrenMap.set(node.id, []);
  });

  // Build hierarchy
  edges.forEach((edge) => {
    childrenMap.get(edge.source).push(edge.target);
  });

  // Calculate positions
  const positionNodes = (
    nodeId,
    position,
    level,
    angleSpan = [0, 2 * Math.PI]
  ) => {
    const node = nodeMap.get(nodeId);
    const children = childrenMap.get(nodeId);

    // Position current node
    node.position = position;

    // Position children in a circular layout around parent
    const childCount = children.length;
    const angleStep = (angleSpan[1] - angleSpan[0]) / childCount;
    const radius = 300 + level * 200; // Increase radius with each level

    children.forEach((childId, index) => {
      const angle = angleSpan[0] + index * angleStep + angleStep / 2;
      const childPosition = {
        x: position.x + radius * Math.cos(angle),
        y: position.y + radius * Math.sin(angle),
      };
      positionNodes(childId, childPosition, level + 1, [
        angle - angleStep / 2,
        angle + angleStep / 2,
      ]);
    });
  };

  // Start layout from root node at center
  positionNodes(rootNode.id, { x: 0, y: 0 }, 0);

  return nodes.map((node) => ({
    ...node,
    position: node.position,
  }));
};
