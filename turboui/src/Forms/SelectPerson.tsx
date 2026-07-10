import * as React from "react";
import AsyncSelect from "react-select/async";

import { Avatar } from "../Avatar";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";
import { useFieldError, useFieldValue } from "./context";
import { InputField } from "./FieldGroup";
import type { SelectPersonPerson, SelectPersonProps } from "./types";
import { useValidation, validatePresence } from "./validation";

interface Option {
  value: string | null;
  label: React.ReactNode;
  person?: SelectPersonPerson;
}

const DEFAULT_VALIDATION_PROPS = {
  required: true,
};

export function SelectPerson(props: SelectPersonProps) {
  const error = useFieldError(props.field);

  return (
    <InputField field={props.field} label={props.label} error={error} hidden={props.hidden} required={props.required}>
      <SelectPersonInput {...props} />
    </InputField>
  );
}

function SelectPersonInput(props: SelectPersonProps) {
  const { field, searchFn, exclude } = props;
  const { required } = { ...DEFAULT_VALIDATION_PROPS, ...props };

  const [, setValue] = useFieldValue<string | null>(field);
  const error = useFieldError(field);
  const excludedIds = buildExcludedIds(exclude);

  const onChange = (option: Option | null) => {
    setValue(option?.value ?? null);
  };

  React.useEffect(() => {
    if (props.default) {
      setValue(props.default.id);
    }
  }, [props.default, setValue]);

  useValidation(field, validatePresence(required));

  return (
    <div className="flex-1" data-test-id={createTestId(field)}>
      <PersonSearch
        autoFocus={props.autoFocus}
        inputId={createTestId(field)}
        onChange={onChange}
        placeholder="Search for person..."
        defaultValue={props.default || undefined}
        loader={searchFn}
        error={!!error}
        filterOption={(candidate) => !excludedIds[candidate.value]}
        allowEmptySelection={props.allowEmpty}
        emptySelectionLabel={props.emptyLabel}
      />
    </div>
  );
}

function buildExcludedIds(exclude?: SelectPersonPerson[]): Record<string, boolean> {
  if (!exclude) return {};

  const res: Record<string, boolean> = {};

  exclude.forEach((person) => {
    res[person.id] = true;
  });

  return res;
}

interface PersonSearchProps {
  onChange: (value: Option | null) => void;
  loader: (query: string) => Promise<SelectPersonPerson[]>;
  filterOption?: (candidate: { value: string }) => boolean;
  placeholder: string;
  autoFocus?: boolean;
  defaultValue?: SelectPersonPerson;
  inputId?: string;
  error?: boolean;
  allowEmptySelection?: boolean;
  emptySelectionLabel?: string;
}

function PersonSearch(props: PersonSearchProps) {
  if (props.allowEmptySelection && !props.emptySelectionLabel) {
    throw new Error("emptySelectionLabel is required when allowEmptySelection is true");
  }

  const defaultValue = props.defaultValue && personAsOption(props.defaultValue);
  const optionLoader = usePeopleOptionLoader(props);

  return (
    <AsyncSelect
      unstyled
      autoFocus={props.autoFocus}
      placeholder={props.placeholder}
      onChange={props.onChange}
      inputId={props.inputId || "people-search"}
      loadOptions={optionLoader}
      defaultValue={defaultValue}
      defaultOptions
      cacheOptions={false}
      filterOption={props.filterOption || (() => true)}
      classNames={asyncSelectClassNames(!!props.error)}
      styles={asyncSelectStyles()}
    />
  );
}

type LoaderFunction = (input: string, callback: (options: Option[]) => void) => void;

function usePeopleOptionLoader(props: PersonSearchProps): LoaderFunction {
  return React.useCallback(
    throttle(async (input: string, callback: (options: Option[]) => void) => {
      try {
        const people = await props.loader(input);
        const options = people.map((person) => personAsOption(person));

        if (props.allowEmptySelection) {
          options.push(emptySelectionOption(props.emptySelectionLabel!));
        }

        callback(options);
      } catch (error) {
        console.error(error);
        callback([]);
      }
    }, 500),
    [props.loader, props.allowEmptySelection, props.emptySelectionLabel],
  );
}

function emptySelectionOption(label: string): Option {
  return {
    value: null,
    label: (
      <div className="flex items-center gap-2" data-test-id={createTestId("person-option-nobody")}>
        {label}
      </div>
    ),
  };
}

function personAsOption(person: SelectPersonPerson): Option {
  return {
    value: person.id,
    label: <PersonLabel person={person} />,
    person,
  };
}

function PersonLabel({ person }: { person: SelectPersonPerson }) {
  return (
    <div className="flex items-center gap-2" data-test-id={createTestId("person-option", person.fullName)}>
      <Avatar person={person} size="tiny" />
      {person.fullName}
      {person.title ? <>&middot; {person.title}</> : null}
    </div>
  );
}

function asyncSelectStyles() {
  return {
    input: (provided: Record<string, unknown>) => ({
      ...provided,
      "input:focus": {
        boxShadow: "none",
      },
    }),
  };
}

function asyncSelectClassNames(error: boolean) {
  return {
    control: ({ isFocused }: { isFocused: boolean }) => {
      if (error) {
        return "bg-surface-base placeholder-content-subtle border border-red-500 rounded-lg px-3";
      }

      if (isFocused) {
        return "bg-surface-base placeholder-content-subtle border-2 border-blue-600 rounded-lg px-3";
      }

      return "bg-surface-base placeholder-content-subtle border border-surface-outline rounded-lg px-3";
    },
    menu: () => "bg-surface-base text-content-accent border border-surface-outline rounded-lg mt-1 overflow-hidden",
    input: () => "placeholder-content-subtle focus:ring-0 outline-none",
    placeholder: () => "truncate",
    option: ({ isFocused, data }: { isFocused: boolean; data: Option }) => {
      return classNames({
        "px-3 py-2 hover:bg-surface-dimmed cursor-pointer": true,
        "bg-surface-dimmed": isFocused,
        "border-t border-stroke-dimmed": data.value === null,
      });
    },
  };
}

function throttle<TArgs extends unknown[]>(callback: (...args: TArgs) => void, wait: number) {
  let timeoutId: number | null = null;

  return (...args: TArgs) => {
    if (timeoutId) window.clearTimeout(timeoutId);

    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
}
