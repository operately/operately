defmodule OperatelyEE.AdminApi.CuratedTemplates.Shared do
  use Gettext, backend: OperatelyWeb.Gettext
  alias Operately.CuratedTemplates
  alias OperatelyWeb.Api.Serializer

  def load(id) do
    case id && CuratedTemplates.get(id) do
      nil -> {:error, :not_found}
      template -> {:ok, template}
    end
  end

  def respond({:ok, template}), do: {:ok, %{template: Serializer.serialize(template, level: :full), errors: []}}
  def respond({:error, %Ecto.Changeset{} = cs}), do: {:ok, %{template: nil, errors: errors(cs)}}
  def respond({:error, :not_found}), do: {:error, :not_found, gettext("Template not found")}
  def respond({:error, :conflict}), do: {:error, :bad_request, gettext("This template has changed. Reload it before saving."), %{reason: "template_conflict"}}
  def respond({:error, :published}), do: {:error, :bad_request, gettext("This action is only available for draft templates.")}

  def errors(cs) do
    Enum.map(Operately.CuratedTemplates.Definitions.errors(cs), fn {path, error} ->
      %{path: path, message: Operately.I18n.ValidationErrors.translate(error)}
    end)
  end
end
