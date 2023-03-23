import React from "react";
import AsyncSelect from 'react-select/async';

import axios from 'axios';

function SearchField({onSelect, loader}) {
  const [selected, setSelected] = React.useState(null);

  const onChange = (value) => {
    onSelect(value);
    setSelected(null);
  }

  return (<AsyncSelect value={selected} onChange={onSelect} loadOptions={loader} />);
}

function PeopleList({people, removePerson}) {
  return people.map((p) => (
    <div className="px-2 py-1 border border-gray-200 round flex justify-between" key={p.value}>
      <p>{p.label}</p>

      <div className="hover:cursor-pointer" onClick={() => removePerson(p.value)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    </div>
    )
  )
}

class GroupsAPI {
  constructor(groupID) {
    this.groupID = groupID;
  }

  search(pattern) {
    const url = `/groups/${this.groupID}/people_search`
    const params = {withCredentials: true, params: {contains: pattern}}

    return axios.get(url, params).then((resp) => resp.data)
  }

  addMembers(peopleIds) {
    const url = `/groups/${this.groupID}/add_people`
    const data = {people: peopleIds}
    const params = {withCredentials: true, data: data}

    return axios.post(url, params)
  }
}

export default function AddGroupMembers({group, onComplete}) {
  const [peopleList, setPeopleList] = React.useState([]);

  const add      = ((person) => setPeopleList([...peopleList, person]));
  const isAdded  = ((id) => peopleList.find((p) => p.value == id));
  const remove   = ((id) => { setPeopleList(peopleList.filter((p) => p.value !== id)) })

  const api = new GroupsAPI(group.id)

  const search = (value: string) => {
    return api.search(value).then((data) => {
      const people = data.map((p) => {
        return {value: p.id, label: p.full_name}
      });

      return people.filter((p) => !isAdded(p.value))
    })
  }

  const submit = () => {
    const ids = peopleList.map((p) => p.id);

    api.addMembers(ids).then(() => onComplete())
  }

  return (
    <>
      <h1 className="font-bold mb-4">Add people to {group.name}</h1>

      <SearchField onSelect={add} loader={search} />

      <div className="flex flex-col gap-2 mt-4">
        <PeopleList people={peopleList} removePerson={remove} />
      </div>

      <div className="mt-4">
        <button onClick={submit} className="inline-flex -space-x-px overflow-hidden rounded-md border bg-white shadow-sm inline-block px-4 py-2 text-sm font-medium text-gray-700 hover:shadow focus:relative">Add Members</button>
      </div>
    </>
  );
}
