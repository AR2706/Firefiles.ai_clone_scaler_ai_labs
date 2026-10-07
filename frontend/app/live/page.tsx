import { Radio } from "lucide-react";

import { ComingSoon } from "@/components/ui/States";

export default function LivePage() {
  return (
    <ComingSoon
      icon={Radio}
      title="Live assistant"
      description="A notetaker that joins your calls and transcribes them as they happen."
      points={[
        "Invite the notetaker to a Google Meet, Zoom or Teams call",
        "Join automatically from your calendar",
        "Speech-to-text with speaker labels",
      ]}
    />
  );
}
