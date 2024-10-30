import * as React from "react";

import classNames from "classnames";

import * as People from "@/models/people";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";
import { createTestId } from "@/utils/testid";
import { match } from "ts-pattern";

interface MultiPeopleSearchProps {
  addedPeople: People.Person[];
  setAddedPeople: React.Dispatch<React.SetStateAction<People.Person[]>>;
  visuals: "minimal" | "regular";
  searchScope: People.SearchScope;
}

export function MultiPeopleSearch(props: MultiPeopleSearchProps) {
  const search = People.usePeopleSearch(props.searchScope);

  const [state, setState] = React.useState<"idle" | "searching">("idle");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [people, setPeople] = React.useState<People.Person[]>(props.addedPeople);
  const [selectedPersonIndex, setSelectedPersonIndex] = React.useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const addPerson = (person: People.Person | null | undefined) => {
    if (!person) return;

    props.setAddedPeople((people) => [...people, person]);
    setSearchTerm("");
    setPeople([]);
    setSelectedPersonIndex(0);
    inputRef.current?.focus();
  };

  const removePerson = (person: People.Person | null | undefined) => {
    if (!person) return;

    props.setAddedPeople((people) => people.filter((p) => p.id !== person.id));
  };

  const moveSelectionUp = () => {
    setSelectedPersonIndex((index) => Math.max(index - 1, 0));
  };

  const moveSelectionDown = () => {
    setSelectedPersonIndex((index) => Math.min(index + 1, people.length - 1));
  };

  const stopEventPropagation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    match(e.key)
      .with("ArrowDown", () => {
        stopEventPropagation(e);
        moveSelectionDown();
      })
      .with("ArrowUp", () => {
        stopEventPropagation(e);
        moveSelectionUp();
      })
      .with("Enter", () => {
        stopEventPropagation(e);
        addPerson(people[selectedPersonIndex]);
      })
      .with("Backspace", () => {
        if (searchTerm === "") {
          stopEventPropagation(e);
          removePerson(props.addedPeople[props.addedPeople.length - 1]);
        }
      })
      .otherwise(() => {
        // Do nothing
      });
  };

  const handleSearchTermChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.trim();

    setSearchTerm(e.target.value);
    if (term.length < 2) setPeople([]);
  };

  React.useEffect(() => {
    setState("searching");

    const t = setTimeout(() => {
      if (searchTerm.length < 2) {
        setState("idle");
        setPeople([]);
        return;
      }

      search({
        query: searchTerm.trim(),
        ignoredIds: props.addedPeople.map((person) => person.id!),
      }).then((response) => {
        setState("idle");
        setPeople(response);
      });
    }, 50);

    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleBlur = () => {
    setSearchTerm("");
    setPeople([]);
    setSelectedPersonIndex(0);
  };

  return (
    <FormField visuals={props.visuals}>
      <div className="flex-1 relative flex gap-1.5 flex-wrap">
        <PeopleList people={props.addedPeople} onRemove={removePerson} />

        <div className="flex-1 relative flex">
          <input
            ref={inputRef}
            type="text"
            className="border-none ring-0 p-0 bg-transparent outline-none hover:ring-0 focus:ring-0 flex-1"
            placeholder={props.addedPeople.length === 0 ? "Type names to assign" : ""}
            onChange={handleSearchTermChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            value={searchTerm}
            id="task-assignees-input"
          />

          {searchTerm.length >= 2 && (
            <PeopleSelectPopup people={people} selectedIndex={selectedPersonIndex} onClick={addPerson} state={state} />
          )}
        </div>
      </div>
    </FormField>
  );
}

function PeopleList({ people, onRemove }: { people: People.Person[]; onRemove: (person: People.Person) => void }) {
  return people.map((person) => (
    <div
      className="flex items-center gap-1 bg-accent-1 rounded-xl px-1.5 py-0.5 text-sm text-white-1 shrink-0"
      key={person.id}
    >
      <Avatar key={person.id} person={person} size={18} />

      <div>{person.fullName}</div>

      <Icons.IconX
        size={12}
        onClick={() => onRemove(person)}
        className="cursor-pointer ml-1"
        data-test-id={createTestId("remove", person.fullName!)}
      />
    </div>
  ));
}

interface PeopleSelectPopupProps {
  people: People.Person[];
  selectedIndex: number;
  onClick: (person: People.Person) => void;
  state: "idle" | "searching";
}

function PeopleSelectPopup({ people, selectedIndex, state, onClick }: PeopleSelectPopupProps) {
  const slicedPeople = people.slice(0, 5);

  if (state === "searching" && slicedPeople.length === 0) return null;

  return (
    <div className="absolute flex items-center justify-center z-[1000]" style={{ top: "30px", left: 0 }}>
      <div className="flex flex-col rounded-lg border border-stroke-base overflow-hidden shadow-lg bg-surface-base">
        {slicedPeople.length === 0 ? (
          <div className="p-1 px-2">No results</div>
        ) : (
          slicedPeople.map((person, index) => (
            <PeopleSelectPopupElement
              key={person.id}
              person={person}
              onClick={onClick}
              selected={selectedIndex === index}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface PeopleSelectPopupElementProps {
  person: People.Person;
  onClick: (person: People.Person) => void;
  selected: boolean;
}

function PeopleSelectPopupElement({ person, onClick, selected }: PeopleSelectPopupElementProps) {
  const testId = createTestId("person-option", person.fullName!);

  const className = classNames({
    "flex items-center gap-2": true,
    "p-1 px-2": true,
    "cursor-pointer": true,
    "bg-sky-300": selected,
  });

  return (
    <div key={person.id} className={className} data-test-id={testId} onClick={() => onClick(person)}>
      <Avatar person={person} size={20} />
      <div>{person.fullName}</div>
    </div>
  );
}

function FormField({ children, visuals = "regular" }: { children: React.ReactNode; visuals?: "minimal" | "regular" }) {
  if (visuals === "minimal") {
    return (
      <div
        className={classNames({
          "flex items-center gap-2 flex-wrap": true,
          "w-full px-2 py-1 placeholder-content-dimmed bg-surface-highlight font-medium": true,
          "outline-none ring-0 border-none": true,
        })}
        children={children}
      />
    );
  } else {
    return (
      <div
        className={classNames(
          "flex items-center gap-2 flex-wrap",
          "w-full bg-surface-base text-content-accent placeholder-content-subtle border rounded-lg px-3 py-1.5",
          "border-surface-outline",
        )}
        children={children}
      />
    );
  }
}
