defmodule Operately.Data.Change092PopulateInviteLinkTypes do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.InviteLink

  def run do
    from(il in InviteLink, where: is_nil(il.type) and is_nil(il.person_id))
    |> Repo.update_all(set: [type: :company_wide])
  end

  defmodule InviteLink do
    use Operately.Schema

    schema "invite_links" do
      field :type, Ecto.Enum, values: [:company_wide, :personal]
      field :person_id, :binary_id
    end
  end
end
