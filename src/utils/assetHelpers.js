export function isHandoverMailEnabled(asset) {
  if (asset.assignmentType !== "employee") return false;
  if (!asset.assignedToId) return false;

  // ✅ approvalRequests array aayega (separate: true ke saath)
  const approvals = asset.approvalRequests;

  // Koi approval request nahi — autoApproved tha
  if (!approvals || approvals.length === 0) return true;

  // Latest request ka status check karo
  return approvals[0].status === "approved";
}
