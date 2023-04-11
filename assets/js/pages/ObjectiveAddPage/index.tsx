import React from "react";
import { useTranslation } from "react-i18next";

import { useNavigate } from "react-router-dom";
import { useMutation, gql, useApolloClient } from "@apollo/client";

import Form from "../../components/Form";
import FormTextInput from "../../components/FormTextInput";
import FormTextArea from "../../components/FormTextArea";
import FormSelect from "../../components/FormSelect";

import AsyncSelect from 'react-select/async';

const CREATE_OBJECTIVE = gql`
  mutation CreateObjective($input: CreateObjectiveInput!) {
    createObjective(input: $input) {
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

function SearchField({id, onSelect, loader, placeholder}) {
  const [selected, setSelected] = React.useState<SelectOption | null>(null);

  const onChange = (value : SelectOption | null) : void => {
    setSelected(value);
    onSelect(value);
  }

  return (<AsyncSelect placeholder={placeholder} inputId={id} value={selected} onChange={onChange} loadOptions={loader} />);
}

function convertToSelectOption(person : Person) : SelectOption {
  return { value: person.id, label: person.fullName + " - " + person.title };
}

function convertToSelectOptions(people : Person[]) : SelectOption[] {
  return people.map(convertToSelectOption);
}

export default function ObjectiveAddPage() {
  const { t } = useTranslation();
  const client = useApolloClient();

  const [selectedOwner, setSelectedOwner] = React.useState<SelectOption | null>(null);

  let navigate = useNavigate();
  let nameInput = React.useRef<HTMLInputElement>(null);
  let descriptionInput = React.useRef<HTMLTextAreaElement>(null);
  let timeframeInput = React.useRef<HTMLSelectElement>(null);

  const [createObjective] = useMutation(CREATE_OBJECTIVE);

  const onSubmit = async () => {
    try {
      await createObjective({
        variables: {
          input : {
            name: nameInput.current?.value,
            description: descriptionInput.current?.value,
            timeframe: timeframeInput.current?.value,
            owner_id: selectedOwner
          }
        }
      });

      navigate("/objectives");
    } catch (err) {
      console.log(err);
    }
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
        <h1 className="text-2xl font-bold mb-4">{t("forms.objective_add_title")}</h1>

        <div className="flex flex-col gap-4">
          <FormTextInput
            ref={nameInput}
            id="name"
            label={t("forms.objective_name_label")}
            placeholder={t("forms.objective_name_placeholder")!}
          />

          <FormTextArea
            ref={descriptionInput}
            id="description"
            label={t("forms.objective_description_label")}
            placeholder={t("forms.objective_description_placeholder")!}
          />


          <div>
            <label
              htmlFor="owner"
              className="block text-sm font-bold text-gray-700 mb-2"
            >{t("forms.objective_owner_label")}</label>

            <SearchField
              id="owner"
              onSelect={(e : any) => setSelectedOwner(e.value)}
              placeholder={t("forms.objective_owner_search_placeholder")!}
              loader={search}
            />
          </div>

          <FormSelect ref={timeframeInput} id="timeframe" label={t("forms.objective_timeframe_label")}>
            <option value="current-quarter">{t("forms.objective_timeframe_current_quarter")}</option>
          </FormSelect>
        </div>
      </Form>
    </>
  )
}
