export function canAccessCase(caseItem, user) {
  if (!caseItem || !user) return false;

  const isLawyer =
    caseItem.lawyer_id?.toString() === user._id.toString() ||
    caseItem.client_id?.user_id?.toString() === user._id.toString();

  const isClientUser =
    user.role === "client" &&
    caseItem.client_id?.email?.toLowerCase() === user.email?.toLowerCase();

  return isLawyer || isClientUser;
}
