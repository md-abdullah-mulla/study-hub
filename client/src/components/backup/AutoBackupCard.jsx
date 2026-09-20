import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, Download, RotateCcw, Trash2, Save, Clock, Info } from 'lucide-react';
import { Card, CardHeader, Button, Badge, Spinner, ConfirmDialog } from '../ui/index.jsx';
import { useToast } from '../../state/ToastContext.jsx';
import {
  backupNow,
  backupStatus,
  deleteSnapshot,
  downloadSnapshot,
  listSnapshots,
  restoreSnapshot,
} from '../../lib/backup.js';

/**
 * Auto backup panel (Phase 5).
 *
 * Shows the truth about the student's safety net:
 *  - when the last backup was taken and whether one is due
 *  - the snapshots that exist, with download / restore / delete
 *  - a clear warning while nothing has been backed up yet
 *
 * Auto backups run by themselves (12 hours) — the "Backup Now" button is for the
 * moment the student has just finished something important.
 */
const formatWhen = (iso) => {
  if (!iso) return 'কখনো না';
  const date = new Date(iso);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'এখনই';
  if (minutes < 60) return `${minutes} মিনিট আগে`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  return `${Math.round(hours / 24)} দিন আগে`;
};

const formatSize = (bytes) => (bytes ? `${Math.max(1, Math.round(bytes / 1024))} KB` : '—');

export default function AutoBackupCard() {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toRestore, setToRestore] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const load = async () => {
    const [statusData, listData] = await Promise.all([backupStatus(), listSnapshots()]);
    setStatus(statusData);
    setSnapshots(listData.snapshots ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runBackup = async () => {
    setBusy(true);
    const result = await backupNow({ kind: 'manual', label: 'Manual backup' });
    setLastResult(result);
    if (result.ok) {
      toast.success(`Backup নেওয়া হলো (${formatSize(result.sizeBytes)})`);
      await load();
    } else {
      toast.error(`Backup ব্যর্থ: ${result.error}`);
    }
    setBusy(false);
  };

  const doRestore = async () => {
    if (!toRestore) return;
    setBusy(true);
    const result = await restoreSnapshot(toRestore.id);
    if (result.ok) {
      // every screen keeps its own cache, so a reload is the honest way to show
      // exactly the restored data (in-page database included)
      toast.success('Backup ফিরে এসেছে — page reload হচ্ছে...');
      setTimeout(() => window.location.reload(), 900);
    } else {
      toast.error(`Restore ব্যর্থ: ${result.error}`);
    }
    setBusy(false);
  };

  const remove = async (snapshot) => {
    setBusy(true);
    const result = await deleteSnapshot(snapshot.id);
    if (result.ok) {
      toast.success('Snapshot মুছে ফেলা হলো');
      await load();
    } else {
      toast.error(result.error);
    }
    setBusy(false);
  };

  if (loading) return <Card><CardHeader title="Auto Backup" icon={ShieldCheck} /><Spinner /></Card>;

  const healthy = Boolean(status?.lastBackupAt) && !status?.isDue;

  return (
    <Card>
      <CardHeader
        title="Auto Backup"
        subtitle="প্রতি ১২ ঘণ্টায় নিজে থেকেই snapshot নেওয়া হয় — data হারানোর ভয় নেই"
        icon={ShieldCheck}
        action={
          <Button onClick={runBackup} disabled={busy}>
            <Save className="mr-1.5 h-4 w-4" />
            Backup Now
          </Button>
        }
      />
      <div className="space-y-3 p-4 sm:p-5">
        <div
          className={`flex flex-wrap items-center gap-2 rounded-2xl border p-3 text-sm ${
            healthy ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          {healthy ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>
            শেষ backup: <strong>{formatWhen(status?.lastBackupAt)}</strong>
            {status?.isDue ? ' — একটা backup এখন দরকার।' : ' — সব ঠিক আছে।'}
          </span>
          <Badge className="border-ink-200 bg-white text-ink-600">
            <Clock className="h-3 w-3" /> {status?.mode === 'browser' ? 'ব্রাউজার storage' : 'server'}
          </Badge>
          {lastResult?.error && <Badge className="border-rose-200 bg-rose-50 text-rose-700">শেষ চেষ্টা ব্যর্থ: {lastResult.error}</Badge>}
        </div>

        {snapshots.length === 0 ? (
          <p className="text-sm text-ink-600">
            এখনো কোনো snapshot নেই — "Backup Now" চাপলে এখনই একটা তৈরি হবে, এরপর নিজে থেকেই হবে।
          </p>
        ) : (
          <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200">
            {snapshots.map((snapshot) => (
              <li key={snapshot.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-800">
                    {snapshot.label ?? 'Auto backup'}
                    {snapshot.kind === 'auto' && <span className="muted"> · auto</span>}
                  </p>
                  <p className="muted">
                    {formatWhen(snapshot.createdAt)} · {formatSize(snapshot.sizeBytes)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button className="btn-ghost" onClick={() => downloadSnapshot(snapshot.id)} disabled={busy} aria-label="Snapshot নামাও">
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="btn-ghost" onClick={() => setToRestore(snapshot)} disabled={busy} aria-label="এই snapshot ফিরিয়ে আনা">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button className="btn-ghost" onClick={() => remove(snapshot)} disabled={busy} aria-label="Snapshot মুছে ফেলো">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="muted flex items-start gap-1.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Restore করলে আগের অবস্থাটাও একটা snapshot হিসেবে রেখে দেওয়া হয়, তাই ভুল restore-ও ফেরানো যায়। নতুন
          snapshot সবচেয়ে পুরনো auto backup-টা সরিয়ে নেয় (সর্বশেষ {status?.mode === 'browser' ? 3 : 5} টা থাকে)।
        </p>
      </div>

      <ConfirmDialog
        open={Boolean(toRestore)}
        title="এই backup ফিরিয়ে আনবে?"
        message={`${formatWhen(toRestore?.createdAt)}-এর snapshot দিয়ে বর্তমান data replace হবে। আগের অবস্থাটা আলাদা snapshot হিসেবে রেখে দেওয়া হবে।`}
        confirmLabel="হ্যাঁ, ফিরিয়ে আনো"
        busy={busy}
        onClose={() => setToRestore(null)}
        onConfirm={doRestore}
      />
    </Card>
  );
}
