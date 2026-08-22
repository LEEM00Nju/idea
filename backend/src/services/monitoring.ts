import * as appInsights from 'applicationinsights'

export class MonitoringService {
  private initialized = false

  private ensureStarted() {
    if (this.initialized || !process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      return
    }

    appInsights
      .setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
      .setAutoCollectRequests(true)
      .setAutoCollectExceptions(true)
      .start()

    this.initialized = true
  }

  trackPlanGenerated(properties: Record<string, string>, measurements: Record<string, number>) {
    this.ensureStarted()
    appInsights.defaultClient?.trackEvent({
      name: 'plan_generated',
      properties,
      measurements,
    })
  }

  trackError(error: unknown, properties: Record<string, string>) {
    this.ensureStarted()
    appInsights.defaultClient?.trackException({
      exception: error instanceof Error ? error : new Error(String(error)),
      properties,
    })
  }
}
