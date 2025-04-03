defmodule OperatelyEE.AdminApi.Queries.GetActivities do
  use TurboConnect.Query
  import Ecto.Query

  alias Operately.Companies.Company

  inputs do
    field :company_id, :company_id
  end

  outputs do
    field :activities, list_of(:activity)
  end

  def call(_conn, inputs) do
    with(
      {:ok, company} <- Company.get(:system, short_id: inputs.company_id),
      activities <- load_activities(company)
    ) do
      {:ok, serialize(activities)}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      _e -> {:error, :internal_server_error}
    end
  end

  defp load_activities(company) do
    query = from a in Operately.Activities.Activity,
      where: fragment("? ->> ?", a.content, "company_id") == ^company.id,
      order_by: [desc: a.inserted_at],
      limit: 100,
      select: map(a, [:id, :inserted_at, :action])

    Operately.Repo.all(query)
  end

  defp serialize(activities) do
    %{activities: Enum.map(activities, fn a -> serialize_activity(a) end)}
  end

  defp serialize_activity(activity) do
    %{
      id: activity.id,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(activity.inserted_at, level: :essential),
      action: activity.action
    }
  end

end
