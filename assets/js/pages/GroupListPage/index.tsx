import React from "react";
import { useQuery, gql } from "@apollo/client";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import ButtonLink from "../../components/ButtonLink";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import CardList from "../../components/CardList";
import Avatar from "../../components/Avatar";
import Icon from "../../components/Icon";

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
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate("/groups/" + group.id)}
      className="rounded-lg bg-new-dark-2 px-8 py-6 mt-4 relative border border-transparent hover:border-brand-base transition cursor-pointer fadeIn"
    >
      <div className="flex justify-between items-center">
        <div className="font-bold text-xl">{group.name}</div>
      </div>

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
        <div className="my-8 flex justify-between items-start">
          <div>
            <h1 className="font-bold text-3xl">People & Groups</h1>
            <div className="mt-2 text-xl">
              {data.groups.reduce((acc, group) => {
                return acc + group.members.length;
              }, 0)}{" "}
              people in {data.groups.length} groups
            </div>
          </div>

          <div className="flex gap-2">
            <button className="border border-gray-600 rounded px-4 py-1 hover:border-brand-base transition-all">
              Invite People
            </button>

            <button className="border border-gray-600 rounded px-4 py-1 hover:border-brand-base transition-all">
              Add Groups
            </button>
          </div>
        </div>

        <ListOfGroups groups={data.groups} />
      </div>
    </div>
  );
}
