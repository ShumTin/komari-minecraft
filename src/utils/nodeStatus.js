export function getNodeStatus(status) {
  if (["online", "offline", "warning"].includes(status)) return status;
  return "unknown";
}

export function getNodeStatusLabel(status) {
  const normalizedStatus = getNodeStatus(status);
  if (normalizedStatus === "online") return "在线";
  if (normalizedStatus === "offline") return "离线";
  if (normalizedStatus === "warning") return "警告";
  return "状态未知";
}
