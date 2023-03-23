import React from "react";
import Select from 'react-select';
import AsyncSelect from 'react-select/async';

import PageTitle from "./page_title";
import Modal from "./modal";

const peopleSearch = (inputValue: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {value: "1", label: "Igor"},
        {value: "2", label: "John"},
        {value: "3", label: "Peter"}
      ]);
    })
  }, 10000)
}


export default function GroupsShowPage({group: group}) {
  const [selectedOption, setSelectedOption] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);

  const handleOpenModal = () => { setShowModal(true); }
  const handleCloseModal = () => { setShowModal(false); }

  return (
    <>
      <PageTitle name={group.name} />

      <button onClick={handleOpenModal} className="inline-flex -space-x-px overflow-hidden rounded-md border bg-white shadow-sm inline-block px-4 py-2 text-sm font-medium text-gray-700 hover:shadow focus:relative">Add Members</button>

      <Modal showModal={showModal}>
        <h1 className="font-bold mb-4">Add people to {group.name}</h1>

        <AsyncSelect
          cacheOptions
          onChange={setSelectedOption}
          loadOptions={peopleSearch}
        />

        <div className="mt-4">
          <button className="inline-flex -space-x-px overflow-hidden rounded-md border bg-white shadow-sm inline-block px-4 py-2 text-sm font-medium text-gray-700 hover:shadow focus:relative">Add Members</button>
        </div>
      </Modal>
    </>
  );
}
