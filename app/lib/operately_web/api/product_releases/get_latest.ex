defmodule OperatelyWeb.Api.ProductReleases.GetLatest do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
  end

  outputs do
    field? :product_release, :product_release, null: true
  end

  def call(conn, _inputs) do
    with {:ok, company} <- find_company(conn),
         {:ok, _me} <- find_me(conn),
         {:ok, :enabled} <- Operately.ProductReleases.ensure_feature_enabled(company) do
      {:ok, %{product_release: Serializer.serialize(Operately.ProductReleases.latest())}}
    else
      {:error, :not_found} -> {:error, :not_found}
    end
  end
end
