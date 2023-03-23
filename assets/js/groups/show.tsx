import React from "react";
import Select from 'react-select';
import AsyncSelect from 'react-select/async';

import PageTitle from "./page_title";
import Modal from "./modal";

import axios from 'axios';


export default function GroupsShowPage({group: group}) {
  const [showModal, setShowModal] = React.useState(false);
  const [selectedPeople, setSelectedPeople] = React.useState([]);
  const [selectedPerson, setSelectedPerson] = React.useState(null);

  const handleOpenModal = () => { setShowModal(true); }
  const handleCloseModal = () => { setShowModal(false); }

  const peopleSearch = (inputValue: string) => {
    const url = `/groups/${group.id}/people_search`

    return axios
      .get(url, {withCredentials: true, params: {contains: inputValue}})
      .then((resp) => {
        return resp.data.map((person) => {
          return {value: person.id, label: person.full_name}
        })
      })
  }

  const addPeople = () => {
    const url = `/groups/${group.id}/add_people`
    const people = selectedPeople.map((p) => p.value)

    return axios
      .post(url, {withCredentials: true, data: {people: people}})
      .then((resp) => {
        console.log(resp)
      })
  }

  const addSelected = (value: string) => {
    setSelectedPeople([...selectedPeople, value]);
    setSelectedPerson(null);
  }

  return (
    <>
      <PageTitle name={group.name} />

      <button onClick={handleOpenModal} className="inline-flex -space-x-px overflow-hidden rounded-md border bg-white shadow-sm inline-block px-4 py-2 text-sm font-medium text-gray-700 hover:shadow focus:relative">Add Members</button>

      <Modal showModal={showModal}>
        <h1 className="font-bold mb-4">Add people to {group.name}</h1>

        <AsyncSelect value={selectedPerson} cacheOptions onChange={addSelected} loadOptions={peopleSearch} />

        <div className="flex flex-col gap-2 mt-4">
          {selectedPeople.map((p) => {
            return (<p className="px-2 py-1 border border-gray-200 round" key={p.value}>{p.label}</p>)
          })}
        </div>

        <div className="mt-4">
          <button onClick={addPeople} className="inline-flex -space-x-px overflow-hidden rounded-md border bg-white shadow-sm inline-block px-4 py-2 text-sm font-medium text-gray-700 hover:shadow focus:relative">Add Members</button>
        </div>
      </Modal>
    </>
  );
}
