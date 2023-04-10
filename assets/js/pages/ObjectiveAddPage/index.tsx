import React from "react";

import { useNavigate } from "react-router-dom";
import { useMutation, gql, useApolloClient } from "@apollo/client";

import Form from "../../components/Form";
import FormTextInput from "../../components/FormTextInput";
import FormTextArea from "../../components/FormTextArea";

import AsyncSelect from 'react-select/async';

const CREATE_OBJECTIVE = gql`
  mutation CreateObjective($name: String!, $description: String) {
    createObjective(name: $name, description: $description) {
      id
      name
    }
  }
`;

const SEARCH_PEOPLE = gql`
  query SearchPeople($query: String!) {
    searchPeople(query: $query) {
      id
      fullName
      title
    }
  }
`;

interface Person {
  id: string;
  fullName: string;
  title: string;
}

interface SelectOption {
  value: string;
  label: string;
}

function SearchField({id, onSelect, loader}) {
  const [selected, setSelected] = React.useState<SelectOption | null>(null);

  const onChange = (value : SelectOption | null) : void => {
    setSelected(value);
    onSelect(value);
  }

  return (<AsyncSelect id={id} inputId="peopleSearch" value={selected} onChange={onChange} loadOptions={loader} />);
}

function convertToSelectOption(person : Person) : SelectOption {
  return { value: person.id, label: person.fullName + " - " + person.title };
}

function convertToSelectOptions(people : Person[]) : SelectOption[] {
  return people.map(convertToSelectOption);
}

export default function ObjectiveAddPage() {
  const client = useApolloClient();
  let navigate = useNavigate();
  let nameInput = React.useRef<HTMLInputElement>(null);
  let descriptionInput = React.useRef<HTMLTextAreaElement>(null);

  const [createObjective] = useMutation(CREATE_OBJECTIVE);

  const onSubmit = async () => {
    await createObjective({
      variables: {
        name: nameInput.current?.value,
        description: descriptionInput.current?.value
      }
    });

    navigate("/objectives");
  };

  const onCancel = () => {
    navigate("/objectives");
  };

  const search = (value: string) => {
    return new Promise((resolve) => {
      client
        .query({ query: SEARCH_PEOPLE, variables: { query: value } })
        .then(({ data }) => convertToSelectOptions(data.searchPeople))
        .then((people) => resolve(people))
        .catch((err : any) => {
          console.log(err);
        });
    });
  }

  return (
    <>
      <Form onSubmit={onSubmit} onCancel={onCancel}>
        <h1 className="text-2xl font-bold mb-4">Add Objective</h1>

        <FormTextInput ref={nameInput} id="name" label="Name" placeholder="ex. Company Website" />
        <FormTextArea ref={descriptionInput} id="description" label="Description" placeholder="Describe the details of the objective" />

        <label htmlFor="owner" className="block text-sm font-medium text-gray-700">Owner</label>
        <SearchField id="owner" onSelect={() => null} loader={search} />
      </Form>
    </>
  )
}
