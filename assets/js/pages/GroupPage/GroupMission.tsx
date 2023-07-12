import React from "react";
import { useApolloClient } from "@apollo/client";

import { setMission } from "../../graphql/Groups";
import Modal from "./Modal";
import * as Forms from "@/components/Form";

interface EditModalProps {
  isOpen: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: (e: React.MouseEvent) => void;
  mission?: string;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

function EditModal(props: EditModalProps) {
  return (
    <Modal title="Edit Mission" hideModal={props.onCancel} isOpen={props.isOpen}>
      <Forms.Form isValid={true} onSubmit={props.onSubmit}>
        <textarea
          data-test-id="groupMissionTextarea"
          ref={props.inputRef}
          className="border border-gray-300 rounded p-2 w-full"
          placeholder="Set a mission for the group&hellip;"
        >
          {props.mission}
        </textarea>
      </Forms.Form>
    </Modal>
  );
}

export default function GroupMission({ groupId, mission, onMissionChanged }) {
  const client = useApolloClient();
  const [showEditModal, setShowEditModal] = React.useState(false);

  let inputRef = React.useRef<HTMLTextAreaElement>(null);

  const handleEditMission = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowEditModal(true);
  };

  const handleSubmit = () => {
    const variables = {
      groupId: groupId,
      mission: inputRef.current?.value,
    };

    setMission(client, { variables }).then(() => {
      setShowEditModal(false);
      onMissionChanged && onMissionChanged();
    });
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowEditModal(false);
  };

  const editLink = (
    <a data-test-id="editGroupMission" className="underline cursor-pointer" onClick={handleEditMission}>
      edit
    </a>
  );

  return (
    <div className="text-dark-2 prose" data-test-id="group-mission">
      <EditModal
        isOpen={showEditModal}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        mission={mission}
        inputRef={inputRef}
      />
      {mission ? <span className="text-dark-1">{mission}</span> : <span className="text-dark-2">mission not set</span>}{" "}
      &mdash; {editLink}
    </div>
  );
}
