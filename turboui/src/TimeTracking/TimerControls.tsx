import React from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { ErrorCallout } from "../Callouts";
import { IconPlayerPlayFilled } from "../icons";
import { Menu, MenuActionItem } from "../Menu";
import { Modal } from "../Modal";
import { Dropdown } from "../FormElements/Dropdown";
import { ActionLink } from "../Link";
import { TimeEntryEditor } from "./TimeEntryEditor";
import { formatDuration } from "./time";
import { useTimeAction } from "./useTimeAction";
import type { ActiveTimer, TimeDestination, TimeTrackingData } from "./types";

export function TimeTrackingControls({
  data,
  destination,
  closed = false,
  compact = false,
  showTimer = true,
}: {
  data: TimeTrackingData;
  destination?: TimeDestination;
  closed?: boolean;
  compact?: boolean;
  showTimer?: boolean;
}) {
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [timerOpen, setTimerOpen] = React.useState(false);
  const action = useTimeAction();
  const destinations = data.destinations.filter((item) => item.enabled && item.canTrack);
  const canRecord = destination ? destination.enabled && destination.canTrack : destinations.length > 0;
  const runningHere = Boolean(destination && data.activeTimer?.destination.id === destination.id);
  const LogButton = compact ? SecondaryButton : PrimaryButton;
  if (!canRecord) return null;

  const start = async () => {
    if (!destination || data.activeTimer) setTimerOpen(true);
    else await action.run(() => data.onStartTimer(destination.id));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {showTimer && !closed && !destination?.closed && (
          <SecondaryButton
            size={compact ? "xxs" : "sm"}
            icon={IconPlayerPlayFilled}
            disabled={runningHere || action.pending}
            loading={action.pending}
            onClick={start}
            testId="start-timer"
          >
            {runningHere ? "Timer running" : data.activeTimer ? "Switch timer" : "Start timer"}
          </SecondaryButton>
        )}
        <LogButton size={compact ? "xxs" : "sm"} onClick={() => setEditorOpen(true)} testId="log-time">
          Log time
        </LogButton>
      </div>
      {action.error && (
        <div role="alert">
          <ErrorCallout message={action.error} />
        </div>
      )}
      {editorOpen && (
        <TimeEntryEditor
          existingEntries={data.entries.filter((entry) => entry.person.id === data.currentPersonId)}
          destinations={destination ? [destination] : destinations}
          today={data.today}
          formattedTimePreferences={data.formattedTimePreferences}
          onSave={data.onSaveEntry}
          onClose={() => setEditorOpen(false)}
        />
      )}
      {timerOpen && (
        <TimerDestinationDialog
          data={data}
          initialDestinationId={destination?.id}
          onClose={() => setTimerOpen(false)}
        />
      )}
    </div>
  );
}

function TimerDestinationDialog({
  data,
  initialDestinationId,
  onClose,
}: {
  data: TimeTrackingData;
  initialDestinationId?: string;
  onClose: () => void;
}) {
  const destinations = data.destinations.filter(
    (destination) =>
      destination.enabled &&
      destination.canTrack &&
      !destination.closed &&
      destination.id !== data.activeTimer?.destination.id,
  );
  const [destinationId, setDestinationId] = React.useState(initialDestinationId ?? destinations[0]?.id ?? "");
  const action = useTimeAction();
  const selected = destinations.find((destination) => destination.id === destinationId);
  const save = async () => {
    if (!selected) return;
    const ok = await action.run(() =>
      data.activeTimer ? data.onSwitchTimer(data.activeTimer.id, selected.id) : data.onStartTimer(selected.id),
    );
    if (ok) onClose();
  };
  return (
    <Modal
      isOpen
      onClose={() => {
        if (!action.pending) onClose();
      }}
      title={data.activeTimer ? "Switch timer" : "Start timer"}
      size="medium"
      testId="timer-destination-dialog"
    >
      <div className="space-y-5">
        {data.activeTimer && (
          <p className="text-sm text-content-dimmed">
            Time on {data.activeTimer.destination.name} will be saved before the next timer starts.
          </p>
        )}
        <div className="space-y-2">
          <label htmlFor="timer-destination" className="font-semibold text-sm">
            Work
          </label>
          <Dropdown
            id="timer-destination"
            value={destinationId}
            items={destinations.map((destination) => ({
              id: destination.id,
              name: `${destination.scopeName} · ${destination.name}`,
            }))}
            onSelect={(item) => setDestinationId(item.id)}
          />
        </div>
        {!destinations.length && (
          <p className="text-sm text-content-dimmed">No other work is available for tracking.</p>
        )}
        {action.error && (
          <div role="alert">
            <ErrorCallout message={action.error} />
          </div>
        )}
        <div className="flex gap-2">
          <PrimaryButton
            size="sm"
            disabled={!selected}
            loading={action.pending}
            onClick={save}
            testId="confirm-start-timer"
          >
            {data.activeTimer ? "Save and switch" : "Start timer"}
          </PrimaryButton>
          <SecondaryButton size="sm" disabled={action.pending} onClick={onClose}>
            Cancel
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  );
}

