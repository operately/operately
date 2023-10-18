defmodule OperatelyWeb.Graphql.Types.UpdateContentProjectCreated do
  use Absinthe.Schema.Notation

  object :update_content_project_created do
    field :creator_role, :string do
      resolve fn update, _, _ ->
        {:ok, update.content["creator_role"]}
      end
    end

    field :creator, :person do
      resolve fn update, _, _ ->
        person = Operately.People.get_person!(update.content["creator_id"])

        {:ok, person}
      end
    end

    field :champion, :person do
      resolve fn update, _, _ ->
        person = Operately.People.get_person!(update.content["champion_id"])

        {:ok, person}
      end
    end
  end

end
