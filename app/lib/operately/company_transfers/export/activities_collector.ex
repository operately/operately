defmodule Operately.CompanyTransfers.Export.ActivitiesCollector do
  @moduledoc """
  Collects activity rows as a custom exception-table export step.
  """

  alias Operately.CompanyTransfers.Export.Relational.{SchemaSnapshot, Sql}

  def collect(%SchemaSnapshot{columns: columns}, company_id) when is_binary(company_id) do
    rows =
      Sql.fetch_rows_by_json_text_field!(
        "activities",
        "content",
        "company_id",
        [company_id],
        Map.fetch!(columns, "activities")
      )

    %{"activities" => rows}
  end
end
