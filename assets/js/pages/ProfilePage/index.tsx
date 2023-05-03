import React from "react";

import Avatar, { AvatarSize } from "../../components/Avatar";

import { useParams } from "react-router-dom";
import { usePerson } from "../../graphql/People";

export default function ProfilePage() {
  const { id } = useParams();

  if (!id) return <p>Unable to find person</p>;

  const { loading, error, data } = usePerson(id);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  const person = data.person;

  return (
    <div className="p-2 flex gap-2 items-center">
      <div className="my-2 flex flex-col">
        <Avatar person={person} size={AvatarSize.Large} />
      </div>

      <div>
        <div className="font-semibold">{person.fullName}</div>
        <div className="text-sm text-dark-2">
          {person.title} at Acme Incorporated
        </div>
      </div>
    </div>
  );
}
