export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Sign in failed</h1>
        <p className="text-muted-foreground text-sm">
          Something went wrong. Please try again.
        </p>
        <a
          href="/auth/signin"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to sign in
        </a>
      </div>
    </div>
  )
}
