defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.CreateFiles do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Repo
  alias Operately.Blobs.Blob

  def mutation_name, do: "project_templates/create_files"

  def setup(ctx) do
    ctx = ctx |> Factory.setup() |> Factory.enable_feature("project_templates") |> Factory.add_space(:space) |> Factory.add_project_template(:template, :space) |> Factory.add_blob(:blob)
    %{ctx | blob: ctx.blob |> Blob.changeset(%{status: :uploaded}) |> Repo.update!()}
  end

  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), files: [%{blob_id: ctx.blob.id, name: "Reusable file"}]}

  def assert(response, _ctx) do
    assert [file] = response.files
    assert file.name == "Reusable file"
  end
end
