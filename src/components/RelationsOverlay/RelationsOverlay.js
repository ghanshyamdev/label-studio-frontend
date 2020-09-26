import { observer } from "mobx-react";
import React, { PureComponent, useEffect } from "react";
import { useState } from "react";
import NodesConnector from "./NodesConnector";

const ArrowMarker = ({ id, color }) => {
  return (
    <marker
      id={`arrow-${id}`}
      viewBox="0 0 10 10"
      refX={8}
      refY={5}
      markerWidth={4}
      markerHeight={4}
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
    </marker>
  );
};

const RelationItemRect = ({ x, y, width, height }) => {
  return <rect x={x} y={y} width={width} height={height} fill="none" />;
};

const RelationConnector = ({ id, command, color, direction, highlight }) => {
  const pathSettings = {
    d: command,
    stroke: color,
    fill: "none",
    strokeLinecap: "round",
  };

  const markers = {};

  if (direction === "bi" || direction === "right") {
    markers.markerEnd = `url(#arrow-${id})`;
  }
  if (direction === "bi" || direction === "left") {
    markers.markerStart = `url(#arrow-${id})`;
  }

  return (
    <>
      {highlight && <path {...pathSettings} opacity={0.1} strokeWidth={6} />}
      <path {...pathSettings} strokeWidth={2} {...markers} />
    </>
  );
};

const RelationLabel = ({ label, position }) => {
  const [x, y] = position;
  const textRef = React.createRef();
  const [background, setBackground] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const groupAttributes = {
    transform: `translate(${x}, ${y})`,
    textAnchor: "middle",
    dominantBaseline: "middle",
  };

  const textAttributes = {
    fill: "white",
    style: { fontSize: 12, fontFamily: "arial" },
  };

  useEffect(() => {
    const textElement = textRef.current;
    const bbox = textElement.getBBox();
    setBackground({
      x: bbox.x - 5,
      y: bbox.y - 3,
      width: bbox.width + 10,
      height: bbox.height + 6,
    });
  }, [label]);

  return (
    <g {...groupAttributes}>
      <rect {...background} stroke="#fff" strokeWidth={2} fill="#a0a" rx="3" />
      <text ref={textRef} {...textAttributes}>
        {label}
      </text>
    </g>
  );
};

const RelationItem = ({ id, startNode, endNode, direction, rootRef, highlight, dimm, labels }) => {
  const root = rootRef.current;
  const [, forceUpdate] = useState();

  const relation = NodesConnector.connect({ id, startNode, endNode, direction, labels }, root);
  const { start, end } = NodesConnector.getNodesBBox({ root, ...relation });
  const [path, textPosition] = NodesConnector.calculatePath(start, end);

  useEffect(() => {
    relation.onChange(() => forceUpdate({}));
    return () => relation.destroy();
  }, []);

  return (
    <g opacity={dimm && !highlight ? 0.5 : 1}>
      <RelationItemRect {...start} />
      <RelationItemRect {...end} />
      <RelationConnector
        id={relation.id}
        command={path}
        color={relation.color}
        direction={relation.direction}
        highlight={highlight}
      />
      {relation.label && <RelationLabel label={relation.label} position={textPosition} />}
    </g>
  );
};

/**
 * @param {{
 * item: object,
 * rootRef: React.RefObject<HTMLElement>
 * }}
 */
const RelationItemObserver = observer(({ relation, ...rest }) => {
  return (
    <RelationItem
      id={relation.id}
      startNode={relation.node1}
      endNode={relation.node2}
      direction={relation.direction}
      {...rest}
    />
  );
});

class RelationsOverlay extends PureComponent {
  /** @type {React.RefObject<HTMLElement>} */
  rootNode = React.createRef();
  state = { shouldRender: false };

  componentDidMount() {
    if (this.rootNode.current) {
      this.setState({ shouldRender: true });
    }
  }

  render() {
    const { relations, visible, highlighted } = this.props;
    const hasHighlight = !!highlighted;

    const style = {
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      position: "absolute",
      pointerEvents: "none",
      zIndex: 100,
      visibility: visible ? "visible" : "hidden",
    };

    return (
      <svg ref={this.rootNode} xmlns="http://www.w3.org/2000/svg" style={style}>
        {this.state.shouldRender ? (
          <>
            <defs>
              {relations.map(relation => (
                <ArrowMarker key={relation.id} id={relation.id} color="#a0a" />
              ))}
            </defs>

            {this.renderRelations(relations, hasHighlight, highlighted)}
          </>
        ) : null}
      </svg>
    );
  }

  renderRelations(relations, hasHighlight, highlighted) {
    return relations.map(relation => (
      <RelationItemObserver
        key={relation.id}
        relation={relation}
        rootRef={this.rootNode}
        labels={relation.relations?.selectedValues()}
        dimm={hasHighlight && relation !== highlighted}
        highlight={relation === highlighted}
      />
    ));
  }
}

const RelationsOverlayObserver = observer(({ store }) => {
  const { relations, showConnections, highlighted } = store;
  return <RelationsOverlay relations={Array.from(relations)} visible={showConnections} highlighted={highlighted} />;
});

export { RelationsOverlayObserver as RelationsOverlay };
