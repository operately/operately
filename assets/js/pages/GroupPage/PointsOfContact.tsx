import React from 'react';
import Button, { ButtonSize } from '../../components/Button';
import Modal from './Modal';

import Form from '../../components/Form';
import FormSelect from '../../components/FormSelect';
import FormTextInput from '../../components/FormTextInput';
import Icon from '../../components/Icon';

import { useApolloClient } from '@apollo/client';
import { addContact } from '../../graphql/Groups';

interface Contact {
  id: string;
  name: string;
  value: string;
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
  formRef: React.RefObject<HTMLFormElement>;
}

function AddContactModal(props : AddContactModalProps) : JSX.Element {
  const [selected, setSelected] = React.useState('slack');

  return <Modal title="Add a Point of Contact" hideModal={props.hideModal} isOpen={props.isOpen}>
    <Form ref={props.formRef} onSubmit={props.onSubmit} onCancel={props.hideModal}>
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

function SlackContact({name, value} : {name: string, value: string}) {
  return <div className="flex gap-2 border rounded border-dark-2 px-2 py-1 shadow-sm hover:shadow-lg cursor-pointer">
    <Icon name="slack" color="brand" hoverColor="brand" />
    <a href={value}>{name}</a>
  </div>;
}

function Contact({contact} : {contact: Contact}) {
  switch (contact.type) {
    case 'slack':
      return SlackContact(contact);
    default:
      throw "Not implemented";
  }
}

export default function PointsOfContact({groupId, groupName, pointsOfContact} : PointsOfContactProps) {
  const client = useApolloClient();
  const [showModal, setShowModal] = React.useState(false);

  let formRef = React.useRef<HTMLFormElement>(null);

  function handleAddContact() {
    let typeInput = formRef.current?.querySelector('#contactType') as HTMLSelectElement;
    let nameInput = formRef.current?.querySelector('#name') as HTMLInputElement;
    let valueInput = formRef.current?.querySelector('#value') as HTMLInputElement;

    addContact(client, {
      variables: {
        groupId: groupId,
        contact: {
          type: typeInput.value,
          name: nameInput.value,
          value: valueInput.value,
        }
      }
    });

    setShowModal(false);
  }

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold">Points of Contact</h2>
      <div className="mb-2">
        Create links that help reach people in the {groupName} group, such as team’s Slack channel.
      </div>

      {pointsOfContact.length > 0 && <div className="my-4">
        <div className="flex gap-4">
          {pointsOfContact.map((contact) => <Contact key={contact.id} contact={contact} />)}
        </div>
      </div>}

      <Button
        ghost
        size={ButtonSize.Small}
        onClick={() => setShowModal(true)}
      >Add a Point of Contact</Button>

      <AddContactModal
        isOpen={showModal}
        formRef={formRef}
        onSubmit={handleAddContact}
        onCancel={() => setShowModal(false)}
        hideModal={() => setShowModal(false)}
      />
    </div>
  );
}
