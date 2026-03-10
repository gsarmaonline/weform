export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Forms</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          New form
        </button>
      </div>
      <p className="text-muted-foreground text-sm">No forms yet. Create your first form to get started.</p>
    </div>
  )
}
