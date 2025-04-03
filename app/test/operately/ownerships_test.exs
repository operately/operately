defmodule Operately.OwnershipsTest do
  use Operately.DataCase

  alias Operately.Ownerships

  describe "ownerships" do
    import Operately.OwnershipsFixtures

    test "list_ownerships/0 returns all ownerships" do
      ownership = ownership_fixture()
      assert Ownerships.list_ownerships() == [ownership]
    end

    test "get_ownership!/1 returns the ownership with given id" do
      ownership = ownership_fixture()
      assert Ownerships.get_ownership!(ownership.id) == ownership
    end
  end
end
