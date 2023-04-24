import React from 'react';
import Button, { ButtonSize } from '../../components/Button';
import Modal from './Modal';

import Form from '../../components/Form';
import FormSelect from '../../components/FormSelect';
import FormTextInput from '../../components/FormTextInput';

interface Contact {
  id: string;
  name: string;
  type: string;
}

interface PointsOfContactProps {
  groupId: string;
  groupName: string;
  pointsOfContact: Contact[];
}

function SlackInputFields() {
  return <div>
    <div className="mt-4 flex flex-col gap-4">
      <FormTextInput id="value" label="URL" />
      <FormTextInput id="name" label="Name" />
    </div>
  </div>;
}

function InputFieldsForType(type: string) {
  switch (type) {
    case 'slack':
      return <SlackInputFields />;
    default:
      throw "Not implemented";
  }
}

interface AddContactModalProps {
  isOpen: boolean;
  hideModal: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function AddContactModal(props : AddContactModalProps) : JSX.Element {
  const [selected, setSelected] = React.useState('slack');

  return <Modal title="Add a Point of Contact" hideModal={props.hideModal} isOpen={props.isOpen}>
    <Form onSubmit={props.onSubmit} onCancel={props.hideModal}>
      <p className="prose mb-4">Select a third-party platform where the team works together.</p>

      <FormSelect id="contactType" label="Type" value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="slack">Slack Channel</option>
      </FormSelect>

      <div className="mt-4">
        {InputFieldsForType(selected)}
      </div>
    </Form>
  </Modal>;
}

export default function PointsOfContact({groupId, groupName, pointsOfContact} : PointsOfContactProps) {
  const [showModal, setShowModal] = React.useState(true);

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold">Points of Contact</h2>
      <div className="mb-2">
        Create links that help reach people in the {groupName} group, such as team’s Slack channel.
      </div>

      <Button
        ghost
        size={ButtonSize.Small}
        onClick={() => setShowModal(true)}
      >Add a Point of Contact</Button>

      <AddContactModal
        isOpen={showModal}
        onSubmit={() => {}}
        onCancel={() => setShowModal(false)}
        hideModal={() => setShowModal(false)}
      />
    </div>
  );
}
