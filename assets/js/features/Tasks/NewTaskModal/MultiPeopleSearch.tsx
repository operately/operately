import * as React from "react";

import classNames from "classnames";

import * as People from "@/graphql/People";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";

interface MultiPeopleSearchProps {
  addedPeople: People.Person[];
  setAddedPeople: React.Dispatch<React.SetStateAction<People.Person[]>>;
}

export function MultiPeopleSearch(props: MultiPeopleSearchProps) {
  const search = People.usePeopleSearch();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [people, setPeople] = React.useState<People.Person[]>([]);
  const [selectedPersonIndex, setSelectedPersonIndex] = React.useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSearch = async (searchTerm: string) => {
    setSearchTerm(searchTerm);

    if (searchTerm.length < 2) {
      setPeople([]);
      return;
    }

    const response = await search({
      query: searchTerm,
      ignoredPeopleIds: props.addedPeople.map((person) => person.id),
    });

    setPeople(response);
  };

  const searchPopupStyle = React.useMemo(() => {
    if (!inputRef.current) return {};

    const inputRect = inputRef.current.getBoundingClientRect();
    return {
      top: `${inputRect.bottom}px`,
      left: `${inputRect.left}px`,
    };
  }, [inputRef.current]);

  return (
    <div
      className={classNames({
        "flex items-center gap-2 flex-wrap": true,
        "w-full px-2 py-1 placeholder-content-dimmed bg-surface-highlight font-medium": true,
        "outline-none ring-0 border-none": true,
      })}
    >
      {props.addedPeople.map((person) => (
        <div
          className="flex items-center gap-1 bg-accent-1 rounded-xl px-1.5 py-0.5 text-sm text-white-1 shrink-0"
          key={person.id}
        >
          <Avatar key={person.id} person={person} size={18} />
          <div>{person.fullName}</div>
          <Icons.IconX
            size={12}
            onClick={() => props.setAddedPeople((people) => people.filter((p) => p.id !== person.id))}
            className="cursor-pointer ml-1"
          />
        </div>
      ))}

      <input
        ref={inputRef}
        type="text"
        className="border-none ring-0 p-0 bg-transparent flex-1 outline-none hover:ring-0 focus:ring-0"
        placeholder={props.addedPeople.length === 0 ? "Type names to assign" : ""}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.stopPropagation();
            e.preventDefault();
            setSelectedPersonIndex((index) => Math.min(index + 1, people.length - 1));
          }

          if (e.key === "ArrowUp") {
            e.stopPropagation();
            e.preventDefault();
            setSelectedPersonIndex((index) => Math.max(index - 1, 0));
          }

          if (e.key === "Enter") {
            e.stopPropagation();
            e.preventDefault();

            const person = people[selectedPersonIndex];
            if (person) {
              setSearchTerm("");
              setPeople([]);
              setSelectedPersonIndex(0);
              props.setAddedPeople((people) => [...people, person]);
            }
          }

          if (e.key === "Backspace" && searchTerm === "" && props.addedPeople.length > 0) {
            props.setAddedPeople((people) => people.slice(0, people.length - 1));
          }
        }}
        value={searchTerm}
      />

      <div className="absolute flex items-center justify-center z-[1000]" style={searchPopupStyle}>
        <div className="flex flex-col rounded-lg border border-stroke-base overflow-hidden shadow-lg bg-surface">
          {searchTerm.length >= 2 && people.length === 0 && <div className="p-1 px-2">No results</div>}
          {people.length > 0 &&
            people.slice(0, 5).map((person, index) => (
              <div
                key={person.id}
                className={classNames({
                  "flex items-center gap-2": true,
                  "p-1 px-2": true,
                  "bg-sky-300": selectedPersonIndex === index,
                })}
              >
                <Avatar person={person} size={20} />
                <div>{person.fullName}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
