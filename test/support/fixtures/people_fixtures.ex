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
        title: "some title"
      })
      |> Operately.People.create_person()

    person
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
