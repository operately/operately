import React from "react";
import { useQuery, gql } from "@apollo/client";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ButtonLink from "../../components/ButtonLink";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import CardList from "../../components/CardList";
import Avatar from "../../components/Avatar";

const GET_GROUPS = gql`
  query GetGroups {
    groups {
      id
      name

      members {
        id
        fullName
        title
        avatarUrl
      }
    }
  }
`;

const GROUP_SUBSCRIPTION = gql`
  subscription OnGroupAdded {
    groupAdded {
      id
    }
  }
`;

export async function GroupsListPageLoader(apolloClient: any) {
  await apolloClient.query({
    query: GET_GROUPS,
    fetchPolicy: "network-only",
  });

  return {};
}

function Group({ group }) {
  return (
    <div className="rounded-lg bg-new-dark-2 p-4">
      <div className="font-bold text-xl">{group.name}</div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        {group.members.map((member) => (
          <div className="mt-4 flex gap-2 items-center">
            <Avatar person={member} />
            <div>
              <div className="font-bold">{member.fullName}</div>
              <div className="text-sm">{member.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListOfGroups({ groups }) {
  return (
    <CardList>
      {groups.map((group) => (
        <Group key={group.id} group={group} />
      ))}
    </CardList>
  );
}

export function GroupListPage() {
  const { t } = useTranslation();
  const { loading, error, data, subscribeToMore, refetch } =
    useQuery(GET_GROUPS);

  React.useEffect(() => {
    subscribeToMore({
      document: GROUP_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        refetch();
        return prev;
      },
    });
  }, []);

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error)
    return (
      <p>
        {t("error.error")}: {error.message}
      </p>
    );

  return (
    <div className="max-w-6xl mx-auto mb-4">
      <div className="m-11 mt-24">
        <PageTitle
          title={t("Groups")}
          buttons={[
            <ButtonLink key="new" to="/groups/new">
              {t("actions.add_group")}
            </ButtonLink>,
          ]}
        />

        <ListOfGroups groups={data.groups} />
      </div>
    </div>
  );
}
