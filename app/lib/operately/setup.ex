defmodule Operately.Setup do
  alias Operately.{Companies, People}

  def configured? do
    Companies.count_companies() > 0 or People.count_accounts() > 0
  end

  def company_setup_pending? do
    Companies.count_companies() == 0 and People.count_accounts() > 0
  end
end
