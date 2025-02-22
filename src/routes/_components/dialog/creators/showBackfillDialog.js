import BackfillDialog from '../components/BackfillDialog.html'
import { showDialog } from './showDialog.js'

export default function showBackfillDialog (account) {
  return showDialog(BackfillDialog, {
    label: 'intl.backfill',
    title: 'intl.backfill',
    account
  })
}
