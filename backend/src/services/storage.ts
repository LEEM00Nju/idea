import { TableClient } from '@azure/data-tables'
import { logger } from '../utils/logger.js'

type PlanAuditRecord = {
  requestId: string
  sleepHours: number
  taskCount: number
  fallbackUsed: boolean
}

export class StorageService {
  private client: TableClient | null = null
  private ready = false

  private async getClient(): Promise<TableClient | null> {
    if (this.ready) {
      return this.client
    }

    this.ready = true

    const connectionString = process.env.AZURE_TABLES_CONNECTION_STRING
    const tableName = process.env.AZURE_TABLES_TABLE_NAME ?? 'RhythmPilotPlans'

    if (!connectionString) {
      return null
    }

    this.client = TableClient.fromConnectionString(connectionString, tableName)
    await this.client.createTable().catch(() => undefined)
    return this.client
  }

  async savePlanAudit(record: PlanAuditRecord): Promise<void> {
    const client = await this.getClient()

    if (!client) {
      return
    }

    await client
      .upsertEntity({
        partitionKey: 'plan',
        rowKey: record.requestId,
        requestId: record.requestId,
        sleepHours: record.sleepHours,
        taskCount: record.taskCount,
        fallbackUsed: record.fallbackUsed,
        createdAt: new Date().toISOString(),
      })
      .catch((error) => {
        logger.warn('Azure Table Storage audit save failed', { error: error instanceof Error ? error.message : error })
      })
  }
}
