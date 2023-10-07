defmodule Operately.PeopleFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.People` context.
  """

  @doc """
  Generate a unique person handle.
  """
  def unique_person_handle, do: "some handle#{System.unique_integer([:positive])}"

  @doc """
  Generate a person.
  """
  def person_fixture(attrs \\ %{}) do
    {:ok, person} =
      attrs
      |> Enum.into(%{
        full_name: "some full_name",
        handle: unique_person_handle(),
        title: "some title",
        email: "some-email@localhost",
        send_daily_summary: true,
        notify_on_mention: true,
        notify_about_assignments: true
      })
      |> Operately.People.create_person()

    person
  end

  def person_fixture_with_account(attrs \\ %{}) do
    email = attrs[:email] || unique_account_email()
    password = attrs[:password] || valid_account_password()

    account = account_fixture(%{email: email, password: password})

    person_fixture(Map.merge(attrs, %{account_id: account.id, email: email}))
  end

  def unique_account_email, do: "account#{System.unique_integer()}@example.com"
  def valid_account_password, do: "hello world!"

  def valid_account_attributes(attrs \\ %{}) do
    Enum.into(attrs, %{
      email: unique_account_email(),
      password: valid_account_password()
    })
  end

  def account_fixture(attrs \\ %{}) do
    {:ok, account} =
      attrs
      |> valid_account_attributes()
      |> Operately.People.register_account()

    account
  end

  def extract_account_token(fun) do
    {:ok, captured_email} = fun.(&"[TOKEN]#{&1}[TOKEN]")
    [_, token | _] = String.split(captured_email.text_body, "[TOKEN]")
    token
  end

end
