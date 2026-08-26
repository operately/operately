defmodule Operately.Operations.KpiAnnotationDeleting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Kpis.{Kpi, KpiAnnotation}
  alias Operately.Activities

  def run(author, %Kpi{} = kpi, %KpiAnnotation{} = annotation) do
    Multi.new()
    |> insert_activity(author, kpi, annotation)
    |> Multi.delete(:annotation, annotation)
    |> Repo.transaction()
    |> Repo.extract_result(:annotation)
  end

  defp insert_activity(multi, author, kpi, annotation) do
    Activities.insert_sync(multi, author.id, :kpi_annotation_deleted, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: kpi.space_id,
        kpi_id: kpi.id,
        annotation_id: annotation.id,
        title: annotation.title,
        date: annotation.date
      }
    end)
  end
end
