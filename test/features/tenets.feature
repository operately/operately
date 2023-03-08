Feature: Tenets

  Scenario: Creating a company tenet
    Given I am logged in as a user
    And I am on the Tenets page
    When I click the "Create Tenet" button
    And I fill in "Name" with "Customer obsession rather than competitor focus"
    And I fill in "Description" with "We are committed to earning the trust of our customers by putting their needs first."
    And I click the "Create" button
    Then I should see "Customer obsession rather than competitor focus" on the Tenets page

