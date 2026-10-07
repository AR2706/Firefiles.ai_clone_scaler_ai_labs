import { Users } from "lucide-react";

import { ComingSoon } from "@/components/ui/States";

export default function TeamPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Team workspace"
      description="Share meetings and work on notes together."
      points={[
        "Invite teammates and set who can see each meeting",
        "Share a meeting with a link",
        "Shared channels for projects and customers",
      ]}
    />
  );
}
