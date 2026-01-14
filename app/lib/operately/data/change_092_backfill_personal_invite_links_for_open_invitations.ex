defmodule Operately.Data.Change092BackfillPersonalInviteLinksForOpenInvitations do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{InvitationToken, Invitation, Person, InviteLink}

  defmodule InvitationToken do
    use Operately.Schema

    schema "invitation_tokens" do
      field :invitation_id, :binary_id
      field :valid_until, :utc_datetime
    end
  end

  defmodule Invitation do
    use Operately.Schema

    schema "invitations" do
      field :admin_id, :binary_id
      field :member_id, :binary_id
    end
  end

  defmodule Person do
    use Operately.Schema

    schema "people" do
      field :company_id, :binary_id
      field :has_open_invitation, :boolean
    end
  end

  defmodule InviteLink do
    use Operately.Schema

    schema "invite_links" do
      field :token, :string
      field :type, Ecto.Enum, values: [:company_wide, :personal]
      field :company_id, :binary_id
      field :author_id, :binary_id
      field :person_id, :binary_id
      field :expires_at, :utc_datetime
      field :use_count, :integer
      field :is_active, :boolean
      field :allowed_domains, {:array, :string}

      timestamps()
    end
  end

  def run do
    from(t in InvitationToken,
      join: i in Invitation,
      on: i.id == t.invitation_id,
      join: p in Person,
      on: p.id == i.member_id,
      where: p.has_open_invitation == true,
      select: {t, i, p}
    )
    |> Repo.all()
    |> Enum.each(fn {token, invitation, person} ->
      maybe_create_invite_link(token, invitation, person)
    end)
  end

  defp maybe_create_invite_link(token, invitation, person) do
    case Repo.get_by(InviteLink, person_id: person.id) do
      nil ->
        %InviteLink{
          token: Operately.InviteLinks.InviteLink.build_token(),
          type: :personal,
          company_id: person.company_id,
          author_id: invitation.admin_id,
          person_id: person.id,
          expires_at: token.valid_until,
          use_count: 0,
          is_active: true,
          allowed_domains: []
        }
        |> Repo.insert!()

      _ ->
        :ok
    end
  end
end
