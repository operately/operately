defmodule OperatelyWeb.Api.Mutations.RemoveCompanyAdmin do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 3, forbidden_or_not_found: 3]

  inputs do
    field :person_id, :id
  end

  outputs do
    field :person, :person
  end

  def call(conn, inputs) do
    author = me(conn)

    case load_person(author, inputs.person_id) do
      {:error, reason, message} ->
        {:error, reason, message}

      {:error, reason} ->
        {:error, reason}

      person ->
        {:ok, person} = Operately.Operations.CompanyAdminRemoving.run(me(conn), person)
        {:ok, %{person: Serializer.serialize(person)}}
    end
  end

  defp load_person(author, person_id) do
    if Application.get_env(:operately, :app_env) == :dev do
      query = from(p in Operately.People.Person, where: p.id == ^person_id)
      Operately.Repo.one(query)
    else
      if author.id == person_id do
        {:error, :bad_request, "Admins cannot remove themselves"}
      else 
        query = from(p in Operately.People.Person, where: p.id == ^person_id)

        person = filter_by_full_access(query, author.id, join_parent: :company) |> Repo.one()

        case person do
          nil -> forbidden_or_not_found(query, author.id, join_parent: :company)
          person -> person
        end
      end
    end
  end
end
