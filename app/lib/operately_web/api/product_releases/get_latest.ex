defmodule OperatelyWeb.Api.ProductReleases.GetLatest do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
  end

  outputs do
    field? :product_release, :product_release, null: true
    field :can_announce, :boolean
  end

  def call(conn, _inputs) do
    with {:ok, _company} <- find_company(conn),
         {:ok, _me} <- find_me(conn) do
      release = Operately.ProductReleases.latest()

      {:ok, %{product_release: Serializer.serialize(release), can_announce: can_announce?(release, conn.assigns[:current_account])}}
    else
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  defp can_announce?(%Operately.ProductReleases.Release{published_at: %DateTime{} = published_at}, %Operately.People.Account{inserted_at: %NaiveDateTime{} = created_at}) do
    DateTime.compare(published_at, DateTime.from_naive!(created_at, "Etc/UTC")) == :gt
  end

  defp can_announce?(_, _), do: false
end
