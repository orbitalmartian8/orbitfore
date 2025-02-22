import { importShowBackfillDialog } from '../_components/dialog/asyncDialogs/importShowBackfillDialog.js'

export async function backfill (account) {
  const showBackfillDialog = await importShowBackfillDialog()
  showBackfillDialog(account)
}
