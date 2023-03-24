import React from "react";
import Modal from "./modal";

import PageTitle from "./page_title";
import AddGroupMembers from "./addGroupMembers";
import CondensedMemberList from "./CondensedMemberList";

import GroupsApi from "../api/GroupsApi";

export default function GroupsShowPage({group: group}) {
  const [showModal, setShowModal] = React.useState(false);
  const [members, setMembers] = React.useState([]);
  const [totalCount, setTotalCount] = React.useState(null)

  const openModal = () => { setShowModal(true); }

  const closeModal = () => {
    setShowModal(false);
  }

  React.useEffect(() => {
    const fetchData = async () => {
      const resp = await GroupsApi.listMembers(group.id, 5, true)

      setTotalCount(resp.total)
    }

    fetchData().catch(console.error)
  }, [totalCount])

  return (
    <>
      <PageTitle name={group.name} />

      <CondensedMemberList members={members} total={totalCount} />

      <button onClick={openModal} className="inline-flex -space-x-px overflow-hidden rounded-md border bg-white shadow-sm inline-block px-4 py-2 text-sm font-medium text-gray-700 hover:shadow focus:relative">Add Members</button>

      <Modal showModal={showModal}>
        <AddGroupMembers group={group} onComplete={closeModal} />
      </Modal>
    </>
  );
}
