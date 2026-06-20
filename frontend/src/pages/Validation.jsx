import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  Brain,
  Clock,
  PlusCircle,
  X,
} from 'lucide-react';
import {
  getValidationHistory,
  submitActualOutcome,
} from '../services/validationApi';
import { UNPLANNED_EVENT_TYPES, PLANNED_EVENT_TYPES } from '../utils/constants';
import { formatDateTime, formatMinutes, getRiskBand } from '../utils/riskUtils';
import LearningLoop from '../components/LearningLoop/LearningLoop.jsx';

const RISK_LEVEL_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function eventTypeLabel(value) {
  return (
    [...PLANNED_EVENT_TYPES, ...UNPLANNED_EVENT_TYPES].find((t) => t.value === value)?.label ??
    value
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function Validation() {
  const [history, setHistory] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [activeRow, setActiveRow] = useState(null); // row being given actuals
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getValidationHistory()
      .then(setHistory)
      .catch((err) => setLoadError(err.message || 'Could not load validation history'));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const validatedRows = useMemo(() => history?.filter((r) => r.validated) ?? [], [history]);
  const pendingRows = useMemo(() => history?.filter((r) => !r.validated) ?? [], [history]);
  const avgAccuracy = useMemo(() => {
    if (!validatedRows.length) return null;
    return Math.round(
      validatedRows.reduce((sum, r) => sum + (r.accuracyPercent ?? 0), 0) / validatedRows.length
    );
  }, [validatedRows]);

  function applyValidatedRow(rowId, updated) {
    setHistory((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...updated, validated: true } : r))
    );
    setActiveRow(null);
    setToast({ kind: 'success', message: 'Validation logged — model accuracy updated.' });
  }

  function applyManualEvent(newRow) {
    setHistory((prev) => [
      {
        id: newRow.id,
        eventName: newRow.eventName,
        eventType: newRow.eventType,
        eventDate: newRow.eventDate,
        predictedRiskScore: 50,
        predictedRiskLevel: 'moderate',
        predictedDelayMinutes: 30,
        eventOccurred: true,
        ...newRow,
        validated: true,
      },
      ...(prev ?? []),
    ]);
    setManualModalOpen(false);
    setToast({ kind: 'success', message: 'Event added and validated.' });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2">
        <ClipboardList size={18} className="text-signal" />
        <h1 className="font-display text-xl font-semibold text-console-text">
          Model Validation
        </h1>
      </div>
      <p className="mt-1.5 max-w-2xl text-sm text-console-muted">
        Track how predicted risk and delay compare against what actually happened on
        the ground, and log outcomes for events the model hasn't been graded on yet.
      </p>

      {/* KPI row */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {avgAccuracy != null && (
          <div className="inline-flex items-center gap-3 rounded-xl border border-console-border bg-console-panel/80 px-5 py-4">
            <span className="font-mono text-3xl font-semibold text-risk-low">
              {avgAccuracy}%
            </span>
            <span className="text-xs text-console-muted">
              average accuracy across {validatedRows.length} validated event
              {validatedRows.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
        <div className="inline-flex items-center gap-3 rounded-xl border border-console-border bg-console-panel/80 px-5 py-4">
          <Brain size={18} className="text-signal shrink-0" />
          <span className="text-xs text-console-muted">
            {pendingRows.length} event{pendingRows.length === 1 ? '' : 's'} pending validation
          </span>
        </div>
      </div>

      {loadError && <p className="mt-4 text-sm text-risk-critical">{loadError}</p>}

      {!history && !loadError && (
        <div className="mt-8 flex items-center gap-2 text-sm text-console-muted">
          <Loader2 className="animate-spin" size={16} /> Loading validation history…
        </div>
      )}

      {/* Main content grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Validation list */}
        <div className="min-w-0">
          {history && (
            <div className="space-y-8">
              {/* Pending Events */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-console-muted">
                    Pending Validation
                  </h2>
                  <button
                    onClick={() => setManualModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-signal hover:text-signal/80"
                  >
                    <PlusCircle size={14} />
                    Add Event
                  </button>
                </div>
                {pendingRows.length === 0 ? (
                  <EmptyState onAddEvent={() => setManualModalOpen(true)} />
                ) : (
                  <div className="space-y-3">
                    {pendingRows.map((row) => (
                      <PendingRow
                        key={row.id}
                        row={row}
                        onAddActuals={() => setActiveRow(row)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Validated Events */}
              {validatedRows.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-console-muted">
                    Validated Events
                  </h2>
                  <div className="space-y-3">
                    {validatedRows.map((row) => (
                      <ValidatedRow key={row.id} row={row} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Learning Loop sidebar */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <LearningLoop />
        </div>
      </div>

      {activeRow && (
        <ActualOutcomeModal
          row={activeRow}
          onClose={() => setActiveRow(null)}
          onSubmitted={(updated) => applyValidatedRow(activeRow.id, updated)}
        />
      )}

      {manualModalOpen && (
        <ManualEventModal
          onClose={() => setManualModalOpen(false)}
          onSubmitted={applyManualEvent}
        />
      )}

      {toast && <Toast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} />}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ onAddEvent }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-console-border bg-console-panel/40 px-6 py-10 text-center">
      <ClipboardList size={24} className="text-console-muted" />
      <p className="max-w-sm text-sm text-console-muted">
        No events pending validation. When an event is completed, actual outcome data
        can be entered here to evaluate model performance.
      </p>
      <button
        type="button"
        onClick={onAddEvent}
        className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-signal px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-signal/90"
      >
        <PlusCircle size={14} />
        Add Event for Validation
      </button>
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ kind, message, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-risk-low/30 bg-console-panel px-4 py-3 text-sm text-console-text shadow-glow">
      <CheckCircle2 size={16} className="text-risk-low shrink-0" />
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 text-console-muted transition-colors hover:text-console-text"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Comparison columns (Predicted vs Actual) ──────────────────────────────
function ComparisonColumns({ row }) {
  const predictedBand = getRiskBand(row.predictedRiskScore);
  const actualBand = row.actualRiskScore != null ? getRiskBand(row.actualRiskScore) : null;
  const maxDelay = Math.max(row.predictedDelayMinutes ?? 0, row.actualDelayMinutes ?? 0, 60);

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-console-muted">
          Predicted
        </p>
        <div className="space-y-2">
          <Metric label="Risk" value={row.predictedRiskScore} band={predictedBand} />
          <BarRow value={row.predictedDelayMinutes ?? 0} max={maxDelay} unit="m" color="bg-signal" />
        </div>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-console-muted">
          Actual
        </p>
        <div className="space-y-2">
          {actualBand ? (
            <Metric label="Risk" value={row.actualRiskScore} band={actualBand} />
          ) : (
            <span className="text-xs text-console-muted">—</span>
          )}
          <BarRow
            value={row.actualDelayMinutes ?? 0}
            max={maxDelay}
            unit="m"
            color="bg-risk-moderate"
          />
        </div>
      </div>
    </div>
  );
}

function eventTypeLabel(value) {
  return [...PLANNED_EVENT_TYPES, ...UNPLANNED_EVENT_TYPES].find((t) => t.value === value)?.label ?? value;
}

function ComparisonBar({ predicted, actual, unit = '' }) {
  return (
    <div className="space-y-2 w-full">
      <BarRow label="Predicted" value={predicted} unit={unit} color="bg-signal" />
      <BarRow label="Actual" value={actual} unit={unit} color="bg-risk-moderate" />
    </div>
  );
}

function BarRow({ label, value, unit, color }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px] w-full max-w-[180px]">
      <div className="flex items-center gap-1.5 text-console-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
        <span>{label}</span>
      </div>
      
      <span className="font-mono text-console-text">
        {value}{unit}
      </span>
    </div>
  );
}

// ─── Validated row ──────────────────────────────────────────────────────────
function ValidatedRow({ row }) {
  const band = row.actualRiskScore != null ? getRiskBand(row.actualRiskScore) : getRiskBand(row.predictedRiskScore);
  return (
    <div className="rounded-xl border border-console-border bg-console-panel/80 p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-6 flex-wrap">
      
      <div className="w-full xl:w-48 shrink-0">
        <div className="flex items-center gap-2">
          <p className="font-display text-sm font-semibold text-console-text truncate">{row.eventName}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-1 gap-6 w-full min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-console-muted mb-2 uppercase tracking-wider">Risk Score</p>
          <ComparisonBar predicted={row.predictedRiskScore} actual={row.actualRiskScore} unit="" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-console-muted mb-2 uppercase tracking-wider">Time Delay</p>
          <ComparisonBar
            predicted={row.predictedDelayMinutes}
            actual={row.actualDelayMinutes}
            unit="m"
          />
        </div>
      </div>

      <div className="shrink-0 flex items-center xl:justify-end w-full xl:w-auto mt-2 xl:mt-0">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${band.softBgClass} ${band.textClass}`}>
          {row.accuracyPercent}% accurate
        </span>
      </div>
      
    </div>
  );
}

// ─── Shared modal shell ─────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-console-border bg-console-panel p-5 shadow-glow scrollbar-console">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-console-text">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-console-muted transition-colors hover:text-console-text"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-console-muted">{label}</span>
      {children}
    </label>
  );
}

// ─── Actual Event Data Form (for an existing predicted event) ─────────────
function ActualOutcomeModal({ row, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    actualCrowdSize: '',
    actualDelayMinutes: '',
    actualRiskLevel: 'moderate',
    actualResourceUsage: '',
    actualIncidentCount: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = form.actualDelayMinutes !== '' && form.actualRiskLevel && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await submitActualOutcome(row.id, {
        actualCrowdSize: form.actualCrowdSize === '' ? null : Number(form.actualCrowdSize),
        actualDelayMinutes: Number(form.actualDelayMinutes),
        actualRiskLevel: form.actualRiskLevel,
        actualResourceUsage: form.actualResourceUsage || null,
        actualIncidentCount: form.actualIncidentCount === '' ? null : Number(form.actualIncidentCount),
        notes: form.notes || null,
      });
      onSubmitted(updated);
    } catch (err) {
      setError(err.message || 'Could not submit actual outcome.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-dashed border-console-border bg-console-panel/50 p-4 sm:flex sm:items-end sm:gap-4 flex-wrap"
    >
      <div className="sm:w-56">
        <p className="font-display text-sm font-semibold text-console-text truncate">{row.eventName}</p>
        <p className="mt-0.5 text-xs text-console-muted">
          Predicted {row.predictedRiskScore} risk · {formatMinutes(row.predictedDelayMinutes)} delay
        </p>
      </div>

      <div className="mt-3 flex flex-1 flex-wrap items-end gap-3 sm:mt-0 min-w-0">
        <label className="flex flex-col gap-1 w-full sm:w-auto">
          <span className="text-[11px] text-console-muted">Actual risk score</span>
          <input
            type="number"
            min={0}
            max={100}
            value={actualRiskScore}
            onChange={(e) => setActualRiskScore(e.target.value)}
            className="input w-full sm:w-32"
            placeholder="0–100"
          />
        </label>
        <label className="flex flex-col gap-1 w-full sm:w-auto">
          <span className="text-[11px] text-console-muted">Actual delay (min)</span>
          <input
            type="number"
            min={0}
            value={actualDelayMinutes}
            onChange={(e) => setActualDelayMinutes(e.target.value)}
            className="input w-full sm:w-32"
            placeholder="minutes"
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center justify-center gap-1.5 rounded-md bg-signal px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-signal/90 disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto"
        >
          {submitting ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
          Log outcome
        </button>
      </div>
    </form>
  );
}