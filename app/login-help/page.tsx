export default function LoginHelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">HSE System Login Guide</h1>
            <p className="mt-2 text-muted-foreground">
              If you&apos;re seeing an &quot;unauthorized: not authenticated&quot; error, you need to log in first.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border/50 bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Admin Account (for testing)</h2>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="text-foreground font-semibold">xom-it-admin@xomoman.com</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Password: </span>
                  <span className="text-foreground font-semibold">Xom@2026</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                This account has full admin access including Settings tab to add users and reset passwords.
              </p>
            </div>

            <div className="rounded-lg border border-border/50 bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Other Test Accounts</h2>
              <div className="space-y-3">
                <div>
                  <p className="font-mono text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    <span className="text-foreground">aabbady@xomoman.com</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Password: Xom@2026</p>
                </div>
                <div>
                  <p className="font-mono text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    <span className="text-foreground">aosama@xomoman.com</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Password: Xom@2026</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Steps to Log In</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to the <a href="/sign-in" className="text-primary hover:underline">/sign-in</a> page</li>
                <li>Enter an email address from the list above</li>
                <li>Enter the password: <span className="font-mono">Xom@2026</span></li>
                <li>Click &quot;Sign In&quot;</li>
                <li>You&apos;ll be redirected to the dashboard</li>
              </ol>
            </div>

            <div className="rounded-lg border border-border/50 bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Admin Features</h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Click Settings tab to access admin controls</li>
                <li>Add new users with auto-generated passwords</li>
                <li>Reset user passwords (sends via email)</li>
                <li>View user statistics and admin counts</li>
                <li>Email service status verification</li>
              </ul>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6">
              <h2 className="text-xl font-semibold mb-4 text-amber-600">Important Notes</h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-amber-600/90">
                <li>All passwords are currently set to <span className="font-mono">Xom@2026</span> for demo purposes</li>
                <li>Users can&apos;t change their password without admin reset</li>
                <li>Only xom-it-admin@xomoman.com has admin access</li>
                <li>Email notifications require valid SMTP credentials</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/sign-in"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Sign In Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
