import * as React from "react";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as Time from "@/utils/time";
import * as Goals from "@/models/goals";

import { useLoadedData } from "./loader";
import { createPath } from "@/utils/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";

interface FormState {
  spaceID: string;
  company: Companies.Company;
  me: People.Person;

  name: string;
  setName: (name: string) => void;

  champion: string | null;
  setChampion: (champion: string | null) => void;

  reviewer: string | null;
  setReviewer: (reviewer: string | null) => void;

  timeframe: TimeframeState;

  isValid: boolean;
  submit: () => void;
  cancel: () => void;
  submitting: boolean;
}

interface TimeframeState {
  year: {
    options: Option[];
    default: Option;
    selected: Option;
    setSelected: (Option: string) => void;
  };
  quarter: {
    options: Option[];
    default: Option;
    selected: Option;
    setSelected: (Option: string) => void;
  };
}

interface Option {
  value: string;
  label: string;
}

export function useForm(company: Companies.Company, me: People.Person): FormState {
  const { spaceID } = useLoadedData();

  const cancel = useNavigateTo(createPath("spaces", spaceID));
  const timeframe = useTimeframe();

  const [name, setName] = React.useState<string>("");
  const [champion, setChampion] = React.useState<string | null>(me.id);
  const [reviewer, setReviewer] = React.useState<string | null>(null);

  const nameIsValid = () => name.length > 0;
  const championIsValid = () => champion !== null;
  const reviewerIsValid = () => reviewer !== null;
  const timeframeIsValid = () => timeframe.year.selected !== null && timeframe.quarter.selected !== null;

  const isValid = timeframeIsValid() && nameIsValid() && championIsValid() && reviewerIsValid();

  const [create, { loading: submitting }] = Goals.useCreateGoalMutation({
    onCompleted: (data: any) => useNavigateTo(createPath("goals", data.createGoal.id)),
  });

  const submit = async () => {
    await create({
      variables: {
        input: {
          spaceId: spaceID,
          name,
          championID: champion,
          reviewerID: reviewer,
          year: timeframe.year.selected.value,
          quarter: timeframe.quarter.selected.value,
        },
      },
    });
  };

  return {
    spaceID,
    company,
    me,

    name,
    setName,

    champion,
    setChampion,

    reviewer,
    setReviewer,

    timeframe,

    isValid,
    submit,
    cancel,
    submitting,
  };
}

function useTimeframe(): TimeframeState {
  const currentYear = Time.currentYear();

  const lastYear = currentYear - 1;
  const nextYear = currentYear + 1;

  const yearOptions = [
    { value: lastYear.toString(), label: `${lastYear} (Last Year)` },
    { value: currentYear.toString(), label: `${currentYear} (Current)` },
    { value: nextYear.toString(), label: `${nextYear} (Next Year)` },
    { value: (nextYear + 1).toString(), label: `${nextYear + 1}` },
    { value: (nextYear + 2).toString(), label: `${nextYear + 2}` },
  ];

  const [selectedYear, setSelectedYear] = React.useState<Option>(yearOptions[1] as Option);

  const quarterOptions = [
    { value: "Whole Year", label: "Whole Year" },
    { value: "Q1", label: "Q1" + (isCurrentQuarter(1, selectedYear.value) ? " (Current)" : "") },
    { value: "Q2", label: "Q2" + (isCurrentQuarter(2, selectedYear.value) ? " (Current)" : "") },
    { value: "Q3", label: "Q3" + (isCurrentQuarter(3, selectedYear.value) ? " (Current)" : "") },
    { value: "Q4", label: "Q4" + (isCurrentQuarter(4, selectedYear.value) ? " (Current)" : "") },
  ];

  const defaultQuarter = getDefaultQuarterOption(quarterOptions, selectedYear.value);
  const [selectedQuarter, setSelectedQuarter] = React.useState<Option>(defaultQuarter);

  return {
    year: {
      options: yearOptions,
      default: yearOptions[1] as Option,
      selected: selectedYear,
      setSelected: (e: any) => setSelectedYear(e as Option),
    },
    quarter: {
      options: quarterOptions,
      default: defaultQuarter,
      selected: selectedQuarter,
      setSelected: (e: any) => setSelectedQuarter(e as Option),
    },
  };
}

function isCurrentQuarter(quarter: number, year: string) {
  const currentYear = Time.currentYear();
  const currentQuarter = Time.currentQuarter();

  return quarter === currentQuarter && year === currentYear.toString();
}

function getDefaultQuarterOption(quarterOptions: Option[], year: string): Option {
  const currentYear = Time.currentYear();
  if (year !== currentYear.toString()) return quarterOptions[1] as Option;

  const currentQuarter = Time.currentQuarter();
  return quarterOptions.find((o) => o.value === `Q${currentQuarter}`) as Option;
}
