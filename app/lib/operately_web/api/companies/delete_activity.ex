defmodule OperatelyWeb.Api.Companies.DeleteActivity do
  @moduledoc """
  Deletes an activity from the company feed.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_admin_access: 2]

  alias Operately.Activities.Activity
  alias Operately.Companies.Company

  inputs do
    field :activity_id, :id, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    with {:ok, activity_id} <- decode_id(inputs.activity_id),
         {:ok, activity} <- load_activity(activity_id, me(conn).company_id),
         :ok <- check_permissions(me(conn)) do
      {:ok, _} = Repo.delete(activity)
      {:ok, %{success: true}}
    end
  end

  defp load_activity(activity_id, company_id) do
    activity =
      from(a in Activity,
        where: a.id == ^activity_id,
        where: fragment("? ->> ? = ?", a.content, "company_id", ^company_id)
      )
      |> Repo.one()

    case activity do
      nil -> {:error, :not_found}
      activity -> {:ok, activity}
    end
  end

  defp check_permissions(person) do
    query = from(c in Company, where: c.id == ^person.company_id)

    if query |> filter_by_admin_access(person.id) |> Repo.exists?() do
      :ok
    else
      {:error, :forbidden}
    end
  end
end
