import React from 'react';
import { useTranslation } from 'react-i18next';

import { gql, useApolloClient } from '@apollo/client';
import Button, {ButtonSize} from '../../components/Button';
import Icon from '../../components/Icon';
import PeopleSuggestions from './PeopleSuggestions';

import Editor from '../../components/Editor';

const CREATE_UPDATE = gql`
  mutation CreateUpdate($input: CreateUpdateInput!) {
    createUpdate(input: $input) {
      id
    }
  }
`;

export default function PostAnUpdate({objectiveID}) : JSX.Element {
  const { t } = useTranslation();
  const client = useApolloClient();
  const peopleSearch = PeopleSuggestions(client);

  const [active, setActive] = React.useState(false);

  const handleAddUpdate = async ({json}) => {
    await client.mutate({
      mutation: CREATE_UPDATE,
      variables: {
        input: {
          updatableId: objectiveID,
          updatableType: "objective",
          content: JSON.stringify(json),
        }
      }
    })

    setActive(false);
  }

  const handleBlur = ({html}) => {
    if(html === "<p></p>") {
      setActive(false);
    }
  }

  return (
    <div className={"mt-10 rounded-lg bg-white border border-dark-8% overflow-hidden " + (active ? "card-shadow" : "")}>
      <div className="px-4 pt-4 text-sm text-dark-1 flex justify-between items-center">
        {t("objectives.write_an_update.title")}
        {active ? <div onClick={() => setActive(false)} className="text-dark-2 hover:text-black hover:cursor-pointer"><Icon name="cancel" color="dark-2" hoverColor="dark" size="small" /></div> : null}
      </div>

      {active
        ? <div className="border-t border-dark-8% mt-2">
            <Editor
              placeholder={t("objectives.write_an_update.placeholder")}
              peopleSearch={peopleSearch}
              onSave={handleAddUpdate}
              onBlur={handleBlur}
            />
          </div>
        : <div className="pb-4 px-4 flex justify-between items-center text-dark-1">
            <div>{t("objectives.write_an_update.cta")}</div>
            <Button size={ButtonSize.Small} ghost onClick={() => setActive(true)}>{t("objectives.write_an_update.button")}</Button>
          </div>
      }
    </div>
  );
}
