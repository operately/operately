defmodule OperatelyWeb.Gettext do
  @moduledoc """
  Gettext backend for Operately interface copy, system messages, notifications, and emails.

  English source text is the message identifier. Frontend catalogs are generated from this
  backend's POT/PO files; do not edit `assets/js/generated/locales/*.json` by hand.
  """

  use Gettext.Backend, otp_app: :operately, default_domain: "messages"
end
