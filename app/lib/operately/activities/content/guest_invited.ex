defmodule Operately.Activities.Content.GuestInvited do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company, type: :string
    belongs_to :person, Operately.People.Person, type: :string
    belongs_to :invite_link, Operately.InviteLinks.InviteLink, type: :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :person_id])
  end

  def build(params) do
    changeset(params)
  end
end
