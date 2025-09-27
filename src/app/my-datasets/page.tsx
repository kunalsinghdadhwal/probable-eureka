import { MyAgentsDashboard } from "@/components/my-agents-dashboard"

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 min-h-screen pt-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">My AI Agents</h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Manage your created AI agent NFTs and dataset shares
        </p>
      </div>
      <MyAgentsDashboard />
    </main>
  )
}