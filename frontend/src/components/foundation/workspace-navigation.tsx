type WorkspaceSection = "overview" | "events" | "tasks" | "guests" | "members";

const sections: { id: WorkspaceSection; label: string; href: string }[] = [
  { id: "overview", label: "Overview", href: "/dashboard" },
  { id: "events", label: "Events", href: "/events" },
  { id: "tasks", label: "Tasks", href: "/tasks" },
  { id: "guests", label: "Guests", href: "/guests" },
  { id: "members", label: "Members", href: "/members" },
];

export function WorkspaceNavigation({ active, role }: { active: WorkspaceSection; role: string }) {
  return <nav className="workspace-navigation" aria-label="Wedding workspace">
    {sections.filter((section) => section.id !== "members" || role === "ADMIN").map((section) => <a key={section.id} href={section.href} aria-current={section.id === active ? "page" : undefined}>{section.label}</a>)}
  </nav>;
}
