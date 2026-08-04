defmodule Operately.ProjectTemplates do
  alias Operately.Companies

  @archive_statuses [:active, :archived, :all]

  def archive_statuses, do: @archive_statuses

  def ensure_feature_enabled(company) do
    if Companies.has_experimental_feature?(company, "project_templates") do
      {:ok, :enabled}
    else
      {:error, :not_found}
    end
  end
end
