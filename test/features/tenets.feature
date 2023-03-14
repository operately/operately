Feature: Tenets

  Scenario: Creating a company tenet
    Given I am logged in as a user
    And I am on the Tenets page
    When I click on the "New Tenet" button
    And I fill in the "Name" field with "Customer obsession rather than competitor focus"
    And I fill in the "Description" field with "We are committed to earning the trust of our customers by putting their needs first."
    And I click on the "Save Tenet" button
    Then I should see "Customer obsession rather than competitor focus" on the Tenets page

