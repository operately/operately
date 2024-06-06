defmodule Operately.Activities.Content.CompanyInvitationTokenCreated do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
    field :invitatition_id, :string
    field :name, :string
    field :email, :string
    field :title, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(params) do
    changeset(params)
  end
end
