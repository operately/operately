import React from "react";
import Modal from "./modal";

import PageTitle from "./page_title";
import AddGroupMembers from "./addGroupMembers";

export default function GroupsShowPage({group: group}) {
  const [showModal, setShowModal] = React.useState(false);

  const openModal = () => { setShowModal(true); }
  const closeModal = () => { setShowModal(false); }

  return (
    <>
      <PageTitle name={group.name} />

      <button onClick={openModal} className="inline-flex -space-x-px overflow-hidden rounded-md border bg-white shadow-sm inline-block px-4 py-2 text-sm font-medium text-gray-700 hover:shadow focus:relative">Add Members</button>

      <Modal showModal={showModal}>
        <AddGroupMembers group={group} onComplete={closeModal} />
      </Modal>
    </>
  );
}
