import React from "react";

import type { DocumentVersion } from "../ApiTypes";
import FormattedTime from "../FormattedTime";
import type { FormattedTimePreferences } from "../FormattedTime";
import { RichContentDiff } from "../RichContentDiff";
import type { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import classNames from "../utils/classnames";

import type { ComparisonStatus, VersionSnapshot } from "../DocumentVersionHistoryPage/types";

import {
  ComparisonErrorState,
  ComparisonLoadingState,
  NoChangesState,
  VersionUnavailableState,
} from "./states";

type Props = {
  versions: DocumentVersion[];
  before: VersionSnapshot | null;
  after: VersionSnapshot | null;
  comparisonStatus: ComparisonStatus;
  formattedTimePreferences: FormattedTimePreferences;
  mentionedPersonLookup: MentionedPersonLookupFn;
  onRetryComparison: () => void;
};

export function ComparisonPanel(props: Props) {
  let content: React.ReactNode;

  if (props.comparisonStatus === "idle" || props.comparisonStatus === "loading") {
    content = <ComparisonLoadingState />;
  } else if (props.comparisonStatus === "error") {
    content = <ComparisonErrorState onRetry={props.onRetryComparison} />;
  } else if (!props.before || !props.after) {
    content = <VersionUnavailableState />;
  } else {
    content = (
      <ReadyComparison
        versions={props.versions}
        before={props.before}
        after={props.after}
        formattedTimePreferences={props.formattedTimePreferences}
        mentionedPersonLookup={props.mentionedPersonLookup}
      />
    );
  }

  return <div data-test-id="comparison-panel">{content}</div>;
}

function ReadyComparison(props: {
  versions: DocumentVersion[];
  before: VersionSnapshot;
  after: VersionSnapshot;
  formattedTimePreferences: FormattedTimePreferences;
  mentionedPersonLookup: MentionedPersonLookupFn;
}) {
  const contentEqual = JSON.stringify(props.before.content) === JSON.stringify(props.after.content);
  const beforeTime = versionInsertedAt(props.versions, props.before);
  const afterTime = versionInsertedAt(props.versions, props.after);
  const beforeLabel = (
    <VersionTimeLabel
      time={beforeTime}
      preferences={props.formattedTimePreferences}
      testId="version-label-before"
    />
  );
  const afterLabel = (
    <VersionTimeLabel
      time={afterTime}
      preferences={props.formattedTimePreferences}
      testId="version-label-after"
    />
  );

  if (contentEqual) {
    return (
      <div>
        <TitleComparison
          beforeTitle={props.before.title}
          afterTitle={props.after.title}
          beforeLabel={beforeLabel}
          afterLabel={afterLabel}
        />
        <NoChangesState />
      </div>
    );
  }

  return (
    <RichContentDiff
      before={props.before.content}
      after={props.after.content}
      beforeLabel={beforeLabel}
      afterLabel={afterLabel}
      beforeAriaLabel={beforeTime ? `Version from ${beforeTime}` : "Earlier version"}
      afterAriaLabel={afterTime ? `Version from ${afterTime}` : "Later version"}
      beforeTitle={props.before.title}
      afterTitle={props.after.title}
      mentionedPersonLookup={props.mentionedPersonLookup}
      showLegend={false}
    />
  );
}

function versionInsertedAt(versions: DocumentVersion[], snapshot: VersionSnapshot): string | null {
  return (
    snapshot.insertedAt ??
    versions.find((version) => version.versionNumber === snapshot.versionNumber)?.insertedAt ??
    null
  );
}

function VersionTimeLabel(props: {
  time: string | null;
  preferences: FormattedTimePreferences;
  testId: string;
}) {
  return (
    <span className="text-xs font-normal text-content-dimmed" data-test-id={props.testId}>
      {props.time ? (
        <>
          <FormattedTime {...props.preferences} time={props.time} format="short-date" />
          {" at "}
          <FormattedTime {...props.preferences} time={props.time} format="time-only" />
        </>
      ) : (
        "Time unavailable"
      )}
    </span>
  );
}

function TitleComparison(props: {
  beforeTitle: string;
  afterTitle: string;
  beforeLabel: React.ReactNode;
  afterLabel: React.ReactNode;
}) {
  const titlesEqual = props.beforeTitle === props.afterTitle;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2" data-test-id="title-comparison">
      <TitlePane
        label={props.beforeLabel}
        title={props.beforeTitle}
        variant={titlesEqual ? "normal" : "removed"}
        position="before"
      />
      <TitlePane
        label={props.afterLabel}
        title={props.afterTitle}
        variant={titlesEqual ? "normal" : "added"}
        position="after"
      />
    </div>
  );
}

function TitlePane(props: {
  label: React.ReactNode;
  title: string;
  variant: "normal" | "removed" | "added";
  position: "before" | "after";
}) {
  return (
    <section
      className={classNames(
        "min-w-0",
        props.position === "before" &&
          "border-b border-stroke-base pb-5 sm:pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-8",
        props.position === "after" && "pt-5 sm:pt-8 md:pt-0 md:pl-8",
      )}
    >
      <header className="mb-2">
        <h2>{props.label}</h2>
      </header>
      <div
        className={classNames(
          "text-xl font-extrabold leading-tight text-content-accent sm:text-2xl",
          props.variant === "removed" && "rounded-md bg-red-200 px-2 py-1 dark:bg-red-400/40",
          props.variant === "added" && "rounded-md bg-emerald-200 px-2 py-1 dark:bg-emerald-400/40",
        )}
        data-test-id={`title-${props.variant}`}
      >
        {props.title || "Untitled"}
      </div>
    </section>
  );
}
