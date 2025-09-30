defmodule OperatelyWeb.Api.Mutations.JoinCompanyViaInviteLink do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field? :token, :string, null: false
    field? :password, :string, null: true
    field? :password_confirmation, :string, null: true
  end

  outputs do
    field? :company, :company, null: true
    field? :person, :person, null: true
    field? :error, :string, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:invite_link, fn -> get_invite_link(inputs.token) end)
    |> run(:validate_link, fn ctx -> validate_invite_link(ctx.invite_link) end)
    |> run(:me, fn -> find_me_if_logged_in(conn) end)
    |> run(:handle_join, fn ctx -> handle_join(ctx, inputs) end)
    |> run(:serialized, fn ctx -> serialize_result(ctx) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :invite_link, _} -> {:ok, %{company: nil, person: nil, error: "Invalid invite link"}}
      {:error, :validate_link, error} -> {:ok, %{company: nil, person: nil, error: error}}
      {:error, :handle_join, error} -> {:ok, %{company: nil, person: nil, error: error}}
      _ -> {:error, :internal_server_error}
    end
  end

  defp get_invite_link(token) do
    case Operately.InviteLinks.get_invite_link_by_token(token) do
      nil -> {:error, :not_found}
      link -> {:ok, link}
    end
  end

  defp validate_invite_link(invite_link) do
    cond do
      not invite_link.is_active -> {:error, "This invite link is no longer valid"}
      Operately.InviteLinks.InviteLink.is_expired?(invite_link) -> {:error, "This invite link has expired"}
      true -> {:ok, invite_link}
    end
  end

  defp find_me_if_logged_in(conn) do
    try do
      {:ok, find_me(conn)}
    rescue
      _ -> {:ok, nil}
    end
  end

  defp handle_join(%{me: nil, invite_link: invite_link}, inputs) do
    # New user signup flow
    if inputs.password && inputs.password_confirmation do
      handle_new_user_signup(invite_link, inputs)
    else
      {:error, "Password required for new users"}
    end
  end

  defp handle_join(%{me: person, invite_link: invite_link}, _inputs) do
    # Existing logged-in user
    handle_existing_user_join(person, invite_link)
  end

  defp handle_new_user_signup(invite_link, inputs) do
    if inputs.password != inputs.password_confirmation do
      {:error, "Passwords don't match"}
    else
      # For new users, we'll handle this in the frontend
      # by redirecting to sign up with the token preserved
      {:error, "Please sign up first and then use this invite link"}
    end
  end

  defp handle_existing_user_join(person, invite_link) do
    cond do
      person.company_id == invite_link.company_id ->
        # Already a member, redirect to company
        company = invite_link.company
        {:ok, %{company: company, person: person, action: :redirect}}
      
      person.company_id != nil ->
        # User belongs to different company
        {:error, "You are already a member of a different company. Please contact support to switch companies."}
      
      true ->
        # Add user to the company
        add_existing_user_to_company(person, invite_link)
    end
  end

  defp add_existing_user_to_company(person, invite_link) do
    # Update person's company_id
    case Operately.People.update_person(person, %{company_id: invite_link.company_id}) do
      {:ok, updated_person} ->
        # Create access bindings for the user in the new company
        add_company_access_bindings(updated_person, invite_link.company_id)
        
        # Increment use count
        Operately.InviteLinks.increment_use_count(invite_link)
        
        {:ok, %{company: invite_link.company, person: updated_person, action: :joined}}
      
      {:error, _changeset} ->
        {:error, "Failed to join company"}
    end
  end

  defp add_company_access_bindings(person, company_id) do
    # This is a simplified version - in practice you'd need to:
    # 1. Get the company space
    # 2. Add the person to the standard access group for the company space
    # 3. Create appropriate access bindings
    # For now, we'll leave this as a TODO since it requires more complex access management
    :ok
  end

  defp serialize_result(%{handle_join: result}) do
    case result do
      %{company: company, person: person, action: action} ->
        {:ok, %{
          company: Serializer.serialize(company, level: :essential),
          person: Serializer.serialize(person, level: :essential),
          error: nil
        }}
      error ->
        {:ok, %{company: nil, person: nil, error: error}}
    end
  end
end