defmodule Operately.Operations.CompanyInvitationTokenCreation do
  alias Ecto.Multi
  alias Operately.Repo

  def run(admin, invitation) do
    Multi.new()
    |> insert_activity(admin, invitation)
    |> Repo.transaction()
  end

  defp insert_activity(multi, admin, invitation) do
    Operately.Activities.insert_sync(multi, admin.id, :company_invitation_token_created, fn _ ->
      %{
        company_id: admin.company_id,
        invitation_id: invitation.id,
        name: invitation.member.full_name,
        email: invitation.member.email,
        title: invitation.member.title,
      }
    end)
  end
end
