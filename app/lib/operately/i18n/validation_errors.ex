defmodule Operately.I18n.ValidationErrors do
  @moduledoc "Translates known changeset messages at the presentation boundary."

  use Gettext, backend: OperatelyWeb.Gettext

  def translate({"can't be blank", _opts}), do: gettext("can't be blank")
  def translate({"has already been taken", _opts}), do: gettext("has already been taken")
  def translate({"is invalid", _opts}), do: gettext("is invalid")
  def translate({"is not valid", _opts}), do: gettext("is not valid")
  def translate({"must have the @ sign and no spaces", _opts}), do: gettext("must have the @ sign and no spaces")
  def translate({"does not match password", _opts}), do: gettext("does not match password")
  def translate({"did not change", _opts}), do: gettext("did not change")
  def translate({"This would create a circular reporting relationship", _opts}), do: gettext("This would create a circular reporting relationship")
  def translate({"This item can't be moved into one of its subfolders", _opts}), do: gettext("This item can't be moved into one of its subfolders")
  def translate({"Email has already been taken", _opts}), do: gettext("Email has already been taken")

  def translate({"should be at least %{count} character(s)", opts}) do
    count = Keyword.fetch!(opts, :count)
    if count == 0, do: gettext("should be at least 0 character(s)"), else: ngettext("should be at least %{count} character(s)", "should be at least %{count} character(s)", count)
  end

  def translate({"should be at most %{count} character(s)", opts}) do
    count = Keyword.fetch!(opts, :count)
    if count == 0, do: gettext("should be at most 0 character(s)"), else: ngettext("should be at most %{count} character(s)", "should be at most %{count} character(s)", count)
  end

  def translate({"should be %{count} character(s)", opts}) do
    count = Keyword.fetch!(opts, :count)
    if count == 0, do: gettext("should be 0 character(s)"), else: ngettext("should be %{count} character(s)", "should be %{count} character(s)", count)
  end

  def translate({message, opts}) do
    Enum.reduce(opts, message, fn {key, value}, text ->
      if is_binary(value) or is_number(value), do: String.replace(text, "%{#{key}}", to_string(value)), else: text
    end)
  end

  def member(field, message, opts \\ [])

  def member(:email, "can't be blank", _opts), do: gettext("Email can't be blank")
  def member(:email, "has already been taken", _opts), do: gettext("Email has already been taken")
  def member(:email, "is invalid", _opts), do: gettext("Email is invalid")
  def member(:email, "is not valid", _opts), do: gettext("Email is not valid")
  def member(:email, "must have the @ sign and no spaces", _opts), do: gettext("Email must have the @ sign and no spaces")
  def member(:full_name, "can't be blank", _opts), do: gettext("Name can't be blank")

  def member(:email, "should be at most %{count} character(s)", opts) do
    count = Keyword.fetch!(opts, :count)

    if count == 0 do
      gettext("Email should be at most 0 character(s)")
    else
      ngettext("Email should be at most %{count} character(s)", "Email should be at most %{count} character(s)", count)
    end
  end

  def member(:email, message, opts), do: translate({"Email " <> message, opts})
  def member(:full_name, message, opts), do: translate({"Name " <> message, opts})
end
