defmodule Operately.People.EmailActivationCodeTest do
  use Operately.DataCase

  describe "creation" do
    test "it creates a 6 digit code" do
      {:ok, code} = Operately.People.EmailActivationCode.create("hello@text.localhost")

      assert String.length(code.code) == 6
    end
  end
end
