defmodule Operately.Operations.KpiAnnotationEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Kpis.{Kpi, KpiAnnotation}
  alias Operately.Activities

  def run(author, %Kpi{} = kpi, %KpiAnnotation{} = annotation, attrs) do
    Multi.new()
    |> Multi.update(:annotation, KpiAnnotation.changeset(annotation, attrs))
    |> insert_activity(author, kpi, annotation)
    |> Repo.transaction()
    |> Repo.extract_result(:annotation)
  end

  defp insert_activity(multi, author, kpi, annotation) do
    Activities.insert_sync(multi, author.id, :kpi_annotation_edited, fn changes ->
      %{
        company_id: author.company_id,
        space_id: kpi.space_id,
        kpi_id: kpi.id,
        annotation_id: changes.annotation.id,
        old_title: annotation.title,
        new_title: changes.annotation.title,
        date: changes.annotation.date
      }
    end)
  end
end
