import { toRaw } from "vue";
import { groups, nodes, overview } from "./data.js";

function clone(value) {
  return structuredClone(toRaw(value));
}

export function getOverview() {
  return clone(overview);
}

export function getGroups() {
  return clone(groups);
}

export function getNodes() {
  return clone(nodes);
}

export function getNodeDetails(node) {
  return {
    ...clone(node),
    system: node.os,
    cores: 2,
    load: "0.00",
    ping: [44, 48, 54],
    packetLoss: "0.0%",
    updatedAt: "12:34:55",
  };
}
