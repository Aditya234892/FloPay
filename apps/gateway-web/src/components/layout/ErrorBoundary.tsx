import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'

interface Props {
  children: ReactNode
  /** Shown instead of the default panel. */
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render-time crashes so one bad component doesn't blank the whole app.
 * Shows the real error message — hiding it behind "something went wrong" makes
 * the product harder to debug for no user benefit in a developer tool.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[FloPay] Unhandled render error:', error, info.componentStack)
  }

  private reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex min-h-[60svh] items-center justify-center p-6">
        <div className="glass sheen max-w-md rounded-2xl p-6 text-center shadow-soft">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-rose-500/12 text-rose-500 ring-1 ring-rose-500/25 ring-inset">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-base font-semibold">This view failed to render</h2>
          <p className="mt-2 text-sm text-fg-muted">{error.message}</p>
          <Button
            className="mt-5"
            variant="secondary"
            onClick={this.reset}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }
}
