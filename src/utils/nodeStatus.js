export function getNodeStatus(status) {
  if (status === "online" || status === "offline") return status;
  return "unknown";
}

export function getNodeStatusLabel(status) {
  const normalizedStatus = getNodeStatus(status);
  if (normalizedStatus === "online") return "在线";
  if (normalizedStatus === "offline") return "离线";
  return "状态未知";
}