export interface GlobalTimeTrackerProps {
  data: TimeTrackingData;
  onOpenDestination?: (destination: TimeDestination) => void;
  longSessionSeconds?: number;
}

export function GlobalTimeTracker(props: GlobalTimeTrackerProps) {
  if (!props.data.activeTimer) return null;
  return <RunningTracker key={props.data.activeTimer.id} {...props} timer={props.data.activeTimer} />;
}

function RunningTracker({
  data,
  timer,
  onOpenDestination,
  longSessionSeconds = 8 * 3600,
}: GlobalTimeTrackerProps & { timer: ActiveTimer }) {
  const [now, setNow] = React.useState(Date.now());
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [switchOpen, setSwitchOpen] = React.useState(false);
  const [discardOpen, setDiscardOpen] = React.useState(false);
  const action = useTimeAction();
  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  const seconds = Math.max(0, Math.floor((now - new Date(timer.startedAt).getTime()) / 1000));
  const isLong = seconds >= longSessionSeconds;
  return (
    <aside
      aria-label="Running timer"
      className="border border-stroke-base rounded-lg bg-surface-base shadow-lg px-3 py-2 text-content-base"
      data-test-id="global-time-tracker"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {onOpenDestination ? (
            <ActionLink
              onClick={() => onOpenDestination(timer.destination)}
              className="block max-w-full truncate font-medium text-sm text-left !text-content-base"
              underline="hover"
              disableColorHoverEffect
            >
              <span title={timer.destination.name}>{timer.destination.name}</span>
            </ActionLink>
          ) : (
            <div className="font-medium text-sm truncate" title={timer.destination.name}>
              {timer.destination.name}
            </div>
          )}
          <div className="text-xs text-content-dimmed truncate">{timer.destination.scopeName}</div>
        </div>
        <div className="font-semibold text-sm tabular-nums shrink-0" role="timer" data-test-id="timer-elapsed">
          {formatDuration(seconds, data.formattedTimePreferences.locale, true)}
        </div>
        <PrimaryButton
          size="xs"
          onClick={() => action.run(() => data.onStopTimer(timer.id))}
          loading={action.pending}
          testId="stop-timer"
        >
          Stop
        </PrimaryButton>
        <Menu
          size="small"
          align="end"
          triggerLabel="Timer actions"
          open={menuOpen}
          onOpenChange={setMenuOpen}
          readonly={action.pending}
        >
          <MenuActionItem onClick={() => setSwitchOpen(true)}>Switch</MenuActionItem>
          <MenuActionItem danger onClick={() => setDiscardOpen(true)}>
            Discard
          </MenuActionItem>
        </Menu>
      </div>
      {isLong && (
        <p className="text-xs text-content-dimmed mt-2">Long session. You can edit the entry after stopping.</p>
      )}
      {action.error && !discardOpen && (
        <div role="alert" className="mt-2">
          <ErrorCallout message={action.error} />
        </div>
      )}
      {switchOpen && <TimerDestinationDialog data={data} onClose={() => setSwitchOpen(false)} />}
      {discardOpen && (
        <Modal
          isOpen
          title="Discard running time?"
          size="small"
          onClose={() => {
            if (!action.pending) setDiscardOpen(false);
          }}
        >
          <p className="text-sm mb-5">This session will not be saved.</p>
          <div className="flex gap-2">
            <PrimaryButton
              size="sm"
              loading={action.pending}
              onClick={() => action.run(() => data.onDiscardTimer(timer.id))}
            >
              Discard time
            </PrimaryButton>
            <SecondaryButton size="sm" disabled={action.pending} onClick={() => setDiscardOpen(false)}>
              Keep timer
            </SecondaryButton>
          </div>
          {action.error && (
            <div role="alert" className="mt-3">
              <ErrorCallout message={action.error} />
            </div>
          )}
        </Modal>
      )}
    </aside>
  );
}
