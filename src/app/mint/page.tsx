import { CreateAgentForm } from "@/components/create-agent-form"

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 min-h-screen pt-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Create AI Agent NFT</h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Tokenize your AI models and datasets as ERC-1155 NFTs
        </p>
      </div>
      <CreateAgentForm />
    </main>
  )
}
