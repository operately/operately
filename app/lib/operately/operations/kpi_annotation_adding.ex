defmodule Operately.Operations.KpiAnnotationAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Kpis.{Kpi, KpiAnnotation}
  alias Operately.Activities

  def run(author, %Kpi{} = kpi, attrs) do
    Multi.new()
    |> insert_annotation(kpi, attrs)
    |> insert_activity(author, kpi)
    |> Repo.transaction()
    |> Repo.extract_result(:annotation)
  end

  defp insert_annotation(multi, kpi, attrs) do
    Multi.insert(
      multi,
      :annotation,
      KpiAnnotation.changeset(%{
        kpi_id: kpi.id,
        date: attrs[:date],
        title: attrs[:title],
        description: attrs[:description],
        created_by_id: attrs[:created_by_id]
      })
    )
  end

  defp insert_activity(multi, author, kpi) do
    Activities.insert_sync(multi, author.id, :kpi_annotation_added, fn changes ->
      %{
        company_id: author.company_id,
        space_id: kpi.space_id,
        kpi_id: kpi.id,
        annotation_id: changes.annotation.id,
        title: changes.annotation.title,
        date: changes.annotation.date
      }
    end)
  end
end
